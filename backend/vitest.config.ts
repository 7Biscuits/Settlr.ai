import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    testTimeout: 20000,
    // Safe defaults so importing modules that validate env does not fail.
    // DB-backed tests are gated behind RUN_DB_TESTS and skip without it.
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgres://paypilot:paypilot@localhost:5432/paypilot",
      JWT_SECRET: process.env.JWT_SECRET ?? "test-secret",
    },
  },
});
