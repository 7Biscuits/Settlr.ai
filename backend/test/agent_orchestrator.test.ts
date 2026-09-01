import { describe, it, expect, vi, beforeEach } from "vitest";
import { runAgent, confirmAction } from "../src/agent/orchestration/orchestrator.js";
import * as deepseekClient from "../src/services/deepseekClient.js";
import * as balanceService from "../src/services/balanceService.js";
import * as walletService from "../src/services/walletService.js";

describe("AI Agent Tool Calling Orchestrator", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("automatically executes non-sensitive (read-only) tools and returns the answer", async () => {
    const mockChatCompletion = vi.spyOn(deepseekClient, "chatCompletion");

    // Step 1: Model asks to call get_balance tool
    mockChatCompletion.mockResolvedValueOnce({
      content: null,
      toolCalls: [
        {
          id: "call_123",
          type: "function",
          function: {
            name: "get_balance",
            arguments: JSON.stringify({}),
          },
        },
      ],
    });

    // Mock balanceService.getOverallBalancesForUser
    vi.spyOn(balanceService, "getOverallBalancesForUser").mockResolvedValueOnce({
      userId: "user-1",
      netBalance: 2500, // +$25.00
      youAreOwed: 2500,
      youOwe: 0,
      breakdown: [],
    });

    // Step 2: Model receives tool output and replies to user
    mockChatCompletion.mockResolvedValueOnce({
      content: "Your overall balance is +$25.00. You are owed $25.00.",
      toolCalls: [],
    });

    const reply = await runAgent(
      { userId: "user-1" },
      "What is my current balance?",
    );

    expect(reply.type).toBe("message");
    expect(reply.content).toContain("+$25.00");
    expect(mockChatCompletion).toHaveBeenCalledTimes(2);

    // Verify messages list includes tool execution result
    const toolMsg = reply.messages.find((m) => m.role === "tool");
    expect(toolMsg).toBeDefined();
    expect(toolMsg?.tool_call_id).toBe("call_123");
    expect(JSON.parse(toolMsg?.content || "{}")).toMatchObject({
      success: true,
      data: { balances: { netBalance: 2500 } },
    });
  });

  it("halts for user confirmation when the model proposes a sensitive tool", async () => {
    const mockChatCompletion = vi.spyOn(deepseekClient, "chatCompletion");

    const targetUserId = "44444444-4444-4444-4444-444444444444";

    // Model requests transfer_wallet_funds (which is sensitive)
    mockChatCompletion.mockResolvedValueOnce({
      content: "I am ready to transfer $50.00 to Bob.",
      toolCalls: [
        {
          id: "call_transfer_1",
          type: "function",
          function: {
            name: "transfer_wallet_funds",
            arguments: JSON.stringify({
              toUserId: targetUserId,
              amount: 5000,
            }),
          },
        },
      ],
    });

    // Spy on walletService.transferFunds - should NOT be called before confirmation
    const transferSpy = vi.spyOn(walletService, "transferFunds");

    const reply = await runAgent(
      { userId: "user-1" },
      `Send $50 to Bob (${targetUserId})`,
    );

    expect(reply.type).toBe("confirmation_required");
    expect(reply.pendingAction).toBeDefined();
    expect(reply.pendingAction?.tool).toBe("transfer_wallet_funds");
    expect(reply.pendingAction?.arguments).toEqual({
      toUserId: targetUserId,
      amount: 5000,
    });
    // Ensure transferFunds was not yet executed!
    expect(transferSpy).not.toHaveBeenCalled();
  });

  it("executes the sensitive tool upon explicit confirmation and summarizes result", async () => {
    const targetUserId = "44444444-4444-4444-4444-444444444444";
    const transferSpy = vi
      .spyOn(walletService, "transferFunds")
      .mockResolvedValueOnce({
        id: "tx-1",
        type: "transfer",
        fromUserId: "user-1",
        toUserId: targetUserId,
        amount: 5000,
        status: "completed",
        idempotencyKey: "idemp-123",
        createdAt: new Date(),
      });

    const mockChatCompletion = vi
      .spyOn(deepseekClient, "chatCompletion")
      .mockResolvedValueOnce({
        content: "Transfer of $50.00 to Bob succeeded successfully!",
        toolCalls: [],
      });

    const priorMessages = [
      { role: "system" as const, content: "system" },
      { role: "user" as const, content: "Send $50 to Bob" },
      {
        role: "assistant" as const,
        content: "I need your confirmation.",
        tool_calls: [
          {
            id: "call_transfer_1",
            type: "function" as const,
            function: {
              name: "transfer_wallet_funds",
              arguments: JSON.stringify({
                toUserId: targetUserId,
                amount: 5000,
              }),
            },
          },
        ],
      },
    ];

    const result = await confirmAction(
      { userId: "user-1" },
      "transfer_wallet_funds",
      { toUserId: targetUserId, amount: 5000 },
      "call_transfer_1",
      priorMessages,
    );

    expect(transferSpy).toHaveBeenCalledTimes(1);
    expect(result.type).toBe("message");
    expect(result.content).toContain("succeeded successfully");
    expect(mockChatCompletion).toHaveBeenCalledTimes(1);
  });

  it("chains multiple read tools sequentially (Step 1: lookup contact -> Step 2: check debt)", async () => {
    const mockChatCompletion = vi.spyOn(deepseekClient, "chatCompletion");
    const aliceId = "11111111-1111-1111-1111-111111111111";
    const groupId = "22222222-2222-2222-2222-222222222222";

    // Step 1: Model calls lookup_user_by_contact to find Alice
    mockChatCompletion.mockResolvedValueOnce({
      content: null,
      toolCalls: [
        {
          id: "call_lookup",
          type: "function",
          function: {
            name: "lookup_user_by_contact",
            arguments: JSON.stringify({ query: "Alice" }),
          },
        },
      ],
    });

    // Mock userService
    const userModule = await import("../src/services/userService.js");
    vi.spyOn(userModule, "lookupUserByContact").mockResolvedValueOnce({
      id: aliceId,
      name: "Alice Smith",
      avatarUrl: null,
    });

    // Step 2: Model receives Alice's UUID and calls get_debt_to_user
    mockChatCompletion.mockResolvedValueOnce({
      content: null,
      toolCalls: [
        {
          id: "call_debt",
          type: "function",
          function: {
            name: "get_debt_to_user",
            arguments: JSON.stringify({ groupId, otherUserId: aliceId }),
          },
        },
      ],
    });

    // Mock balanceService
    vi.spyOn(balanceService, "getDebtToUserInGroup").mockResolvedValueOnce({
      groupId,
      userId: "user-1",
      otherUserId: aliceId,
      youOwe: 3000,
      youAreOwed: 0,
      netOwedToUser: -3000,
    });

    // Mock group membership assertion
    const groupModule = await import("../src/services/groupService.js");
    vi.spyOn(groupModule, "assertMember").mockResolvedValue();

    // Step 3: Model summarizes final answer
    mockChatCompletion.mockResolvedValueOnce({
      content: "You owe Alice $30.00 in this group.",
      toolCalls: [],
    });

    const reply = await runAgent(
      { userId: "user-1" },
      "How much do I owe Alice in the Trip group?",
    );

    expect(reply.type).toBe("message");
    expect(reply.content).toBe("You owe Alice $30.00 in this group.");
    expect(mockChatCompletion).toHaveBeenCalledTimes(3);

    // Verify all tool steps are in the messages chain
    const toolCalls = reply.messages.filter((m) => m.role === "tool");
    expect(toolCalls.length).toBe(2);
    expect(toolCalls[0]?.name).toBe("lookup_user_by_contact");
    expect(toolCalls[1]?.name).toBe("get_debt_to_user");
  });

  it("chains a read tool into a sensitive tool (lookup contact -> propose transfer)", async () => {
    const mockChatCompletion = vi.spyOn(deepseekClient, "chatCompletion");
    const bobId = "33333333-3333-3333-3333-333333333333";

    // Step 1: Model calls lookup_user_by_contact
    mockChatCompletion.mockResolvedValueOnce({
      content: null,
      toolCalls: [
        {
          id: "call_lookup_bob",
          type: "function",
          function: {
            name: "lookup_user_by_contact",
            arguments: JSON.stringify({ phone: "+15551234567" }),
          },
        },
      ],
    });

    const userModule = await import("../src/services/userService.js");
    vi.spyOn(userModule, "lookupUserByContact").mockResolvedValueOnce({
      id: bobId,
      name: "Bob Jones",
      avatarUrl: null,
    });

    // Step 2: Model receives Bob's ID and proposes transfer_wallet_funds
    mockChatCompletion.mockResolvedValueOnce({
      content: "Found Bob (+15551234567). I need confirmation to transfer $20.00.",
      toolCalls: [
        {
          id: "call_transfer_bob",
          type: "function",
          function: {
            name: "transfer_wallet_funds",
            arguments: JSON.stringify({ toUserId: bobId, amount: 2000 }),
          },
        },
      ],
    });

    const reply = await runAgent(
      { userId: "user-1" },
      "Send $20 to +15551234567",
    );

    expect(reply.type).toBe("confirmation_required");
    expect(reply.pendingAction?.tool).toBe("transfer_wallet_funds");
    expect(reply.pendingAction?.arguments).toEqual({
      toUserId: bobId,
      amount: 2000,
    });
    expect(mockChatCompletion).toHaveBeenCalledTimes(2);
  });
});

