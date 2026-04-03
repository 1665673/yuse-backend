import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectDb } from "./db.js";

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[server] Listening on http://localhost:${config.port}`);
    console.log(`[server] Swagger UI at http://localhost:${config.port}/api-docs`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
