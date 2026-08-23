from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.app import index_resume
from src.retriever import retrieve_resume
from src.groq_ranker import rank_resume_groq
from src.chat import generate_answer

import asyncio
import json
from pathlib import Path


app = FastAPI()

# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REQUEST MODELS

class ScreeningRequest(BaseModel):
    job_description: str


class QARequest(BaseModel):
    resume_id: str
    question: str

# HOME

@app.get("/")
def home():
    return {
        "message": "Resume AI API is running"
    }

# UPLOAD RESUMES

@app.post("/upload")
async def upload_resumes(
    files: list[UploadFile] = File(...)
):
    upload_folder = Path("data/resumes")
    upload_folder.mkdir(
        parents=True,
        exist_ok=True
    )

    results = []

    for file in files:

        # Only PDF files
        if not file.filename.lower().endswith(".pdf"):
            results.append({
                "filename": file.filename,
                "success": False,
                "message": "Only PDF files are allowed."
            })
            continue

        file_path = (
            upload_folder / file.filename
        )

        # Prevent duplicate uploads
        if file_path.exists():
            results.append({
                "filename": file.filename,
                "success": False,
                "message": "This resume is already uploaded."
            })
            continue

        # Read uploaded file
        content = await file.read()

        # Save PDF
        with open(
            file_path,
            "wb"
        ) as output_file:

            output_file.write(content)

        # Index resume
        try:

            result = index_resume(
                file_path
            )

            results.append(result)

        except Exception as e:

            results.append({
                "filename": file.filename,
                "success": False,
                "message": str(e)
            })

    return results

# SCREEN RESUMES

@app.post("/screen")
async def screen_resumes(
    request: ScreeningRequest
):
    with open(
        "resume_registry.json",
        "r"
    ) as file:
        registry = json.load(file)

    async def process_resume(
        resume_id,
        pdf_path
    ):
        relevant_chunks = retrieve_resume(
            request.job_description,
            resume_id
        )

        if not relevant_chunks:
            return None

        resume_text = "\n\n".join(
            relevant_chunks
        )

        try:
            ranking = rank_resume_groq(
                resume_text,
                request.job_description
            )

            ranking = json.loads(ranking)

            return {
                "resume_id": resume_id,
                "pdf_path": pdf_path,
                "ranking": ranking
            }

        except Exception as e:
            print(
                f"Failed to rank {resume_id}: {e}"
            )
            return None

    tasks = [
        process_resume(
            resume_id,
            pdf_path
        )
        for resume_id, pdf_path
        in registry.items()
    ]

    results = await asyncio.gather(
        *tasks
    )

    results = [
        result
        for result in results
        if result is not None
    ]

    results.sort(
        key=lambda x: x["ranking"]["score"],
        reverse=True
    )

    return results

# RESUME Q&A

@app.post("/ask")
def ask_question(
    request: QARequest
):

    if not request.question.strip():

        return {
            "error": "Please enter a question."
        }

    try:

        answer = generate_answer(
            request.question,
            request.resume_id
        )

        return {
            "resume_id": request.resume_id,
            "question": request.question,
            "answer": answer
        }

    except Exception as e:

        return {
            "error": str(e)
        }



# GET AVAILABLE RESUMES

@app.get("/resumes")
def get_resumes():

    with open(
        "resume_registry.json",
        "r"
    ) as file:

        registry = json.load(file)

    results = []

    for resume_id, pdf_path in registry.items():

        filename = Path(
            pdf_path
        ).name

        display_name = (
            Path(filename)
            .stem
            .replace("-", " ")
            .replace("_", " ")
            .title()
        )

        results.append({
            "resume_id": resume_id,
            "filename": filename,
            "display_name": display_name
        })

    return results