#!/bin/bash

# Railway Deployment Script for Shift Scheduler
echo "🚀 Railway Deployment Script"
echo "========================================="

# Check if this is running in Railway environment
if [ "$RAILWAY_ENVIRONMENT" = "production" ]; then
    echo "📡 Running in Railway production environment"
    
    # Install Python dependencies
    echo "🐍 Installing Python dependencies..."
    pip3 install -r backend/requirements.txt
    
    # Install Node.js dependencies
    echo "📦 Installing Node.js dependencies..."
    npm install
    
    # Install frontend dependencies
    echo "🎨 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    # Build frontend
    echo "🏗️ Building frontend..."
    cd frontend && npm run build && cd ..
    
    # Start the application
    echo "🚀 Starting application..."
    npm run start:prod
else
    echo "🔧 Running in development environment"
    
    # Development setup
    echo "🛠️ Setting up development environment..."
    
    # Check if Python 3 is available
    if command -v python3 &> /dev/null; then
        echo "✅ Python 3 found"
    else
        echo "❌ Python 3 not found. Please install Python 3."
        exit 1
    fi
    
    # Check if Node.js is available
    if command -v node &> /dev/null; then
        echo "✅ Node.js found: $(node --version)"
    else
        echo "❌ Node.js not found. Please install Node.js."
        exit 1
    fi
    
    # Install dependencies
    echo "📦 Installing all dependencies..."
    npm run setup
    
    # Start development server
    echo "🚀 Starting development server..."
    npm run dev
fi 