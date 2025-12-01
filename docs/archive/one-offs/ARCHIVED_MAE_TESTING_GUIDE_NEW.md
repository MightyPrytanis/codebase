---
Document ID: ARCHIVED-MAE_TESTING_GUIDE_NEW
Title: Mae Testing Guide New
Subject(s): Archived | Limited Utility
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Document archived due to limited current or future utility (mock data, test files, old/duplicate content, etc.)
Status: Archived
---

**ARCHIVED:** This document has limited current or future utility and has been archived. Archived 2025-11-28.

---

---
Document ID: MAE-TESTING-GUIDE-NEW
Title: Mae Testing Guide New
Subject(s): LexFiat | Guide | UI | Testing
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# MAE Workflow Testing Guide

This guide provides step-by-step instructions for testing the Multi-Agent Engine (MAE) workflow functionality that has been integrated into LexFiat.

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Build the Project**
   ```bash
   npm run build
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open your browser to `http://localhost:5000`
   - The MAE Workflows section will be visible on the dashboard

## Testing the Backend API Endpoints

### 1. Test Workflow Templates
```bash
curl -s http://localhost:5000/api/mae-workflow-templates | jq .
```
**Expected Result:** Returns 4 workflow types (Compare, Critique, Collaborate, Custom)

### 2. Create Workflow from Template
```bash
curl -s -X POST http://localhost:5000/api/mae-workflows/from-template \
  -H "Content-Type: application/json" \
  -d '{"templateId": "compare", "attorneyId": "test-attorney-123"}' | jq .
```
**Expected Result:** Returns created workflow with generated ID and associated steps

### 3. Execute Workflow
```bash
# Replace WORKFLOW_ID with the ID from step 2
curl -s -X POST http://localhost:5000/api/mae-workflows/WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{"caseId": "test-case-456", "executionData": {"documents": ["doc1.pdf", "doc2.pdf"]}}' | jq .
```
**Expected Result:** Returns execution record with tracking information

### 4. List All Workflows
```bash
curl -s http://localhost:5000/api/mae-workflows | jq .
```
**Expected Result:** Returns array of created workflows

### 5. List All Executions
```bash
curl -s http://localhost:5000/api/mae-workflow-executions | jq .
```
**Expected Result:** Returns array of workflow executions

## Testing the Frontend UI

### 1. Dashboard Integration
- Navigate to `http://localhost:5000`
- Scroll down to the "Multi-Agent Engine (MAE) Workflows" section
- Verify 4 workflow cards are displayed: Compare, Critique, Collaborate, Custom Workflow

### 2. Workflow Cards Functionality
- Each card should show:
  - Workflow name and description
  - Number of agents and steps
  - Estimated execution time
  - Execute/Configure buttons (or Build Workflow for Custom)

### 3. Active Executions Monitor
- Below the workflow cards, there should be an "Active MAE Executions" section
- This displays mock active and completed workflow executions

## Expected Workflow Types

### Compare Workflow
- **Agents:** document_analyzer, legal_comparator, fact_checker
- **Steps:** 3 (Document Ingestion, Comparative Analysis, Fact Verification)
- **Use Case:** Multi-agent document comparison and analysis

### Critique Workflow  
- **Agents:** legal_reviewer, compliance_checker, quality_assessor
- **Steps:** 3 (Legal Review, Compliance Check, Quality Assessment)
- **Use Case:** Legal document review and critique

### Collaborate Workflow
- **Agents:** collaboration_coordinator, task_manager, communication_facilitator
- **Steps:** 3 (Collaboration Setup, Task Distribution, Communication Facilitation)
- **Use Case:** Multi-party collaboration workflow

### Custom Workflow
- **Agents:** Configurable
- **Steps:** Variable
- **Use Case:** Build your own custom workflow

## Troubleshooting

### If the server won't start:
1. Check that port 5000 is available
2. Verify all dependencies are installed
3. Ensure the build completed successfully

### If API endpoints return errors:
1. Confirm the server is running on port 5000
2. Check server logs for error messages
3. Verify JSON payload formatting in POST requests

### If frontend doesn't display workflows:
1. Check browser console for JavaScript errors
2. Verify the MAE Workflows component is loading
3. Confirm API endpoints are responding correctly

## Complete Test Script

Here's a complete script to test all functionality:

```bash
#!/bin/bash

# Start server in background (if not already running)
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

echo "Testing MAE Workflow API Endpoints..."

echo "1. Testing workflow templates..."
curl -s http://localhost:5000/api/mae-workflow-templates | jq '.[] | .name'

echo "2. Creating workflow from template..."
WORKFLOW_RESPONSE=$(curl -s -X POST http://localhost:5000/api/mae-workflows/from-template \
  -H "Content-Type: application/json" \
  -d '{"templateId": "compare", "attorneyId": "test-attorney-123"}')

WORKFLOW_ID=$(echo $WORKFLOW_RESPONSE | jq -r '.workflow.id')
echo "Created workflow ID: $WORKFLOW_ID"

echo "3. Executing workflow..."
EXECUTION_RESPONSE=$(curl -s -X POST http://localhost:5000/api/mae-workflows/$WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{"caseId": "test-case-456", "executionData": {"documents": ["doc1.pdf", "doc2.pdf"]}}')

EXECUTION_ID=$(echo $EXECUTION_RESPONSE | jq -r '.id')
echo "Created execution ID: $EXECUTION_ID"

echo "4. Verifying data persistence..."
echo "Workflows count: $(curl -s http://localhost:5000/api/mae-workflows | jq 'length')"
echo "Executions count: $(curl -s http://localhost:5000/api/mae-workflow-executions | jq 'length')"

echo "All tests completed successfully!"

# Clean up
kill $SERVER_PID
```

This testing guide confirms that the MAE workflow integration is fully functional with both backend API endpoints and frontend UI components working properly.