from src.chat import generate_answer
from src.groq_ranker import rank_resume_groq
from src.retriever import retrieve_resume
import json

with open("resume_registry.json", "r") as file:
    registry = json.load(file)

print("\nAvailable Resumes:")

resume_list = list(registry.items())

for i, (resume_id, pdf_path) in enumerate(resume_list, start=1):
    print(f"{i}. {pdf_path}")

selected = int(input("\nChoose a resume: "))
selected_resume_id, selected_pdf_path = resume_list[selected - 1]


while True:
    print("\n=== Resume AI ===")
    print("1. Ask a question about the resume")
    print("2. Screen resume against a job")
    print("3. Exit")
    
    choice = input("\n choose an option:")
    
    if choice =="1":
        question = input("Ask a question about the resume:")
        answer = generate_answer(question, selected_resume_id)
        
        print("\nAnswer:\n")
        print(answer)
        
    elif choice == "2":
        job_description = input("\nEnter the job description:\n")

        results = []

        for resume_id, pdf_path in registry.items():

            relevant_chunks = retrieve_resume(job_description, resume_id)

            if not relevant_chunks:
                print(f"\nNo relevant content found for: {pdf_path.name}")
                continue
        
            resume_text = "\n\n".join(relevant_chunks)
            
            try:
                ranking = rank_resume_groq(resume_text, job_description)
    
                ranking = json.loads(ranking)

            except  Exception as e:
                print(f"\nCould not evaluate: {pdf_path}")
                print(f"Reason: {e}")
                continue
                
            results.append({
                "resume_id": resume_id,
                "pdf_path": pdf_path,
                "ranking": ranking,
                })

        #sort highest score first
        results.sort(
            key=lambda x: x["ranking"]["score"],
            reverse=True
        )

        print("\n=== Resume Screening Results ===\n")
    
        for position, result in enumerate(results, start=1):
             
             ranking = result["ranking"]

             print(f"\n{position}. Resume: {result['pdf_path']}")
             print(f"Match SCore: {ranking['score']}%")

             print("\nMatched Skills:")
             for skill in ranking["matched_skills"]:
                print(f"- {skill}")

             print("\nMissing Skills:")
             for skill in ranking["missing_skills"]:
                print(f"- {skill}")

             print("\nRelevant Experience:")
             for experience in ranking["relevant_experience"]:
                 print(f"- {experience}")
 
             print("\nOverall Assessment:")
             print(ranking["overall_assessment"])
 
             print("\n" + "_" * 70)

    elif choice =="3":
        print("Goodbye!")
        break
    
    else:
        print("Invalid Option. Select available options only.")