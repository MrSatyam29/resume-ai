import chromadb
from sentence_transformers import SentenceTransformer

embedding_model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

client = chromadb.PersistentClient(path="vectorstore")
collection = client.get_collection("resume_collection")

def retrieve_resume(query, resume_id):
    query_embedding = embedding_model.encode(query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=3,
        where={"resume_id": resume_id}
    )
    return results["documents"][0]

if __name__ == "__main__":
    query = "Does the candidate know Java?"

    results = retrieve_resume(query)

    print("\nRetrieved Chunks:\n")

    for i, chunk in enumerate(results, start=1):
        print(f"Chunk {i}:")
        print(chunk)
        print("-" * 60)

    