---
⚠️ ARCHIVED DOCUMENT - INACTIVE

This document has been archived as a one-off/historical record.
For current project status, see: docs/PROJECT_CHANGE_LOG.md
Archived: 2025-11-28
---

---
Document ID: TRANSFER-PACKAGE
Title: Cosmos Transfer Package
Subject(s): General
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

This package contains the complete Cosmos MCP server system ready for deployment on a new host.

### Core Application Files
- `src/` - TypeScript source code for MCP server
- `public/` - Web interface files (HTML, CSS, JS)
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `web-server.js` - Express web server for dashboard
- `start.js` - Production startup script

### Configuration Files
- `.env.example` - Environment variables template
- `claude-desktop-config.json` - Claude Desktop integration config
- `.replit` - Replit platform configuration
- `Procfile` - Heroku deployment configuration

### Documentation Suite
- `README.md` - Main project documentation
- `INSTALL.md` - Installation instructions
- `FAQ.md` - Frequently asked questions
- `SECURITY_OPTIONS.md` - Security implementation guide
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment verification
- `replit.md` - Technical architecture and preferences

### Assets and Branding
- `cosmos-logo.svg` - Main logo file
- `cosmos-logo-small.svg` - Compact logo version
- `cosmos-logo-icon.svg` - Icon-only version

### Sample Data and Types
- `src/data/samplePartners.ts` - Demo partner data
- `src/types/` - TypeScript type definitions
- `src/services/` - Business logic services
- `src/tools/` - MCP tool implementations

## Pre-Transfer Setup Requirements

### Environment Variables Needed
Create `.env` file with:
```
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PORT=5000
```

### System Requirements
- Node.js 18+ (recommended: Node.js 20)
- npm or yarn package manager
- TypeScript compiler
- Git (for version control)

## Deployment Instructions

### Quick Start
1. Extract package to target directory
2. Install dependencies: `npm install`
3. Set environment variables in `.env`
4. Build application: `npm run build`
5. Start server: `npm start`

### Production Deployment Options

#### Option A: Replit Deployment
- Upload package to Replit
- Configure environment variables in Secrets
- Use provided `.replit` configuration
- Deploy using Replit Deployments

#### Option B: Traditional Hosting
- Use provided `Procfile` for Heroku
- Configure environment variables on host platform
- Set up automatic builds from Git repository
- Configure health checks at `/health` endpoint

#### Option C: Docker Deployment
- Create Dockerfile based on Node.js 20 Alpine
- Copy package contents to container
- Install dependencies and build
- Expose port 5000 for web interface

## Configuration Updates Required

### 1. Update Hosted Service URLs
Replace all instances of `https://cosmos-mcp-server.replit.app` with your new domain:

**Files to update:**
- `public/index.html` (line 236)
- `README.md` (line 30)
- `INSTALL.md` (line 118)
- `DEPLOYMENT_CHECKLIST.md` (line 33)
- `claude-desktop-config.json` (line 5)

### 2. Contact Information
Update placeholder contact details in `public/index.html` line 242:
```html
<p>📧 <a href="mailto:your-email@domain.com">Email Support</a> | 📱 <a href="tel:+1234567890">Phone Support</a></p>
```

### 3. Authentication Credentials
Update login credentials in `public/script.js` lines 60-61:
- Current: `demo/cosmos2025` and `admin/secure_cosmos_2025!`
- Recommend: Generate secure credentials for production

## Testing and Verification

### Health Checks
- Web Interface: `http://your-domain:5000`
- Health Endpoint: `http://your-domain:5000/health`
- MCP API Test: `http://your-domain:5000/api/mcp`

### MCP Integration Test
1. Configure Claude Desktop with new server URL
2. Test `recommend_next_action` tool functionality
3. Verify AI recommendations generate properly
4. Confirm partner data loads correctly

### Web Dashboard Test
1. Access web interface at your domain
2. Login with configured credentials
3. Test Next Action AI widget
4. Verify all dashboard components load
5. Test light/dark theme toggle

## Security Considerations

### Production Security
- Change default authentication credentials
- Enable HTTPS/TLS encryption
- Configure rate limiting for API endpoints
- Set up monitoring and logging
- Implement proper error handling

### API Key Security
- Store OpenAI API key in secure environment variables
- Never commit API keys to version control
- Use key rotation best practices
- Monitor API usage and costs

## Support and Maintenance

### Code Architecture
- MCP Server: TypeScript with Model Context Protocol SDK
- Web Interface: Vanilla HTML/CSS/JavaScript
- AI Service: OpenAI GPT-4 integration
- Data Layer: In-memory with TypeScript interfaces

### Update Process
1. Pull latest changes from repository
2. Run `npm install` for dependency updates
3. Execute `npm run build` to compile TypeScript
4. Restart server with `npm start`
5. Verify functionality with health checks

### Troubleshooting
- Check server logs for error messages
- Verify environment variables are set correctly
- Confirm OpenAI API key has sufficient credits
- Test MCP protocol communication
- Validate web server port accessibility

## Package Verification Checklist

- [ ] All source files included and complete
- [ ] Dependencies listed in package.json
- [ ] Environment variables documented
- [ ] Documentation files present and updated
- [ ] Logo and asset files included
- [ ] Configuration examples provided
- [ ] Security guidelines documented
- [ ] Testing procedures outlined

---

**Transfer Date**: August 2025
**Package Version**: 1.0.0
**Cosmos Server Name**: project-cosmos (internal) / cosmos (Claude Desktop)
**Original Platform**: Replit