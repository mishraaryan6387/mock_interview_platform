# AIVA Mock Interviews
![image (1)](https://github.com/user-attachments/assets/de5ac8dd-d887-49cb-8948-60ed28dd5c95)

AIVA (AI Virtual Assistant) Mock Interviews is an interactive interview preparation platform powered by AI. It simulates authentic technical and CV-based job interviews by asking dynamic questions, capturing and transcribing verbal responses, and providing comprehensive performance evaluations with actionable feedback.

---

## 📑 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Interview Workflow](#interview-workflow)
- [API Endpoints](#api-endpoints)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Quick Start (Single Command)](#1-quick-start-single-command)
  - [2. Manual Run (Individual Services)](#2-manual-run-individual-services)
  - [3. Optional: Coqui TTS Docker Service](#3-optional-coqui-tts-docker-service)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Overview

AIVA prepares candidates for AI, machine learning, and software engineering interviews by providing:

1. **CV-Based Interviews**: Upload a PDF résumé/CV and provide a brief self-introduction. The AI analyzes your background and conducts a personalized, conversational technical interview with context-aware follow-ups.
2. **Technical Topic Interviews**: Choose from an extensive pre-built bank of technical questions across various AI/ML categories and difficulty tiers (Easy, Medium, Hard). Each question is dynamically reformulated into an engaging spoken prompt.

---

## System Architecture

AIVA adopts a modern, decoupled client-server architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│               Vite + React 19 Frontend (Port 5173)              │
│  - Cyberpunk Glassmorphic UI (Lucide Icons, Canvas Confetti)    │
│  - Web Speech API (Real-time Speech Recognition & Synthesis)   │
│  - Interactive Voice Visualizer & Real-time Answer Transcript   │
│  - In-browser Settings (Model, API Key, Base URL, Speaker ID)   │
└────────────────┬───────────────────────────────▲────────────────┘
                 │ REST / JSON                   │ Audio Stream / Fallback
                 ▼                               │
┌────────────────────────────────────────────────┴────────────────┐
│                   FastAPI Server (Port 8000)                    │
│  - CORS-enabled REST API with auto-documentation (/docs)        │
│  - PyPDF2 CV Text Extraction & Validation                       │
│  - Dynamic Question Reformulation & Interview Orchestration     │
│  - Multi-criteria Performance Evaluation Report Generator       │
└────────────────┬───────────────────────────────┬────────────────┘
                 │                               │
                 ▼                               ▼
┌─────────────────────────────────┐   ┌───────────────────────────┐
│        LLM Service Layer        │   │     Text-to-Speech Engine │
│ - Local: Ollama (llama3.2, etc) │   │ - Coqui TTS (Docker :5002)│
│ - Cloud: OpenAI / Groq / etc.   │   │ - Seamless browser fallback│
└─────────────────────────────────┘   └───────────────────────────┘
```

### Core Architecture Components

- **Frontend (`frontend/`)**: Modern Single Page Application built with **React 19** and **Vite**. Features a responsive glassmorphic interface, real-time Web Speech recognition with editable transcription, audio spectrum visualizer, and dynamic scorecards.
- **Backend API (`src/server.py`)**: Asynchronous **FastAPI** service exposing structured REST endpoints for file upload, question querying, LLM generation, evaluation, and audio synthesis.
- **AI Core (`src/backend.py`)**: Utilizes the OpenAI-compatible Python SDK, enabling seamless swapping between local models (via Ollama or LM Studio) and remote providers (OpenAI, Groq, OpenRouter).
- **TTS Service**: Connects to a Coqui TTS engine running locally or via Docker. If the TTS container is offline, the frontend seamlessly falls back to the browser's native `window.speechSynthesis` API without interrupting the interview.
- **Question Database (`interview_questions.json`)**: Pre-curated question bank categorized by field, subject, and difficulty level.

---

## Key Features

- 🎯 **Dual Interview Modes**:
  - **CV-Driven**: Extracts experience and skills directly from your uploaded PDF CV for contextual technical questions.
  - **Category-Driven**: Practice with curated questions filtered by domain, topic, and difficulty.
- 🗣️ **Interactive Voice Experience**:
  - Questions read aloud via Coqui TTS or high-quality browser synthesis.
  - Hands-free speech-to-text with continuous transcription and manual text correction before submission.
- 🔄 **Dynamic Question Reformulation**:
  - Raw question templates are reformulated on-the-fly by the LLM into natural, realistic interview prompts.
- 📊 **Detailed Evaluation & Feedback**:
  - In-depth performance reports assessing technical depth, communication clarity, and problem-solving structure.
  - Question-by-question review with concrete recommendations for improvement.
- ⚙️ **Configurable In-App Settings**:
  - Adjust LLM Model Name, API Key, and Base URL directly from the frontend settings modal.
- 🛡️ **Fault-Tolerant Design**:
  - Built-in heuristic fallbacks for LLM and TTS ensure an uninterrupted interview even if local services experience latency or disconnects.

---

## Interview Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Select Mode    │────►│  Upload CV or   │────►│  Start Session  │
│ (CV / Technical)│     │  Filter Topics  │     │  & Instructions │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Final Scorecard │◄────│ Answer Questions│◄────│ Listen to       │
│  & Evaluation   │     │ (Voice / Text)  │     │ Spoken Prompt   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

![Screenshot from 2025-03-21 21-53-04](https://github.com/user-attachments/assets/a5e7d1aa-2f21-4674-8fa4-ec38b3839a66)

---

## API Endpoints

The FastAPI backend exposes the following REST API endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/config` | Returns current LLM & TTS configuration and connection status |
| `GET` | `/api/questions/metadata` | Lists all available categories, subjects, and difficulty tiers |
| `POST` | `/api/questions/filter` | Filters and selects questions matching specified criteria |
| `POST` | `/api/cv/upload` | Accepts multipart PDF file upload and returns extracted plain text |
| `POST` | `/api/interview/cv/start` | Initializes a CV-based interview with the first tailored question |
| `POST` | `/api/interview/cv/next` | Generates the next question based on CV and conversation history |
| `POST` | `/api/interview/technical/reformulate` | Reformulates a raw question into conversational interview phrasing |
| `POST` | `/api/interview/evaluate` | Generates a comprehensive markdown performance evaluation report |
| `POST` | `/api/tts` | Synthesizes text into WAV audio using Coqui TTS (or signals browser fallback) |

Interactive Swagger documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

## Prerequisites

- **Python**: Version 3.10+ (Python 3.12 recommended)
- **Node.js**: Version 18.0+ and `npm`
- **LLM Provider**:
  - **Ollama** (Local, free): Download from [ollama.com](https://ollama.com) and pull a model, e.g., `ollama run llama3.2`
  - **OpenAI / Compatible API**: Valid API key from OpenAI, Groq, or OpenRouter
- **Microphone**: Enabled in your web browser for voice input

---

## Getting Started

### 1. Quick Start (Single Command)

Run both the FastAPI backend and Vite React frontend concurrently with the launcher:

```bash
python run.py
```

This starts:
- **FastAPI Backend**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Vite React UI**: [http://localhost:5173](http://localhost:5173)

### 2. Manual Run (Individual Services)

You can run the backend and frontend in separate terminal windows:

#### Terminal 1 — Backend:
```bash
# Activate your virtual environment if applicable
.venv\Scripts\activate   # Windows
# or source .venv/bin/activate  # macOS / Linux

uvicorn src.server:app --host 127.0.0.1 --port 8000 --reload
```

#### Terminal 2 — Frontend:
```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Optional: Coqui TTS Docker Service

For neural text-to-speech, run the Coqui TTS container:

```bash
docker run -d -p 5002:5002 --name aiva-tts ghcr.io/coqui-ai/tts-cpu:latest \
  python3 -m TTS.server.server --model_name tts_models/en/vctk/vits --port 5002 --use_cuda false
```

> **Note**: If you don't run the Coqui TTS container, AIVA will automatically switch to your browser's built-in speech synthesis without requiring any manual configuration.

---

## Environment Configuration

Create a `.env` file in the project root directory or edit the existing one:

```env
# LLM Service Configuration
API_KEY="ollama"                          # Use "ollama" for local Ollama, or your OpenAI API key
BASE_URL="http://localhost:11434/v1/"      # Ollama endpoint or "https://api.openai.com/v1"
MODEL_NAME="llama3.2:latest"              # Model identifier (e.g. llama3.2:latest, gpt-4o-mini)

# Text-to-Speech Service
TTS_SERVER_URL="http://localhost:5002"    # URL for optional Coqui TTS Docker container
```

Settings can also be overridden directly within the web application by clicking the **Settings** gear icon in the top navigation bar.

---

## Project Structure

```
aiva_mock_interviews/
├── frontend/                     # Modern Vite + React frontend application
│   ├── src/
│   │   ├── components/           # UI Components
│   │   │   ├── Navbar.jsx        # Navigation bar & status indicators
│   │   │   ├── SetupView.jsx     # CV upload & technical topic selection
│   │   │   ├── InterviewView.jsx # Live question/answer voice session
│   │   │   ├── EvaluationView.jsx# Feedback report & score metrics
│   │   │   └── SettingsModal.jsx # API & model configuration modal
│   │   ├── App.jsx               # Application state orchestration
│   │   ├── App.css               # Component layout styling
│   │   ├── index.css             # Glassmorphic cyberpunk design system
│   │   └── main.jsx              # React DOM entry point
│   ├── package.json              # Frontend npm dependencies
│   └── vite.config.js            # Vite bundler configuration
├── src/                          # Backend source directory
│   ├── backend.py                # LLM prompting, OpenAI client, and audio helpers
│   └── server.py                 # FastAPI REST API endpoints
├── interview_questions.json      # Comprehensive question database for technical interviews
├── pyproject.toml                # Python project dependencies
├── run.py                        # Unified application orchestrator
├── utils.py                      # PDF extraction and audio processing utilities
├── .env.example                  # Template environment variables
├── docker-compose.yml            # Docker Compose configuration for TTS
├── Dockerfile                    # Container definition
└── README.md                     # Project documentation
```

---

## Troubleshooting

### 1. LLM Connection Issues
- **Ollama**: Ensure Ollama is running (`ollama serve`) and the model is downloaded (`ollama pull llama3.2:latest`). Make sure `BASE_URL` ends with `/v1/`.
- **OpenAI**: Ensure you have supplied a valid `API_KEY` (format: `sk-...`) and adequate account credits.

### 2. Microphone & Speech Recognition
- Ensure you have granted microphone access in your browser.
- Web Speech API requires a Chromium-based browser (Chrome, Edge, Brave) or Safari for optimal speech recognition support.
- If audio transcription is inaccurate, you can edit the text response directly in the text area before clicking **Submit Answer**.

### 3. TTS Server Connection
- If Coqui TTS is not running on port 5002, the app will log an informational notice and gracefully play questions using your browser's native text-to-speech engine.

---

## Contributing

Contributions to improve AIVA Mock Interviews are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
