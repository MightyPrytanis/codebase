#!/bin/bash

# Start Demo Script for LexFiat + Cyrano
# This script starts both the Cyrano MCP HTTP bridge and LexFiat frontend

echo "🚀 Starting LexFiat Demo..."
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Start Cyrano HTTP Bridge
start_cyrano() {
    echo -e "${YELLOW}📡 Starting Cyrano MCP HTTP Bridge...${NC}"
    cd /Users/davidtowne/Desktop/Coding/codebase/Cyrano
    
    if ! check_port 5002; then
        echo "Cyrano may already be running. Continuing..."
    else
        npm run http > /tmp/cyrano.log 2>&1 &
        CYRANO_PID=$!
        echo $CYRANO_PID > /tmp/cyrano.pid
        echo -e "${GREEN}✅ Cyrano started (PID: $CYRANO_PID)${NC}"
        echo "   Logs: /tmp/cyrano.log"
        
        # Wait for server to start
        echo "   Waiting for server to start..."
        sleep 3
        
        # Test if server is up
        if curl -s http://localhost:5002/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Cyrano HTTP Bridge is running on http://localhost:5002${NC}"
        else
            echo -e "${YELLOW}⚠️  Cyrano may still be starting...${NC}"
        fi
    fi
}

# Start LexFiat Frontend
start_lexfiat() {
    echo -e "${YELLOW}🎨 Starting LexFiat Frontend...${NC}"
    cd /Users/davidtowne/Desktop/Coding/codebase/LexFiat
    
    if ! check_port 5173; then
        echo "LexFiat may already be running. Continuing..."
    else
        npm run dev > /tmp/lexfiat.log 2>&1 &
        LEXFIAT_PID=$!
        echo $LEXFIAT_PID > /tmp/lexfiat.pid
        echo -e "${GREEN}✅ LexFiat started (PID: $LEXFIAT_PID)${NC}"
        echo "   Logs: /tmp/lexfiat.log"
        
        # Wait a bit for Vite to start
        sleep 2
        echo -e "${GREEN}✅ LexFiat should be available at http://localhost:5173${NC}"
    fi
}

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    if [ -f /tmp/cyrano.pid ]; then
        CYRANO_PID=$(cat /tmp/cyrano.pid)
        kill $CYRANO_PID 2>/dev/null
        echo "   Stopped Cyrano (PID: $CYRANO_PID)"
        rm /tmp/cyrano.pid
    fi
    if [ -f /tmp/lexfiat.pid ]; then
        LEXFIAT_PID=$(cat /tmp/lexfiat.pid)
        kill $LEXFIAT_PID 2>/dev/null
        echo "   Stopped LexFiat (PID: $LEXFIAT_PID)"
        rm /tmp/lexfiat.pid
    fi
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Start both servers
start_cyrano
start_lexfiat

echo ""
echo "================================"
echo -e "${GREEN}🎉 Demo is running!${NC}"
echo ""
echo "📍 URLs:"
echo "   LexFiat:  http://localhost:5173"
echo "   Cyrano:   http://localhost:5002"
echo ""
echo "📊 Check status:"
echo "   Cyrano health:  curl http://localhost:5002/health"
echo "   Cyrano tools:   curl http://localhost:5002/mcp/tools"
echo ""
echo "🛑 Press Ctrl+C to stop both servers"
echo ""

# Wait for user interrupt
wait


