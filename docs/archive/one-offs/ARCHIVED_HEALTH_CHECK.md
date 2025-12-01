---
Document ID: ARCHIVED-HEALTH_CHECK
Title: Health Check
Subject(s): Archived | One-Off | Limited Utility
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Document archived due to limited current utility (superseded by other docs, one-off, or historical).
Status: Archived
---

**ARCHIVED:** This document has limited current utility and has been archived. Archived 2025-11-28.

---

---
Document ID: HEALTH-CHECK
Title: Health Check
Subject(s): Cyrano
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# Health Check Endpoint Implementation

Add this health check endpoint to your Express server for production monitoring:

```javascript
// server/index.ts or server/routes.ts

app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };
  
  try {
    // Optional: Add database connectivity check
    // const dbStatus = await checkDatabaseConnection();
    // healthcheck.database = dbStatus ? 'connected' : 'disconnected';
    
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error.message;
    res.status(503).json(healthcheck);
  }
});

// Optional: More detailed health check with AI provider status
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: 'unknown',
      ai_providers: {}
    }
  };
  
  try {
    // Check database connection
    // health.services.database = await checkDatabase() ? 'healthy' : 'unhealthy';
    
    // Check AI provider connectivity (optional, avoid in production due to cost)
    if (process.env.NODE_ENV === 'development') {
      const providers = ['openai', 'anthropic', 'gemini', 'perplexity'];
      for (const provider of providers) {
        try {
          // health.services.ai_providers[provider] = await checkProvider(provider);
          health.services.ai_providers[provider] = 'configured';
        } catch (error) {
          health.services.ai_providers[provider] = 'error';
        }
      }
    }
    
    res.json(health);
  } catch (error) {
    health.status = 'error';
    health.error = error.message;
    res.status(503).json(health);
  }
});
```

## Usage with Hosting Platforms

All major hosting platforms can use these endpoints for health checks:

### Railway
- Automatically uses `/health` if available
- No configuration needed

### Render  
- Set Health Check Path: `/health`
- In render.yaml: `healthCheckPath: /health`

### Fly.io
- Configured in fly.toml:
```toml
[[http_service.checks]]
  path = "/health"
  protocol = "http"
```

### Docker
- Add to Dockerfile:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
```

### Vercel
- Create `/api/health.js`:
```javascript
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}
```