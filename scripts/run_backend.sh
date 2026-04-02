#!/bin/bash

# Run Backend Server
# Starts the FastAPI backend server

echo "🚀 Starting Healthcare AI Backend..."

cd backend

# Check if virtual environment exists
if [ ! -d "../venv" ]; then
    echo "Virtual environment not found. Running setup..."
    bash ../scripts/setup.sh
fi

# Activate virtual environment
source ../venv/bin/activate

# Start the server
python main.py
