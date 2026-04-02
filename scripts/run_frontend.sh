#!/bin/bash

# Run Frontend Server
# Starts the React frontend development server

echo "🚀 Starting Healthcare AI Frontend..."

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the development server
npm run dev

echo "Frontend running at http://localhost:3000"
