import os
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv
import requests
from langchain_core.embeddings import Embeddings
from langchain_community.vectorstores import Chroma

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class HFEmbeddings(Embeddings):
    def __init__(self, api_key: str, model_name: str):
        self.api_url = f"https://router.huggingface.co/hf-inference/models/{model_name}/pipeline/feature-extraction"
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def embed_documents(self, texts: list) -> list:
        response = requests.post(
            self.api_url,
            headers=self.headers,
            json={"inputs": texts, "options": {"wait_for_model": True}},
        )
        result = response.json()
        return result

    def embed_query(self, text: str) -> list:
        return self.embed_documents([text])[0]


# Load the vector store
CHROMA_DIR = Path(__file__).resolve().parent / "chroma_db"
embeddings = HFEmbeddings(
    api_key=os.getenv("HF_API_KEY"),
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)
vectorstore = Chroma(
    persist_directory=str(CHROMA_DIR),
    embedding_function=embeddings,
)

SYSTEM_PROMPT = """You are a helpful university assistant chatbot. 
You answer questions about university rules, regulations, scholarships, 
dormitories, and academic policies.

Rules:
- Only answer based on the context provided to you.
- If you don't know the answer or the context doesn't cover it, say: 
  "I don't have information about that. Please contact the student office."
- Be friendly and concise.
- Always cite which document/section your answer comes from when possible.
- Answer in the same language the student uses. If they ask in Lithuanian, respond in Lithuanian. If in English, respond in English.
"""

def get_response(user_message: str, conversation_history: list) -> str:
    # RAG: Search for relevant document chunks with deduplication
    raw_results = vectorstore.similarity_search(user_message, k=10)
    
    # Deduplicate by content
    seen = set()
    results = []
    for doc in raw_results:
        content_key = doc.page_content.strip()[:200]
        if content_key not in seen:
            seen.add(content_key)
            results.append(doc)
        if len(results) == 5:
            break

    context = "\n\n".join([
        f"[Source: {doc.metadata.get('source', 'unknown')}, Page: {doc.metadata.get('page', '?')}]\n{doc.page_content}"
        for doc in results
    ])

    # Build the messages list
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(conversation_history)

    messages.append({
        "role": "user",
        "content": f"Context from university documents:\n{context}\n\nStudent question: {user_message}",
    })

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.3,
        max_tokens=500,
    )

    return response.choices[0].message.content