from parser import extract_text_from_pdf
from chunker import chunk_text
from embeddings import create_embeddings
from vectorstore import store_embeddings

import uuid
import json
from pathlib import Path

folder_path = input("Enter the folder containing resumes: ")

pdf_files = list(Path(folder_path).glob("*.pdf"))

print(f"\nFound {len(pdf_files)} resume(s).")

with open("resume_registry.json", "r") as file:
    registry = json.load(file)

for pdf_path in pdf_files:

    pdf_path_str = str(pdf_path)

    if pdf_path_str in regisrty.values():
        print(f"\nAlready indexed: {pdf_path.name}")
        continue

    print(f"\nProcessing: {pdf_path.name}")

    resume_id = f"resume_{uuid.uuid4()}"
    print(f"Resume ID: {resume_id}")


    resume_text = extract_text_from_pdf(pdf_path)
    
    chunks = chunk_text(resume_text)
    
    embeddings = create_embeddings(chunks)
    
    store_embeddings(chunks, embeddings, resume_id)

    registry[resume_id] = str(pdf_path)

    print(f"Total Chunks: {len(chunks)}")
    print(f"Total Embeddings: {len(embeddings)}")
    print(f"Embedding Dimesnion {len(embeddings[0])}")
    print("Embeddings stored successfully!")

with open("resume_resgistry.json", "w") as file:
    json.dump(registry, file, indent=4)

print("\nAll resumes processed successfully!")
