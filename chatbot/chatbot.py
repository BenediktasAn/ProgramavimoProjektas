import os
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Load the vector store
CHROMA_DIR = Path(__file__).resolve().parent / "chroma_db"
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
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
    # RAG: Search for relevant document chunks
    results = vectorstore.similarity_search(user_message, k=3)
    context = "\n\n".join([
        f"[Source: {doc.metadata.get('source', 'unknown')}, Page: {doc.metadata.get('page', '?')}]\n{doc.page_content}"
        for doc in results
    ])

    # Build the messages list
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(conversation_history)

    # Add the user message with retrieved context
    messages.append({
        "role": "user",
        "content": f"Context from university documents:\n{context}\n\nStudent question: {user_message}",
    })

    # Call the LLM
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.3,
        max_tokens=500,
    )

    return response.choices[0].message.content