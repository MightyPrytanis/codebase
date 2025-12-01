---
Document ID: FREE-HOSTING-GUIDE
Title: Free Hosting Guide for Cyrano AI Orchestration Platform
Subject(s): Cyrano
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

## 🎯 Quick Start Options

### Option 1: Railway (Recommended for Full Stack)
**Best for**: Complete deployment with database included
**Free Tier**: 500 hours/month, 1GB RAM, 1GB storage

#### Step-by-Step Railway Deployment:
1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub
2. **Connect Repository**: Click "New Project" → "Deploy from GitHub repo" → Select your Cyrano repo
3. **Add Database**: Click "Add Plugin" → "PostgreSQL" → Railway auto-creates DATABASE_URL
4. **Configure Environment Variables**:
   ```bash
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GEMINI_API_KEY=...
   PERPLEXITY_API_KEY=pplx-...
   SESSION_SECRET=your-random-secret-key
   # DATABASE_URL is auto-configured by Railway
   ```
5. **Deploy**: Railway automatically builds and deploys
6. **Custom Domain**: Add custom domain in Railway dashboard (optional)

**Pros**: Zero configuration database, automatic HTTPS, great for full-stack apps
**Cons**: Limited free hours, can get expensive if you exceed limits

---

### Option 2: Render (Reliable Free Tier)
**Best for**: Production-ready free hosting
**Free Tier**: Unlimited hours, sleeps after 15min inactivity

#### Step-by-Step Render Deployment:
1. **Database Setup**: 
   - Sign up at [render.com](https://render.com)
   - Create "PostgreSQL" service (free tier available)
   - Note the connection string
2. **Backend Deployment**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Add environment variables (same as Railway above)
3. **Frontend (Optional Static Site)**:
   - Create separate "Static Site" service
   - Build Command: `npm run build`
   - Publish Directory: `dist/public`

**Pros**: Reliable uptime, good free tier, PostgreSQL included
**Cons**: Cold start delays, limited simultaneous builds

---

### Option 3: Vercel + Serverless Backend
**Best for**: Blazing fast frontend with edge functions
**Free Tier**: Generous limits, global CDN

#### Step-by-Step Vercel Deployment:
1. **Database**: Use [Neon](https://neon.tech) for free PostgreSQL
   - Sign up at neon.tech → Create database → Get connection string
2. **Frontend + API Deployment**:
   - Install Vercel CLI: `npm i -g vercel`
   - In your project: `vercel`
   - Add environment variables in Vercel dashboard
3. **Convert to Vercel Functions**: Create `/api` directory and convert Express routes

**Configuration needed**: 
```javascript
// vercel.json
{
  "builds": [
    { "src": "server/index.ts", "use": "@vercel/node" },
    { "src": "client/**", "use": "@vercel/static-build" }
  ]
}
```

**Pros**: Excellent performance, global CDN, generous free tier
**Cons**: Requires code restructuring for serverless functions

---

### Option 4: Fly.io (Docker-Based)
**Best for**: Full control with Docker containers
**Free Tier**: 160GB bandwidth, 3 shared CPU VMs

#### Step-by-Step Fly.io Deployment:
1. **Install CLI**: `curl -L https://fly.io/install.sh | sh`
2. **Login**: `fly auth login`
3. **Initialize**: `fly launch` (creates fly.toml)
4. **Add PostgreSQL**: `fly postgres create`
5. **Deploy**: `fly deploy`

**Dockerfile** (create in root):
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

**Pros**: Full Docker support, persistent storage, good free tier
**Cons**: Requires Docker knowledge

---

### Option 5: Supabase + Netlify
**Best for**: JAMstack approach with real-time features
**Free Tier**: Both platforms offer generous free tiers

#### Step-by-Step Deployment:
1. **Database**: [Supabase](https://supabase.com)
   - Create project → Get connection string
   - Optional: Use Supabase auth instead of custom JWT
2. **Frontend**: [Netlify](https://netlify.com)
   - Connect GitHub repo
   - Build command: `npm run build`
   - Publish directory: `dist/public`
3. **Backend**: Deploy as Netlify Functions or separate service on Render

**Pros**: Great for static sites, real-time capabilities, good free tiers
**Cons**: May require architecture changes

---

## 🗄️ Free Database Options

### 1. Neon (Recommended)
- **Tier**: 500MB free, serverless PostgreSQL
- **URL**: [neon.tech](https://neon.tech)
- **Pros**: True serverless, scales to zero, excellent for development

### 2. Supabase
- **Tier**: 500MB free, real-time features
- **URL**: [supabase.com](https://supabase.com)
- **Pros**: Real-time subscriptions, built-in auth, dashboard

### 3. Railway PostgreSQL
- **Tier**: 1GB free with Railway account
- **Pros**: Integrated with hosting platform

### 4. Aiven
- **Tier**: 1 month free trial, then paid
- **URL**: [aiven.io](https://aiven.io)
- **Pros**: Professional grade, multiple cloud providers

---

## 📁 File Storage Solutions

### Current Implementation
The platform uses local filesystem storage at `./uploads/`. For production:

### 1. Cloudinary (Recommended)
```javascript
// Add to environment variables
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```
- **Free Tier**: 25GB storage, 25GB bandwidth/month
- **Pros**: Image transformations, CDN, easy integration

### 2. AWS S3 (via Uppy integration ready)
- **Free Tier**: 5GB storage, 20,000 GET requests
- **Setup**: Already configured in package.json with `@uppy/aws-s3`

### 3. Google Cloud Storage
- **Free Tier**: 5GB storage
- **Integration**: Use `@google-cloud/storage` (already in dependencies)

---

## 🚀 One-Click Deploy Templates

### Railway Template
Create `railway.json`:
```json
{
  "build": {
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Render Blueprint
Create `render.yaml`:
```yaml
services:
- type: web
  name: cyrano-api
  env: node
  buildCommand: npm run build
  startCommand: npm start
  envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: cyrano-db
      property: connectionString
databases:
- name: cyrano-db
  databaseName: cyrano
```

---

## 🔒 Environment Configuration

Create `.env.production`:
```bash
# Database
DATABASE_URL=postgresql://username:password@host:5432/database

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
PERPLEXITY_API_KEY=pplx-...

# Security
SESSION_SECRET=your-very-secure-random-string
JWT_SECRET=another-secure-random-string

# File Storage (choose one)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret

# Optional: Additional AI providers
XAI_API_KEY=...
DEEPSEEK_API_KEY=...
```

---

## 📊 Monitoring & Health Checks

### Simple Health Check Endpoint
Add to your Express server:
```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});
```

### Uptime Monitoring (Free)
1. **UptimeRobot**: 50 monitors free
2. **StatusCake**: 10 uptime tests free
3. **Pingdom**: 1 check free

---

## 💡 Cost Optimization Tips

1. **Use serverless where possible** - Vercel, Netlify Functions scale to zero
2. **Optimize AI API calls** - Cache responses, implement rate limiting
3. **Use CDN for assets** - Cloudinary, Vercel Edge Network
4. **Monitor usage** - Set up alerts for approaching limits
5. **Database optimization** - Use connection pooling, optimize queries

---

## 🛡️ Security Checklist for Production

- [ ] Use HTTPS everywhere (all platforms provide this free)
- [ ] Set secure environment variables
- [ ] Enable CORS properly
- [ ] Use rate limiting for AI endpoints
- [ ] Secure file upload validation
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Backup database regularly

---

## 🚦 Getting Started - Quickest Path

**For beginners**: Use Railway
**For developers**: Use Render + Neon
**For performance**: Use Vercel + Neon
**For full control**: Use Fly.io

### 5-Minute Quickstart (Railway):
1. Push your code to GitHub
2. Sign up at railway.app
3. Click "Deploy from GitHub"
4. Add PostgreSQL plugin
5. Add your AI API keys
6. Deploy! 🚀

Your AI orchestration platform will be live and accessible within minutes.