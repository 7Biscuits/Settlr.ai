import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, closeDatabase } from "./client.js";

async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "../database/migrations" });
  console.log("Migrations complete.");
  await closeDatabase();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
