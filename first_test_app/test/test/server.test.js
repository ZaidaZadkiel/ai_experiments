import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cp,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { initDatabase } from "../src/db/init.js";
import { startServer } from "../src/server.js";
import { VIEWS_DIR } from "../src/templates.js";

/**
 * Starts the server on a random port with a temporary database (FR-26),
 * and optionally a temporary copy of the templates.
 */
async function withServer(fn, { copyViews = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "greeter-server-"));
  const databasePath = join(dir, "app.db");
  await initDatabase(databasePath);
  let viewsDir = VIEWS_DIR;
  if (copyViews) {
    viewsDir = join(dir, "views");
    await cp(VIEWS_DIR, viewsDir, { recursive: true });
  }
  const app = await startServer({ port: 0, databasePath, viewsDir });

  const request = async (path, options = {}) => {
    const res = await fetch(`http://127.0.0.1:${app.port}${path}`, {
      redirect: "manual",
      ...options,
    });
    return { status: res.status, headers: res.headers, body: await res.text() };
  };
  const get = async (path) => {
    const res = await request(path);
    assert.equal(res.status, 200, `GET ${path} should return a page`);
    assert.equal(res.headers.get("content-type"), "text/html; charset=utf-8");
    return res.body;
  };
  const rows = () => {
    const db = new DatabaseSync(databasePath);
    const result = db
      .prepare("SELECT * FROM names ORDER BY name")
      .all()
      .map((row) => ({ ...row }));
    db.close();
    return result;
  };

  try {
    await fn({ request, get, rows, viewsDir });
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
}

/** The visible text of a page, with tags removed and spaces collapsed. */
function text(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

test("/ shows the empty table message when nobody is registered (FR-16, FR-17)", async () => {
  await withServer(async ({ get }) => {
    assert.match(text(await get("/")), /Nobody has been greeted yet\./);
  });
});

test("/ lists names and counts only, most considered first (FR-16)", async () => {
  await withServer(async ({ get }) => {
    await get("/greet?name=bob");
    await get("/greet?name=Ada");
    await get("/greet?name=Carl");
    await get("/consider?name=carl");
    const html = await get("/");
    assert.match(text(html), /Name Considered Carl 2 Ada 1 bob 1/);
    assert.doesNotMatch(html, /<a\b/, "the table has no links");
    assert.doesNotMatch(html, /\d{4}-\d{2}-\d{2}T/, "the table shows no time");
    assert.doesNotMatch(html, /Nobody has been greeted yet/);
  });
});

test("/greet without a name shows the welcome page (FR-14)", async () => {
  await withServer(async ({ get }) => {
    for (const path of ["/greet", "/greet?name="]) {
      const html = await get(path);
      assert.match(
        text(html),
        /welcome to the greeter page, consider who you want and see how much consideration everyone has/,
      );
      assert.match(html, /<form action="\/consider" method="get">/);
      assert.match(html, /<input[^>]*name="name"/);
      assert.match(html, /would you like to be considered\?<\/button>/);
      assert.match(
        html,
        /function normalizeName/,
        "includes the browser name check",
      );
    }
  });
});

test("/greet?name= greets the name and creates its record (FR-2, FR-10, FR-18)", async () => {
  await withServer(async ({ get, rows }) => {
    assert.match(text(await get("/greet?name=Ada")), /Hello, Ada!/);
    const [record] = rows();
    assert.equal(record.name, "Ada");
    assert.equal(record.considered, 1);
    assert.match(record.last_time_seen, ISO_TIME);
  });
});

test("greeting an existing name in another case keeps the record (FR-18, FR-22, FR-23)", async () => {
  await withServer(async ({ get, rows }) => {
    await get("/greet?name=Ada");
    const before = rows()[0].last_time_seen;
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.match(text(await get("/greet?name=ADA")), /Hello, ADA!/);
    const after = rows();
    assert.equal(after.length, 1);
    assert.equal(after[0].name, "Ada", "keeps the first spelling");
    assert.equal(after[0].considered, 1);
    assert.ok(after[0].last_time_seen > before, "last_time_seen is updated");
  });
});

test("pages show the name as received; the database saves it normalized (FR-21, FR-23)", async () => {
  await withServer(async ({ get, rows }) => {
    assert.match(text(await get("/greet?name=Jos%C3%A9")), /Hello, José!/);
    assert.equal(rows()[0].name, "Jos_");
    assert.match(text(await get("/")), /Jos_ 1/);
  });
});

test("names from the request are escaped, stored names are not escaped twice (FR-7)", async () => {
  await withServer(async ({ get, rows }) => {
    const html = await get("/greet?name=%3Cscript%3Ealert(1)%3C%2Fscript%3E");
    assert.doesNotMatch(html, /<script>alert/);
    assert.match(html, /Hello, &lt;script&gt;alert\(1\)&lt;\/script&gt;!/);
    assert.equal(rows()[0].name, "&lt;script&gt;alert(1)&lt;_script&gt;");

    await get("/greet?name=O'Brien");
    const table = await get("/");
    assert.match(table, /<td>O&#39;Brien<\/td>/);
    assert.doesNotMatch(table, /&amp;#39;/);
  });
});

test("/consider without a name shows the form (FR-5)", async () => {
  await withServer(async ({ get }) => {
    const html = await get("/consider");
    assert.match(html, /<form action="\/consider" method="get">/);
    assert.match(html, /<input[^>]*name="name"[^>]*value=""/);
    assert.match(html, /function normalizeName/);
  });
});

test("/consider with a known name increases the count (FR-3, FR-4, FR-22, FR-23)", async () => {
  await withServer(async ({ get, rows }) => {
    await get("/greet?name=Ada");
    const before = rows()[0].last_time_seen;
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.match(
      text(await get("/consider?name=ada")),
      /you have considered ada/,
    );
    const [record] = rows();
    assert.equal(record.considered, 2);
    assert.ok(record.last_time_seen > before, "last_time_seen is updated");
  });
});

test("/consider with an unknown name links to /greet with the raw value (FR-20)", async () => {
  await withServer(async ({ get, rows }) => {
    const html = await get("/consider?name=O'Brien");
    assert.match(
      html,
      /I dont know O&#39;Brien, but if you want\s*<a href="\/greet\?name=O%27Brien">i can greet them<\/a>/,
    );
    assert.equal(rows().length, 0, "nothing is created");

    // Following the link registers the name, normalized exactly once.
    await get("/greet?name=O%27Brien");
    assert.equal(rows()[0].name, "O&#39;Brien");
  });
});

test("a name with no usable characters returns the page with a message (FR-24)", async () => {
  await withServer(async ({ get, rows }) => {
    const welcome = await get("/greet?name=%20%20%20");
    assert.match(
      welcome,
      /<p class="message">That name has no usable characters\.<\/p>/,
    );
    const form = await get("/consider?name=%20%20%20");
    assert.match(
      form,
      /<p class="message">That name has no usable characters\.<\/p>/,
    );
    assert.equal(rows().length, 0);
  });
});

test("the message is empty when there is nothing to say (FR-24)", async () => {
  await withServer(async ({ get }) => {
    for (const path of [
      "/",
      "/greet",
      "/greet?name=Ada",
      "/consider",
      "/consider?name=Ada",
      "/consider?name=Bob",
    ]) {
      assert.match(await get(path), /<p class="message"><\/p>/, path);
    }
  });
});

test("only the first name value is used (FR-27)", async () => {
  await withServer(async ({ get, rows }) => {
    assert.match(text(await get("/greet?name=a&name=b")), /Hello, a!/);
    assert.deepEqual(
      rows().map((r) => r.name),
      ["a"],
    );
  });
});

test("other methods and unknown paths redirect to / (FR-9, FR-15, FR-19)", async () => {
  await withServer(async ({ request }) => {
    const cases = [
      ["POST", "/greet?name=Ada"],
      ["PUT", "/consider?name=Ada"],
      ["DELETE", "/"],
      ["HEAD", "/greet"],
      ["GET", "/nowhere"],
      ["GET", "/favicon.ico"],
      ["GET", "/greet/"],
    ];
    for (const [method, path] of cases) {
      const res = await request(path, { method });
      assert.equal(res.status, 303, `${method} ${path}`);
      assert.equal(res.headers.get("location"), "/", `${method} ${path}`);
    }
  });
});

test("simultaneous considerations never lose a count (FR-28)", async () => {
  await withServer(async ({ get, rows }) => {
    await get("/greet?name=Ada");
    await Promise.all(
      Array.from({ length: 20 }, () => get("/consider?name=Ada")),
    );
    assert.equal(rows()[0].considered, 21);
  });
});

test("an edited template shows on the next request without a restart (FR-13)", async () => {
  await withServer(
    async ({ get, viewsDir }) => {
      assert.match(text(await get("/greet?name=Ada")), /Hello, Ada!/);
      const file = join(viewsDir, "greeting.html");
      const template = await readFile(file, "utf8");
      await writeFile(file, template.replace("Hello,", "Howdy,"));
      assert.match(text(await get("/greet?name=Ada")), /Howdy, Ada!/);
    },
    { copyViews: true },
  );
});

test("the server's JavaScript contains no HTML (FR-11)", async () => {
  const srcDir = join(import.meta.dirname, "..", "src");
  const files = (await readdir(srcDir, { recursive: true })).filter((f) =>
    f.endsWith(".js"),
  );
  assert.ok(files.length > 0);
  for (const file of files) {
    const source = await readFile(join(srcDir, file), "utf8");
    assert.doesNotMatch(
      source,
      /<\/?[a-zA-Z][^>]*>|<!/,
      `src/${file} contains HTML`,
    );
  }
});
