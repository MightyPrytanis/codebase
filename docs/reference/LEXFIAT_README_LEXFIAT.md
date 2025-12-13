---
Document ID: README
Title: LexFiat
Subject(s): LexFiat
Project: Cyrano
Version: v548
Created: 2025-11-26 (2025-W48)
Last Substantive Revision: 2025-11-26 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

> **"Automation enables better client relationships rather than replacing them."**

LexFiat is an MCP-compliant thin client legal workflow automation application designed for modern law practices. Originally built as a custom solution for a busy solo family law practitioner, LexFiat transforms traditional legal workflows through AI-powered document analysis and verification, intelligent case management, and adaptive user interfaces.

**Architecture:** LexFiat is a **thin client** that calls **Cyrano MCP server** for all backend operations. It does NOT have its own backend server.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Cyrano MCP server running (or accessible via API)
- Cyrano API URL configured

### Installation
```bash
# Clone repository
git clone <repository-url>
cd lexfiat

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration:
# VITE_CYRANO_API_URL=http://localhost:5002  # or your Cyrano server URL
```

### Development
```bash
# Start development server (Vite)
npm run dev
```

Visit `http://localhost:5173` (or port shown by Vite) to see LexFiat in action.

---

## ✨ Key Features

### Adaptive Workflow Intelligence
- **Dynamic Dashboards**: Interfaces that transform based on active legal workflows
- **Assembly Line Metaphor**: Three-stage workflow (Intake → Processing → Output & Delivery)
- **Real-time Updates**: Live data synchronization across all components

### AI-Powered Legal Analysis
- **Multi-AI Support**: Uses Cyrano MCP tools for AI operations
- **Document Intelligence**: Automated analysis via Cyrano tools
- **Document Verification**: Potemkin engine integration for comprehensive document verification (facts, citations, claims)
- **Red Flag Detection**: Intelligent identification of urgent legal matters

### Document Verification (Hybrid Approach)
LexFiat implements a hybrid approach for document verification:
- **Potemkin Engine**: Used for comprehensive document verification workflows that combine multiple verification steps with AI analysis
- **Direct Tools**: Used for simple operations like citation checking (via `citation_checker` tool)
- **Benefits**: Flexibility for custom workflows, performance for simple operations, and access to advanced verification features
- **Response Generation**: AI-drafted responses with attorney approval workflow

### Professional Legal Branding
- **Custom Logo**: Simplified Edison bulb design representing "Legal Intelligence"
- **Dark Theme**: Professional navy and gold color scheme
- **Responsive Design**: Optimized for desktop and mobile use

### Demo Mode
- **Realistic Scenarios**: Johnson v Johnson divorce, Hartley Estate probate cases
- **Interactive Testing**: Full workflow demonstration without real client data
- **Educational Tool**: Perfect for showcasing capabilities to potential clients

---

## 🏗️ Architecture

### Frontend-Only Application
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui component library
- **Styling**: Tailwind CSS for styling
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite

### Backend Integration
- **Cyrano MCP Server**: All backend operations via MCP protocol
- **HTTP API**: Calls Cyrano's HTTP bridge endpoints
- **No Express Server**: LexFiat does NOT have its own backend
- **Database**: Managed by Cyrano MCP server

### AI Integration
LexFiat uses Cyrano MCP tools for all AI operations:
- Document analysis via `document_analyzer` tool
- Legal review via `legal_reviewer` tool
- Fact checking via `fact_checker` tool
- Multi-agent workflows via `mae_engine` tool
- And other Cyrano MCP tools as needed

---

## 📁 Project Structure

```
lexfiat/
├── client/                    # React frontend (main app)
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── dashboard/   # Dashboard components
│   │   │   ├── layout/      # Layout components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities
├── shared/                   # Shared types (app-specific)
│   └── schema.ts            # Database schema types
├── package.json             # Frontend dependencies only
└── vite.config.ts          # Vite configuration
```

**Note:** There is NO `server/` directory. LexFiat is frontend-only.

---

## 🔧 Environment Variables

```env
# Cyrano MCP Server (Required)
VITE_CYRANO_API_URL=http://localhost:5002
# Or: https://cyrano-mcp-server.onrender.com (production)

# Database (if LexFiat needs direct DB access - typically handled by Cyrano)
DATABASE_URL=postgresql://...  # Optional, usually not needed
```

---

## 🚀 Deployment

### Production Deployment

LexFiat is a static frontend application. Deploy as a static site:

#### Option 1: Static Hosting (Recommended)
1. **Build the app**: `npm run build`
2. **Deploy `dist/` folder** to:
   - Vercel
   - Netlify
   - GitHub Pages
   - Any static hosting service
3. **Configure environment variables** in hosting platform
4. **Set `VITE_CYRANO_API_URL`** to your Cyrano server URL

#### Option 2: Docker (if needed)
1. Build Docker image from provided Dockerfile
2. Deploy to any cloud provider
3. Configure `VITE_CYRANO_API_URL` environment variable

#### Option 3: Traditional VPS
1. Build: `npm run build`
2. Serve `dist/` with nginx or Apache
3. Configure reverse proxy if needed

**Important:** Ensure Cyrano MCP server is running and accessible at the configured `VITE_CYRANO_API_URL`.

---

## 🔄 Development Workflow

### Available Scripts
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production (creates dist/)
npm run serve        # Preview production build
```

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- shadcn/ui components
- Responsive design patterns

---

## 🔌 Cyrano Integration

LexFiat calls Cyrano MCP server for all backend operations:

### Example API Calls
```typescript
// Call Cyrano tool via HTTP
const response = await fetch(`${import.meta.env.VITE_CYRANO_API_URL}/mcp/execute`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'document_analyzer',
    arguments: { document: '...' }
  })
});
```

### Available Cyrano Tools
- `document_analyzer` - Document analysis
- `legal_reviewer` - Legal document review
- `fact_checker` - Fact verification
- `mae_engine` - Multi-agent workflows
- `goodcounsel_engine` - Ethics and wellness
- And many more (see Cyrano MCP server documentation)

---

## 📊 Demo Mode

Experience LexFiat's capabilities with realistic legal scenarios:

### Available Scenarios
- **Johnson v Johnson**: High-conflict divorce with custody disputes
- **Hartley Estate**: Complex probate with family disagreements
- **Emergency Response**: Urgent custody modification requests
- **Settlement Negotiation**: Multi-party settlement conferences

Access demo mode via the dashboard "Demo Mode" button.

---

## 🔐 Security & Privacy

- Environment variable management
- HTTPS enforcement in production
- API key protection (handled by Cyrano)
- No client-side sensitive data exposure
- All backend operations via secure Cyrano MCP

---

## 📞 Support

### Technical Issues
- Review Cyrano MCP server documentation
- Check Cyrano server is running and accessible
- Verify `VITE_CYRANO_API_URL` is correctly configured

### Production Support
- **Domain**: lexfiat.org (if configured)
- **Client**: Mekel Miller, Esq. - Michigan Family Law & Probate
- **Backend**: Cyrano MCP server (separate deployment)

---

## 📄 License

This project is proprietary software developed for legal practice automation.

---

**LexFiat** - *Legal Intelligence Platform*  
*"Let There Be Law"* through intelligent automation.

Built with ⚡ by expert developers, designed for legal professionals.
