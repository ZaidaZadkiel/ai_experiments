import { encodeQueryValue, escapeHtml } from "./html.js";
import { normalizeName } from "./name-rule.js";
import { fillTemplate, loadTemplate, renderTemplate } from "./templates.js";

const NO_USABLE_CHARACTERS = "That name has no usable characters.";

function sendPage(res, html) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

/** Every invalid request ends here (FR-9, FR-15). */
function redirectHome(res) {
  res.writeHead(303, { Location: "/" });
  res.end();
}

/**
 * Builds the request handler. There is deliberately no error handling:
 * any failure rejects the handler's promise and crashes the server (FR-25).
 */
export function createHandler({
  db,
  viewsDir,
  now = () => new Date().toISOString(),
}) {
  const render = (file, values) => renderTemplate(viewsDir, file, values);

  // Every page has an optional message, empty unless there is something to say (FR-24).
  const page = (file, values = {}, message = "") =>
    render(file, { ...values, MESSAGE: escapeHtml(message) });

  const nameRule = () => render("name-rule.html");

  async function namesTable() {
    const names = db.listNames();
    let rows;
    if (names.length === 0) {
      rows = await render("index-empty.html");
    } else {
      const rowTemplate = await loadTemplate(viewsDir, "index-row.html");
      rows = names
        .map((row) =>
          fillTemplate(rowTemplate, {
            ROW_NAME: row.name, // stored names are already HTML-safe (FR-7, FR-21)
            CONSIDERED: escapeHtml(row.considered),
          }),
        )
        .join("");
    }
    return page("index.html", { ROWS: rows });
  }

  async function welcomePage(message) {
    return page("greet.html", { NAME_RULE: await nameRule() }, message);
  }

  async function considerForm(raw, message) {
    return page(
      "consider.html",
      { NAME: escapeHtml(raw), NAME_RULE: await nameRule() },
      message,
    );
  }

  async function greet(raw) {
    if (!raw) return welcomePage();
    const name = normalizeName(raw);
    if (!name) return welcomePage(NO_USABLE_CHARACTERS);
    db.greet(name, now());
    // Pages show the name as received; the database keeps the normalized form (FR-23).
    return page("greeting.html", { NAME: escapeHtml(raw) });
  }

  async function consider(raw) {
    if (!raw) return considerForm("");
    const name = normalizeName(raw);
    if (!name) return considerForm(raw, NO_USABLE_CHARACTERS);
    if (!db.consider(name, now())) {
      // The link carries the raw value, so /greet normalizes it exactly once (FR-20).
      return page("unknown.html", {
        NAME: escapeHtml(raw),
        NAME_URL: escapeHtml(encodeQueryValue(raw)),
      });
    }
    return page("considered.html", { NAME: escapeHtml(raw) });
  }

  return async function handleRequest(req, res) {
    if (req.method !== "GET") return redirectHome(res);
    const url = new URL(req.url, "http://localhost");
    // Only the first `name` value counts (FR-27).
    const raw = url.searchParams.get("name");
    switch (url.pathname) {
      case "/":
        return sendPage(res, await namesTable());
      case "/greet":
        return sendPage(res, await greet(raw));
      case "/consider":
        return sendPage(res, await consider(raw));
      default:
        return redirectHome(res);
    }
  };
}
