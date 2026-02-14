# Document QA Bot (RAG-based)

A question-answering bot that provides accurate, grounded answers based **only on a specific set of documents**.  
The system uses embeddings, a vector database, and a Large Language Model (LLM) to retrieve relevant document chunks and generate answers.

This is a **Retrieval-Augmented Generation (RAG)** system with a conversational interface.

---

## Features

- Ask natural language questions about your documents
- Semantic search using vector embeddings
- LLM answers grounded in retrieved document context
- Source-aware responses (optional / configurable)
- Modular architecture (LLM, vector DB, and UI are swappable)

---


## Tech Stack
Frontend:
- React
- TypeScript
- Optional UI frameworks: Material UI / TailwindCSS / ShadCN
- API communication via REST or WebSockets

Backend:
- Node.js + TypeScript
- Express.js / Fastify (API layer)
- RAG orchestration logic
- Embedding generation pipeline
- LLM integration (OpenAI / Azure OpenAI / local model)

AI Layer:
- Embedding model (e.g., OpenAI Embeddings or local embedding model)
- Large Language Model (GPT / Llama / Claude etc.)
- Python
- Prompt templating & context injection

Database Layer
- Milvus (Vector Database)
- Stores document embeddings
- Performs similarity search (semantic retrieval)

Optional:
- PostgreSQL / MongoDB (metadata & conversation history)



