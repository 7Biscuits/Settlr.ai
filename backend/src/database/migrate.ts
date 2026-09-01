import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import { db, closeDatabase } from "./client.js";

const migrationsFolder = fileURLToPath(
  new URL("../../../database/migrations", import.meta.url),
);

async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder });
  console.log("Migrations complete.");
  await closeDatabase();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
