const express = require('express');
const app = express();

// Add health check endpoint
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

module.exports = app;