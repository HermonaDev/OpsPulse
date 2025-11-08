#!/bin/bash
# Startup script for Render - sets PYTHONPATH and starts the server
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}

