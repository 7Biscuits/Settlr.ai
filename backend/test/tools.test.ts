import { describe, it, expect } from "vitest";
import { listTools, getTool, isSensitive, getToolSchemasForLLM } from "../src/tools/registry.js";

describe("tool registry", () => {
  it("registers the expected tools", () => {
    const names = listTools().map((t) => t.name).sort();
    expect(names).toContain("get_balance");
    expect(names).toContain("create_expense");
    expect(names).toContain("settle_debt");
    expect(names).toContain("transfer_wallet_funds");
  });

  it("flags money-moving tools as sensitive", () => {
    expect(isSensitive("settle_debt")).toBe(true);
    expect(isSensitive("transfer_wallet_funds")).toBe(true);
    expect(isSensitive("create_expense")).toBe(true);
    expect(isSensitive("get_balance")).toBe(false);
    expect(isSensitive("check_wallet_balance")).toBe(false);
  });

  it("treats unknown tools as sensitive by default", () => {
    expect(isSensitive("nonexistent_tool")).toBe(true);
    expect(getTool("nonexistent_tool")).toBeUndefined();
  });

  it("produces LLM function schemas for every tool", () => {
    const schemas = getToolSchemasForLLM();
    expect(schemas.length).toBe(listTools().length);
    for (const s of schemas) {
      expect(s.type).toBe("function");
      expect(typeof s.function.name).toBe("string");
      expect(s.function.parameters).toHaveProperty("type", "object");
    }
  });
});
