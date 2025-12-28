#!/bin/bash
#
# Rollback Script for Cyrano MCP Server
#
# Usage: ./scripts/rollback.sh [version]
#

set -e

VERSION=${1:-previous}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "⏪ Rolling back Cyrano MCP Server to version: $VERSION"

cd "$PROJECT_ROOT"

# Docker rollback
if [ -f "docker-compose.yml" ]; then
  echo "🐳 Rolling back Docker containers..."
  
  # Stop current containers
  docker-compose down
  
  # If version specified, checkout that version
  if [ "$VERSION" != "previous" ]; then
    echo "📦 Checking out version: $VERSION"
    git checkout "$VERSION"
  else
    echo "📦 Reverting to previous git commit..."
    git checkout HEAD~1
  fi
  
  # Rebuild and restart
  docker-compose build
  docker-compose up -d
  
  echo "✅ Rollback complete!"
else
  echo "⚠️  Docker not detected. Manual rollback required."
  echo "   To rollback: git checkout $VERSION && npm install && npm run build && npm start"
fi
