import os
from dotenv import load_dotenv
from google import genai

from src.retriever import retrieve_resume
from src.ranker import rank_resume


load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)


def generate_answer(question, resume_id):
    relevant_chunks = retrieve_resume(question, resume_id)

    context = "\n\n".join(relevant_chunks)

    prompt = f"""
You are a resume analysis assistant.

Use ONLY the information provided in the resume context below
to answer the user's question.

Resume Context:
{context}

Question:
{question}

Answer clearly and concisely.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    return response.text