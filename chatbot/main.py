import os
import json
from collections import Counter
from datetime import datetime, timezone, date
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .chatbot import get_response, get_response_stream

DOCUMENTS_DIR = os.path.join(os.path.dirname(__file__), "documents")
LOG_FILE = os.path.join(os.path.dirname(__file__), "questions.log")
FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), "feedback.log")

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
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
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
    return StreamingResponse(generate(), media_type="text/plain")

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
    files = []
    for filename in os.listdir(DOCUMENTS_DIR):
        if filename.endswith(".pdf"):
            full_path = os.path.join(DOCUMENTS_DIR, filename)
            size_bytes = os.path.getsize(full_path)
            size_str = f"{round(size_bytes / 1024)} KB" if size_bytes < 1024 * 1024 else f"{round(size_bytes / (1024 * 1024), 1)} MB"
            files.append({"name": filename, "size": size_str})
    return files


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


@app.get("/health")
async def health():
    return {"status": "ok"}

#Fixed bug