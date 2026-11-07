import { mkdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = join(import.meta.dirname, "..", "..", "data");

/** The app's database file. Fixed; not configurable. */
export const DATABASE_PATH = join(DATA_DIR, "app.db");
export const SCHEMA_PATH = join(DATA_DIR, "init.sql");

/**
 * Creates the SQLite database file (and its folder) if needed, then runs the schema.
 * The schema uses CREATE TABLE IF NOT EXISTS, so running this again keeps existing data.
 * The path argument exists only so tests can use a temporary file.
 */
export async function initDatabase(
  databasePath = DATABASE_PATH,
  schemaPath = SCHEMA_PATH,
) {
  const schema = await readFile(schemaPath, "utf8");
  await mkdir(dirname(resolve(databasePath)), { recursive: true });
  const db = new DatabaseSync(databasePath);
  try {
    db.exec(schema);
  } finally {
    db.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  await initDatabase();
  console.log(`Database ready at ${DATABASE_PATH}`);
}
