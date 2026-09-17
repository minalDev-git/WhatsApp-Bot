# AI-Powered WhatsApp Customer Service Chatbot

A real WhatsApp bot powered by LangChain, Groq (Llama 3.3), and Retrieval-Augmented Generation (RAG). The bot integrates with WhatsApp via Baileys, maintains conversational context, learns user preferences, and retrieves information from a custom knowledge base.

## Overview

This chatbot provides automated customer service on WhatsApp by combining:

- **Large Language Models** (LLM) for natural conversation
- **Retrieval-Augmented Generation (RAG)** to answer knowledge-base queries accurately
- **Conversational Memory** to maintain chat history per user
- **Personal User Memory** to extract and remember user preferences and facts
- **Intelligent Message Analysis** to decide when to retrieve knowledge base docs or personal memory

Perfect for bakery customer service or any business needing WhatsApp support automation.

## Features

✅ **RAG with Custom Knowledge Base** — Retrieves relevant information from a bakery knowledge base using vector similarity search (FAISS + HuggingFace embeddings)

✅ **Conversational Memory** — Maintains per-user chat history in SQLite for contextual responses

✅ **Personal User Memory** — Automatically extracts and stores personal facts (name, location, preferences) from user messages

✅ **Intelligent Retrieval Decisions** — Uses an LLM analyzer to decide when to query the knowledge base or personal memory

✅ **WhatsApp Integration** — Real WhatsApp connectivity via Baileys (no business API key required)

✅ **Prompt Guardrails** — Built-in security measures to prevent prompt injection and irrelevant queries

✅ **Multi-User Support** — Separate memory and chat history per WhatsApp number

## Tech Stack

| Component                 | Technology                                                     | Purpose                                           |
| ------------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| **LLM Framework**         | LangChain                                                      | Prompt management, chains, and tool orchestration |
| **Large Language Models** | Groq (Llama 3.3)                                               | Fast, accurate response generation                |
| **WhatsApp Integration**  | Baileys                                                        | Real WhatsApp connectivity via QR code scanning   |
| **Vector Database**       | FAISS + HuggingFace Embeddings                                 | Semantic similarity search for RAG                |
| **Chat History**          | SQLite (better-sqlite3)                                        | Per-user conversation storage                     |
| **Embeddings**            | HuggingFace Inference (sentence-transformers/all-MiniLM-L6-v2) | Convert text to vectors for similarity search     |
| **Text Splitting**        | LangChain Text Splitters                                       | Chunk knowledge base into retrievable segments    |
| **Logging**               | Pino                                                           | Clean, fast logging for debugging                 |
| **QR Code**               | qrcode                                                         | Terminal QR code generation for WhatsApp pairing  |

## Project Structure

```
.
├── index.js                 # Main entry point: WhatsApp listener & message processor
├── package.json             # Dependencies and project metadata
├── .env.example             # Environment variables template
├── chatbot.db               # SQLite database (auto-created)
│
├── db/
│   └── db.js               # Database initialization & schema
│
├── memory/
│   ├── analyzer.js         # LLM-based message analyzer (RAG & memory decisions)
│   ├── chat_memory.js      # Retrieve/save conversation history per user
│   ├── user_memory.js      # Retrieve/save personal user facts
│   └── extractor.js        # Fact extraction utilities
│
├── prompts/
│   ├── system_prompt.js    # Main chatbot system prompt with guardrails
│   ├── analysis_prompt.js  # Analyzer LLM prompt (decides RAG/memory retrieval)
│   └── extraction_prompt.js # Fact extraction prompt
│
├── rag/
│   ├── rag_pipeline.js     # Orchestrates vector store queries
│   ├── ingest.js           # Document loading & chunking
│   └── vectorstore.js      # FAISS vector store initialization & persistence
│
├── data/
│   └── knowledge_base.txt  # Business knowledge base (bakery menu, hours, etc.)
│
├── vectorstore/
│   ├── docstore.json       # FAISS document metadata
│   └── faiss.index         # Serialized FAISS index
│
├── auth_info_baileys/      # WhatsApp authentication (auto-created after first scan)
│
└── node_modules/           # Dependencies
```

## How It Works

### Message Processing Flow

```
WhatsApp Message
       ↓
[index.js] Receive via Baileys
       ↓
[chat_memory.js] Save to SQLite chat history
       ↓
[analyzer.js] Analyze message → JSON decision
       ├─ needs_rag: true/false
       ├─ needs_memory: true/false
       └─ facts: extracted personal info
       ↓
[user_memory.js] Save extracted facts
       ↓
[rag_pipeline.js & user_memory.js] Conditional retrieval
       ├─ If needs_rag=true  → Query FAISS vector store (knowledge base)
       └─ If needs_memory=true → Retrieve stored user facts from SQLite
       ↓
[index.js] Invoke main LLM with:
       ├─ System prompt (with guardrails)
       ├─ Chat history (conversation context)
       ├─ Personal memory (if needed)
       ├─ RAG context (if needed)
       └─ User question
       ↓
[ChatGroq / Llama 3.3] Generate response
       ↓
[chat_memory.js] Save assistant reply to history
       ↓
[index.js] Send response via Baileys → WhatsApp
```

## LLM & APIs

### Primary LLM

- **Groq API** with **Llama 3.3** (main conversation) and **llama-3.1-8b-instant** (lightweight analyzer)
  - Fast inference for real-time chat
  - Main LLM temperature: 0.7 (conversational)
  - Analyzer LLM temperature: 0 (deterministic routing decisions)

### Embeddings & RAG

- **HuggingFace Inference API**
  - Model: `sentence-transformers/all-MiniLM-L6-v2`
  - Converts knowledge base chunks and queries into vectors
  - Enables semantic similarity search via FAISS

### WhatsApp

- **Baileys** (local, no API key required)
  - Simulates WhatsApp Web connection
  - Requires QR code scan, not an official business API

### Environment Variables

Create a `.env` file with:

```bash
# Groq API
GROQ_API_KEY=your_groq_api_key
MODEL=groq/llama-3.3-70b-specdec

# HuggingFace (for embeddings)
HUGGINGFACEHUB_API_TOKEN=your_huggingface_token

# (Optional) Restrict bot to a specific WhatsApp number
# ALLOWED_NUMBER=923325367841
```

## Installation & Setup

### Prerequisites

- **Node.js 20+** (`node -v` to check)
- **Groq API key** (free tier available at https://console.groq.com)
- **HuggingFace API token** (free at https://huggingface.co/settings/tokens)

### Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd "WhatsApp bot"
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   nano .env
   ```

4. **Run the bot**

   ```bash
   npm start
   ```

5. **Authenticate with WhatsApp**
   - A QR code appears in the terminal
   - On your phone: **WhatsApp → Settings → Linked Devices → Link a Device**
   - Scan the QR code
   - The bot is now live — send it a message from any chat

6. **Persistent login**
   - Credentials are saved in `auth_info_baileys/` after first login
   - No need to re-scan unless you delete this folder or unlink from WhatsApp settings

## Example Interactions

### Example 1: Menu Query (RAG)

```
User: What's on your menu?

Analyzer decides: needs_rag=true, needs_memory=false

LLM retrieves menu from knowledge base and responds:
Assistant: We offer cakes (Chocolate Fudge, Vanilla Cream, Red Velvet,
Strawberry, Black Forest), cupcakes, pastries, cookies, brownies, and
fresh bread. What would you like to order?
```

### Example 2: Personal Memory

```
User: My name is Ahmed and I live in Karachi.

Analyzer decides: needs_rag=false, needs_memory=false
                 facts={ "name": "Ahmed", "city": "Karachi" }

[Facts saved to user memory]
Assistant: Nice to meet you, Ahmed! I've saved your location.
```

### Example 3: Follow-up Using Memory

```
User: What's my name?

Analyzer decides: needs_rag=false, needs_memory=true

LLM retrieves memory and responds:
Assistant: Your name is Ahmed.
```

## Future Improvements

- **Delivery & Tracking**: Integrate order management system with delivery tracking
- **Payment Integration**: Support WhatsApp pay or payment gateway links
- **Dynamic Menu Updates**: Allow admins to update knowledge base without code changes
- **Sentiment Analysis**: Detect customer satisfaction and route escalations to human agents
- **Multi-Language Support**: Translate responses for broader customer base
- **Analytics Dashboard**: Track bot performance, common queries, and user patterns
- **Proactive Notifications**: Send order status updates and special offers automatically
- **Image Recognition**: Process food photos and identify cakes/items from images

## Notes

- **Baileys** is an unofficial WhatsApp Web client. Great for learning and demos, but keep test traffic light. Don't use for bulk messaging—WhatsApp can ban the number.
- **Groq Free Tier** has rate limits. The bot handles 429 errors gracefully.
- **Group chats and Status updates** are intentionally ignored (1:1 messages only).
- To unlink: unlink from WhatsApp settings or delete `auth_info_baileys/` folder and rescan QR.
