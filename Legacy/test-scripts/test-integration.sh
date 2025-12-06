#!/bin/bash

# Cyrano MCP Server - Basic Integration Test Script

echo "🚀 Testing Cyrano MCP Server Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_build() {
    echo -e "${YELLOW}📦 Testing build...${NC}"
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Build successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Build failed${NC}"
        return 1
    fi
}

test_mcp_server() {
    echo -e "${YELLOW}🔄 Testing MCP Server (stdio mode)...${NC}"
    # Start server in background and capture both stdout and stderr
    npm run mcp > /tmp/mcp_test.log 2>&1 &
    MCP_PID=$!
    
    # Wait for server to start (check log file)
    for i in {1..5}; do
        sleep 1
        if grep -q "Cyrano MCP Server running on stdio" /tmp/mcp_test.log 2>/dev/null; then
            echo -e "${GREEN}✅ MCP Server starts successfully${NC}"
            kill $MCP_PID 2>/dev/null
            wait $MCP_PID 2>/dev/null
            return 0
        fi
    done
    
    # If we get here, server didn't start or message not found
    echo -e "${RED}❌ MCP Server failed to start${NC}"
    echo "Last 10 lines of log:"
    tail -10 /tmp/mcp_test.log 2>/dev/null || echo "No log file"
    kill $MCP_PID 2>/dev/null
    wait $MCP_PID 2>/dev/null
    return 1
}

test_http_bridge() {
    echo -e "${YELLOW}🌐 Testing HTTP Bridge...${NC}"
    
    # Start HTTP bridge in background
    npm run http > /tmp/http_test.log 2>&1 &
    HTTP_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Test status endpoint
    if curl -s http://localhost:5002/mcp/status | grep -q '"status":"running"'; then
        echo -e "${GREEN}✅ HTTP Bridge status endpoint working${NC}"
    else
        echo -e "${RED}❌ HTTP Bridge status endpoint failed${NC}"
        kill $HTTP_PID 2>/dev/null
        return 1
    fi
    
    # Test tools endpoint
    TOOL_COUNT=$(curl -s http://localhost:5002/mcp/tools | jq '.tools | length' 2>/dev/null)
    # Updated: Should have 46+ tools (was 17, now includes Chronometric, modules, engines, verification tools)
    if [ "$TOOL_COUNT" -ge "40" ]; then
        echo -e "${GREEN}✅ HTTP Bridge tools endpoint working ($TOOL_COUNT tools)${NC}"
    else
        echo -e "${RED}❌ HTTP Bridge tools endpoint failed (got $TOOL_COUNT tools, expected 40+)${NC}"
        kill $HTTP_PID 2>/dev/null
        return 1
    fi
    
    # Test tool execution
    RESULT=$(curl -s -X POST http://localhost:5002/mcp/execute \
        -H "Content-Type: application/json" \
        -d '{"tool": "document_analyzer", "input": {"document_text": "Test document", "analysis_type": "summary"}}' \
        | jq -r '.content[0].text' 2>/dev/null)
    
    if [[ "$RESULT" == *"metadata"* && "$RESULT" == *"summary"* ]]; then
        echo -e "${GREEN}✅ Tool execution working${NC}"
    else
        echo -e "${RED}❌ Tool execution failed${NC}"
        kill $HTTP_PID 2>/dev/null
        return 1
    fi
    
    # Clean up
    kill $HTTP_PID 2>/dev/null
    return 0
}

test_tool_validation() {
    echo -e "${YELLOW}🔍 Testing tool input validation...${NC}"
    
    # Start HTTP bridge in background
    npm run http > /tmp/http_validation.log 2>&1 &
    HTTP_PID=$!
    sleep 3
    
    # Test invalid input - should get validation error
    ERROR_RESULT=$(curl -s -X POST http://localhost:5002/mcp/execute \
        -H "Content-Type: application/json" \
        -d '{"tool": "document_analyzer", "input": {"document_text": "Test", "analysis_type": "invalid"}}')
    
    if echo "$ERROR_RESULT" | grep -q '"isError":true'; then
        echo -e "${GREEN}✅ Input validation working${NC}"
    else
        echo -e "${RED}❌ Input validation failed${NC}"
        kill $HTTP_PID 2>/dev/null
        return 1
    fi
    
    # Clean up
    kill $HTTP_PID 2>/dev/null
    return 0
}

# Main test execution
echo "Starting Cyrano MCP Server integration tests..."
echo "============================================="

FAILED_TESTS=0

# Run tests
test_build || ((FAILED_TESTS++))
test_mcp_server || ((FAILED_TESTS++))
test_http_bridge || ((FAILED_TESTS++))
test_tool_validation || ((FAILED_TESTS++))

echo "============================================="
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Cyrano MCP Server is ready for integration.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure MCP client (e.g., Claude Desktop)"
    echo "2. Integrate with LexFiat application"
    echo "3. Deploy to production environment"
    exit 0
else
    echo -e "${RED}❌ $FAILED_TESTS test(s) failed. Please check the logs.${NC}"
    exit 1
fi