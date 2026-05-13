import os
import json
from collections import Counter
from datetime import datetime, timezone, date
from fastapi import FastAPI, Request, UploadFile, File, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse, Response
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .chatbot import get_response, get_response_stream, embeddings, vectorstore
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

DOCUMENTS_DIR = os.path.join(os.path.dirname(__file__), "documents")
LOG_FILE = os.path.join(os.path.dirname(__file__), "questions.log")
FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), "feedback.log")
METADATA_FILE = os.path.join(os.path.dirname(__file__), "documents_meta.json")


def load_metadata() -> dict:
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_metadata(meta: dict) -> None:
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

limiter = Limiter(key_func=get_remote_address)


def log_question(question: str, answered: bool) -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "question": question,
        "answered": answered,
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


app = FastAPI(title="University Chatbot API")
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"response": "Too many requests. Please wait a moment and try again."}
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://askktu.online", "https://www.askktu.online", "http://localhost:8000"],
    allow_methods=["POST", "GET", "DELETE"],
    allow_headers=["Content-Type", "X-Admin-Password"],
)


class ChatRequest(BaseModel):
    message: str
    conversation_history: list = []


class ChatResponse(BaseModel):
    response: str
    confidence: int = 100


@app.post("/api/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(request: Request, chat_request: ChatRequest):
    answered = False
    try:
        answer, confidence = get_response(
            user_message=chat_request.message,
            conversation_history=chat_request.conversation_history,
        )
        answered = True
        return ChatResponse(response=answer, confidence=confidence)
    finally:
        log_question(chat_request.message, answered)
@app.post("/api/chat/stream")

@limiter.limit("10/minute")
async def chat_stream(request: Request, chat_request: ChatRequest):
    def generate():
        for token in get_response_stream(
            user_message=chat_request.message,
            conversation_history=chat_request.conversation_history,
        ):
            yield token

    log_question(chat_request.message, True)
    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={"X-Accel-Buffering": "no"},
    )

class FeedbackRequest(BaseModel):
    question: str
    answer: str
    rating: str


@app.post("/api/feedback")
async def feedback(request: FeedbackRequest):
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "question": request.question,
        "answer": request.answer,
        "rating": request.rating,
    }
    with open(FEEDBACK_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
    return {"status": "ok"}


@app.get("/api/documents")
async def documents():
    meta = load_metadata()
    files = []
    for filename in os.listdir(DOCUMENTS_DIR):
        if filename.endswith(".pdf"):
            full_path = os.path.join(DOCUMENTS_DIR, filename)
            size_bytes = os.path.getsize(full_path)
            size_str = f"{round(size_bytes / 1024)} KB" if size_bytes < 1024 * 1024 else f"{round(size_bytes / (1024 * 1024), 1)} MB"
            files.append({
                "name": filename,
                "size": size_str,
                "category": meta.get(filename, {}).get("category", ""),
            })
    return files


@app.get("/api/documents/{filename}")
async def serve_document(filename: str, download: bool = False):
    if not filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are served")
    safe_name = os.path.basename(filename)
    file_path = os.path.join(DOCUMENTS_DIR, safe_name)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=safe_name,
        content_disposition_type="attachment" if download else "inline",
    )


@app.get("/api/stats")
async def stats():
    STOP_WORDS = {
        "what", "is", "the", "are", "a", "an", "of", "in", "to", "how",
        "do", "i", "can", "for", "and", "or", "it", "at", "on", "be",
        "kas", "yra", "kaip", "ar", "kokia", "kokios", "kokie", "kur",
        "ir", "su", "ne", "tai", "kurie", "kuris",
    }

    total = 0
    today_count = 0
    word_counts: Counter = Counter()
    today = date.today().isoformat()

    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue
                total += 1
                if entry.get("timestamp", "").startswith(today):
                    today_count += 1
                words = entry.get("question", "").lower().split()
                for word in words:
                    word = word.strip("?.,!;:")
                    if len(word) > 2 and word not in STOP_WORDS:
                        word_counts[word] += 1

    top_keywords = [{"word": w, "count": c} for w, c in word_counts.most_common(5)]

    return {
        "total_questions": total,
        "questions_today": today_count,
        "top_keywords": top_keywords,
    }


@app.post("/api/admin/upload")
async def admin_upload(
    file: UploadFile = File(...),
    x_admin_password: str = Header(...),
    category: str = "",
):
    admin_password = os.getenv("ADMIN_PASSWORD", "")
    if not admin_password or x_admin_password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin password")

    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    save_path = os.path.join(DOCUMENTS_DIR, file.filename)
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)

    try:
        loader = PyPDFLoader(save_path)
        pages = loader.load()
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500, chunk_overlap=50,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        chunks = splitter.split_documents(pages)
        vectorstore.add_documents(chunks)
    except Exception as e:
        os.remove(save_path)
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")

    meta = load_metadata()
    meta[file.filename] = {"category": category.strip()}
    save_metadata(meta)

    return {"status": "ok", "filename": file.filename, "chunks": len(chunks)}


@app.delete("/api/admin/documents/{filename}")
async def delete_document(filename: str, x_admin_password: str = Header(...)):
    admin_password = os.getenv("ADMIN_PASSWORD", "")
    if not admin_password or x_admin_password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin password")

    safe_name = os.path.basename(filename)
    file_path = os.path.join(DOCUMENTS_DIR, safe_name)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove chunks from vector store (source metadata is the full path set by PyPDFLoader)
    chunks_deleted = 0
    try:
        vectorstore._collection.delete(where={"source": file_path})
        chunks_deleted = 1  # ChromaDB doesn't return count on delete; flag success
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector store removal failed: {str(e)}")

    os.remove(file_path)

    meta = load_metadata()
    meta.pop(safe_name, None)
    save_metadata(meta)

    return {"status": "ok", "filename": safe_name, "chunks_deleted": chunks_deleted}


@app.get("/api/stats/export")
async def export_stats():
    import csv, io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["timestamp", "question", "answered"])
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line)
                    writer.writerow([
                        entry.get("timestamp", ""),
                        entry.get("question", ""),
                        str(entry.get("answered", "")).lower(),
                    ])
                except json.JSONDecodeError:
                    continue
    today = date.today().isoformat()
    filename = f"askktu-stats-{today}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/admin/feedback")
async def get_feedback(x_admin_password: str = Header(...)):
    admin_password = os.getenv("ADMIN_PASSWORD", "")
    if not admin_password or x_admin_password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin password")

    entries = []
    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    entries.reverse()
    return entries


@app.get("/health")
async def health():
    return {"status": "ok"}

#Fixed bug