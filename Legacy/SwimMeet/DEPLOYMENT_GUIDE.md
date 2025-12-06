# SwimMeet Deployment Guide

## Quick Start
1. **Install dependencies**: `npm install`
2. **Set environment variables** (see .env.example)
3. **Setup database**: `npm run db:push`
4. **Start development**: `npm run dev`
5. **Build for production**: `npm run build`

## Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Required variables:
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="..."
PERPLEXITY_API_KEY="pplx-..."
SESSION_SECRET="your-secret-key"
```

## Database Migration
```bash
# Push schema to database
npm run db:push

# Generate migrations (if needed)
npm run db:generate
```

## Production Deployment

### Option 1: Node.js Server
```bash
npm run build
npm start
```

### Option 2: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Option 3: Static + Serverless
- Frontend: Deploy `dist/public/` to any static host
- Backend: Deploy `dist/index.js` to serverless platform

## File Storage Configuration
Currently using local filesystem at `./uploads/`

For production, configure cloud storage:
1. Update `server/services/local-storage.ts`
2. Add cloud provider credentials
3. Update file paths in frontend

## Security Checklist
- [ ] Use HTTPS in production
- [ ] Set secure session cookies
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Set up database connection pooling
- [ ] Configure rate limiting

## Monitoring
- API response times logged
- Database query performance tracked
- AI provider connection status monitored
- User authentication events logged

## Backup Strategy
- Database: Regular PostgreSQL backups
- Files: Backup upload directory
- Environment: Secure credential storage
- Code: Version control with git

## Performance Optimization
- Frontend: Vite optimized build
- Backend: Express with compression
- Database: Indexed queries via Drizzle
- Caching: React Query for API responses

## Troubleshooting
- Check logs: `npm run dev` shows all errors
- Database: Verify connection string
- AI APIs: Check provider status and keys
- File uploads: Verify directory permissions