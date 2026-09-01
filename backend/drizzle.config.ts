import { defineConfig } from "drizzle-kit";
// Drizzle Kit evaluates this TypeScript file directly, before the project is
// compiled. It therefore needs the TypeScript source extension here rather
// than the `.js` extension used by the compiled application.
import { env } from "./src/config/env.ts";

export default defineConfig({
  schema: "./src/database/schema/index.ts",
  out: "../database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
