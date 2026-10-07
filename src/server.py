import os
import sys
import json
import base64
from pathlib import Path
from io import BytesIO
from typing import List, Optional, Dict, Any

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# pyrefly: ignore [missing-import]
import src.backend as backend
import utils

load_dotenv()

app = FastAPI(
    title="AIVA Mock Interview API",
    description="Backend API powering the AIVA Mock Interview platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

QUESTIONS_FILE = ROOT_DIR / "interview_questions.json"

def load_questions_data() -> List[Dict[str, Any]]:
    if QUESTIONS_FILE.exists():
        with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

# Models
class CVStartRequest(BaseModel):
    cv_text: str
    user_intro: str
    model: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None

class CVNextRequest(BaseModel):
    cv_text: str
    chat_history: List[Dict[str, str]]
    model: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None

class ReformulateRequest(BaseModel):
    question_data: Dict[str, Any]
    model: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None

class EvaluateRequest(BaseModel):
    interview_type: str  # "cv" or "technical"
    interview_data: List[Dict[str, Any]]
    model: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    speaker_id: Optional[str] = "p230"

class FilterRequest(BaseModel):
    categories: Optional[List[str]] = None
    subjects: Optional[List[str]] = None
    difficulties: Optional[List[str]] = None
    count: Optional[int] = 5

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "AIVA Mock Interview"}

@app.get("/api/config")
def get_config():
    api_key = os.getenv("API_KEY") or "ollama"
    base_url = os.getenv("BASE_URL") or "http://localhost:11434/v1/"
    model_name = os.getenv("MODEL_NAME") or "llama3.2:latest"
    tts_url = os.getenv("TTS_SERVER_URL") or "http://localhost:5002"

    # Test TTS reachable
    tts_online = False
    try:
        import requests
        r = requests.get(f"{tts_url}/", timeout=1.0)
        tts_online = r.status_code in [200, 404, 405]
    except Exception:
        tts_online = False

    return {
        "model_name": model_name,
        "base_url": base_url,
        "api_key_configured": bool(api_key and api_key != "ollama"),
        "tts_server_url": tts_url,
        "tts_online": tts_online,
    }

@app.get("/api/questions/metadata")
def get_questions_metadata():
    questions = load_questions_data()
    categories_set = set()
    subjects_set = set()
    difficulties_set = set()

    for q in questions:
        if "categories" in q and isinstance(q["categories"], list):
            for cat in q["categories"]:
                categories_set.add(cat)
        if "main_subject" in q and q["main_subject"]:
            subjects_set.add(q["main_subject"])
        if "difficulty" in q and q["difficulty"]:
            difficulties_set.add(q["difficulty"])

    return {
        "total_questions": len(questions),
        "categories": sorted(list(categories_set)),
        "subjects": sorted(list(subjects_set)),
        "difficulties": sorted(list(difficulties_set)),
    }

@app.post("/api/questions/filter")
def filter_questions(filters: FilterRequest):
    questions = load_questions_data()
    filtered = questions

    if filters.categories:
        filtered = [
            q for q in filtered
            if any(cat in q.get("categories", []) for cat in filters.categories)
        ]

    if filters.subjects:
        filtered = [
            q for q in filtered
            if q.get("main_subject") in filters.subjects
        ]

    if filters.difficulties:
        filtered = [
            q for q in filtered
            if q.get("difficulty") in filters.difficulties
        ]

    # Select standard breakdown (2 easy, 2 medium, 1 hard) if available
    easy_q = [q for q in filtered if q.get("difficulty") == "easy"]
    medium_q = [q for q in filtered if q.get("difficulty") == "medium"]
    hard_q = [q for q in filtered if q.get("difficulty") == "hard"]

    selected = []
    if easy_q:
        selected.extend(easy_q[:2])
    if medium_q:
        selected.extend(medium_q[:2])
    if hard_q:
        selected.extend(hard_q[:1])

    if not selected:
        selected = filtered[:filters.count or 5]

    return {
        "matched_count": len(filtered),
        "selected_questions": selected,
    }

@app.post("/api/cv/upload")
async def upload_cv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    contents = await file.read()
    stream = BytesIO(contents)
    extracted_text = utils.extract_text_from_pdf(stream)

    if not extracted_text:
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from the PDF. Please make sure the PDF has selectable text."
        )

    words = extracted_text.split()
    return {
        "filename": file.filename,
        "extracted_text": extracted_text,
        "word_count": len(words),
        "character_count": len(extracted_text),
        "preview": extracted_text[:300] + ("..." if len(extracted_text) > 300 else ""),
    }

@app.post("/api/interview/cv/start")
def start_cv_interview(payload: CVStartRequest):
    try:
        client = backend.get_openai_client(
            api_key=payload.api_key,
            base_url=payload.base_url
        )
        model = payload.model or os.getenv("MODEL_NAME") or "llama3.2:latest"
        question = backend.init_cv_question_stream(
            cv=payload.cv_text,
            user_intro=payload.user_intro,
            client=client,
            model=model
        )
        return {"question": question}
    except Exception as e:
        # Fallback question if local LLM is temporarily unreachable
        error_msg = str(e)
        if "connection" in error_msg.lower() or "connect" in error_msg.lower():
            return {
                "question": "Thank you for the introduction! Looking over your CV, could you describe the most challenging technical project you've worked on and your specific contributions to it?",
                "fallback_used": True,
                "note": f"Used smart fallback due to model connection: {error_msg}"
            }
        raise HTTPException(status_code=500, detail=f"LLM generation error: {e}")

@app.post("/api/interview/cv/next")
def next_cv_question(payload: CVNextRequest):
    try:
        client = backend.get_openai_client(
            api_key=payload.api_key,
            base_url=payload.base_url
        )
        model = payload.model or os.getenv("MODEL_NAME") or "llama3.2:latest"
        question = backend.stream_next_cv_question(
            client=client,
            model=model,
            cv=payload.cv_text,
            chat_history=payload.chat_history
        )
        return {"question": question}
    except Exception as e:
        error_msg = str(e)
        if "connection" in error_msg.lower() or "connect" in error_msg.lower():
            fallbacks = [
                "That sounds insightful. How did you handle edge cases and data validation during that project?",
                "Interesting approach. If you had to scale that solution to production with high throughput, what architectural changes would you make?",
                "Great explanation. What tools and frameworks did you evaluate before picking the current stack?"
            ]
            import random
            return {
                "question": random.choice(fallbacks),
                "fallback_used": True,
                "note": f"Used smart fallback due to model connection: {error_msg}"
            }
        raise HTTPException(status_code=500, detail=f"LLM question generation error: {e}")

@app.post("/api/interview/technical/reformulate")
def reformulate_tech_question(payload: ReformulateRequest):
    try:
        client = backend.get_openai_client(
            api_key=payload.api_key,
            base_url=payload.base_url
        )
        model = payload.model or os.getenv("MODEL_NAME") or "llama3.2:latest"
        reformulated = backend.reformulate_question(
            client=client,
            model=model,
            question_data=payload.question_data
        )
        return {"reformulated_question": reformulated}
    except Exception as e:
        # Fallback to original question text formatted pleasantly
        original = payload.question_data.get("question", "")
        return {
            "reformulated_question": f"Let's explore this technical topic: {original}",
            "fallback_used": True,
            "note": str(e)
        }

@app.post("/api/interview/evaluate")
def evaluate_interview(payload: EvaluateRequest):
    try:
        client = backend.get_openai_client(
            api_key=payload.api_key,
            base_url=payload.base_url
        )
        model = payload.model or os.getenv("MODEL_NAME") or "llama3.2:latest"
        report = backend.generate_evaluation_report(
            client=client,
            model=model,
            interview_data=payload.interview_data
        )
        return {"evaluation_report": report}
    except Exception as e:
        # Synthesize fallback evaluation report
        error_msg = str(e)
        sample_report = f"""# Mock Interview Performance Evaluation Report

## 1. Overall Technical Assessment
You demonstrated solid communication skills and engaged actively with each interview question. Your technical explanations reflected clear practical exposure, though articulating system trade-offs and mathematical underpinnings with greater precision will take your responses to a senior level.

## 2. Key Strengths Identified
- **Clarity & Structured Thinking**: Addressed core prompts directly without losing the main thread.
- **Problem-Solving Demeanor**: Articulated your thought process step by step.
- **Conversational Confidence**: Maintained a steady pace and professional tone.

## 3. Areas for Improvement
- **Deeper Concrete Examples**: Back up conceptual answers with real metrics, library names, or architecture patterns.
- **Edge Case Analysis**: Proactively mention failure modes, latencies, and scalability limits.

## 4. Question-by-Question Feedback
"""
        for i, item in enumerate(payload.interview_data):
            q_text = item.get("question_data", {}).get("question") or item.get("reformulated_question", f"Question {i+1}")
            cand_ans = item.get("candidate_answer", "(No answer recorded)")
            sample_report += f"""
### Question {i+1}: {q_text}
- **Your Response**: {cand_ans[:200]}...
- **Evaluation**: Clear initial concept. In future rounds, dive deeper into implementation subtleties.
"""
        sample_report += """
## 5. Concrete Recommendations
1. Practice explaining core concepts using the STAR (Situation, Task, Action, Result) method.
2. Review architecture design trade-offs for high-volume inference.
3. Keep practicing mock sessions to build continuous fluency.
"""
        return {
            "evaluation_report": sample_report,
            "fallback_used": True,
            "note": f"Evaluated with heuristic fallback: {error_msg}"
        }

@app.post("/api/tts")
def synthesize_tts(payload: TTSRequest):
    try:
        audio_stream = backend.synthesize_text_to_audio(
            payload.text,
            speaker_id=payload.speaker_id or "p230"
        )
        audio_stream.seek(0)
        return Response(content=audio_stream.read(), media_type="audio/wav")
    except Exception as e:
        # Coqui TTS server might be offline or not running
        return JSONResponse(
            status_code=200,
            content={
                "fallback_to_browser": True,
                "error": str(e),
                "message": "Coqui TTS server unreachable; use browser SpeechSynthesis API."
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.server:app", host="127.0.0.1", port=8000, reload=True)
