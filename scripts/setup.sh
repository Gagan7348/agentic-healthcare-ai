#!/bin/bash

# Healthcare AI Setup Script
# Run this to set up the complete environment

echo "🏥 Setting up Healthcare AI System..."

# Create virtual environment
echo "Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create .env file if not exists
if [ ! -f backend/.env ]; then
    echo "Creating .env file..."
    cp backend/.env.example backend/.env
    echo "Please add your GEMINI_API_KEY to backend/.env"
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your Gemini API key to backend/.env"
echo "2. Run: source venv/bin/activate"
echo "3. Run: python backend/main.py"
