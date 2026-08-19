import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

def rank_resume(resume_text, job_description):
    prompt = f"""
You are a resume screening assistant.

Compare the candidate's resume with the job description.

Candidate Resume:
{resume_text}

Job Description:
{job_description}

Analyze:
1. Skills that match the job requirements.
2. Required skills that are missing.
3. Relevant experience and projects.
4. Overall suitability for the role.

Return ONLY valid JSON using exactly this structure:

{{
    "score": 0,
    "matched_skills": [],
    "missing_skills": [],
    "relevant_experience" [],
    "overall_assessment": ""
}}

Rules:
- "score" must be an integer from 0 to 100.
- "matched_skills" must contain skills clearly supported by the resume.
- "missing_skills" must contain job requirements not clearly supported by the resume.
- "relevant_experience" must contain relevant evidence from the resume.
- "overall_assessment" must be a concise assessment of the candidate's suitability.
- Return ONLY JSON.
- Do NOT use Markdown.
- Do NOT use ```json.

"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    return response.text