# ⚡ Settlr.ai (PayPilot)
### *The Autonomous AI Financial Co-Pilot & Social Expense Settlement Engine*

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_57-black.svg)](https://expo.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-000000.svg)](https://fastify.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E.svg)](https://supabase.com/)
[![Deepgram](https://img.shields.io/badge/Deepgram-Nova--2_STT_%26_Aura_TTS-13EF93.svg)](https://deepgram.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-C5F74F.svg)](https://orm.drizzle.team/)
[![Tests](https://img.shields.io/badge/Vitest-48_Passed-green.svg)](https://vitest.dev/)

</div>

---

## 🎬 Live Demo Video

<div align="center">

<a href="https://streamable.com/cb48zv" target="_blank" title="Click to watch the full demo on Streamable">
  <img src="https://cdn-cf-east.streamable.com/image/cb48zv.jpg" onerror="this.src='https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80'" alt="Settlr.ai Live Demo Video" width="760" style="border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); max-width: 100%; border: 2px solid #151C8A;" />
</a>

<br/>

[![Watch Demo](https://img.shields.io/badge/▶_Watch_Interactive_Demo-Streamable-00F58D?style=for-the-badge&logoColor=000000&labelColor=151C8A)](https://streamable.com/cb48zv)

*🎥 **Click the banner above to watch the end-to-end Voice AI, Group Splits, and Instant Settlement walkthrough on Streamable.***

</div>

---

## 🌟 Overview & Problem Statement

Splitting bills, tracking group debts, and transferring money with friends is traditionally painful, fractured across multiple apps, and prone to manual calculation errors. 

**Settlr.ai (PayPilot)** reimagines social finance by integrating **conversational and voice-first AI** directly into an **atomic financial ledger**:
* **Speak Naturally:** *"Split ₹1,200 for dinner equally between Alice and Bob"* $\rightarrow$ Transcribes in milliseconds, orchestrates multi-step ledger tools, calculates penny-exact shares, prompts for 1-tap confirmation, and speaks back the outcome.
* **Instant Direct Settlements:** Zero-fee peer-to-peer wallet transfers, 1-tap pairwise debt resolution, and contact lookup by Name, Email, or Phone.
* **Autonomous Financial Assistant:** DeepSeek/Groq OpenAI-compatible LLM orchestrator equipped with a robust financial tool registry.

---

## 🏗️ System Architecture

```mermaid
graph TD
    User([📱 Mobile User]) <-->|Voice Audio / UI Touch| Mobile[⚛️ React Native / Expo App]
    
    subgraph Mobile Client Layer
        Mobile --> Rec[🎙️ expo-audio Voice Recorder]
        Mobile --> Play[🔊 expo-audio Voice Player]
        Mobile --> UI[🎨 Responsive UI & Dynamic Bottom Tabs]
    end

    Mobile <-->|REST API + JWT Bearer| Backend[⚡ Fastify TypeScript Backend]

    subgraph Backend Services & Agent Layer
        Backend --> Auth[🔐 Argon2 Auth & JWT Revocation]
        Backend --> SplitEngine[📐 Integer Split Calculator]
        Backend --> VoiceSvc[🎙️ Deepgram STT Nova-2 & Aura TTS]
        Backend --> Agent[🤖 AI Agent Orchestrator]
    end

    subgraph External AI & Data Infrastructure
        VoiceSvc <-->|Audio Stream| Deepgram[🌐 Deepgram API]
        Agent <-->|Structured Function Calling| LLM[🧠 DeepSeek / Groq / OpenAI LLM]
        Backend <-->|Drizzle ORM Connection Pool| DB[(🐘 Supabase PostgreSQL Database)]
    end
```

---

## ✨ Key Features & Technical Innovations

### 1. 🎙️ End-to-End Voice AI & Text-to-Speech Feedback Loop
* **Ultra Low-Latency STT:** Integrates **Deepgram Nova-2** to capture and transcribe spoken natural language with financial domain precision.
* **Natural Voice Synthesis:** Generates human-like audio replies via **Deepgram Aura-2** (`aura-2-thalia-en`).
* **Flexible Voice Controls:** 
  * Header toggle for **`TTS On 🔊` / `TTS Muted 🔇`**.
  * Per-action mute selection inside sensitive confirmation sheets.
  * Real-time **Tap-to-Mute** button while speech is playing.

### 2. 🤖 Autonomous Financial Tool Calling Registry
The backend AI Agent executes complex multi-step financial logic using structured tool calling:

| Tool Name | Purpose & Capabilities | Confirmation Gate |
| :--- | :--- | :---: |
| `create_group` | Creates a new split group for trips, roommates, or projects | ❌ Autonomous |
| `add_group_member` | Discovers registered users by email/phone and adds them | ❌ Autonomous |
| `add_expense` | Records group expenses with equal, custom, percentage, or share splits | ❌ Autonomous |
| `get_balances` | Computes live directed debts and net receivables across all groups | ❌ Autonomous |
| `settle_debt` | Clears pairwise debts atomically between two users | ⚠️ **Safety Gated** |
| `transfer_wallet_funds` | Executes direct P2P wallet transfers with idempotency keys | ⚠️ **Safety Gated** |
| `propose_split` | Proposes a complex split breakdown for user review | ❌ Autonomous |

### 3. 🛡️ Confirmation Safety Gate (`ConfirmSheet`)
No destructive or monetary transaction is executed without explicit human authorization. The AI proposes an `AgentActionProposal` payload, renders a breakdown modal, and only touches the database upon user tap.

### 4. 📐 Precision Financial Engine (Zero Floating-Point Drift)
* All wallet balances, expenses, splits, and debt amounts are computed and stored as **integer minor units** (paise / cents).
* Strict penny-exact split reconciliation ensures that the sum of splits always matches the total bill.

### 5. 💬 Direct Messaging & Contact Discovery
* Multi-field user lookup (`GET /users/search` or `POST /users/lookup-contacts`) by name, phone, or email.
* Real-time 1-on-1 direct conversations with unread counter badges and receipt attachments.

### 6. 📱 Best-in-Class Mobile UX
* **Keyboard Avoidance & Auto-Scroll:** Chat message streams and composers smoothly push up above the software keyboard, while bottom navigation tabs auto-dismiss during typing.
* **Onboarding & Auth Flow:** Branded multi-step carousel, custom registration capturing bio and phone, and show/hide password eye toggles without pre-filled inputs.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
* **Node.js** $\ge 20.x$
* **npm** or **yarn**
* **Expo Go** app on iOS/Android or an emulator

---

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/settlr-ai.git
cd settlr-ai
```

---

### 2. Configure Backend Environment
Create `backend/.env` with your API keys:
```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database (Supabase PostgreSQL Connection String)
DATABASE_URL=postgresql://postgres.your-project:your-password@aws-0-region.pooler.supabase.com:6543/postgres

# JWT Secret (minimum 32 characters)
JWT_SECRET=super_secret_jwt_key_settlr_hackathon_demo_2026_x1y2z3

# AI & Voice Engine
DEEPSEEK_API_KEY=your_deepseek_or_groq_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_STT_MODEL=nova-2
DEEPGRAM_TTS_MODEL=aura-2-thalia-en
```

---

### 3. Install Dependencies & Seed Database
```bash
# Install backend dependencies
cd backend
npm install

# Push database schema & seed demo users
npx drizzle-kit push
npm run seed

# Run automated tests
npm test
```

---

### 4. Start the Backend Server
```bash
npm run dev
# Server will listen on http://0.0.0.0:3000
```

---

### 5. Start the Mobile Client
```bash
cd ../mobile
npm install

# Start Expo dev server
npx expo start -c
```
* Scan the QR code using **Expo Go** on your physical phone, or press **`i`** for iOS Simulator / **`a`** for Android Emulator.

---

## 👥 Seeded Demo Credentials

Use any of the 4 pre-configured users for your presentation:

| Name | Email | Password | Starting Balance | Role |
| :--- | :--- | :--- | :---: | :--- |
| **Rudransh** | `rudransh@settlr.ai` | `password123` | ₹85,000.00 | AI Engineer & Primary Demo Account |
| **Shahil** | `shahil@settlr.ai` | `password123` | ₹75,000.00 | Co-founder & Split Participant |
| **Rupam** | `rupam@settlr.ai` | `password123` | ₹60,000.00 | Product Designer |
| **Kamal** | `kamal@settlr.ai` | `password123` | ₹50,000.00 | Operations Lead |

---

## 🎬 3-Minute Hackathon Demo Script

```
1. 🔐 AUTH & ONBOARDING (0:00 - 0:30)
   • Showcase swipeable advert onboarding carousel.
   • Click "Sign Up" from the top bar -> Highlight password toggle & contact schema.
   • Log in as "Rudransh" (rudransh@settlr.ai / password123).

2. 📊 LIVE DASHBOARD & SETTLEMENTS (0:30 - 1:00)
   • Review real-time wallet balance (₹85,000.00) and live receivable (₹6,300.00) stats.
   • Tap "Groups" tab -> Showcase active groups and inline group creation form.

3. 🎙️ THE "WOW" MOMENT: VOICE AGENT & TOOL CALLING (1:00 - 2:15)
   • Tap "Assistant" tab -> Tap the Blue Mic button.
   • Speak: "Add Shahil to a group called Goa Trip and split 1200 rupees for dinner"
   • Watch Deepgram Nova-2 transcribe audio live.
   • Observe Agent reason across multiple tools -> Propose split -> Open ConfirmSheet.
   • Highlight the TTS Mute toggle inside the modal.
   • Tap "Confirm & execute" -> Ledger updates atomically, and Deepgram Aura speaks the confirmation!

4. 💳 DIRECT WALLET SETTLEMENT (2:15 - 3:00)
   • Go to "Wallet" tab -> Tap "Settle" on a pending debt.
   • Funds transfer instantly with zero transaction fees and record into the activity ledger.
```

---

## 🧪 Automated Test Suite

Settlr includes comprehensive integration and unit tests powered by **Vitest**:
```bash
npm --prefix backend test
```
```
 ✓ test/split.test.ts (13 tests)
 ✓ test/agent_orchestrator.test.ts (5 tests)
 ✓ test/tools.test.ts (4 tests)
 ✓ test/expense_mgmt.test.ts (8 tests)
 ✓ test/group_mgmt.test.ts (8 tests)
 ✓ test/messages.test.ts (10 tests)
 ✓ test/storage.test.ts (5 tests)
 ✓ test/user.test.ts (9 tests)
 ✓ test/voice.test.ts (5 tests)
 ✓ test/logout.test.ts (3 tests)

 Test Files  10 passed (10)
      Tests  48 passed (48)
```

---

## 🔒 Security & Reliability Architecture

* **Argon2id Password Hashing:** State-of-the-art memory-hard hashing algorithm.
* **Token Blacklisting / Revocation:** Database-backed token revocation table for secure logouts.
* **Idempotency Keys:** Every wallet transfer and top-up requires a UUID idempotency key to prevent double charging.
* **Fastify Rate Limiting:** Brute-force protection on authentication and voice transcription endpoints.
* **SQL Injection Immunity:** Drizzle ORM parameterized query builder across all database queries.

---

## 📄 License
Settlr is open source under the [MIT License](LICENSE).
