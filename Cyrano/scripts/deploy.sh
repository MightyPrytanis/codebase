#!/bin/bash
#
# Deployment Script for Cyrano MCP Server
# 
# Usage: ./scripts/deploy.sh [environment]
# Environment: development, staging, production (default: production)
#

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Deploying Cyrano MCP Server to $ENVIRONMENT environment..."

cd "$PROJECT_ROOT"

# Load environment-specific variables
if [ -f ".env.$ENVIRONMENT" ]; then
  echo "📋 Loading environment variables from .env.$ENVIRONMENT"
  export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# Run tests (optional, can be skipped with --skip-tests)
if [ "$2" != "--skip-tests" ]; then
  echo "🧪 Running tests..."
  npm run test:unit
  
  if [ $? -ne 0 ]; then
    echo "⚠️  Tests failed, but continuing deployment..."
  fi
fi

# Docker deployment (if docker-compose.yml exists)
if [ -f "docker-compose.yml" ]; then
  echo "🐳 Building Docker image..."
  docker-compose build
  
  if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
  fi
  
  echo "🚀 Starting services..."
  docker-compose up -d
  
  if [ $? -ne 0 ]; then
    echo "❌ Docker deployment failed!"
    exit 1
  fi
  
  echo "✅ Deployment complete!"
  echo "📊 Checking service health..."
  sleep 5
  curl -f http://localhost:5000/health || echo "⚠️  Health check failed - service may still be starting"
else
  echo "📦 Starting application..."
  npm start
fi

echo "✅ Deployment script completed!"
