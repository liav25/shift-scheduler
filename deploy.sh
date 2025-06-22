#!/bin/bash

# Enhanced deployment script for Railway
set -e

echo "🚀 Preparing for deployment..."

# Clean up any previous build artifacts
echo "🧹 Cleaning up previous artifacts..."
rm -rf backend/__pycache__
rm -rf backend/venv
rm -rf frontend/dist
rm -rf frontend/node_modules/.cache

# Verify dependencies are specified correctly
echo "🔍 Verifying dependency files..."

if [ ! -f "requirements.txt" ]; then
    echo "❌ Root requirements.txt not found"
    exit 1
fi

if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ Backend requirements.txt not found"
    exit 1
fi

echo "✅ Dependency files found"

# Test Python dependencies locally (optional - only if we're not in Railway)
if [ -z "$RAILWAY_ENVIRONMENT" ]; then
    echo "🔍 Testing dependencies locally..."
    
    # Create temporary virtual environment for testing
    python3 -m venv test_env
    source test_env/bin/activate
    
    # Install and test dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    pip install -r backend/requirements.txt
    
    # Test imports
    python3 -c "
import fastapi
import uvicorn
import pydantic
print('✅ All critical dependencies import successfully')
"
    
    # Clean up test environment
    deactivate
    rm -rf test_env
    
    echo "✅ Local dependency test passed"
fi

# Validate configuration files
echo "🔍 Validating configuration files..."

if [ ! -f "nixpacks.toml" ]; then
    echo "❌ nixpacks.toml not found"
    exit 1
fi

if [ ! -f "railway.toml" ]; then
    echo "❌ railway.toml not found"
    exit 1
fi

if [ ! -f "start.sh" ]; then
    echo "❌ start.sh not found"
    exit 1
fi

echo "✅ Configuration files validated"

# Make scripts executable
chmod +x start.sh

# Verify package.json scripts
echo "🔍 Verifying package.json scripts..."
if ! grep -q "start.*start.sh" package.json; then
    echo "⚠️  Warning: package.json may not be configured correctly for Railway"
fi

echo "✅ Deployment preparation complete"
echo ""
echo "📋 Deployment checklist:"
echo "  ✅ Dependencies verified"
echo "  ✅ Configuration files present"
echo "  ✅ Scripts made executable"
echo ""
echo "🚀 Ready for Railway deployment!"
echo ""
echo "To deploy to Railway:"
echo "  1. Commit these changes: git add . && git commit -m 'Fix deployment configuration'"
echo "  2. Push to Railway: git push"
echo ""
echo "To test locally:"
echo "  npm run start"

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