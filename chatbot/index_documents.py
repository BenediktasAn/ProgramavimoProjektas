import os
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

DOCUMENTS_DIR = Path(__file__).resolve().parent / "documents"
CHROMA_DIR = Path(__file__).resolve().parent / "chroma_db"


def index_documents():
    # 1. Load all PDFs
    all_documents = []
    for pdf_file in DOCUMENTS_DIR.glob("*.pdf"):
        print(f"Loading: {pdf_file.name}")
        loader = PyPDFLoader(str(pdf_file))
        pages = loader.load()
        all_documents.extend(pages)

    if not all_documents:
        print("No PDFs found in documents/ folder!")
        return

    print(f"Loaded {len(all_documents)} pages total.")

    # 2. Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(all_documents)
    print(f"Split into {len(chunks)} chunks.")

    # 3. Create embeddings and store in ChromaDB
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )

    # Delete old database if it exists
    if CHROMA_DIR.exists():
        import shutil
        shutil.rmtree(CHROMA_DIR)

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(CHROMA_DIR),
    )

    print(f"Done! Stored {len(chunks)} chunks in ChromaDB at {CHROMA_DIR}")


if __name__ == "__main__":
    index_documents()