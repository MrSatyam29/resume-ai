from src.parser import extract_text_from_pdf
from src.chunker import chunk_text
from src.embeddings import create_embeddings
from src.vectorstore import store_embeddings

import uuid
import json
from pathlib import Path


def index_resume(pdf_path):
    pdf_path = Path(pdf_path)

    with open("resume_registry.json", "r") as file:
        registry = json.load(file)

    pdf_path_str = str(pdf_path)

    # Check if the resume is already indexed
    if pdf_path_str in registry.values():
        return {
            "success": False,
            "message": f"Already indexed: {pdf_path.name}"
        }

    print(f"\nProcessing: {pdf_path.name}")

    resume_id = f"resume_{uuid.uuid4()}"

    resume_text = extract_text_from_pdf(pdf_path)

    chunks = chunk_text(resume_text)

    embeddings = create_embeddings(chunks)

    store_embeddings(
        chunks,
        embeddings,
        resume_id
    )

    registry[resume_id] = pdf_path_str

    with open("resume_registry.json", "w") as file:
        json.dump(registry, file, indent=4)

    print(f"Total Chunks: {len(chunks)}")
    print(f"Total Embeddings: {len(embeddings)}")
    print(f"Embedding Dimension: {len(embeddings[0])}")
    print("Embeddings stored successfully!")

    return {
        "success": True,
        "resume_id": resume_id,
        "filename": pdf_path.name,
        "chunks": len(chunks),
        "embeddings": len(embeddings),
        "embedding_dimension": len(embeddings[0])
    }