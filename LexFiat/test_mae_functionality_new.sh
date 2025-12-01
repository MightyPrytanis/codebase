#!/bin/bash

echo "=== MAE Workflow Functionality Test ==="
echo

# Start server in background if not running
if ! curl -s http://localhost:5000 > /dev/null; then
    echo "Starting development server..."
    npm run dev &
    SERVER_PID=$!
    echo "Waiting for server to start..."
    sleep 8
else
    echo "Server already running on port 5000"
    SERVER_PID=""
fi

echo "=== Testing API Endpoints ==="

echo
echo "1. Testing workflow templates endpoint..."
TEMPLATES=$(curl -s http://localhost:5000/api/mae-workflow-templates)
if [ $? -eq 0 ]; then
    echo "✅ Templates endpoint working"
    echo "   Available workflows: $(echo $TEMPLATES | jq -r '.[] | .name' | tr '\n' ', ' | sed 's/,$//')"
else
    echo "❌ Templates endpoint failed"
    exit 1
fi

echo
echo "2. Creating workflow from Compare template..."
WORKFLOW_RESPONSE=$(curl -s -X POST http://localhost:5000/api/mae-workflows/from-template \
  -H "Content-Type: application/json" \
  -d '{"templateId": "compare", "attorneyId": "test-attorney-123"}')

if [ $? -eq 0 ]; then
    WORKFLOW_ID=$(echo $WORKFLOW_RESPONSE | jq -r '.workflow.id')
    echo "✅ Workflow created successfully"
    echo "   Workflow ID: $WORKFLOW_ID"
    echo "   Steps created: $(echo $WORKFLOW_RESPONSE | jq '.steps | length')"
else
    echo "❌ Workflow creation failed"
    exit 1
fi

echo
echo "3. Executing workflow..."
EXECUTION_RESPONSE=$(curl -s -X POST http://localhost:5000/api/mae-workflows/$WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{"caseId": "test-case-456", "executionData": {"documents": ["doc1.pdf", "doc2.pdf"]}}')

if [ $? -eq 0 ]; then
    EXECUTION_ID=$(echo $EXECUTION_RESPONSE | jq -r '.id')
    echo "✅ Workflow execution started"
    echo "   Execution ID: $EXECUTION_ID"
    echo "   Status: $(echo $EXECUTION_RESPONSE | jq -r '.status')"
else
    echo "❌ Workflow execution failed"
    exit 1
fi

echo
echo "4. Verifying data persistence..."
WORKFLOWS_COUNT=$(curl -s http://localhost:5000/api/mae-workflows | jq 'length')
EXECUTIONS_COUNT=$(curl -s http://localhost:5000/api/mae-workflow-executions | jq 'length')

echo "   Stored workflows: $WORKFLOWS_COUNT"
echo "   Stored executions: $EXECUTIONS_COUNT"

if [ "$WORKFLOWS_COUNT" -gt 0 ] && [ "$EXECUTIONS_COUNT" -gt 0 ]; then
    echo "✅ Data persistence working"
else
    echo "❌ Data persistence issues"
    exit 1
fi

echo
echo "=== All Tests Passed! ==="
echo
echo "📊 Summary:"
echo "   ✅ API endpoints functional"
echo "   ✅ Workflow creation working"
echo "   ✅ Workflow execution working"
echo "   ✅ Data persistence working"
echo
echo "🌐 Frontend available at: http://localhost:5000"
echo "📖 Full testing guide: MAE_TESTING_GUIDE_NEW.md"

# Clean up if we started the server
if [ ! -z "$SERVER_PID" ]; then
    echo
    echo "Server is running in background (PID: $SERVER_PID)"
    echo "To stop: kill $SERVER_PID"
fi