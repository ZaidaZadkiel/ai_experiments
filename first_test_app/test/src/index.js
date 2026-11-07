import { startServer } from "./server.js";

const { port } = await startServer({ port: Number(process.env.PORT || 3000) });
console.log(`Greeter listening on http://localhost:${port}`);
