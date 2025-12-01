---
Document ID: QUICK-START
Title: 🚀 Quick Start - Deploy Cyrano AI Platform
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

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/cyrano-ai-platform)
- ✅ Free PostgreSQL database included
- ✅ Automatic HTTPS
- ✅ 500 hours/month free

### 🎨 Render (Most Reliable)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
- ✅ Never sleeps on paid plan
- ✅ Free PostgreSQL
- ✅ Excellent uptime

### ⚡ Vercel (Fastest)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MightyPrytanis/Cyrano)
- ✅ Global CDN
- ✅ Edge functions
- ✅ Instant deployments

### 🪂 Fly.io (Full Control)
```bash
# Install Fly CLI and deploy
curl -L https://fly.io/install.sh | sh
flyctl launch
```

---

## 🔧 Manual Setup (5 minutes)

### 1. Choose Your Stack

**Easiest**: Railway (database + hosting)
**Best Performance**: Vercel + Neon database
**Most Control**: Fly.io + PostgreSQL

### 2. Get API Keys

You'll need these AI provider keys:
- [OpenAI](https://platform.openai.com/api-keys) (Required)
- [Anthropic](https://console.anthropic.com/) (Required) 
- [Google Gemini](https://makersuite.google.com/app/apikey) (Required)
- [Perplexity](https://www.perplexity.ai/settings/api) (Required)

### 3. Deploy with Script

```bash
# Clone repository
git clone https://github.com/MightyPrytanis/Cyrano.git
cd Cyrano

# Run deployment script
./deploy.sh railway  # or render, vercel, fly, docker
```

### 4. Configure Environment

After deployment, add your API keys in the hosting platform dashboard:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY` 
- `GEMINI_API_KEY`
- `PERPLEXITY_API_KEY`

---

## 🗄️ Database Options

All platforms include free PostgreSQL options:

| Platform | Database | Free Tier |
|----------|----------|-----------|
| Railway | PostgreSQL | 1GB |
| Render | PostgreSQL | 1GB |
| Neon | Serverless PostgreSQL | 500MB |
| Supabase | PostgreSQL + Auth | 500MB |

---

## 📁 File Storage

Choose one of these free options:

- **Cloudinary**: 25GB free, image transformations
- **AWS S3**: 5GB free, industry standard  
- **Google Cloud**: 5GB free, integrated with AI services

---

## 🎯 What You Get

After deployment, your AI platform includes:

- 🤖 **DIVE Mode**: Query multiple AI providers simultaneously
- 🔍 **TURN Mode**: AI-to-AI fact-checking with 4 escalation levels
- 👥 **WORK Mode**: AI collaboration workflows
- 📊 **Analytics**: Response tracking and statistics
- 🔐 **Authentication**: Secure user management
- 📁 **File Uploads**: Document processing capabilities
- ⭐ **Rating System**: Response quality tracking

---

## 🆘 Need Help?

1. **Check the logs** in your hosting platform dashboard
2. **Verify environment variables** are set correctly
3. **Test database connection** with the health check endpoint
4. **Review** the detailed [FREE_HOSTING_GUIDE.md](FREE_HOSTING_GUIDE.md)

## 📚 Full Documentation

- [FREE_HOSTING_GUIDE.md](FREE_HOSTING_GUIDE.md) - Detailed hosting options
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment
- [TRANSFER_PACKAGE.md](TRANSFER_PACKAGE.md) - Architecture overview

---

**⚡ Get up and running in under 5 minutes with Railway!**