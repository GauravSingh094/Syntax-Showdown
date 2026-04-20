# Syntax Showdown ⚔️

**Syntax Showdown** is a high-performance, multi-agent AI debate platform. It pits advanced LLMs against each other in real-time moderated debates, adjudicated by a third impartial "Judge" agent. 

Built with a **dual-model architecture** (Mistral/Llama for debaters, DeepSeek/Mistral for the judge), the system uses **LangGraph** for complex state orchestration and **Server-Sent Events (SSE)** for real-time live streaming of the debate flow.

---

## 🚀 Features

- **Multi-Agent Orchestration**: Powered by LangGraph to manage the state machine of Pro, Opponent, and Judge nodes.
- **Dual-Model Logic**: Optimizes reasoning by using specialized models for argumentation vs. objective adjudication.
- **Real-Time Streaming**: Watch the debate unfold word-by-word via SSE.
- **Memory Persistence**: Powered by **ChromaDB Cloud**, allowing users to save and review their entire debate history.
- **Premium UI**: A glassmorphic, dark-themed dashboard built with Next.js 15, Framer Motion, and Tailwind CSS.
- **Secure Auth**: Full user authentication and route protection via **Clerk**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), Tailwind CSS, Framer Motion, Zustand |
| **Backend** | FastAPI (Python 3.10+), LangGraph, Pydantic |
| **AI Models** | Ollama (Llama 3.2 1B, Mistral, DeepSeek-LLM) |
| **Database** | ChromaDB (Vector store for debate history) |
| **Auth** | Clerk (JWT-based session management) |

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Ollama**: [Download here](https://ollama.com/)
- **Node.js**: v18+
- **Python**: v3.10+

### 2. Environment Configuration
You will need to set up environment variables for both the frontend and backend. See the `.env.example` files in each directory.

#### Backend (`/backend/.env`)
```env
OLLAMA_URL=http://localhost:11434
CLERK_SECRET_KEY=sk_test_...
CLERK_JWKS_URL=https://.../.well-known/jwks.json
CHROMA_API_KEY=ck-...
CHROMA_TENANT=...
CHROMA_DATABASE=Syntax-Showdown
```

#### Frontend (`/frontend/.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Model Preparation
Pull the necessary models in your terminal:
```bash
ollama pull llama3.2:1b
ollama pull mistral
```

---

## 🏃 Running the Project

### Start the Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to witness the showdown.

---

## 🔒 Security Notice
The `.gitignore` is configured to ignore all `.env` files and `venv` directories. Never commit your `CLERK_SECRET_KEY` or `CHROMA_API_KEY` to public repositories. Use the provided `.env.example` files as templates.

---

## 📜 License
MIT License. Created with ❤️ by Gaurav Singh.
