# replit.md

## Overview
"Swim Meet" is a sophisticated AI orchestration platform built with React, Express, and PostgreSQL, designed to enable simultaneous querying of multiple AI services with advanced response management capabilities. The platform features an aquatic/natatorium design theme and supports 8 AI providers: OpenAI, Anthropic, Google, Microsoft, Perplexity, DeepSeek, Grok, and Llama. Its business vision includes providing a robust, enterprise-grade platform for AI interaction, collaboration, and fact-checking, with a focus on data persistence, security, and user sovereignty.

## User Preferences
Preferred communication style: Simple, everyday language.
**CRITICAL REQUIREMENT**: 100% truth-based functionality - never simulate, fake, or claim capabilities that don't exist. User demands complete honesty about what works vs what's broken.
**COST OPTIMIZATION**: Minimize API calls during testing - reduce polling frequency and only test connections when necessary to avoid unnecessary charges.
**PROVIDER FOCUS**: Microsoft Copilot and Llama testing disabled due to external API issues - focusing on working providers (OpenAI, Claude, Gemini, Perplexity).
**COMMUNICATION PREFERENCE**: User values steady, measurable progress over hype or promotional language. Focus on factual status updates and concrete functionality verification.
**TYPOGRAPHY PREFERENCE**: User dislikes dated-looking fonts (late 90s/early 2000s style, Mac 1996 appearance). Prefers modern, readable system fonts that don't look ancient. Needs larger text for readability (user is 50) but not jumbo senior size - something sophisticated and clear.
**PLATFORM INDEPENDENCE PRIORITY**: User strongly prefers maximum portability with zero Replit dependencies. All solutions should be deployable on any server without proprietary tie-ins. CRITICAL: User explicitly rejects Replit object storage as it violates sovereignty principles - costs extra and creates vendor lock-in. SOLUTION: Must implement local filesystem storage with user-owned cloud storage integration (Google Drive, Dropbox, OneDrive, iCloud) providing enterprise capabilities with complete user data sovereignty.
**DATA PERSISTENCE REQUIREMENT**: User needs to access EEOC work and other conversations days/weeks/months later. All data must persist in database, not memory.
**SECURITY PRIORITY**: User emphasizes proper authentication and security for production deployment on Cosmos/LexFiat platforms. Prefers simple, stable solutions over complex implementations.

## System Architecture

### UI/UX Decisions
The platform features a sophisticated luxe aesthetic with a refined color balance (cement gray, lighter asphalt), professional typography (SF Pro Display), and sharp right angles (all rounded corners removed). It incorporates subtle gradients, minimal 3D hover effects, and texture overlays. Text legibility is prioritized with maximum contrast headings and improved font weights. Distinctive mode colors (DIVE, TURN, WORK) and navigation button colors are used. The logo is a professional sans-serif design with a dynamic gradient. High-contrast text is implemented using specific color values.

### Technical Implementations
**Frontend**: Built with React and TypeScript, using Vite, shadcn/ui (on Radix UI), Tailwind CSS, React Query for server state, and Wouter for routing. Features include modular components, real-time updates via polling, and responsive design.
**Backend**: An Express.js application handling API requests, AI service integrations, and data persistence. Key aspects include a centralized AIService class, encrypted credential management, simultaneous query processing, and session management.
**Authentication & Security**: Features user registration/login with bcrypt hashing, JWT tokens for session management, protected API routes, credential encryption, environment-based configuration, and Zod for input validation. A comprehensive admin panel provides enterprise-grade user management.
**Data Persistence**: Uses PostgreSQL with Drizzle ORM to store conversations, AI responses, statistics, and user data. This includes local filesystem storage for file uploads and integration with user-owned cloud storage for enhanced data sovereignty.
**Advanced AI Features**:
- **DIVE Mode**: Real-time multi-AI querying.
- **TURN Mode Verification**: AI-to-AI fact-checking with accuracy scores and attached file context.
- **WORK Mode Collaboration**: Sequential AI collaboration with authentic handoffs between different AI models.
- **Feedback Systems**: Thumbs up/down rating system, "Report Fabrication" mechanism, and "TURN Validate" on all outputs.
- **Content Clearing**: Functionality to clear query text, responses, attached files, and conversation ID.

### System Design Choices
The system prioritizes maximum platform independence, using standard technologies (PostgreSQL, JWT, bcrypt) with zero proprietary dependencies. It is designed for portability across any server. A persistent database schema supports all features including authentication, conversations, responses, ratings, and workflow states. Real-time connection status verification for AI providers is integrated.

## External Dependencies

### Database
- **PostgreSQL**: Primary database (Neon Database serverless Postgres)
- **Drizzle ORM**: Type-safe database queries and schema management
- **@neondatabase/serverless**: Connection pooling driver

### AI Services
- **OpenAI API**: GPT-4o model via `@openai/api`
- **Anthropic API**: Claude model via `@anthropic-ai/sdk`
- **Google Gemini**: Via `@google/genai`
- **Microsoft Copilot**: Via RapidAPI proxy service
- **Perplexity**: Via Perplexity API
- **Grok (xAI)**: Via xAI API
- **DeepSeek**: Placeholder for future integration
- **Llama**: Via RapidAPI proxy

### UI Framework
- **shadcn/ui**: Component library built on Radix UI
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Fast build tool
- **ESBuild**: Production bundling
- **TypeScript**: Type safety

### Authentication & Session Management
- **connect-pg-simple**: PostgreSQL session store
- **Express Session**: Server-side session management

### Utilities
- **date-fns**: Date manipulation
- **zod**: Runtime type validation
- **clsx/twMerge**: Conditional CSS class management