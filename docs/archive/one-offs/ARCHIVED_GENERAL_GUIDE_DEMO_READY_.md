---
Document ID: ARCHIVED-GENERAL_GUIDE_DEMO_READY_
Title: General Guide Demo Ready 
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
Document ID: DEMO-READY
Title: Demo Ready! 🎉
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
**Status:** ✅ READY FOR DEMO

---

## Quick Start

### Option 1: Use the Start Script
```bash
cd /Users/davidtowne/Desktop/Coding/codebase
./start-demo.sh
```

### Option 2: Manual Start

**Terminal 1 - Cyrano MCP Server:**
```bash
cd /Users/davidtowne/Desktop/Coding/codebase/Cyrano
npm run http
```

**Terminal 2 - LexFiat Frontend:**
```bash
cd /Users/davidtowne/Desktop/Coding/codebase/LexFiat
npm run dev
```

---

## URLs

- **LexFiat Dashboard:** http://localhost:5173
- **Cyrano API:** http://localhost:5002
- **Cyrano Health:** http://localhost:5002/health
- **Cyrano Tools:** http://localhost:5002/mcp/tools

---

## What's Working

✅ **Cyrano MCP Server:**
- HTTP bridge running on port 5002
- All 50+ tools registered and available
- API accepts both `input` and `arguments` formats
- Health check endpoint working

✅ **LexFiat Frontend:**
- React app with Vite
- Connected to Cyrano API
- Dashboard UI ready
- GoodCounsel widget functional
- Demo mode available

---

## Demo Features to Show

1. **GoodCounsel Widget**
   - Ethics and wellness guidance
   - Multi-AI provider support
   - Real-time AI responses

2. **Document Analysis**
   - Upload documents
   - AI-powered analysis
   - Red flag detection

3. **Workflow Management**
   - Case management
   - Task tracking
   - Status monitoring

4. **AI Tools**
   - Document analyzer
   - Legal reviewer
   - Fact checker
   - Compliance checker

---

## Troubleshooting

### Cyrano Not Starting
- Check port 5002 is available: `lsof -i :5002`
- Check logs: `tail -f /tmp/cyrano-demo.log`
- Verify build: `cd Cyrano && npm run build`

### LexFiat Not Starting
- Check port 5173 is available: `lsof -i :5173`
- Check logs: `tail -f /tmp/lexfiat-demo.log`
- Install dependencies: `cd LexFiat && npm install`

### API Connection Issues
- Verify `VITE_CYRANO_API_URL=http://localhost:5002` in LexFiat `.env.local`
- Test Cyrano health: `curl http://localhost:5002/health`
- Check CORS settings (should be enabled in Cyrano)

---

## Stop Servers

```bash
# Kill Cyrano
kill $(cat /tmp/cyrano-demo.pid) 2>/dev/null

# Kill LexFiat
kill $(cat /tmp/lexfiat-demo.pid) 2>/dev/null

# Or use the script
./start-demo.sh  # Press Ctrl+C
```

---

**Status:** ✅ READY  
**Next:** Open http://localhost:5173 in your browser!


