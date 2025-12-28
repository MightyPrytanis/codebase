#!/bin/bash
#
# Build Script for Cyrano MCP Server
#
# Usage: ./scripts/build.sh [--clean]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Clean build if requested
if [ "$1" == "--clean" ]; then
  echo "🧹 Cleaning previous build..."
  npm run clean
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running TypeScript type check..."
npm run build -- --noEmit || npm run build

# Run tests
echo "🧪 Running tests..."
npm run test:unit

# Build application
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build completed successfully!"
  echo "📦 Output: dist/"
else
  echo "❌ Build failed!"
  exit 1
fi
