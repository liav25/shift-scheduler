#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting Shift Scheduler Application..."

# Ensure Python dependencies are installed
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt || pip3 install -r backend/requirements.txt

# Ensure frontend dependencies are installed
echo "📦 Checking frontend dependencies..."
cd frontend && npm list --depth=0 --silent || npm install
cd ..

# Start the application
echo "🌟 Starting services..."
concurrently \
  "cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}" \
  "cd frontend && npm run preview" \
  --names "backend,frontend" \
  --prefix-colors "blue,green" \
  --kill-others-on-fail 