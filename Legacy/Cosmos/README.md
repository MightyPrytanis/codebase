# Cosmos - P360 Enhancements Dashboard

![Cosmos Dashboard](https://img.shields.io/badge/Status-Live-brightgreen)
![MCP Server](https://img.shields.io/badge/MCP-Compatible-blue)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple)

## Overview

Cosmos is the codename for a suite of AI-powered mortgage partner management tools designed for Claude Desktop integration. These tools will be rolled out to partners as part of P360 enhancements, with an intuitive web interface provided as an additional secure point of access for development, demonstration, and ease of use.

## 🚀 Quick Start

### Web Interface
1. Visit the deployed application
2. Login with demo credentials: `demo` / `cosmos2025`
3. Access the Next Action AI widget to generate recommendations
4. Explore coming soon features and documentation

### Claude Desktop Integration
1. Install Claude Desktop on your computer
2. Configure the hosted MCP server in Claude Desktop settings:
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
3. Start asking Claude for mortgage partner recommendations

## 🏗️ Architecture

### Core Components
- **MCP Server**: Model Context Protocol server for Claude Desktop integration
- **Web Dashboard**: Modern React-style interface with authentication and real-time updates
- **AI Engine**: OpenAI GPT-4 integration for intelligent recommendations
- **Partner Data**: In-memory storage with realistic mortgage broker data

### Technology Stack
- **Backend**: Node.js, TypeScript, MCP SDK
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **AI**: OpenAI GPT-4
- **Protocol**: Model Context Protocol (MCP)

## 🎯 Features

### Active Features
- **Next Action AI**: Generate AI-powered recommendations for mortgage partner management
- **Authentication**: Secure access with demo credentials
- **Dark/Light Mode**: Toggle between display themes
- **Real-time Status**: Live MCP server monitoring
- **Responsive Design**: Mobile-friendly interface

### Coming Soon
- **Competitor Tracker**: Real-time competitive analysis
- **Analytics Module**: Advanced performance analytics
- **License Alert**: Automated license expiration monitoring
- **Dynamic Email Generator**: AI-powered personalized communications
- **Broker Passport**: One-time signup for automatic lender applications

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- TypeScript compiler
- OpenAI API key (optional, falls back to mock data)

### Setup
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the MCP server
npm start

# Or run in development mode
npm run dev
```

### Environment Variables
Create a `.env` file with:
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
```

## 📚 API Documentation

### MCP Tools

#### recommend_next_action
Generate AI-powered recommendations for mortgage partner management.

**Parameters:**
- `partnerId` (string, optional): Specific partner ID to analyze
- `timeframe` (enum): Time horizon - `immediate`, `this_week`, `this_month`
- `priority` (enum): Priority filter - `urgent`, `high`, `medium`, `low`
- `category` (string): Category filter - `follow_up`, `risk_mitigation`, `opportunity`, `compliance`, `performance`
- `limit` (number): Maximum recommendations (1-20, default: 10)

**Example:**
```javascript
// Through web interface
const result = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'recommend_next_action',
    params: {
      timeframe: 'this_week',
      priority: 'high',
      limit: 5
    }
  })
});
```

### REST API Endpoints

#### GET /api/status
Returns MCP server status and health information.

#### POST /api/mcp
Executes MCP tools through web interface.

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#3b82f6`
- **Primary Purple**: `#8b5cf6`
- **Primary Green**: `#10b981`
- **Accent Colors**: Various blues, purples, and greens
- **Status Colors**: Success, warning, error, info variants

### Typography
- **Font Family**: Inter, system fonts
- **Sizes**: XS (0.75rem) to 3XL (1.875rem)
- **Weights**: 300-700

### Theme Support
- Light mode (default)
- Dark mode with full contrast compliance
- Automatic system preference detection
- Manual toggle available

## 🔐 Security

### Authentication
- Demo authentication system implemented
- Session management with localStorage
- Secure credential validation

### Data Protection
- No sensitive data stored in browser
- API communication over HTTPS
- Path traversal protection for static files

## 🧪 Testing

### Manual Testing Checklist
- [ ] Authentication flow works
- [ ] Dark/light mode toggle functions
- [ ] Next Action AI generates recommendations
- [ ] All widgets display correctly
- [ ] Status monitoring updates
- [ ] Responsive design on mobile
- [ ] Tutorial system completes

### API Testing
```bash
# Test MCP server directly
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node dist/index.js

# Test web API
curl -X POST http://localhost:5000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"tool": "recommend_next_action", "params": {"limit": 3}}'
```

## 📖 User Guide

### Getting Started
1. **Access the Dashboard**: Navigate to the web interface and authenticate
2. **Explore Widgets**: Review available tools and coming soon features
3. **Generate Recommendations**: Use Next Action AI with various filters
4. **Toggle Themes**: Switch between light and dark modes for comfort
5. **View Tutorial**: Complete the interactive onboarding experience

### Best Practices
- Use specific partner IDs for targeted analysis
- Apply appropriate timeframes for actionable results
- Filter by priority for urgent attention items
- Review recommendations regularly for optimal performance

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit pull request with detailed description

### Code Standards
- TypeScript strict mode enabled
- ES2020 target with CommonJS modules
- Consistent formatting and naming conventions
- Comprehensive error handling

## 📝 License

This project is proprietary software developed for Surge Solutions Partner 360 platform.

## 🆘 Support

### Common Issues
- **MCP Server Won't Start**: Check Node.js version and dependencies
- **Authentication Fails**: Verify demo credentials (demo/cosmos2025)
- **API Errors**: Check network connectivity and MCP server status
- **UI Not Loading**: Clear browser cache and check console errors

### Getting Help
- Check the FAQ section in the web interface
- Review logs in browser developer tools
- Verify MCP server status in dashboard
- Contact development team for additional support

### Contact the Development Team
📧 **Email**: [support+cosmos@p360platform.com](mailto:support+cosmos@p360platform.com)
📱 **Text/Call**: [Support Available](sms:+15551234567)

---

**Cosmos** - Transforming mortgage partner management through AI-powered insights and intelligent automation.
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)
)