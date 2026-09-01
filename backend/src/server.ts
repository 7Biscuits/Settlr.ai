import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { closeDatabase } from "./database/client.js";

async function main() {
  const app = await buildApp();

  const shutdown = async () => {
    await app.close();
    await closeDatabase();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
