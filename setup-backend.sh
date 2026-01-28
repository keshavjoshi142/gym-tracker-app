#!/bin/bash

echo "🚀 Setting up GymTracker Backend Server..."

# Navigate to server directory
cd "$(dirname "$0")/server"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please make sure you're in the correct directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
if command -v npm &> /dev/null; then
    npm install
elif command -v yarn &> /dev/null; then
    yarn install
else
    echo "❌ Error: Neither npm nor yarn found. Please install Node.js and npm."
    exit 1
fi

# Create database directory if it doesn't exist
mkdir -p data

echo "✅ Dependencies installed successfully!"
echo ""
echo "🎯 To start the server:"
echo "   npm start    (production mode)"
echo "   npm run dev  (development mode with auto-restart)"
echo ""
echo "🌐 Server will be available at: http://localhost:3000"
echo "🔍 Health check endpoint: http://localhost:3000/api/health"
echo ""
echo "📱 Your React Native app will automatically connect to the server"
echo "   when it detects the API is available."