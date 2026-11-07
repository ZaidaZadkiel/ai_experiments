import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { initDatabase } from "../../src/db/init.js";

async function withTempDir(fn) {
  const dir = await mkdtemp(join(tmpdir(), "greeter-db-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("initDatabase creates the file, its folder and the names table", async () => {
  await withTempDir(async (dir) => {
    const dbPath = join(dir, "nested", "app.db");
    await initDatabase(dbPath);

    const db = new DatabaseSync(dbPath);
    const columns = db.prepare("PRAGMA table_info(names)").all();
    db.close();

    assert.deepEqual(
      columns.map((c) => [c.name, c.type]),
      [
        ["name", "TEXT"],
        ["last_time_seen", "TEXT"],
        ["considered", "INTEGER"],
      ],
    );
  });
});

test("new records start with considered = 1 and names ignore case", async () => {
  await withTempDir(async (dir) => {
    const dbPath = join(dir, "app.db");
    await initDatabase(dbPath);

    const db = new DatabaseSync(dbPath);
    db.prepare("INSERT INTO names (name, last_time_seen) VALUES (?, ?)").run(
      "Ada",
      "2026-11-04T00:00:00.000Z",
    );
    const row = db
      .prepare("SELECT name, considered FROM names WHERE name = ?")
      .get("ADA");
    assert.throws(() =>
      db.prepare("INSERT INTO names (name) VALUES (?)").run("ada"),
    );
    db.close();

    assert.equal(row.name, "Ada");
    assert.equal(row.considered, 1);
  });
});

test("running initDatabase again keeps existing data", async () => {
  await withTempDir(async (dir) => {
    const dbPath = join(dir, "app.db");
    await initDatabase(dbPath);

    let db = new DatabaseSync(dbPath);
    db.prepare("INSERT INTO names (name) VALUES (?)").run("Ada");
    db.close();

    await initDatabase(dbPath);

    db = new DatabaseSync(dbPath);
    const { count } = db.prepare("SELECT COUNT(*) AS count FROM names").get();
    db.close();
    assert.equal(count, 1);
  });
});
