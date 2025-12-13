---
Document ID: DEPLOYMENT-CHECKLIST
Title: LexFiat Deployment Checklist
Subject(s): LexFiat
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

- [ ] All TypeScript compilation errors resolved
- [ ] No console errors in browser dev tools
- [ ] All components render properly
- [ ] Demo mode functionality working
- [ ] Logo and branding consistent throughout

### ✅ Environment Configuration
- [ ] `DATABASE_URL` configured
- [ ] `ANTHROPIC_API_KEY` set (required for core functionality)
- [ ] Optional AI keys configured if needed:
  - [ ] `GEMINI_API_KEY`
  - [ ] `OPENAI_API_KEY`
  - [ ] `XAI_API_KEY`
- [ ] Object storage variables set:
  - [ ] `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
  - [ ] `PRIVATE_OBJECT_DIR`
  - [ ] `PUBLIC_OBJECT_SEARCH_PATHS`

### ✅ Database
- [ ] Database schema up to date (`npm run db:push`)
- [ ] Database connection successful
- [ ] Demo data loads correctly
- [ ] Session storage working

### ✅ Functionality Testing
- [ ] Dashboard loads and displays data
- [ ] Demo mode creates realistic scenarios
- [ ] AI provider setup interface works
- [ ] Logo showcase page accessible
- [ ] Settings page functional
- [ ] Navigation between pages works
- [ ] Responsive design on mobile devices

# LexFiat Deployment Checklist

This checklist provides comprehensive deployment instructions for multiple platform options.

## Pre-Deployment Requirements

### System Requirements
- [ ] Node.js 18+ installed
- [ ] PostgreSQL database available
- [ ] SSL certificate capability
- [ ] Domain name configured (lexfiat.org)

### Environment Setup
- [ ] Clone repository: `git clone <repository-url>`
- [ ] Copy `.env.example` to `.env`
- [ ] Configure all required environment variables:
  - [ ] Database connection (DATABASE_URL)
  - [ ] Anthropic API key (ANTHROPIC_API_KEY) - Required
  - [ ] Optional AI providers (GEMINI_API_KEY, OPENAI_API_KEY)
  - [ ] File storage paths (PUBLIC_OBJECT_SEARCH_PATHS, PRIVATE_OBJECT_DIR)

## Deployment Options

Choose one deployment method based on your infrastructure preferences:

## Option 1: Docker Deployment (Recommended)

### Step 1: Docker Setup
1. [ ] Install Docker and Docker Compose
2. [ ] Configure `.env` file with production values
3. [ ] Build and start services:
   ```bash
   docker-compose up -d
   ```
4. [ ] Verify containers are running:
   ```bash
   docker-compose ps
   ```

### Step 2: Database Migration
1. [ ] Run database migrations:
   ```bash
   docker-compose exec lexfiat npm run db:push
   ```
2. [ ] Verify database connection and tables

### Step 3: Custom Domain Setup (lexfiat.org)
1. [ ] Configure reverse proxy (nginx/Apache) to point to container
2. [ ] Set up SSL certificate with Let's Encrypt:
   ```bash
   certbot --nginx -d lexfiat.org
   ```
3. [ ] Configure DNS A record to point to your server IP
4. [ ] Test HTTPS access at lexfiat.org

## Option 2: Traditional VPS Deployment

### Step 1: Server Setup
1. [ ] Install Node.js 18+ on your server
2. [ ] Install PostgreSQL or configure remote database
3. [ ] Install PM2 for process management:
   ```bash
   npm install -g pm2
   ```

### Step 2: Application Deployment
1. [ ] Clone repository to server
2. [ ] Install dependencies:
   ```bash
   npm install
   ```
3. [ ] Build application:
   ```bash
   npm run build
   ```
4. [ ] Configure production environment variables
5. [ ] Start application with PM2:
   ```bash
   pm2 start dist/server/index.js --name lexfiat
   pm2 save
   pm2 startup
   ```

### Step 3: Reverse Proxy and SSL
1. [ ] Install and configure nginx:
   ```nginx
   server {
       listen 80;
       server_name lexfiat.org;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
2. [ ] Install SSL certificate with Let's Encrypt
3. [ ] Configure DNS A record

## Option 3: Platform-as-a-Service (PaaS)

### Heroku Deployment
1. [ ] Install Heroku CLI
2. [ ] Create Heroku app:
   ```bash
   heroku create lexfiat
   ```
3. [ ] Configure environment variables:
   ```bash
   heroku config:set DATABASE_URL=postgresql://...
   heroku config:set ANTHROPIC_API_KEY=sk-ant-...
   ```
4. [ ] Deploy application:
   ```bash
   git push heroku main
   ```
5. [ ] Configure custom domain:
   ```bash
   heroku domains:add lexfiat.org
   ```

### Railway Deployment
1. [ ] Connect GitHub repository to Railway
2. [ ] Configure environment variables in Railway dashboard
3. [ ] Deploy automatically on git push
4. [ ] Configure custom domain in Railway settings

### DigitalOcean App Platform
1. [ ] Create app from GitHub repository
2. [ ] Configure environment variables
3. [ ] Set up managed PostgreSQL database
4. [ ] Configure custom domain

## DNS Configuration

For all deployment options, configure DNS at your domain registrar:

1. [ ] Log into domain registrar account
2. [ ] Navigate to DNS management section  
3. [ ] Add A record:
   - Host: `@` (or blank)
   - Value: `<YOUR_SERVER_IP>`
   - TTL: 3600
4. [ ] Add CNAME record (optional):
   - Host: `www`
   - Value: `lexfiat.org`
   - TTL: 3600
5. [ ] Save DNS changes
6. [ ] Wait for propagation (5 minutes to 48 hours)

### Step 5: Post-Deployment Testing
1. [ ] Access site at lexfiat.org
2. [ ] Test all major functionality:
   - [ ] Dashboard loads
   - [ ] Demo mode works
   - [ ] AI providers connect
   - [ ] Database operations succeed
   - [ ] Logo and branding display correctly
3. [ ] Test on multiple browsers
4. [ ] Test responsive design on mobile

## Domain Propagation Verification

### Tools to Check DNS Propagation
- [ ] Check with: whatsmydns.net
- [ ] Verify A record points to correct IP
- [ ] Verify TXT record exists
- [ ] Test from multiple geographic locations

### Expected Timeline
- **Immediate**: DNS changes saved at registrar
- **5-15 minutes**: Most locations see changes
- **1-4 hours**: Majority of global DNS servers updated
- **24-48 hours**: Complete global propagation

## Production Environment Checklist

### ✅ Performance
- [ ] Page load times under 3 seconds
- [ ] API responses under 1 second
- [ ] Database queries optimized
- [ ] Images and assets optimized

### ✅ Security
- [ ] All API keys in environment variables
- [ ] No sensitive data in client-side code
- [ ] HTTPS enforced
- [ ] Session security configured

### ✅ Monitoring
- [ ] Error logging in place
- [ ] Database connection monitoring
- [ ] API rate limiting considered
- [ ] Backup strategy defined

## Rollback Plan

### If Deployment Fails
1. [ ] Check application logs (docker logs, pm2 logs, or platform logs)
2. [ ] Verify environment variables are correctly set
3. [ ] Test database connection and credentials
4. [ ] Review code for recent changes
5. [ ] Contact hosting provider support if infrastructure issue

### If Custom Domain Fails
1. [ ] Verify DNS records are correct using dig or nslookup
2. [ ] Check domain registrar settings
3. [ ] Wait additional time for DNS propagation
4. [ ] Test with DNS lookup tools (whatsmydns.net)
5. [ ] Use temporary domain/IP as fallback

## Post-Launch Tasks

### ✅ Documentation
- [ ] Update README with production URL
- [ ] Document any deployment-specific configurations
- [ ] Share access credentials securely
- [ ] Provide maintenance instructions

### ✅ Handoff to New Developer
- [ ] Share repository access
- [ ] Transfer hosting platform ownership/access
- [ ] Provide environment variable values
- [ ] Share domain registrar access
- [ ] Complete knowledge transfer session

### ✅ Monitoring Setup
- [ ] Set up uptime monitoring
- [ ] Configure error alerts
- [ ] Establish backup procedures
- [ ] Document maintenance schedule

## Emergency Contacts

### Technical Support
- **Hosting Platform Support**: [Your hosting provider support]
- **Anthropic API Issues**: support@anthropic.com
- **Domain Registrar**: [Contact info for lexfiat.org registrar]

### Project Stakeholders
- **Client**: Mekel Miller, Esq.
- **Domain**: lexfiat.org
- **Primary Contact**: [Contact information]

---

**Deployment Date**: _____
**Deployed By**: _____
**Production URL**: https://lexfiat.org
**Fallback URL**: [Development/staging URL]

## Final Verification

- [ ] Application accessible at lexfiat.org
- [ ] All functionality working as expected
- [ ] Performance meets requirements
- [ ] Security measures in place
- [ ] Documentation complete
- [ ] Handoff materials prepared

**Deployment Status**: ⬜ Complete ⬜ Issues Found ⬜ Rollback Required

**Notes**: 
_________________________________
_________________________________
_________________________________