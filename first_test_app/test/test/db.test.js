import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openDatabase } from "../src/db.js";
import { initDatabase } from "../src/db/init.js";

async function withDatabase(fn) {
  const dir = await mkdtemp(join(tmpdir(), "greeter-db-"));
  const path = join(dir, "app.db");
  await initDatabase(path);
  const db = await openDatabase(path);
  const rows = () => {
    const reader = new DatabaseSync(path);
    const result = reader.prepare("SELECT * FROM names ORDER BY name").all();
    reader.close();
    return result;
  };
  try {
    await fn(db, rows);
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
}

test("openDatabase fails when the database file does not exist (FR-25)", async () => {
  await assert.rejects(
    openDatabase(join(tmpdir(), "does-not-exist", "app.db")),
  );
});

test("greet creates a record with considered = 1 (FR-18)", async () => {
  await withDatabase(async (db, rows) => {
    db.greet("Ada", "2026-11-04T10:00:00.000Z");
    assert.deepEqual(
      rows().map((r) => ({ ...r })),
      [
        {
          name: "Ada",
          last_time_seen: "2026-11-04T10:00:00.000Z",
          considered: 1,
        },
      ],
    );
  });
});

test("greet on an existing name, in any case, only updates last_time_seen (FR-18, FR-22)", async () => {
  await withDatabase(async (db, rows) => {
    db.greet("Ada", "2026-11-04T10:00:00.000Z");
    db.consider("Ada", "2026-11-04T10:30:00.000Z");
    db.greet("ADA", "2026-11-04T11:00:00.000Z");
    assert.deepEqual(
      rows().map((r) => ({ ...r })),
      [
        {
          name: "Ada",
          last_time_seen: "2026-11-04T11:00:00.000Z",
          considered: 2,
        },
      ],
    );
  });
});

test("consider increases the count and updates last_time_seen (FR-3)", async () => {
  await withDatabase(async (db, rows) => {
    db.greet("Ada", "2026-11-04T10:00:00.000Z");
    assert.equal(db.consider("ada", "2026-11-04T12:00:00.000Z"), true);
    assert.deepEqual(
      rows().map((r) => ({ ...r })),
      [
        {
          name: "Ada",
          last_time_seen: "2026-11-04T12:00:00.000Z",
          considered: 2,
        },
      ],
    );
  });
});

test("consider returns false and creates nothing for an unknown name", async () => {
  await withDatabase(async (db, rows) => {
    assert.equal(db.consider("Nobody", "2026-11-04T12:00:00.000Z"), false);
    assert.equal(rows().length, 0);
  });
});

test("listNames sorts by count, highest first, ties A to Z ignoring case (FR-16)", async () => {
  await withDatabase(async (db) => {
    for (const name of ["bob", "Carl", "Ada", "dora"]) db.greet(name, "t");
    db.consider("dora", "t");
    db.consider("dora", "t");
    db.consider("Carl", "t");
    assert.deepEqual(
      db.listNames().map((r) => [r.name, r.considered]),
      [
        ["dora", 3],
        ["Carl", 2],
        ["Ada", 1],
        ["bob", 1],
      ],
    );
  });
});
