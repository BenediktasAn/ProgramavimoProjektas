import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DOCUMENTS_DIR = Path(__file__).resolve().parent / "documents"

TEST_QUESTIONS = [
    "What is KTU's vision?",
    "What are the university's values?",
    "Kokios yra universiteto vertybės?",
    "What are KTU's priority research areas?",
    "What results does KTU expect to achieve by 2025?",
    "What is the role of ECIU University?",
    "How does the university plan to develop human resources?",
    "What are the rules about academic integrity?",
]

CONFIGS = [
    {"chunk_size": 500, "chunk_overlap": 50, "k": 3, "label": "500/50/k3 (current)"},
    {"chunk_size": 800, "chunk_overlap": 100, "k": 3, "label": "800/100/k3"},
    {"chunk_size": 800, "chunk_overlap": 100, "k": 5, "label": "800/100/k5"},
    {"chunk_size": 1000, "chunk_overlap": 150, "k": 3, "label": "1000/150/k3"},
    {"chunk_size": 1000, "chunk_overlap": 150, "k": 5, "label": "1000/150/k5"},
]


def load_all_documents():
    all_docs = []
    for pdf_file in DOCUMENTS_DIR.glob("*.pdf"):
        loader = PyPDFLoader(str(pdf_file))
        all_docs.extend(loader.load())
    return all_docs


def main():
    print("Loading documents...")
    documents = load_all_documents()
    print(f"Loaded {len(documents)} pages")

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )

    for config in CONFIGS:
        print(f"\n{'='*60}")
        print(f"Testing: {config['label']}")
        print(f"{'='*60}")

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=config["chunk_size"],
            chunk_overlap=config["chunk_overlap"],
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        chunks = splitter.split_documents(documents)
        print(f"Total chunks: {len(chunks)}")

        # Use in-memory Chroma, no disk storage
        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
        )

        for question in TEST_QUESTIONS:
            results = vectorstore.similarity_search(question, k=config["k"])
            print(f"\nQ: {question}")
            print(f"Found {len(results)} chunks:")
            for i, doc in enumerate(results):
                source = doc.metadata.get("source", "unknown").split("\\")[-1]
                page = doc.metadata.get("page", "?")
                preview = doc.page_content[:100].replace("\n", " ")
                print(f"  {i+1}. [{source}, p.{page}] {preview}...")

    print("\n\nDone! Compare the results above.")


if __name__ == "__main__":
    main()