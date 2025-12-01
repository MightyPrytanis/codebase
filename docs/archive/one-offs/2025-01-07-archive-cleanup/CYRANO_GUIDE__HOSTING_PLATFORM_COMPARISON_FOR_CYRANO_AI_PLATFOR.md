---
Document ID: HOSTING-COMPARISON
Title: 🏆 Hosting Platform Comparison for Cyrano AI Platform
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

| Platform | Free Tier | Database | Storage | Best For | Deployment Time |
|----------|-----------|----------|---------|----------|----------------|
| **Railway** | 500hrs/month, 1GB RAM | ✅ PostgreSQL 1GB | Local + Cloud | Beginners | 2 minutes |
| **Render** | Unlimited, sleeps | ✅ PostgreSQL 1GB | Local + Cloud | Reliability | 3 minutes |
| **Vercel** | Generous limits | ❌ Need external | Serverless | Performance | 1 minute |
| **Fly.io** | 160GB bandwidth | ❌ Need external | Persistent volumes | Developers | 5 minutes |
| **Heroku** | 550-1000hrs/month | ❌ Add-ons | Ephemeral | Enterprise | 3 minutes |

## Detailed Breakdown

### 🚂 Railway - The Beginner's Choice
**Perfect for**: First-time deployers, rapid prototyping
```bash
✅ Pros:
- Zero-config PostgreSQL included
- Automatic HTTPS certificates
- GitHub integration
- Simple environment variable management
- Built-in monitoring dashboard

❌ Cons:
- Limited to 500 hours/month on free tier
- Can be expensive once you exceed free limits
- Fewer advanced features than competitors
```

**Cost after free tier**: $5/month for Hobby plan

---

### 🎨 Render - The Reliable Choice
**Perfect for**: Production applications, always-on services
```bash
✅ Pros:
- Unlimited hours (with sleep after 15min)
- Excellent uptime and reliability
- Free PostgreSQL database
- Docker support
- Built-in SSL certificates
- Great for background services

❌ Cons:
- Cold start delays (~30 seconds)
- Limited simultaneous builds on free tier
- Less flexibility than container platforms
```

**Cost after free tier**: $7/month for always-on service

---

### ⚡ Vercel - The Performance Leader
**Perfect for**: Frontend-heavy applications, global reach
```bash
✅ Pros:
- Blazing fast global CDN
- Instant deployments
- Excellent developer experience
- Built-in analytics
- Edge functions for API routes

❌ Cons:
- Requires code restructuring for serverless
- No built-in database (need Neon/Supabase)
- Function timeout limits (10 seconds)
- More complex for full-stack apps
```

**Cost after free tier**: $20/month for Pro plan

---

### 🪂 Fly.io - The Developer's Choice
**Perfect for**: Complex applications, multiple regions, full control
```bash
✅ Pros:
- Full Docker container support
- Multiple region deployment
- Persistent storage volumes
- SSH access to containers
- Advanced networking features
- Great for microservices

❌ Cons:
- Steeper learning curve
- Requires Docker knowledge
- More configuration required
- Complex pricing structure
```

**Cost after free tier**: Variable based on usage

---

### 🟣 Heroku - The Enterprise Standard
**Perfect for**: Teams, established workflows, add-on ecosystem
```bash
✅ Pros:
- Mature platform with extensive add-ons
- Easy scaling and management
- Great for teams and collaboration
- Excellent documentation
- Built-in CI/CD pipelines

❌ Cons:
- More expensive than alternatives
- Dynos sleep on free tier
- Add-ons can get expensive quickly
- Less modern than newer platforms
```

**Cost after free tier**: $7/month for Basic dyno

---

## 📊 Performance Comparison

| Metric | Railway | Render | Vercel | Fly.io | Heroku |
|--------|---------|---------|---------|---------|---------|
| **Cold Start** | ~2s | ~30s | ~1s | ~3s | ~10s |
| **Global CDN** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Auto-scaling** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Custom Domains** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **SSL Certificates** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Build Time** | Fast | Medium | Very Fast | Medium | Medium |

---

## 💰 Cost Analysis (Monthly)

### Free Tier Limits
```
Railway:   500 hours execution time
Render:    Unlimited hours (with sleep)
Vercel:    100GB bandwidth, 100 functions
Fly.io:    160GB bandwidth, 3 shared VMs
Heroku:    550 dyno hours (1000 with credit card)
```

### After Free Tier
```
Railway:   $5-20/month  (Hobby to Pro)
Render:    $7-25/month  (Web Service to Pro)
Vercel:    $20/month    (Pro plan)
Fly.io:    $5-30/month  (Usage-based)
Heroku:    $7-25/month  (Basic to Standard)
```

---

## 🎯 Recommendation Matrix

### 👶 **Complete Beginner**
**Go with Railway**
- Simplest setup process
- Database included
- One-click deployments
- Great documentation

### 🏢 **Business/Production**
**Go with Render**
- Excellent uptime
- Professional support
- Predictable pricing
- Database included

### 🚀 **Performance-Critical**
**Go with Vercel + Neon**
- Global edge network
- Instant deployments
- Best user experience
- Requires external database

### 🛠️ **Advanced Developer**
**Go with Fly.io**
- Full container control
- Multi-region deployment
- Advanced networking
- Persistent storage

---

## 🔄 Migration Path

Start with Railway for development → Move to Render for production → Scale with Fly.io if needed

All platforms support standard environment variables and can import from GitHub, making migration straightforward.

---

## 📞 Support & Community

| Platform | Documentation | Community | Support |
|----------|---------------|-----------|---------|
| Railway | Excellent | Discord | Email |
| Render | Good | Discord | Email/Chat |
| Vercel | Excellent | Discord | Email/Chat |
| Fly.io | Good | Discourse | Email |
| Heroku | Excellent | Stack Overflow | Paid plans |

---

**🎉 Winner for Cyrano AI Platform: Railway for beginners, Render for production**