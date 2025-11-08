#!/bin/bash
# Start script for Render deployment
export PYTHONPATH="${PYTHONPATH}:."
uvicorn backend.main:app --host 0.0.0.0 --port $PORT

