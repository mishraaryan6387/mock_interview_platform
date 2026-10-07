"""
AIVA Mock Interview Platform - Development Orchestrator
Runs both the FastAPI backend (port 8000) and the Vite React frontend (port 5173).
"""

import sys
import subprocess
import os
import signal
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"

def main():
    print("====================================================")
    print("   🎙️  AIVA — AI Virtual Assistant Mock Interviews  ")
    print("====================================================")
    print("Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    print("Starting Vite React Frontend on http://localhost:5173 ...")
    print("Press Ctrl+C to terminate both servers.\n")

    # Use virtual environment Python if available
    venv_python = ROOT_DIR / ".venv" / "Scripts" / "python.exe"
    py_exec = str(venv_python) if venv_python.exists() else sys.executable

    # Start FastAPI backend
    backend_cmd = [py_exec, "-m", "uvicorn", "src.server:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=str(ROOT_DIR))


    # Start Vite frontend
    frontend_cmd = ["npm", "run", "dev"]
    # On Windows, npm is npm.cmd
    if sys.platform.startswith("win"):
        frontend_cmd = ["npm.cmd", "run", "dev"]

    frontend_proc = subprocess.Popen(frontend_cmd, cwd=str(FRONTEND_DIR))

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping AIVA servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Servers stopped successfully.")

if __name__ == "__main__":
    main()
