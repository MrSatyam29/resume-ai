# Resume AI

An AI-powered resume screening and Q&A system built using RAG (Retrieval-Augmented Generation).

## Features

- Upload multiple PDF resumes
- Extract and chunk resume text
- Generate semantic embeddings
- Store and retrieve resume vectors
- Screen resumes against a job description
- Rank candidates using an LLM
- Ask questions about an individual resume
- Retrieve relevant resume content before generating answers
- React-based web interface
- FastAPI backend

## Architecture

```text
Resume PDF
    ↓
Text Extraction
    ↓
Text Chunking
    ↓
Embeddings
    ↓
Vector Store
    ↓
Semantic Retrieval
    ↓
┌───────────────────────┐
│                       │
▼                       ▼
Resume Screening       Resume Q&A
│                       │
▼                       ▼
Groq LLM               Groq LLM
│                       │
▼                       ▼
Candidate Ranking      AI Answer