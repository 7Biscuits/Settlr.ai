import { describe, it, expect } from "vitest";
import { listTools, getTool, isSensitive, getToolSchemasForLLM } from "../src/tools/registry.js";

describe("tool registry", () => {
  it("registers the expected tools", () => {
    const names = listTools().map((t) => t.name).sort();
    expect(names).toContain("create_expense");
    expect(names).toContain("update_expense");
    expect(names).toContain("delete_expense");
    expect(names).toContain("get_groups");
    expect(names).toContain("create_group");
    expect(names).toContain("update_group");
    expect(names).toContain("delete_group");
    expect(names).toContain("invite_to_group");
    expect(names).toContain("settle_debt");
    expect(names).toContain("transfer_wallet_funds");
    expect(names).toContain("get_my_profile");
    expect(names).toContain("lookup_user_by_contact");
    expect(names).toContain("update_my_profile");
    expect(names).toContain("list_conversations");
    expect(names).toContain("get_direct_messages");
    expect(names).toContain("send_direct_message");
  });

  it("flags money-moving and mutating tools as sensitive", () => {
    expect(isSensitive("settle_debt")).toBe(true);
    expect(isSensitive("transfer_wallet_funds")).toBe(true);
    expect(isSensitive("create_expense")).toBe(true);
    expect(isSensitive("update_expense")).toBe(true);
    expect(isSensitive("delete_expense")).toBe(true);
    expect(isSensitive("create_group")).toBe(true);
    expect(isSensitive("update_group")).toBe(true);
    expect(isSensitive("delete_group")).toBe(true);
    expect(isSensitive("update_my_profile")).toBe(true);
    expect(isSensitive("send_direct_message")).toBe(true);
    expect(isSensitive("get_balance")).toBe(false);
    expect(isSensitive("check_wallet_balance")).toBe(false);
    expect(isSensitive("get_groups")).toBe(false);
    expect(isSensitive("get_my_profile")).toBe(false);
    expect(isSensitive("lookup_user_by_contact")).toBe(false);
    expect(isSensitive("list_conversations")).toBe(false);
    expect(isSensitive("get_direct_messages")).toBe(false);
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
