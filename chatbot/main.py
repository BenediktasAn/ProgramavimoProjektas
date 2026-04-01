import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .chatbot import get_response

DOCUMENTS_DIR = os.path.join(os.path.dirname(__file__), "documents")

app = FastAPI(title="University Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://askktu.online", "https://www.askktu.online", "http://localhost:8000"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


# Define what the frontend sends to us
class ChatRequest(BaseModel):
    message: str
    conversation_history: list = []  # optional, defaults to empty


# Define what we send back
class ChatResponse(BaseModel):
    response: str


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint. The frontend sends a message,
    we return the chatbot's response.
    """
    #parses incoming JSON into an object
    bot_response = get_response(
        user_message=request.message,
        conversation_history=request.conversation_history,
    )
    return ChatResponse(response=bot_response)


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


# Health check — useful for verifying the server is running
@app.get("/health")
async def health():
    return {"status": "ok"}