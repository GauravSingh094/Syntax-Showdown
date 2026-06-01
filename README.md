# Syntax Showdown ⚔️

**Syntax Showdown** is a high-performance, multi-agent AI debate platform. It pits advanced LLMs against each other in real-time moderated debates, adjudicated by a third impartial "Judge" agent. 

Built with a **Multi-Provider Cloud LLM Engine**, the system leverages high-performance cloud providers with automatic dynamic failover chains to ensure high availability and robust reasoning. It uses **LangGraph** for complex state orchestration, **Server-Sent Events (SSE)** for real-time live streaming of the debate flow, and offers comprehensive cost and token observability telemetry.

---

## 🚀 Features

- **Multi-Agent Orchestration**: Powered by LangGraph to manage the state machine of Pro, Opponent, and Judge nodes.
- **Multi-Provider Cloud LLM Engine**: Native support for **Groq**, **OpenRouter**, **Gemini**, and **OpenAI** cloud providers, moving beyond local-only execution.
- **Dynamic Failover & Resilience**: Configurable failover chains (e.g., Groq ➔ OpenRouter ➔ Gemini ➔ OpenAI) automatically route requests to fallback providers on rate limits or service disruptions. Includes structured audit logs for failover events.
- **Cost & Token Observability**: Comprehensive telemetry tracking latency, token usage (input/output/total), request costs, active debate costs, and cumulative session costs.
- **Diagnostics API**: Dedicated `/llm/test` healthcheck endpoint to verify credentials, model accessibility, and response health for all integrated providers.
- **Real-Time Streaming**: Watch the debate unfold word-by-word via Server-Sent Events (SSE).
- **Memory Persistence**: Powered by **ChromaDB Cloud** vector database, allowing users to save and search their entire debate history.
- **Premium UI**: A glassmorphic, dark-themed dashboard built with Next.js 15, Framer Motion, and Tailwind CSS.
- **Secure Auth**: Full user authentication and route protection via **Clerk**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), Tailwind CSS, Framer Motion, Zustand |
| **Backend** | FastAPI (Python 3.10+), LangGraph, Pydantic |
| **AI Engine** | Multi-Provider Cloud LLMs (Groq, OpenRouter, Gemini, OpenAI) |
| **Database** | ChromaDB Cloud (Vector store for debate history) |
| **Auth** | Clerk (JWT-based session management) |

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Node.js**: v18+
- **Python**: v3.10+

### 2. Environment Configuration
You will need to set up environment variables for both the frontend and backend. See the `.env.example` files in each directory.

#### Backend (`/backend/.env`)
```env
# Cloud LLM Routing Configuration
PRIMARY_PROVIDER=groq
ENABLE_FAILOVER=true

# Cloud LLM API Keys
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Clerk Authentication (Required for JWT Verification)
CLERK_SECRET_KEY=sk_test_...
CLERK_JWKS_URL=https://.../.well-known/jwks.json

# ChromaDB Cloud (Vector Storage for History)
CHROMA_HOST=api.trychroma.com
CHROMA_API_KEY=ck-...
CHROMA_TENANT=your_tenant_id_here
CHROMA_DATABASE=Syntax-Showdown
```

#### Frontend (`/frontend/.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🏃 Running the Project

### Start the Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Set up and activate python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Start the Frontend
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js dev server:
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to witness the showdown.

---

## 🧪 Testing

The backend includes a dedicated unit and integration testing suite for verifying failover behavior, telemetry, and fallback routing mechanisms.

To run the failover and provider chain tests:
```bash
cd backend
pytest app/tests/test_llm_failover.py -v
```

---

## 🔒 Security Notice
The `.gitignore` is configured to ignore all `.env` files and `venv` directories. Never commit your API keys or Clerk secrets to public repositories. Use the provided `.env.example` files as templates.

---

## 📜 License
MIT License. Created with ❤️ by Gaurav Singh.
