---
Document ID: ARCHIVED-GENERAL_GUIDE_DEMO_INSTRUCTIONS
Title: General Guide Demo Instructions
Subject(s): Archived | One-Off
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: One-off document archived as no longer useful for active reference.
Status: Archived
---

**ARCHIVED:** This document is a one-off (status report, completion summary, handoff, etc.) and is no longer useful for active reference. Archived 2025-11-28.

---

---
Document ID: DEMO-INSTRUCTIONS
Title: Demo Instructions
Subject(s): General
Project: Cyrano
Version: v548
Created: 2025-11-26 (2025-W48)
Last Substantive Revision: 2025-11-26 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

**Date:** 2025-11-26  
**Status:** ✅ READY

---

## 🎉 Demo is Ready!

Both servers are configured and ready to run.

---

## Quick Start

### Start Both Servers

**Option 1: Use the script (recommended)**
```bash
cd /Users/davidtowne/Desktop/Coding/codebase
./start-demo.sh
```

**Option 2: Manual start**

**Terminal 1 - Cyrano:**
```bash
cd /Users/davidtowne/Desktop/Coding/codebase/Cyrano
npm run http
```

**Terminal 2 - LexFiat:**
```bash
cd /Users/davidtowne/Desktop/Coding/codebase/LexFiat
npm run dev
```

---

## 🌐 Access Points

Once both servers are running:

- **LexFiat Dashboard:** http://localhost:5173
- **Cyrano API Health:** http://localhost:5002/health
- **Cyrano Tools List:** http://localhost:5002/mcp/tools

---

## ✅ What's Working

1. **Cyrano MCP Server**
   - ✅ HTTP bridge on port 5002
   - ✅ 50+ tools registered
   - ✅ API accepts both `input` and `arguments` formats
   - ✅ Health check working

2. **LexFiat Frontend**
   - ✅ React + Vite setup
   - ✅ Connected to Cyrano API
   - ✅ Dashboard UI ready
   - ✅ GoodCounsel widget functional

3. **API Integration**
   - ✅ Compatibility layer for `arguments` → `input`
   - ✅ CORS enabled
   - ✅ Error handling

---

## 🎯 Demo Features to Show

### 1. GoodCounsel Widget
- Navigate to dashboard
- Find GoodCounsel widget
- Enter context and get AI guidance
- Test different time pressure levels

### 2. Document Analysis
- Upload a document (if upload feature exists)
- Run document analysis
- View AI-powered insights

### 3. Tool Integration
- Show available tools via API
- Test tool execution
- Demonstrate real-time responses

---

## 🧪 Test Commands

```bash
# Test Cyrano health
curl http://localhost:5002/health

# List all tools
curl http://localhost:5002/mcp/tools | jq '.tools | length'

# Test GoodCounsel
curl -X POST http://localhost:5002/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "good_counsel",
    "arguments": {
      "context": "Busy day with multiple client meetings",
      "time_pressure": "high"
    }
  }'
```

---

## 🛑 Stop Servers

**If using the script:**
- Press `Ctrl+C` in the terminal running the script

**If running manually:**
```bash
# Find and kill processes
pkill -f "tsx.*http-bridge"
pkill -f "vite"
```

---

## 📝 Notes

- LexFiat may take 10-20 seconds to fully start
- First load may be slower (Vite compilation)
- Check browser console for any connection errors
- Ensure Cyrano is running before LexFiat loads

---

**Status:** ✅ READY FOR DEMO  
**Next:** Open http://localhost:5173 in your browser!


