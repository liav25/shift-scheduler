#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting Shift Scheduler Application..."

# Check if we're in a Railway environment
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "🚂 Running on Railway in $RAILWAY_ENVIRONMENT mode"
fi

# Upgrade pip first
echo "📦 Upgrading pip..."
pip3 install --upgrade pip

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

# Verify critical dependencies
echo "🔍 Verifying Python dependencies..."
python3 -c "import fastapi; print('✅ FastAPI is available')" || {
    echo "❌ FastAPI not found, installing directly..."
    pip3 install fastapi uvicorn
    echo "✅ FastAPI installed directly"
}

python3 -c "import uvicorn; print('✅ Uvicorn is available')" || {
    echo "❌ Uvicorn not found, installing directly..."
    pip3 install uvicorn[standard]
    echo "✅ Uvicorn installed directly"
}

# Ensure frontend dependencies are installed (only if frontend exists)
if [ -d "frontend" ]; then
    echo "📦 Checking frontend dependencies..."
    cd frontend
    if [ ! -d "node_modules" ] || ! npm list --depth=0 --silent 2>/dev/null; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    cd ..
    echo "✅ Frontend dependencies ready"
fi

# Verify backend can start
echo "🔍 Testing backend startup..."
cd backend
timeout 10s python3 -c "
import fastapi
from main import app
print('✅ Backend imports successfully')
" || {
    echo "❌ Backend import test failed"
    exit 1
}
cd ..

# Start the application
echo "🌟 Starting services..."
echo "Backend port: ${PORT:-8000}"

if [ -d "frontend" ]; then
    # Start both backend and frontend
    concurrently \
      "cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}" \
      "cd frontend && npm run preview" \
      --names "backend,frontend" \
      --prefix-colors "blue,green" \
      --kill-others-on-fail
else
    # Start only backend
    echo "Frontend not found, starting backend only..."
    cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
fi 