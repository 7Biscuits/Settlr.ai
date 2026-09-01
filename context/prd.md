# PayPilot — Product Requirements Document

## 1. What to Build

Build **PayPilot**, an AI-powered shared-expense and debt-settlement application inspired by Splitwise.

PayPilot allows users to:
- Create groups and add friends.
- Record and split shared expenses.
- Track who owes whom.
- Ask an AI agent about their expenses and debts through **text or voice**.
- Let the AI **reason → plan → act** using controlled backend tools.
- Execute financial actions such as settling debts through an in-app wallet.
- Require user confirmation for sensitive financial actions.

**Key differentiator:** PayPilot is not just an expense tracker. It turns expense information into **actionable financial workflows**.

---

## 2. Purpose of Building

Shared expenses are easy to record but often difficult to settle. Users still have to manually calculate debts, remind friends, decide who to pay, and execute payments.

PayPilot reduces this friction through an **AI financial agent** that understands natural-language requests, determines the required steps, and safely executes those steps using predefined backend tools.

### Example

> "How much do I owe everyone from our Goa trip?"

The AI retrieves the relevant expenses and calculates the user's outstanding balances.

More advanced:

> "Settle everything I owe Rahul."

The agent:
1. Identifies Rahul's outstanding balance.
2. Checks the user's wallet balance.
3. Creates the settlement.
4. Requests confirmation if required.
5. Executes the transaction.
6. Updates the final balances.

---

## 3. Features

### Expense & Group Management
- Create groups.
- Add/remove members.
- Create shared expenses.
- Split expenses equally or by custom amounts.
- Track individual and group balances.

### AI Financial Agent
- Text-based commands.
- Voice commands with speech-to-text.
- Understand natural-language financial requests.
- Retrieve financial data through controlled tools.
- Plan and execute multi-step tasks.

### Tool Calling & Orchestration

The LLM **does not directly access or modify the database**.

Instead, it uses controlled backend tools such as (but not limited to):

- `create_expense()`
- `get_expenses()`
- `get_balance()`
- `get_group_balance()`
- `add_friend()`
- `transfer_wallet_funds()`
- `settle_debt()`

The orchestration layer handles:
- Tool selection.
- Tool chaining.
- State/context management.
- Validation.
- Execution results.

### In-App Wallet (The currency is )
- Maintain wallet balance.
- Add funds through a simulated/sandbox flow.
- Transfer funds to other users.
- Settle debts using wallet funds.
- View transaction history.

### Safety & Human Oversight
- Backend validates every financial action.
- Permission checks prevent unauthorized actions.
- Insufficient-balance checks.
- Confirmation required for sensitive transactions.
- Verify transaction results before updating balances.

---

## 4. Core User Flow

```text
User Request
     ↓
AI Reasoning
     ↓
Tool Selection
     ↓
Tool Execution
     ↓
Result
     ↓
Next Tool (if required)
     ↓
User Confirmation
     ↓
Financial Action
     ↓
State Update

## 5. Example

"Pay everyone I owe."

Find outstanding debts
        ↓
Calculate total
        ↓
Check wallet balance
        ↓
Present proposed payments
        ↓
User confirms
        ↓
Execute settlements
        ↓
Verify transactions
        ↓
Update balances

6. MVP Scope

The hackathon MVP should prioritize:

User authentication
Groups and shared expenses
Debt/balance calculation
AI text/voice interface
LLM tool calling
Multi-step tool chaining
In-app wallet (demo currency)
At least one meaningful financial action
Human confirmation for financial actions
Complete end-to-end demo flow

Primary goal: Demonstrate that PayPilot can move beyond "telling the user what they owe" to reasoning about their finances and safely taking action on their behalf.