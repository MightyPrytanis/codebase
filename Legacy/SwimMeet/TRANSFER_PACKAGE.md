# SwimMeet AI Orchestration Platform - Transfer Package

## Project Overview
SwimMeet is a sophisticated AI orchestration platform built with React, Express, and PostgreSQL, designed to enable simultaneous querying of multiple AI services with advanced response management capabilities. The platform features an aquatic/natatorium design theme and supports 8 AI providers: OpenAI, Anthropic, Google, Microsoft, Perplexity, DeepSeek, Grok, and Llama.

## Business Vision
Provides a robust, enterprise-grade platform for AI interaction, collaboration, and fact-checking, with a focus on data persistence, security, and user sovereignty.

## Architecture Summary

### Frontend Stack
- **React 18** with TypeScript
- **Vite** build system
- **shadcn/ui** component library (built on Radix UI)
- **Tailwind CSS** for styling
- **React Query** for server state management
- **Wouter** for routing
- **Lucide React** for icons

### Backend Stack
- **Express.js** with TypeScript
- **PostgreSQL** database (Neon serverless)
- **Drizzle ORM** for database operations
- **JWT** authentication with bcrypt
- **Session management** with express-session

### Key Features Implemented

#### 1. DIVE Mode - Multi-AI Querying
- Real-time simultaneous queries to multiple AI providers
- Response comparison and analysis
- Status indicators for AI connections

#### 2. TURN Mode - AI-to-AI Verification
- **Four escalation levels:**
  - Conversation (💬): Standard fact-checking
  - Examination (🔍): Thorough skeptical review
  - Adjudication (⚖️): Adversarial challenge mode
  - Inquisition (🔥🔗): Burning stake trial with fabrication presumption
- AI agents fact-check each other's responses
- Escalation-specific verification prompts

#### 3. WORK Mode - AI Collaboration
- Sequential AI collaboration
- Authentic handoffs between different AI models
- Refinement and synthesis capabilities

#### 4. Advanced Features
- **Award System**: Thumbs up/down rating with "Report Fabrication"
- **File Storage**: Local filesystem implementation (primary)
- **Cloud Storage**: UI framework for future vendor integrations
- **Statistics Tracking**: Comprehensive response analytics
- **User Authentication**: Complete registration/login system
- **Admin Panel**: Enterprise-grade user management

### Database Schema
Located in `shared/schema.ts`:
- **Users**: Authentication and profile data
- **Conversations**: Chat session management
- **AI Responses**: Complete response tracking
- **Statistics**: Performance metrics
- **Sessions**: Secure session storage

### AI Provider Integration
Connected and working:
- OpenAI (GPT-4)
- Anthropic (Claude 4)
- Google (Gemini Pro)
- Perplexity

Setup required:
- DeepSeek
- Grok (xAI)
- Mistral AI

### File Storage System
- **Primary**: Local filesystem (`server/services/local-storage.ts`)
- **Future**: Cloud provider integrations (UI ready, marked "In Development")
- **Upload handling**: Complete backend routes and services

### Security Implementation
- **Password hashing**: bcrypt
- **JWT tokens**: Secure session management
- **Protected routes**: Authentication middleware
- **Input validation**: Zod schemas
- **Environment configuration**: Secure credential management

## Current State

### Working Features
✅ User authentication and registration
✅ Multi-AI provider querying (DIVE mode)
✅ AI-to-AI verification with escalation levels (TURN mode)
✅ File upload and local storage
✅ Response rating and award system
✅ Conversation history and statistics
✅ Real-time provider connection testing
✅ Professional UI with aquatic theme
✅ Complete database persistence

### In Development
🚧 Cloud storage provider integrations
🚧 Advanced WORK mode collaboration features
🚧 Additional AI provider connections (DeepSeek, Grok, Mistral)

## Technical Architecture

### File Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and API client
├── server/                # Express backend
│   ├── routes.ts          # API route definitions
│   ├── services/          # Business logic services
│   └── index.ts           # Server entry point
├── shared/                # Shared TypeScript types
│   └── schema.ts          # Database schema and types
├── public/                # Static assets
└── attached_assets/       # User uploaded files
```

### Environment Variables Required
```
DATABASE_URL=              # PostgreSQL connection string
OPENAI_API_KEY=           # OpenAI API key
ANTHROPIC_API_KEY=        # Anthropic API key
GEMINI_API_KEY=           # Google Gemini API key
PERPLEXITY_API_KEY=       # Perplexity API key
XAI_API_KEY=              # xAI Grok API key (optional)
SESSION_SECRET=           # Session encryption key
```

### Database Setup
1. PostgreSQL database (Neon recommended)
2. Run migrations: `npm run db:push`
3. Tables will be created automatically via Drizzle

### Deployment Instructions
1. **Frontend**: Built with `npm run build` → static files in `dist/public/`
2. **Backend**: Compiled with esbuild → `dist/index.js`
3. **Database**: PostgreSQL with connection pooling
4. **Files**: Local filesystem or cloud storage integration

## User Sovereignty Features
- **Local file storage**: No vendor lock-in for file uploads
- **Database export**: Full data portability
- **Standard technologies**: PostgreSQL, JWT, bcrypt (no proprietary dependencies)
- **Cloud integration ready**: Support for user-owned cloud storage

## Key User Preferences
- **Truth-focused**: 100% authentic functionality, no simulation
- **Cost-conscious**: Minimal API calls during testing
- **Platform independence**: Maximum portability, zero proprietary dependencies
- **Data persistence**: All conversations and data stored in database
- **Modern typography**: Professional, readable fonts (not dated 90s style)
- **Security priority**: Proper authentication for production deployment

## Recent Development
- ✅ Complete logo update with SwimMeet branding
- ✅ Local file storage system implementation
- ✅ TURN escalation system with burning stake inquisition mode
- ✅ Cloud storage UI framework (providers greyed out as "In Development")
- ✅ Fixed component errors and LSP diagnostics

## Transfer Checklist
- [ ] Database export/backup
- [ ] Environment variable documentation
- [ ] API key management transfer
- [ ] File storage migration plan
- [ ] Deployment configuration
- [ ] User data export
- [ ] Documentation review

## Contact for Technical Questions
All technical implementation details are documented in:
- `replit.md` - Project architecture and decisions
- `ARCHIVE_SUMMARY.md` - Development history
- Individual component files with inline documentation

The codebase is production-ready with enterprise-grade authentication, data persistence, and scalable architecture.