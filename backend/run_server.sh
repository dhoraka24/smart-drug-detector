#!/bin/bash
# Run FastAPI server from project root
cd ..
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

