#!/bin/bash

# Cosmos Deployment Script
# Quick setup for new host environments

echo "🛸 Cosmos MCP Server Deployment Script"
echo "======================================="

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please upgrade to Node.js 18+."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your OpenAI API key!"
fi

# Build TypeScript
echo "🔧 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Test health endpoint
echo "🏥 Testing health endpoint..."
npm start &
SERVER_PID=$!
sleep 5

if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

kill $SERVER_PID 2>/dev/null

echo ""
echo "🎉 Cosmos deployment successful!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your OpenAI API key"
echo "2. Update contact information in public/index.html"
echo "3. Change authentication credentials in public/script.js"
echo "4. Update server URLs in documentation files"
echo "5. Start server: npm start"
echo "6. Access dashboard: http://localhost:5000"
echo ""
echo "For Claude Desktop integration, update the server URL in:"
echo "- claude-desktop-config.json"
echo "- All documentation files"
echo ""
echo "Happy deploying! 🚀"