import chromadb

client = chromadb.PersistentClient(path="vectorstore")

collection = client.get_or_create_collection(
    name="resume_collection"
)

print(collection.name)

def store_embeddings(chunks, embeddings, resume_id):
    collection.add(
        documents=chunks,
        embeddings=embeddings.tolist(),
        ids=[
            f"{resume_id}_chunk_{i}"
            for i in range(len(chunks))
        ],
        metadatas=[
            {
                "resume_id": resume_id,
                "chunk_index": i
            }
            for i in range(len(chunks))
        ]
    )
    