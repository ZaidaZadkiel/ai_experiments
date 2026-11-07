import { createServer } from "node:http";
import { createHandler } from "./app.js";
import { openDatabase } from "./db.js";
import { DATABASE_PATH } from "./db/init.js";
import { VIEWS_DIR } from "./templates.js";

/**
 * Starts the HTTP server. `npm start` passes only the port, so the app always
 * uses data/app.db and src/views. The other options exist only for tests (FR-26).
 */
export async function startServer({
  port = 3000,
  databasePath = DATABASE_PATH,
  viewsDir = VIEWS_DIR,
} = {}) {
  const db = await openDatabase(databasePath);
  const server = createServer(createHandler({ db, viewsDir }));

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, resolve);
  });

  return {
    server,
    port: server.address().port,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      db.close();
    },
  };
}
