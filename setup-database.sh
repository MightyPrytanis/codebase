#!/bin/bash

# Database Setup Script for Cyrano Demo
# This script sets up PostgreSQL via Docker Compose

echo "🗄️  Setting up PostgreSQL database for Cyrano..."
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
check_docker() {
    if docker info > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! check_docker; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo ""
    echo "Please start Docker Desktop and run this script again."
    echo ""
    echo "Alternatively, you can start PostgreSQL manually:"
    echo "  cd $SCRIPT_DIR/Cyrano"
    echo "  docker-compose up -d postgres"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Start PostgreSQL
echo ""
echo -e "${YELLOW}📦 Starting PostgreSQL container...${NC}"
cd "$SCRIPT_DIR/Cyrano"

if docker-compose up -d postgres 2>&1 | grep -q "error\|Error\|ERROR"; then
    echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL container started${NC}"

# Wait for PostgreSQL to be ready
echo ""
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -1)
if [ -z "$POSTGRES_CONTAINER" ]; then
    POSTGRES_CONTAINER="cyrano-postgres-1"
fi

for i in {1..30}; do
    if docker exec "$POSTGRES_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start within 30 seconds${NC}"
        exit 1
    fi
    sleep 1
done

# Update .env file with PostgreSQL connection string
echo ""
echo -e "${YELLOW}📝 Updating .env file with PostgreSQL connection...${NC}"

ENV_FILE="$SCRIPT_DIR/Cyrano/.env"
BACKUP_FILE="$SCRIPT_DIR/Cyrano/.env.backup.$(date +%Y%m%d_%H%M%S)"

# Backup existing .env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo "   Backed up existing .env to: $BACKUP_FILE"
fi

# Update DATABASE_URL
if grep -q "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null; then
    # Replace existing DATABASE_URL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:password123@localhost:5432/cyrano|' "$ENV_FILE"
    else
        # Linux
        sed -i 's|^DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:password123@localhost:5432/cyrano|' "$ENV_FILE"
    fi
    echo -e "${GREEN}✅ Updated DATABASE_URL in .env${NC}"
else
    # Add DATABASE_URL if it doesn't exist
    echo "DATABASE_URL=postgresql://postgres:password123@localhost:5432/cyrano" >> "$ENV_FILE"
    echo -e "${GREEN}✅ Added DATABASE_URL to .env${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo ""
echo "PostgreSQL is running with:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: cyrano"
echo "  User: postgres"
echo "  Password: password123"
echo ""
echo "Connection string: postgresql://postgres:password123@localhost:5432/cyrano"
echo ""
echo "To stop PostgreSQL:"
echo "  cd $SCRIPT_DIR/Cyrano && docker-compose stop postgres"
echo ""
echo "To view logs:"
echo "  docker logs $POSTGRES_CONTAINER"
echo ""
