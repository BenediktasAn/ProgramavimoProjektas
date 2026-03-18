# askKTU — University RAG Chatbot

A question-answering web app for KTU students. Ask questions in natural language and get answers grounded in official university documents (statutes, regulations, scholarship rules, etc.).

Built with React + FastAPI + ChromaDB + Groq (LLaMA 3.3).

---

## Prerequisites

- Python 3.x
- Node.js 20+ (use [nvm](https://github.com/nvm-sh/nvm))
- A **Groq API key** — free at [console.groq.com](https://console.groq.com)
- A **HuggingFace token** — free at [huggingface.co](https://huggingface.co) → Settings → Access Tokens → New token (Read access)

---

## Running locally

### 1. Clone the repo

```bash
git clone https://github.com/BenediktasAn/ProgramavimoProjektas.git
cd ProgramavimoProjektas
```

### 2. Create the `.env` file

Create a file called `.env` in the project root:

```
GROQ_API_KEY=your_groq_key_here
HF_API_KEY=your_huggingface_token_here
```

### 3. Set up the Python environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn groq langchain-community langchain-core python-dotenv requests
```

### 4. Set up the frontend

```bash
cd WebPage
npm install
cd ..
```

### 5. Start both servers (two terminals)

**Terminal 1 — backend:**
```bash
source venv/bin/activate
uvicorn chatbot.main:app --reload --port 8000
```

**Terminal 2 — frontend:**
```bash
cd WebPage
npm run dev
```

Open **http://localhost:5173**.

---

## Deploying to a server (Ubuntu + Nginx)

These steps assume you have a VPS with Nginx and SSL already configured (e.g. via Certbot).

### 1. Install Node.js

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
```

### 2. Clone the repo

```bash
git clone https://github.com/BenediktasAn/ProgramavimoProjektas.git /var/www/ProgramavimoProjektas
cd /var/www/ProgramavimoProjektas
```

### 3. Create the `.env` file

```bash
nano .env
```

Paste your keys:
```
GROQ_API_KEY=your_groq_key_here
HF_API_KEY=your_huggingface_token_here
```

### 4. Set up the Python environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn groq langchain-community langchain-core python-dotenv requests
```

### 5. Build the frontend

```bash
cd WebPage
npm install
npm run build
cd ..
```

### 6. Configure Nginx

Edit your Nginx site config (e.g. `/etc/nginx/sites-available/default`) and add a proxy block for the API inside the `server` block:

```nginx
location / {
    try_files $uri /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Also make sure the `root` points to the built frontend:

```nginx
root /var/www/ProgramavimoProjektas/WebPage/dist;
```

Reload Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 7. Start the backend (runs in background)

```bash
source venv/bin/activate
nohup uvicorn chatbot.main:app --port 8000 &
```

Logs go to `nohup.out`. To stop it: `pkill -f uvicorn`.

---

## Updating the server after a code change

```bash
cd /var/www/ProgramavimoProjektas
git pull origin main
cd WebPage && npm install && npm run build && cd ..
sudo systemctl reload nginx
pkill -f uvicorn
source venv/bin/activate
nohup uvicorn chatbot.main:app --port 8000 &
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Map | Leaflet / React-Leaflet |
| Chatbot API | Python, FastAPI |
| RAG / Vector search | ChromaDB |
| Embeddings | HuggingFace Inference API (`paraphrase-multilingual-MiniLM-L12-v2`) |
| LLM | Groq — LLaMA 3.3 70B |

---

## Project Structure

```
ProgramavimoProjektas/
├── chatbot/
│   ├── chatbot.py          # RAG logic (embeddings + LLM)
│   ├── main.py             # FastAPI server
│   ├── chroma_db/          # Pre-built vector database
│   └── documents/          # KTU source documents (PDFs)
├── WebPage/
│   └── src/
│       ├── components/chat/Chat.tsx   # Chat UI
│       ├── components/map/Map.tsx     # University map
│       └── pages/                     # Page routes
├── .env                    # API keys (not committed)
└── README.md
```
