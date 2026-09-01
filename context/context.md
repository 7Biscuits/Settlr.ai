# PayPilot — Architecture

## 1. App Flow

PayPilot follows an AI-agent architecture where the LLM handles reasoning and planning, while the backend controls all actual financial operations.

### Overall Flow

```text
User
  │
  ├── Text
  └── Voice
       │
       ▼
   Frontend
       │
       ▼
   AI Agent
       │
       ├── Understand intent
       ├── Reason
       ├── Plan
       └── Select tools
              │
              ▼
      Tool Orchestration
              │
              ├── Validate
              ├── Execute
              ├── Process result
              └── Chain next tool
                     │
                     ▼
                Backend
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Expenses   Balances    Wallet
          │          │          │
          └──────────┼──────────┘
                     ▼
                 PostgreSQL
                     │
                     ▼
              Updated State
                     │
                     ▼
                  AI Agent
                     │
                     ▼
                   User


### Core Principle

The LLM never directly accesses or modifies the database.

The LLM can only interact with the application through predefined tools. The backend validates every tool request and performs the actual operation.

LLM
 │
 │ Tool Call
 ▼
Tool Layer
 │
 │ Validated Request
 ▼
Backend Services
 │
 ▼
Database / Wallet

### 2. Application Flows
Normal Expense Flow
Create Expense
      ↓
Backend Validation
      ↓
Calculate Splits
      ↓
Store Expense
      ↓
Update Balances
      ↓
Display Updated State

AI Query Flow

Example:

"How much do I owe Rahul?"

User Request
      ↓
AI Agent
      ↓
Understand Intent
      ↓
get_balance()
      ↓
Backend
      ↓
Tool Result
      ↓
AI Response
      ↓
User
AI Action Flow

Example:

"Settle everything I owe Rahul."

User Request
      ↓
AI Agent
      ↓
Understand Intent
      ↓
get_balance()
      ↓
check_wallet_balance()
      ↓
Create Settlement Plan
      ↓
User Confirmation
      ↓
transfer_wallet_funds()
      ↓
settle_debt()
      ↓
Verify Transaction
      ↓
Update Balances
      ↓
AI Response
Multi-Step Tool Chaining

Tool calls can be chained when completing a request requires multiple operations.

User Request
      ↓
get_balance()
      ↓
Tool Result
      ↓
check_wallet_balance()
      ↓
Tool Result
      ↓
calculate_settlement()
      ↓
User Confirmation
      ↓
transfer_wallet_funds()
      ↓
settle_debt()
      ↓
verify_transaction()
3. System Architecture
Frontend

Responsible for the user-facing application.

Authentication
Dashboard
Groups
Expense management
Balance visualization
Wallet
Transaction history
AI chat
Voice input
Action confirmations
AI Agent

Responsible for reasoning and decision-making.

Understand natural-language requests
Determine user intent
Retrieve relevant information
Select tools
Create multi-step plans
Chain tool calls
Interpret tool results
Generate responses

The AI agent does not contain financial business logic.

Tool & Orchestration Layer

Acts as the controlled interface between the AI and the application.

Responsibilities:

Define available tools
Validate tool parameters
Execute tools
Handle tool results
Maintain execution context
Chain multiple tool calls
Handle failures and invalid requests
Backend

Responsible for application and financial business logic.

Authentication
Authorization
User management
Group management
Expense management
Balance calculations
Debt settlement
Wallet operations
Transaction processing
Database access
Validation
Database

PostgreSQL stores the application's persistent state.

Main entities include:

Users
Groups
Group Members
Expenses
Expense Splits
Balances
Wallets
Transactions
Settlements
4. Folder & File Structure
paypilot/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── groups/
│   │   │   ├── expenses/
│   │   │   ├── balances/
│   │   │   ├── wallet/
│   │   │   └── ai/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   │
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   │
│   │   ├── tools/
│   │   │   ├── expense/
│   │   │   ├── group/
│   │   │   ├── balance/
│   │   │   └── wallet/
│   │   │
│   │   ├── agent/
│   │   │   ├── agent/
│   │   │   ├── orchestration/
│   │   │   └── prompts/
│   │   │
│   │   ├── database/
│   │   └── utils/
│   │
│   └── ...
│
├── database/
│   ├── schema/
│   └── migrations/
│
├── docs/
│   ├── PRD.md
│   └── ARCHITECTURE.md
│
└── README.md
Architectural Separation
AI Agent
    │
    │ Tool Calls
    ▼
Tools
    │
    │ Validated Operations
    ▼
Backend Services
    │
    ▼
Database / Wallet

The AI decides what should happen.

The backend decides whether it is allowed to happen and performs the operation.

5. Tech Stack
Frontend
NextJS
TypeScript
Vite
Tailwind CSS
Backend
Node.js
Fastify
TypeScript
Database & Infrastructure
PostgreSQL
Drizzle ORM
 
AI
DeepSeek
LLM Tool Calling
ElevenLabs for voice
Speech-to-Text
Architecture
NextJS + TypeScript
        │
        ▼
Node.js + Fastify
        │
        ├───────────────┐
        ▼               ▼
   AI Agent       Backend Services
        │               │
        ▼               │
  Tool Calling          │
        │               │
        └───────┬───────┘
                ▼
            PostgreSQL
                │
              
6. Design Principles
LLM decides, backend enforces.
The LLM never directly modifies application state.
All financial actions happen through controlled tools.
Backend validation is mandatory for every financial operation.
Sensitive actions require user confirmation.
Tool results can be used to determine subsequent tool calls.
The database remains the source of truth.