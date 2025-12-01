---
Document ID: ARCHIVED-INTEGRATION_EXAMPLES
Title: Integration Examples
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
Document ID: INTEGRATION-EXAMPLES
Title: Integration Examples
Subject(s): Cyrano
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# Cyrano MCP Server - Integration Examples

## Example 1: Basic Legal Document Analysis

```bash
curl -X POST http://localhost:5002/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "document_analyzer",
    "input": {
      "document_text": "This Employment Agreement is entered into between ABC Corp and John Doe. The employee agrees to work full-time for a salary of $75,000 per year. The term of employment is indefinite, subject to termination by either party with 30 days notice.",
      "analysis_type": "comprehensive",
      "focus_areas": ["compensation", "termination"]
    }
  }'
```

## Example 2: Legal Compliance Check

```bash
curl -X POST http://localhost:5002/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "compliance_checker",
    "input": {
      "document_text": "Privacy Policy: We collect personal information including names, emails, and browsing data. This information may be shared with third parties for marketing purposes.",
      "regulations": ["GDPR", "CCPA"],
      "jurisdiction": "california",
      "industry": "technology"
    }
  }'
```

## Example 3: Multi-Document Comparison

```bash
curl -X POST http://localhost:5002/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "contract_comparator",
    "input": {
      "document1": "Contract Version 1: Payment due in 30 days. Termination requires 60 days notice.",
      "document2": "Contract Version 2: Payment due in 15 days. Termination requires 30 days notice.",
      "comparison_type": "structural",
      "focus_areas": ["payment_terms", "termination_clauses"]
    }
  }'
```

## Example 4: Fact Checking Legal Claims

```bash
curl -X POST http://localhost:5002/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "fact_checker",
    "input": {
      "claim": "According to federal law, all employees must receive overtime pay at 1.5x their regular rate for hours worked over 40 per week.",
      "verification_level": "thorough",
      "context": "This claim is being made in an employment dispute case.",
      "sources": ["29 USC 207", "Fair Labor Standards Act"]
    }
  }'
```

## Example 5: Quality Assessment

```bash
curl -X POST http://localhost:5002/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "quality_assessor",
    "input": {
      "document_text": "The parties hereby agree to the terms and conditions set forth herein. Party A shall provide services to Party B for a fee.",
      "assessment_criteria": ["clarity", "completeness", "legal_sufficiency"],
      "quality_standard": "professional"
    }
  }'
```

## Example 6: AI Workflow Orchestration

```bash
curl -X POST http://localhost:5002/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "ai_orchestrator",
    "input": {
      "task_description": "Review contract for compliance issues, then generate recommendations",
      "orchestration_mode": "sequential",
      "ai_providers": ["claude", "gpt-4"],
      "parameters": {
        "max_iterations": 3,
        "confidence_threshold": 0.8
      }
    }
  }'
```

## Example 7: Data Extraction (Arkiver)

```bash
curl -X POST http://localhost:5002/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "extract_conversations",
    "input": {
      "file_path": "/path/to/conversations.json",
      "title_filter": "legal"
    }
  }'
```

## LexFiat Integration Example (JavaScript)

```javascript
// LexFiat client integration
class CyranoClient {
  constructor(baseUrl = 'http://localhost:5002') {
    this.baseUrl = baseUrl;
  }

  async analyzeDocument(text, analysisType = 'comprehensive') {
    const response = await fetch(`${this.baseUrl}/mcp/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'document_analyzer',
        input: { document_text: text, analysis_type: analysisType }
      })
    });
    return response.json();
  }

  async checkCompliance(text, regulations, jurisdiction) {
    const response = await fetch(`${this.baseUrl}/mcp/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'compliance_checker',
        input: { document_text: text, regulations, jurisdiction }
      })
    });
    return response.json();
  }

  async compareDocuments(doc1, doc2, focusAreas = []) {
    const response = await fetch(`${this.baseUrl}/mcp/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'contract_comparator',
        input: { 
          document1: doc1, 
          document2: doc2, 
          comparison_type: 'comprehensive',
          focus_areas: focusAreas 
        }
      })
    });
    return response.json();
  }
}

// Usage in LexFiat
const cyrano = new CyranoClient();

// Analyze uploaded document
const analysis = await cyrano.analyzeDocument(documentText, 'comprehensive');
console.log('Document Analysis:', analysis);

// Check compliance
const compliance = await cyrano.checkCompliance(
  documentText, 
  ['GDPR', 'CCPA'], 
  'california'
);
console.log('Compliance Check:', compliance);
```

## Claude Desktop MCP Configuration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "cyrano-legal": {
      "command": "node",
      "args": ["/path/to/Cyrano/dist/mcp-server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Python Integration Example

```python
import requests
import json

class CyranoMCPClient:
    def __init__(self, base_url="http://localhost:5002"):
        self.base_url = base_url
    
    def analyze_document(self, text, analysis_type="comprehensive"):
        response = requests.post(
            f"{self.base_url}/mcp/execute",
            json={
                "tool": "document_analyzer",
                "input": {
                    "document_text": text,
                    "analysis_type": analysis_type
                }
            }
        )
        return response.json()
    
    def fact_check(self, claim, context=None, verification_level="thorough"):
        response = requests.post(
            f"{self.base_url}/mcp/execute",
            json={
                "tool": "fact_checker",
                "input": {
                    "claim": claim,
                    "context": context,
                    "verification_level": verification_level
                }
            }
        )
        return response.json()

# Usage
client = CyranoMCPClient()
result = client.analyze_document("Your legal document text here")
print(json.dumps(result, indent=2))
```

## Error Handling Best Practices

```javascript
async function safeCyranoCall(tool, input) {
  try {
    const response = await fetch('http://localhost:5002/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, input })
    });
    
    const result = await response.json();
    
    if (result.isError) {
      console.error('Tool execution error:', result.content[0].text);
      return { success: false, error: result.content[0].text };
    }
    
    return { success: true, data: result };
    
  } catch (error) {
    console.error('Network/parsing error:', error);
    return { success: false, error: error.message };
  }
}
```

These examples demonstrate the full integration capabilities of the Cyrano MCP Server with various client applications.