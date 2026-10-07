from PyPDF2 import PdfReader
import re
import speech_recognition as sr
from io import StringIO, BytesIO
import os
from pathlib import Path
import tempfile
import requests
from pydub import AudioSegment
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def clean_text(text: str) -> str:
    """
    Clean and format text from PDF.
    """
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\.(?=[A-Z])', '. ', text)
    text = re.sub(r',(?=[^\s])', ', ', text)
    text = re.sub(r'(?<=[.!?])\s{2,}', '\n\n', text)
    text = text.replace('•', '\n• ')
    text = re.sub(r'([a-z])([A-Z])', r'\1\n\2', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def extract_text_from_pdf(pdf_source) -> str:
    """
    Extract and clean text from a PDF file (supports path string, Path, or file-like object).
    """
    try:
        if isinstance(pdf_source, (str, Path)):
            if not os.path.exists(pdf_source):
                print(f"Error: PDF file does not exist: {pdf_source}")
                return ""
            reader = PdfReader(str(pdf_source))
        elif hasattr(pdf_source, "read") or hasattr(pdf_source, "getvalue"):
            if hasattr(pdf_source, "seek"):
                pdf_source.seek(0)
            reader = PdfReader(pdf_source)
        else:
            reader = PdfReader(pdf_source)

        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            if page_text:
                cleaned_text = clean_text(page_text)
                if cleaned_text:
                    text_parts.append(cleaned_text)

        full_text = '\n\n'.join(text_parts)
        return clean_text(full_text)

    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def collect_user_speech(timeout: int = 10, phrase_timeout: int = 5):
    """
    Collect user's speech with robust error handling.
    
    Args:
        timeout (int): Total time to listen for speech
        phrase_timeout (int): Maximum silence between phrases
    
    Returns:
        str: Recognized speech text
    """
    recognizer = sr.Recognizer()
    
    try:
        with sr.Microphone() as source:
            print("Adjusting for ambient noise... Please wait.")
            recognizer.adjust_for_ambient_noise(source, duration=1)
            print("Listening... Speak now!")

            try:
                audio = recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_timeout)
                text = recognizer.recognize_google(audio)
                print(f"Recognized: {text}")
                return text
            except sr.WaitTimeoutError:
                print("No speech detected within the time limit.")
                return ""
            except sr.UnknownValueError:
                print("Could not understand the audio.")
                return ""
            except sr.RequestError as e:
                print(f"Speech recognition service error: {e}")
                return ""
    except Exception as e:
        print(f"Microphone or audio capture error: {e}")
        return ""

def text_to_speech(text, speaker_id="p225"):
    """
    Convert text to speech using the TTS server.
    """
    # Get TTS server URL from environment variable, default to localhost if not set
    tts_server_url = os.getenv("TTS_SERVER_URL", "http://localhost:5002")
    url = f"{tts_server_url}/api/tts"
    
    data = {
        "text": text,
        "speaker_id": speaker_id
    }
    
    try:
        response = requests.post(url, data=data)
        if response.status_code == 200:
            # Create a temporary file to store the audio
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(response.content)
                temp_path = temp_file.name
            
            return temp_path
        else:
            raise Exception(f"TTS request failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Error in text_to_speech: {e}")
        raise

def chunk_text_fixed_size(text, chunk_size=256):
    """Splits text into fixed-size chunks using StringIO"""
    buffer = StringIO(text)
    while chunk := buffer.read(chunk_size):  # Read `chunk_size` at a time
        yield chunk  # Yield each chunk immediately
