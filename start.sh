#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting Shift Scheduler Application..."

# Check if we're in a Railway environment
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "🚂 Running on Railway in $RAILWAY_ENVIRONMENT mode"
fi

# Ensure Python dependencies are installed
echo "📦 Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt
    echo "✅ Root requirements.txt installed"
fi

if [ -f "backend/requirements.txt" ]; then
    pip3 install -r backend/requirements.txt
    echo "✅ Backend requirements.txt installed"
fi

# Test if FastAPI is available
echo "🔍 Testing FastAPI installation..."
python3 -c "import fastapi; print('✅ FastAPI is available')" || {
    echo "❌ FastAPI not found, installing directly..."
    pip3 install fastapi uvicorn
}

# Ensure frontend dependencies are installed
echo "📦 Checking frontend dependencies..."
if [ -d "frontend" ]; then
    cd frontend
    if [ ! -d "node_modules" ] || ! npm list --depth=0 --silent 2>/dev/null; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    cd ..
    echo "✅ Frontend dependencies ready"
fi

# Start the application
echo "🌟 Starting services..."
echo "Backend port: ${PORT:-8000}"

concurrently \
  "cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}" \
  "cd frontend && npm run preview" \
  --names "backend,frontend" \
  --prefix-colors "blue,green" \
  --kill-others-on-fail 