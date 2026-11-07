import { access } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";

/**
 * Opens the database created by `npm run db:init`. A missing file is fatal
 * (FR-25), so it is checked first instead of letting SQLite create an empty one.
 */
export async function openDatabase(databasePath) {
  await access(databasePath);
  const db = new DatabaseSync(databasePath);

  // The primary key uses COLLATE NOCASE, so the conflict ignores case and the
  // record keeps the spelling it was created with (FR-18, FR-22).
  const greet = db.prepare(
    `INSERT INTO names (name, last_time_seen) VALUES (?, ?)
     ON CONFLICT (name) DO UPDATE SET last_time_seen = excluded.last_time_seen`,
  );
  // One statement, so simultaneous requests never lose a count (FR-3, FR-28).
  const consider = db.prepare(
    `UPDATE names SET considered = considered + 1, last_time_seen = ? WHERE name = ?`,
  );
  const list = db.prepare(
    `SELECT name, considered FROM names ORDER BY considered DESC, name ASC`,
  );

  return {
    /** Creates the record with considered = 1, or updates last_time_seen. */
    greet(name, now) {
      greet.run(name, now);
    },
    /** Returns true if the name existed and was considered, false if unknown. */
    consider(name, now) {
      return consider.run(now, name).changes > 0;
    },
    /** All names, most considered first, ties A to Z ignoring case (FR-16). */
    listNames() {
      return list.all();
    },
    close() {
      db.close();
    },
  };
}
