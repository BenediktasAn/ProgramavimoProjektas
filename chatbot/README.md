# ASKKTU — University Chatbot

A chatbot that answers questions about KTU university rules and regulations, built as part of the ASKKTU project.

## What it does

Students can ask questions about scholarships, dormitories, academic integrity, grading policies, accreditation, university strategy, and other university regulations. The chatbot retrieves relevant information from official university documents using RAG (Retrieval-Augmented Generation) and provides accurate, sourced answers with document and page citations.

## Chatbot scope and rules

- Only answers based on retrieved university documents.
- If the answer is not found in the documents, responds with: "I don't have information about that. Please contact the student office."
- Responds in the same language the student uses (Lithuanian or English).
- Cites the source document and page number when possible.
- Keeps answers friendly and concise.
- Does not generate information that is not in the provided documents.

## Current status

- [x] Development environment set up (Python + FastAPI)
- [x] Chatbot skeleton with API endpoints
- [x] RAG pipeline (document loading, chunking, vector search)
- [x] Multilingual support (Lithuanian and English)
- [x] University documents indexed in ChromaDB
- [x] Project structure organized
- [ ] Frontend integration

## Tech stack

- **Python 3.10+**
- **FastAPI** — web framework for the chat API
- **Groq API** (Llama 3.3 70B) — LLM for generating responses
- **ChromaDB** — vector database for storing document chunks
- **LangChain** — framework for document loading, splitting, and retrieval
- **HuggingFace Embeddings** — multilingual embedding model for document search
- **RAG (Retrieval-Augmented Generation)** — grounds answers in real university documents

## Project structure

```
chatbot/
├── main.py              # FastAPI app with /api/chat and /health endpoints
├── chatbot.py           # Chatbot logic (RAG search, LLM calls, system prompt)
├── index_documents.py   # Script to load PDFs and store in ChromaDB
├── requirements.txt     # Python dependencies
├── documents/           # University PDF documents
└── chroma_db/           # ChromaDB vector database (generated, gitignored)
```

## Setup

### 1. Create and activate a virtual environment

```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\Activate.ps1       # Windows PowerShell
```

### 2. Install dependencies

```bash
pip install -r chatbot/requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```
GROQ_API_KEY=your-groq-api-key-here
```

Get a free API key at https://console.groq.com/keys

### 4. Add university documents

Place PDF files into the `chatbot/documents/` folder.

### 5. Index the documents

```bash
python -m chatbot.index_documents
```

This loads all PDFs, splits them into chunks, and stores them in ChromaDB. Run this again whenever you add or update documents.

### 6. Run the server

```bash
uvicorn chatbot.main:app --reload --port 8000
```

### 7. Test

Open `http://localhost:8000/docs` in your browser to test the chat endpoint interactively.

## API

### POST /api/chat

Send a message and receive a chatbot response.

**Request:**
```json
{
  "message": "What GPA do I need for a scholarship?",
  "conversation_history": []
}
```

**Response:**
```json
{
  "response": "..."
}
```

### GET /health

Returns server status.
