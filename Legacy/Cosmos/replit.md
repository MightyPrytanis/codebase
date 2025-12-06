# Project Cosmos - MCP Partner Management Server

## Overview

Project Cosmos is an MCP (Model Context Protocol) server built in TypeScript that provides AI-powered partner management tools for the P360 platform. The system analyzes mortgage broker relationships, performance metrics, and compliance data to generate actionable business recommendations. It integrates with Claude Desktop through the MCP protocol and leverages OpenAI GPT-4 for intelligent analysis of partner portfolios, enabling relationship managers to make data-driven decisions about mortgage broker partnerships.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core MCP Server Framework
The application is built on the MCP TypeScript SDK, implementing a server that communicates with Claude Desktop through stdio transport. The server exposes a single primary tool `recommend_next_action` that serves as the main interface for partner analysis and recommendations.

### Service Layer Architecture
The system follows a service-oriented architecture with clear separation of concerns:

- **CosmosServer**: Main MCP server orchestrator that handles protocol communication and request routing
- **PartnerAnalyzer**: Core business logic service that coordinates partner analysis workflows
- **DataService**: Data access layer managing partner information and filtering operations
- **AIService**: OpenAI integration service for generating intelligent recommendations
- **NextActionTool**: MCP tool implementation that defines the public interface and input validation

### Data Management Strategy
Partner data is currently managed through in-memory storage using TypeScript interfaces and sample data. The system is structured to easily transition to external databases:

- **Partner Interface**: Comprehensive data model covering metrics, contact info, compliance status, and performance data
- **Sample Data**: Realistic mortgage broker data for development and testing
- **Filtering Logic**: Built-in partner segmentation by status, type, performance, and risk factors

### AI-Powered Recommendation Engine
The recommendation system uses OpenAI GPT-4 to analyze partner data and generate specific business actions:

- **Contextual Analysis**: Provides detailed partner context including performance metrics, compliance status, and relationship history
- **Structured Output**: Returns prioritized recommendations with clear categories (follow_up, risk_mitigation, opportunity, compliance, performance)
- **Business Logic**: Incorporates mortgage industry expertise for relevant, actionable suggestions

### Input Validation and Error Handling
The system uses Zod schemas for robust input validation and implements graceful error handling:

- **Type Safety**: Strong TypeScript typing throughout the application
- **Schema Validation**: Zod-based input validation for MCP tool parameters
- **Fault Tolerance**: Continues processing other partners even if individual analysis fails

## External Dependencies

### Core Framework Dependencies
- **@modelcontextprotocol/sdk**: MCP protocol implementation for Claude Desktop integration (v1.17.1)
- **TypeScript/Node.js**: Runtime environment with ES2020 target and CommonJS modules

### AI and Data Processing
- **OpenAI API**: GPT-4 integration for generating intelligent partner recommendations and business analysis
- **Zod**: Schema validation library ensuring type safety and input validation

### Development and Configuration
- **dotenv**: Environment variable management for API keys and configuration
- **ts-node**: TypeScript execution for development workflow

### Optional Peer Dependencies
- **ws**: WebSocket support for potential real-time features
- **zod**: Peer dependency for OpenAI SDK schema validation

The architecture is designed for easy extension to include database integration (Drizzle ORM ready), additional AI providers, and enhanced real-time capabilities as the system scales.

## Recent Changes

### Deployment Configuration Fixes (August 2, 2025)
- **Fixed deployment health checks**: Added proper health check endpoints at `/` and `/health` that respond correctly to deployment systems
- **Corrected web server binding**: Ensured web server binds to `0.0.0.0:5000` for proper deployment accessibility
- **Enhanced health check logic**: `/` endpoint intelligently detects health check requests vs regular user requests
- **Created deployment scripts**: Added `start.js` and `deploy.sh` for production deployment scenarios
- **Verified MCP API functionality**: Confirmed that `/api/mcp` endpoint properly integrates with the MCP server
- **Fixed .replit deployment configuration**: Added proper `run` and `build` commands to deployment section for successful cloud deployment
- **Fixed web UI health check conflict**: Corrected health check detection logic to prevent browser requests from showing "OK" instead of the dashboard interface
- **Updated branding and design**: Created flying saucer and stars SVG logo, enhanced emerald green color scheme, updated all branding to "P360 Enhancements Dashboard", removed all Surge references for security
- **Redesigned logo to be simpler, flatter, and more pictographic**: Used white color for better contrast against blue/green background
- **Enhanced logo with depth and sizing**: Added curved arc for 3D effect, increased size to 40px, created standalone SVG versions for app listings
- **Added movement dynamics**: Applied -8 degree tilt to saucer to indicate lateral movement and ascension

### August 2, 2025 - Security and Integration Updates
- **MCP Server Configuration**: Confirmed server name as "project-cosmos" for internal use, "cosmos" for Claude Desktop integration
- **Hosted Service Model**: Updated all documentation to point users to hosted Cosmos server (no local installation required)
- **Updated Integration Instructions**: Added 4-step Claude Desktop setup guide with collapsible JSON configuration pointing to hosted service
- **Enhanced Security**: Implemented environment-based authentication options, hidden actual contact details
- **Contact Information**: Replaced personal details with secure P360 platform contacts

### August 2, 2025 - Comprehensive Dashboard Enhancement
- **Achievement**: Transformed basic web interface into full-featured Cosmos dashboard
- **Implementation**: 
  - Built comprehensive dashboard with widget-based architecture similar to Compass
  - Implemented authentication system with demo credentials (demo/cosmos2025)
  - Added light/dark theme toggle with full readability compliance
  - Created active Next Action AI widget with full MCP integration
  - Added 5 "Coming Soon" widgets (Competitor Tracker, Analytics Module, License Alert, Dynamic Email Generator, Broker Passport)
  - Implemented complete documentation suite (README.md, INSTALL.md, FAQ.md)
  - Enhanced branding with "Cosmos - P360 Enhancements Dashboard"
  - Built tutorial/onboarding system with animated guidance
  - Added real-time status monitoring and MCP server integration
  - Created API endpoints for seamless tool requests and responses
  - Ensured mobile responsiveness and accessibility compliance
- **Status**: ✅ Full-featured Cosmos dashboard operational
- **Features**: Authentication, themes, AI recommendations, status monitoring, documentation
- **Claude Integration**: MCP server configuration file provided for Claude Desktop setup

### August 2, 2025 - Fixed Application Startup Issues
- **Issue**: App failed to start due to incorrect MCP SDK package name and TypeScript configuration
- **Resolution**: 
  - Corrected MCP SDK package from `@modelcontextprotocol/sdk-typescript` to `@modelcontextprotocol/sdk`
  - Fixed TypeScript module configuration from ES2020 to CommonJS for compatibility
  - Replaced `import.meta` usage with `require.main` check for CommonJS
  - Updated import paths to use correct MCP SDK structure
- **Status**: ✅ Project Cosmos MCP Server running successfully
- **Available Tools**: `recommend_next_action` tool active and ready
- **Workflows**: Both production server (`node dist/index.js`) and development server (`nodemon ts-node`) configured