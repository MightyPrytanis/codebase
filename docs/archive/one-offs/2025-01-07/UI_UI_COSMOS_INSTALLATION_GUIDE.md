---
Document ID: INSTALL
Title: Cosmos Installation Guide
Subject(s): UI
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

This guide provides step-by-step instructions for setting up the Cosmos MCP server and web interface. Cosmos is the codename for AI-powered mortgage partner management tools being integrated into the P360 platform.

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux Ubuntu 18.04+
- **Node.js**: Version 18.0 or higher
- **RAM**: 2GB available memory
- **Storage**: 500MB free disk space
- **Network**: Internet connection for AI features

### Recommended Requirements
- **Node.js**: Version 20.0 or higher
- **RAM**: 4GB available memory
- **Storage**: 1GB free disk space
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Pre-Installation Setup

### 1. Install Node.js
Visit [nodejs.org](https://nodejs.org/) and download the LTS version for your operating system.

**Verify installation:**
```bash
node --version
npm --version
```

### 2. Get OpenAI API Key (Optional)
1. Visit [platform.openai.com](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Generate a new API key
5. Save the key securely (you'll need it later)

**Note**: The system works with mock data if no API key is provided.

## Installation Methods

### Method 1: Replit Deployment (Recommended)
If you're using Replit, the system is already configured and ready to use.

1. Open the Replit project
2. The MCP server and web interface start automatically
3. Visit the web interface URL provided by Replit
4. Use demo credentials: `demo` / `cosmos2025`

### Method 2: Local Development Setup

#### Step 1: Clone or Download
```bash
# If using git
git clone <repository-url>
cd cosmos

# Or download and extract the project files
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Environment Configuration
Create a `.env` file in the project root:
```env
# Optional: OpenAI API key for live AI recommendations
OPENAI_API_KEY=your_openai_api_key_here

# Web server port (default: 5000)
PORT=5000

# Environment mode
NODE_ENV=development
```

#### Step 4: Build the Project
```bash
npm run build
```

#### Step 5: Start the Servers
```bash
# Production mode
npm start

# Development mode with hot reload
npm run dev
```

#### Step 6: Access the Interface
Open your browser and navigate to:
- **Web Interface**: `http://localhost:5000`
- **Demo Credentials**: Username: `demo`, Password: `cosmos2025`

## Claude Desktop Integration

### Step 1: Install Claude Desktop
1. Download Claude Desktop from [claude.ai](https://claude.ai/download)
2. Install the application for your operating system
3. Launch Claude Desktop and sign in

### Step 2: Configure Hosted MCP Server
1. Open Claude Desktop settings
2. Navigate to the "Developer" or "MCP Servers" section
3. Add the hosted Cosmos server configuration:

```json
{
  "mcpServers": {
    "cosmos": {
      "command": "node",
      "args": ["https://cosmos-mcp-server.replit.app/dist/index.js"]
    }
  }
}
```

**Important**: This connects to the hosted Cosmos server - no local installation or API keys required.

### Step 3: Verify Integration
1. Restart Claude Desktop
2. Start a new conversation
3. Ask: "What tools are available?"
4. Confirm that `recommend_next_action` tool is listed

### Step 4: Test the Integration
Ask Claude to generate partner recommendations:
```
Generate mortgage partner recommendations for this week with high priority
```

## Troubleshooting Installation

### Common Issues and Solutions

#### 1. Node.js Version Error
**Problem**: "Node.js version not supported"
**Solution**: 
```bash
# Check current version
node --version

# Install Node Version Manager (nvm) and switch versions
# For macOS/Linux:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# For Windows:
# Download and install from nodejs.org
```

#### 2. npm Install Fails
**Problem**: Dependency installation errors
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use yarn as alternative
npm install -g yarn
yarn install
```

#### 3. Port Already in Use
**Problem**: "Port 5000 is already in use"
**Solution**:
```bash
# Option 1: Use different port
PORT=3000 npm start

# Option 2: Kill process on port 5000
# macOS/Linux:
lsof -ti:5000 | xargs kill

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

#### 4. TypeScript Build Errors
**Problem**: Compilation failures
**Solution**:
```bash
# Ensure TypeScript is installed
npm install -g typescript

# Clean build
rm -rf dist
npm run build

# Check for syntax errors
npx tsc --noEmit
```

#### 5. OpenAI API Errors
**Problem**: AI features not working
**Solution**:
1. Verify API key is correct
2. Check OpenAI account has credits
3. Test API key:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```
4. System falls back to mock data if API fails

#### 6. Web Interface Not Loading
**Problem**: Blank page or loading errors
**Solution**:
1. Check browser console for errors (F12)
2. Verify web server is running:
```bash
curl http://localhost:5000/api/status
```
3. Clear browser cache and cookies
4. Try incognito/private browsing mode

### Performance Optimization

#### 1. Memory Usage
For systems with limited RAM:
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 dist/index.js
```

#### 2. Startup Speed
```bash
# Pre-compile TypeScript for faster starts
npm run build
```

#### 3. Network Optimization
- Use local network when possible
- Cache static assets
- Enable compression in production

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start dist/index.js --name cosmos-mcp
pm2 start web-server.js --name cosmos-web
pm2 save
pm2 startup
```

### Security Considerations
1. Change default authentication credentials
2. Use HTTPS in production
3. Implement rate limiting
4. Regular security updates

### Monitoring
1. Set up log monitoring
2. Configure health checks
3. Monitor API usage and costs
4. Track user analytics

## Verification Checklist

After installation, verify these components work:

- [ ] **MCP Server**: Can execute tools via command line
- [ ] **Web Interface**: Loads and authentication works
- [ ] **Next Action AI**: Generates recommendations
- [ ] **Theme Toggle**: Light/dark mode switching
- [ ] **Status Monitoring**: Shows server health
- [ ] **Claude Integration**: Tools available in Claude Desktop
- [ ] **API Endpoints**: `/api/status` and `/api/mcp` respond
- [ ] **Mobile Responsive**: Interface works on mobile devices

## Getting Help

### Documentation Resources
- Main README.md for overview
- FAQ.md for common questions
- API documentation in code comments

### Support Channels
1. Check browser console for error messages
2. Review server logs for backend issues
3. Test individual components separately
4. Contact development team with detailed error information

### Diagnostic Information
When reporting issues, include:
- Operating system and version
- Node.js version
- npm version
- Browser type and version
- Complete error messages
- Steps to reproduce the problem

---

**Installation Complete!** Your Cosmos MCP server should now be running and ready to provide AI-powered mortgage partner management recommendations.