# ⚡ Settlr.ai (PayPilot)
### *The Autonomous AI Financial Co-Pilot & ACID-Compliant Social Expense Settlement Engine*

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_57-black.svg?style=for-the-badge&logo=react)](https://expo.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-000000.svg?style=for-the-badge&logo=fastify)](https://fastify.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E.svg?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![Deepgram](https://img.shields.io/badge/Deepgram-Nova--2_STT_%26_Aura_TTS-13EF93.svg?style=for-the-badge&logo=deepgram)](https://deepgram.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-C5F74F.svg?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![Vitest](https://img.shields.io/badge/Vitest-48_Passed-green.svg?style=for-the-badge&logo=vitest)](https://vitest.dev/)

</div>

---

## 🎬 Live Demo & Video Walkthrough

<div align="center">

<a href="https://streamable.com/cb48zv" target="_blank" title="Click to watch the full demo on Streamable">
  <img src="https://cdn-cf-east.streamable.com/image/cb48zv.jpg" onerror="this.src='https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80'" alt="Settlr.ai Live Demo Video" width="760" style="border-radius: 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.3); max-width: 100%; border: 2px solid #151C8A;" />
</a>

<br/>

[![Watch Demo](https://img.shields.io/badge/▶_Watch_Interactive_Demo-Streamable-00F58D?style=for-the-badge&logoColor=000000&labelColor=151C8A)](https://streamable.com/cb48zv)

*🎥 **Click the banner above or visit [https://streamable.com/cb48zv](https://streamable.com/cb48zv) to watch the end-to-end Voice AI, Group Expense Splits, and Instant Settlement demo in action.***

</div>

---

## 📑 Table of Contents
1. [Core Philosophy & Problem Statement](#-core-philosophy--problem-statement)
2. [End-to-End System Architecture](#-end-to-end-system-architecture)
3. [Deep-Dive Technical Subsystems](#-deep-dive-technical-subsystems)
   - [Voice AI Subsystem (Deepgram Nova-2 + Aura-2)](#1-voice-ai-subsystem-deepgram-nova-2--aura-2)
   - [AI Agent Orchestrator & Tool Registry](#2-ai-agent-orchestrator--autonomous-tool-registry)
   - [Financial Ledger & Split Calculator Engine](#3-financial-ledger--split-calculator-engine)
   - [Security, Auth & Idempotency Architecture](#4-security-auth--idempotency-architecture)
   - [Direct Messaging & Contact Discovery](#5-direct-messaging--contact-discovery)
   - [Mobile Architecture & UX Engineering](#6-mobile-architecture--ux-engineering)
4. [Database Schema & Entity Relationship Model](#-database-schema--entity-relationship-model)
5. [Complete REST API Reference](#-complete-rest-api-reference)
6. [Step-by-Step Installation & Run Guide](#-step-by-step-installation--run-guide)
7. [Seeded Demo Accounts](#-seeded-demo-accounts)
8. [Automated Testing & Verification](#-automated-testing--verification)
9. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🌟 Core Philosophy & Problem Statement

Splitting bills, tracking group debts, and settling shared expenses is traditionally fractured across disjointed note apps, calculator spreadsheets, and peer-to-peer payment gateways. Users are forced to manually compute ratios, chase down friends across messaging apps, and calculate pairwise balances.

**Settlr.ai (PayPilot)** solves this by uniting **conversational & voice-first generative AI** with an **ACID-compliant double-entry ledger**:

1. **Zero-Friction Natural Voice Interaction:** Talk naturally (*"Create a group called Goa Trip, add Alice and Bob, and split 1500 for dinner equally"*) $\rightarrow$ Transcribes audio in real-time, executes sequential database operations, computes penny-exact shares, gates dangerous balance changes behind a 1-tap confirmation sheet, and speaks back the outcome using neural TTS.
2. **Zero Floating-Point Drift Ledger:** All financial calculations are executed in integer minor units (paise/cents) using mathematical invariants ($\sum \text{splits} \equiv \text{total}$), eliminating penny rounding discrepancies.
3. **Atomic Pairwise Debt Simplification:** Directed balance graph computes who owes whom across all shared groups and enables 1-tap zero-fee settlements.

---

## 🏗️ End-to-End System Architecture

```mermaid
graph TD
    User([📱 Mobile User]) <-->|Voice Audio / UI Touch| Mobile[⚛️ React Native / Expo App SDK 57]
    
    subgraph Mobile Client Layer
        Mobile --> Rec[🎙️ expo-audio Voice Recorder]
        Mobile --> Play[🔊 expo-audio Voice Player]
        Mobile --> Nav[🧭 Expo Router File-Based Routing]
        Mobile --> Reanimated[✨ React Native Reanimated 4 & Gesture Handler]
        Mobile --> LocalStore[🔒 Expo SecureStore Session Engine]
    end

    Mobile <-->|HTTPS + JWT Bearer| Backend[⚡ Fastify 5.2 TypeScript Backend Engine]

    subgraph Backend Services & Logic Layer
        Backend --> RateLimit[🛡️ Sliding-Window Rate Limiter]
        Backend --> AuthSvc[🔐 Argon2id Auth & Token Revocation]
        Backend --> AgentEngine[🤖 Multi-Turn Agent Orchestrator]
        Backend --> VoiceEngine[🎙️ Deepgram Nova-2 STT & Aura-2 TTS]
        Backend --> SplitCalc[📐 Penny-Exact Split Math Engine]
        Backend --> Ledger[💳 Double-Entry Wallet & Settlement Engine]
    end

    subgraph External Cloud & Storage Infrastructure
        VoiceEngine <-->|Audio Stream| Deepgram[🌐 Deepgram API Cloud]
        AgentEngine <-->|OpenAI-Compatible Tool Calling| LLM[🧠 DeepSeek / Groq / OpenAI LLM]
        Backend <-->|Drizzle ORM Connection Pool| DB[(🐘 Supabase PostgreSQL 15 Database)]
        Backend <-->|Multipart Form Uploads| Storage[(🗄️ Supabase S3-Compatible Storage)]
    end
```

---

## 🔬 Deep-Dive Technical Subsystems

### 1. Voice AI Subsystem (Deepgram Nova-2 + Aura-2)

The voice pipeline delivers a responsive, low-latency conversational experience running entirely through backend proxies to ensure API keys are never exposed on client devices:

```mermaid
sequenceDiagram
    autonumber
    actor User as 📱 Mobile User
    participant AudioRec as 🎙️ expo-audio (Client)
    participant Backend as ⚡ Fastify Server
    participant DeepgramSTT as 🗣️ Deepgram Nova-2 STT
    participant LLM as 🤖 Agent Orchestrator
    participant DeepgramTTS as 🔊 Deepgram Aura-2 TTS
    participant AudioPlay as 🔈 expo-audio (Client)

    User->>AudioRec: Press & hold single mic button (Speak)
    AudioRec->>AudioRec: Record 44.1kHz M4A audio stream
    AudioRec->>Backend: POST /voice/transcribe (Base64 audio payload)
    Backend->>DeepgramSTT: POST /v1/listen?model=nova-2&smart_format=true
    DeepgramSTT-->>Backend: Transcribed plain-text string
    Backend-->>AudioRec: JSON { text: "..." }
    AudioRec->>Backend: POST /agent/chat (Transcribed user prompt)
    Backend->>LLM: Multi-step tool reasoning & execution
    LLM-->>Backend: Agent response text + tool results
    Backend->>DeepgramTTS: POST /v1/speak?model=aura-2-thalia-en (MP3 output)
    DeepgramTTS-->>Backend: Binary MP3 audio buffer
    Backend-->>AudioPlay: JSON { audioBase64: "...", mimeType: "audio/mpeg" }
    AudioPlay->>AudioPlay: Write to FileSystem cache & play via AudioPlayer
    AudioPlay-->>User: Speaks synthesized voice reply
```

* **Client Recording (`useVoiceRecorder.ts`):** Employs the modern `expo-audio` module (native to Expo SDK 57) configured with `RecordingPresets.HIGH_QUALITY` and `setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })`.
* **Client Playback (`useVoicePlayer.ts`):** Writes short-lived base64 audio chunks to `FileSystem.cacheDirectory`, initializes an `AudioPlayer` instance, and binds `playbackStatusUpdate` listeners to clean up memory immediately upon completion.
* **Instant TTS Mute Controls:** 
  * Header toggle pill (`TTS On 🔊` / `TTS Muted 🔇`) globally suppresses audio calls.
  * In-modal toggle inside `ConfirmSheet` allows muting spoken results of specific actions.
  * Real-time tap-to-mute interrupt halts ongoing audio playback instantly.

---

### 2. AI Agent Orchestrator & Autonomous Tool Registry

The backend orchestrator (`agentProposalService.ts`, `deepseekClient.ts`) implements an OpenAI-compatible function calling loop with a strict **Human-In-The-Loop (HITL)** security gate:

```mermaid
flowchart TD
    Prompt[User Input / Transcribed Speech] --> CallLLM[Invoke LLM with System Prompt & Tool Schemas]
    CallLLM --> CheckTools{Does LLM request tool execution?}
    
    CheckTools -- No --> ReturnReply[Return Final Assistant Response & Synthesize TTS]
    
    CheckTools -- Yes --> GatedCheck{Is Tool Destructive / Financial?}
    
    GatedCheck -- Safe (Read / Non-Financial) --> RunTool[Execute Tool Function on Database]
    RunTool --> FeedResult[Append Tool Result to Message Thread]
    FeedResult --> CallLLM
    
    GatedCheck -- Sensitive (Settle / Transfer) --> ProposeAction[Insert Pending Row in agent_action_proposals]
    ProposeAction --> SendConfirmSheet[Return status: confirmation_required with proposalId]
    SendConfirmSheet --> RenderUI[Render Native ConfirmSheet Modal to User]
    RenderUI --> UserDecision{User Taps Confirm?}
    UserDecision -- Cancel --> Abort[Delete Proposal & Cancel Action]
    UserDecision -- Confirm --> ExecuteProposal[POST /agent/confirm -> Execute Atomic Transaction]
    ExecuteProposal --> FeedResult
```

#### Autonomous Tool Calling Specification

| Tool Identifier | Description | Parameters | Safety Gate |
| :--- | :--- | :--- | :---: |
| `create_group` | Creates a shared split group | `name` (string) | 🟢 Autonomous |
| `add_group_member` | Adds user by email/phone or creates invite | `groupId` (UUID), `contact` (string) | 🟢 Autonomous |
| `add_expense` | Records group expense with split breakdown | `groupId` (UUID), `description` (string), `amount` (cents), `paidByUserId` (UUID), `splitType` (`equal`\|`exact`\|`percentage`\|`shares`), `splits` (array) | 🟢 Autonomous |
| `get_balances` | Computes pairwise debts across groups | `groupId` (UUID, optional) | 🟢 Autonomous |
| `propose_split` | Proposes a complex split allocation | `totalAmount` (cents), `memberIds` (array), `splitType` (string) | 🟢 Autonomous |
| `settle_debt` | Clears pairwise debt between users | `groupId` (UUID), `toUserId` (UUID), `amount` (cents) | 🔴 **Safety Gated** |
| `transfer_wallet_funds` | Transfers wallet balance directly to a user | `toUserId` (UUID), `amount` (cents) | 🔴 **Safety Gated** |

---

### 3. Financial Ledger & Split Calculator Engine

All currency computations strictly adhere to integer minor units (paise / cents) to prevent floating-point arithmetic errors:

```ts
// Mathematical Invariant Guaranteed by splitCalculator.ts:
// Sum of all split amounts MUST EXACTLY EQUAL the total bill.
assert(splits.reduce((acc, s) => acc + s.amount, 0) === totalAmount);
```

#### Split Allocation Algorithms:
1. **Equal Split (`equal`):** Divides `totalAmount` by $N$ using integer division `floor(total / N)`. The remainder $R = \text{total} \pmod N$ is distributed 1 cent/paise each to the first $R$ members.
2. **Exact Amounts (`exact`):** Explicit integer minor unit assignments; validated to match `totalAmount` exactly.
3. **Percentage Split (`percentage`):** Converts basis-point percentages ($100.00\% = 10000$) to minor units using largest-remainder rounding.
4. **Shares / Ratio Split (`shares`):** Computes weight ratios $w_i / \sum w$ and balances rounding remainders.

#### Pairwise Debt Simplification:
For any group $G$, pairwise balances are computed by evaluating directed edges between debtors and creditors:
$$\text{NetBalance}(u) = \sum \text{PaidBy}(u) - \sum \text{OwedBy}(u)$$
Positive net balance indicates money receivable; negative indicates payable.

---

### 4. Security, Auth & Idempotency Architecture

* **Argon2id Hashing:** Industry standard memory-hard hashing algorithm (`hashPassword(password)`) protects passwords against GPU dictionary attacks.
* **Database-Backed Token Blacklist:** `revoked_tokens` table stores SHA-256 hashes of invalidated JWTs upon user logout, blocking replayed bearer tokens.
* **Idempotency Safeguard:** All mutation endpoints (`POST /wallet/topup`, `POST /wallet/transfer`, `POST /wallet/settle`) require a `x-idempotency-key` UUID header to prevent double deductions during network retries.
* **Sliding-Window Rate Limiting:** In-memory rate limiting throttles brute force attempts on `/auth/login`, `/auth/register`, and `/voice/transcribe`.

---

### 5. Direct Messaging & Contact Discovery

* **Fuzzy & Indexed Contact Search:** `POST /users/lookup-contacts` and `GET /users/search` query against name, email, and normalized E.164 phone numbers.
* **Direct Conversations:** 1-on-1 private messaging channels with automatic unread counter badges and real-time polling.
* **Receipt Image Attachments:** Uploads receipts directly to Supabase S3-compatible storage with signed URI references.

---

### 6. Mobile Architecture & UX Engineering

* **Sliding Viewport Tabs:** Custom Reanimated 4 viewport driven by spring physics (`withSpring` damping 24, stiffness 240) eliminates tab mounting lag.
* **Intelligent Keyboard Avoidance:** 
  * Bottom navigation tab bar dynamically listens to `keyboardWillShow` / `keyboardDidShow` and collapses to 0 height.
  * `KeyboardAvoidingView` seamlessly pushes composer and chat bubbles into visible screen space with auto-scroll anchors.
* **Optimistic UI Updates:** Newly created groups and transactions update local state immediately before network confirmation.

---

## 🗄️ Database Schema & Entity Relationship Model

```mermaid
erDiagram
    users ||--o{ wallets : "owns (1:1)"
    users ||--o{ group_members : "belongs to"
    users ||--o{ expenses : "paid by"
    users ||--o{ expense_splits : "owes"
    users ||--o{ transactions : "initiates / receives"
    users ||--o{ settlements : "settles with"
    users ||--o{ direct_messages : "sends"
    users ||--o{ agent_action_proposals : "requests"
    users ||--o{ revoked_tokens : "invalidates"

    groups ||--o{ group_members : "contains"
    groups ||--o{ expenses : "contains"
    groups ||--o{ balances : "tracks"
    groups ||--o{ settlements : "tracks"
    groups ||--o{ group_invitations : "invites"

    expenses ||--o{ expense_splits : "divided into"
    conversations ||--o{ direct_messages : "holds"

    users {
        uuid id PK
        varchar email UK
        varchar name
        varchar password_hash
        varchar phone UK
        varchar avatar_url
        text bio
        timestamp created_at
    }

    wallets {
        uuid id PK
        uuid user_id FK
        bigint balance
        timestamp updated_at
    }

    groups {
        uuid id PK
        varchar name
        uuid created_by FK
        timestamp created_at
    }

    group_members {
        uuid id PK
        uuid group_id FK
        uuid user_id FK
        varchar role
        timestamp joined_at
    }

    expenses {
        uuid id PK
        uuid group_id FK
        uuid paid_by FK
        varchar description
        bigint amount
        varchar split_type
        varchar receipt_url
        timestamp created_at
    }

    expense_splits {
        uuid id PK
        uuid expense_id FK
        uuid user_id FK
        bigint amount
        timestamp created_at
    }

    transactions {
        uuid id PK
        uuid wallet_id FK
        uuid from_user_id FK
        uuid to_user_id FK
        varchar type
        bigint amount
        varchar idempotency_key UK
        varchar status
        timestamp created_at
    }

    balances {
        uuid id PK
        uuid group_id FK
        uuid user_a FK
        uuid user_b FK
        bigint amount
        timestamp updated_at
    }
```

---

## 📡 Complete REST API Reference

| Domain | Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :---: |
| **Auth** | `POST` | `/auth/register` | Register new user with wallet initialization | ❌ No |
| | `POST` | `/auth/login` | Authenticate credentials & return JWT | ❌ No |
| | `POST` | `/auth/logout` | Revoke active JWT in database | ✅ Yes |
| | `GET` | `/auth/me` | Return active authenticated user profile | ✅ Yes |
| **Dashboard** | `GET` | `/dashboard` | Returns aggregated balance, debts, activity & groups | ✅ Yes |
| **Groups** | `GET` | `/groups` | List all groups for authenticated user | ✅ Yes |
| | `POST` | `/groups` | Create a new split group | ✅ Yes |
| | `GET` | `/groups/:id` | Get group details, member roster & metrics | ✅ Yes |
| | `PATCH` | `/groups/:id` | Update group name (owner only) | ✅ Yes |
| | `DELETE` | `/groups/:id` | Delete group (only if all debts are settled) | ✅ Yes |
| | `POST` | `/groups/:id/members` | Add member directly by email | ✅ Yes |
| | `POST` | `/groups/:id/invitations` | Create shareable invite or add member | ✅ Yes |
| **Expenses** | `POST` | `/groups/:id/expenses` | Add group expense with split breakdown | ✅ Yes |
| | `GET` | `/groups/:id/expenses` | List group expenses | ✅ Yes |
| | `GET` | `/expenses/:id` | Get detailed expense breakdown | ✅ Yes |
| | `DELETE` | `/expenses/:id` | Delete expense and roll back ledger | ✅ Yes |
| **Balances** | `GET` | `/groups/:id/balances` | Get pairwise balances inside a group | ✅ Yes |
| | `GET` | `/balances` | Get overall net balances across all groups | ✅ Yes |
| **Wallet** | `GET` | `/wallet` | Get wallet balance and recent transactions | ✅ Yes |
| | `POST` | `/wallet/topup` | Add sandbox funds to wallet (`idempotencyKey`) | ✅ Yes |
| | `POST` | `/wallet/transfer` | Direct P2P wallet transfer (`idempotencyKey`) | ✅ Yes |
| | `POST` | `/wallet/settle` | Settle group debt via wallet (`idempotencyKey`) | ✅ Yes |
| **AI Agent** | `POST` | `/agent/chat` | Send conversational prompt for tool execution | ✅ Yes |
| | `POST` | `/agent/confirm` | Confirm & execute sensitive proposed tool action | ✅ Yes |
| **Voice** | `POST` | `/voice/transcribe` | Deepgram Nova-2 speech-to-text audio parser | ✅ Yes |
| | `POST` | `/voice/synthesize` | Deepgram Aura-2 neural text-to-speech engine | ✅ Yes |
| **Messaging** | `GET` | `/messages/conversations` | List direct message threads with unread counts | ✅ Yes |
| | `GET` | `/messages/:userId` | Get 1-on-1 message history | ✅ Yes |
| | `POST` | `/messages/:userId` | Send 1-on-1 message with optional attachment | ✅ Yes |
| **Users** | `GET` | `/users/search?q=...` | Search users by name, email, or phone | ✅ Yes |
| | `POST` | `/users/lookup-contacts` | Batch match address book contacts against users | ✅ Yes |

---

## 🚀 Step-by-Step Installation & Run Guide

### Prerequisites
* **Node.js** $\ge 20.x$
* **npm** $\ge 10.x$
* **Git**
* **Expo Go App** (iOS / Android) or simulator

---

### 1. Clone the Repository
```bash
git clone https://github.com/7Biscuits/Settlr.ai.git
cd Settlr.ai
```

---

### 2. Configure Backend Environment
Create `backend/.env` in the `backend/` directory:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database Connection (Supabase PostgreSQL Connection URI)
DATABASE_URL=postgresql://postgres.your-project:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# JWT Secret (Must be >= 32 characters in production)
JWT_SECRET=super_secret_jwt_key_settlr_hackathon_demo_2026_x1y2z3

# AI Agent Configuration (DeepSeek / Groq / OpenAI Compatible)
DEEPSEEK_API_KEY=your_deepseek_or_groq_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# Deepgram Voice AI
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_STT_MODEL=nova-2
DEEPGRAM_TTS_MODEL=aura-2-thalia-en
```

---

### 3. Install Backend Dependencies, Migrate & Seed
```bash
cd backend
npm install

# Push database schema to Supabase PostgreSQL
npx drizzle-kit push

# Seed the 4 primary Settlr demo users and transactions
npm run seed

# Run automated test suite (48 tests)
npm test
```

---

### 4. Start the Backend Server
```bash
npm run dev
# Fastify server will start listening on http://0.0.0.0:3000
```

---

### 5. Configure & Start the Mobile App
Open a new terminal window:
```bash
cd ../mobile
npm install

# (Optional) Explicitly set backend IP if using physical device:
# export EXPO_PUBLIC_API_BASE_URL="http://192.168.1.50:3000"

# Start the Expo Dev Server
npx expo start -c
```
* **iOS Simulator:** Press **`i`**
* **Android Emulator:** Press **`a`**
* **Physical Device:** Open **Expo Go** and scan the displayed QR code.

---

## 👥 Seeded Demo Accounts

Use any of these pre-configured accounts for testing or presentations (all accounts share password `password123`):

| Name | Email Address | Password | Initial Balance | Bio / Demo Persona |
| :--- | :--- | :---: | :---: | :--- |
| **Rudransh** | `rudransh@settlr.ai` | `password123` | **₹85,000.00** | AI Engineer & Primary Demo Account 🤖 |
| **Shahil** | `shahil@settlr.ai` | `password123` | **₹75,000.00** | Settlr Co-founder & Split Participant 🚀 |
| **Rupam** | `rupam@settlr.ai` | `password123` | **₹60,000.00** | Product Designer & Coffee Aficionado ☕ |
| **Kamal** | `kamal@settlr.ai` | `password123` | **₹50,000.00** | Operations Lead & Roadtrip Planner 🏖️ |

---

## 🧪 Automated Testing & Verification

The test suite covers unit split calculators, agent orchestrator multi-turn tools, group expense lifecycles, and voice pipelines:

```bash
npm --prefix backend test
```

```
 RUN  v2.1.5 /Users/rudranshsrivastava/Programming/PayPilot/backend

 ✓ test/split.test.ts (13 tests) 12ms
 ✓ test/agent_orchestrator.test.ts (5 tests) 8ms
 ✓ test/tools.test.ts (4 tests) 4ms
 ✓ test/group_mgmt.test.ts (8 tests) 78ms
 ✓ test/expense_mgmt.test.ts (8 tests) 77ms
 ✓ test/messages.test.ts (10 tests) 97ms
 ✓ test/storage.test.ts (5 tests) 123ms
 ✓ test/user.test.ts (9 tests) 125ms
 ✓ test/voice.test.ts (5 tests) 60ms
 ✓ test/logout.test.ts (3 tests) 42ms

 Test Files  10 passed (10)
      Tests  48 passed (48)
```

---

## ❓ Troubleshooting & FAQs

#### Q1: "Cannot connect to backend from physical phone on Expo Go"
* **Solution:** Make sure your mobile device and computer are on the **same Wi-Fi network**. The app automatically infers your computer's local IP address from Expo's debugger host. If using a firewall or VPN, set `EXPO_PUBLIC_API_BASE_URL="http://<YOUR_LOCAL_IP>:3000"` in `mobile/.env`.

#### Q2: "Supabase connection refused / timeout"
* **Solution:** Ensure you are using Supabase's **Session/Transaction Pooler** (port `6543` or `5432` with IPv4 compatibility mode enabled). The backend client sets `rejectUnauthorized: false` automatically for cloud TLS handshakes.

#### Q3: "Microphone permission error during voice commands"
* **Solution:** On iOS Simulator or Android Emulator, ensure microphone permissions are granted in System Settings. On physical devices, accept the system prompt on first mic tap.

---

## 📄 License
Settlr.ai is open source software licensed under the [MIT License](LICENSE).
