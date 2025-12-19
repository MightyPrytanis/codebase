---
Document ID: SECURITY-CONFIG-WALKTHROUGH
Title: Security Configuration Walkthrough Guide
Subject(s): Security | Configuration | Production | Step-by-Step
Project: Cyrano
Version: v551
Created: 2025-12-17 (2025-W51)
Last Substantive Revision: 2025-12-17 (2025-W51)
Last Format Update: 2025-12-17 (2025-W51)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Step-by-step walkthrough guide for configuring production security settings, designed for users learning security best practices.
Status: Active
Related Documents: FINAL_SECURITY_REPORT_STEPS_13_15.md, HUMAN_USER_TODOS_STEP_12.md
---

# Security Configuration Walkthrough Guide

**Purpose:** Step-by-step guide to configure production security settings for Project Cyrano  
**Audience:** Users learning security configuration as they implement it  
**Prerequisites:** Basic understanding of environment variables and server configuration  
**Estimated Time:** 2-3 hours

---

## Overview

This guide walks you through configuring all production security settings for the Cyrano ecosystem. Each section explains what you're doing and why, so you can learn security best practices as you implement them.

**What You'll Configure:**
1. Environment Variables (secrets, API keys, configuration)
2. CORS and Origin Restrictions
3. HTTPS/TLS Configuration
4. Session Cookie Security
5. Database Security
6. Monitoring and Logging

---

## Step 1: Environment Variables Configuration

### What Are Environment Variables?

Environment variables are configuration values stored outside your code. They keep secrets (like API keys) out of your codebase and allow different settings for development vs. production.

### Step 1.1: Create Production Environment File

**Action:** Create a `.env.production` file in your project root (never commit this to git!)

```bash
# In your project root directory
touch .env.production
```

**Why:** This file will contain all your production secrets. The `.gitignore` file should already exclude `.env*` files.

### Step 1.2: Set Required Security Variables

**Action:** Add these variables to `.env.production`:

```bash
# Production Environment
NODE_ENV=production

# Security Secrets (generate strong random values)
SESSION_SECRET=<generate-64-char-random-string>
JWT_SECRET=<generate-64-char-random-string>
WELLNESS_ENCRYPTION_KEY=<generate-64-char-hex-string>

# CORS Configuration (comma-separated list of allowed origins)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# HTTPS Enforcement
FORCE_HTTPS=true

# Database (use secure connection string with SSL)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

**How to Generate Secrets:**

```bash
# Generate SESSION_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate WELLNESS_ENCRYPTION_KEY (64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Why Each Variable:**
- `NODE_ENV=production`: Enables production security features (HTTPS enforcement, strict CORS)
- `SESSION_SECRET`: Encrypts session cookies - must be random and secret
- `JWT_SECRET`: Signs authentication tokens - must be random and secret
- `WELLNESS_ENCRYPTION_KEY`: Encrypts wellness data - must be 64 hex characters
- `ALLOWED_ORIGINS`: Restricts which websites can access your API (prevents CSRF attacks)
- `FORCE_HTTPS`: Automatically redirects HTTP to HTTPS
- `DATABASE_URL`: Connection string with SSL required for encrypted database connections

### Step 1.3: Verify Environment Variables

**Action:** Create a verification script to check all required variables are set:

```bash
# Create verify-env.sh
cat > verify-env.sh << 'EOF'
#!/bin/bash
echo "Verifying production environment variables..."

required_vars=(
  "NODE_ENV"
  "SESSION_SECRET"
  "JWT_SECRET"
  "WELLNESS_ENCRYPTION_KEY"
  "ALLOWED_ORIGINS"
  "DATABASE_URL"
)

missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
  echo "✅ All required environment variables are set"
  exit 0
else
  echo "❌ Missing environment variables:"
  printf '   - %s\n' "${missing_vars[@]}"
  exit 1
fi
EOF

chmod +x verify-env.sh
```

**Action:** Run the verification:

```bash
source .env.production
./verify-env.sh
```

---

## Step 2: CORS and Origin Restrictions

### What Is CORS?

CORS (Cross-Origin Resource Sharing) controls which websites can make requests to your API. Without restrictions, any website could access your API, leading to security vulnerabilities.

### Step 2.1: Configure ALLOWED_ORIGINS

**Action:** In `.env.production`, set your allowed origins:

```bash
ALLOWED_ORIGINS=https://lexfiat.yourdomain.com,https://arkiver.yourdomain.com
```

**Important:** 
- Use full URLs with `https://`
- Separate multiple origins with commas
- No trailing slashes
- Only include domains you control

**Why:** This prevents unauthorized websites from accessing your API, protecting against CSRF (Cross-Site Request Forgery) attacks.

### Step 2.2: Test CORS Configuration

**Action:** Test that unauthorized origins are rejected:

```bash
# This should be rejected (unauthorized origin)
curl -H "Origin: https://evil-site.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-api-domain.com/api/tools

# This should be allowed (authorized origin)
curl -H "Origin: https://lexfiat.yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-api-domain.com/api/tools
```

**Expected Result:** Unauthorized origin should return CORS error; authorized origin should return success.

---

## Step 3: HTTPS/TLS Configuration

### What Is HTTPS/TLS?

HTTPS encrypts data between the browser and your server. TLS (Transport Layer Security) is the protocol that provides this encryption. Without HTTPS, data can be intercepted and read by attackers.

### Step 3.1: Obtain SSL Certificate

**Option A: Let's Encrypt (Free, Recommended for Learning)**

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

**Option B: Cloud Provider (Easier, but costs money)**
- AWS: Use Certificate Manager
- Google Cloud: Use Load Balancer SSL certificates
- Azure: Use App Service certificates

**Why:** SSL certificates prove your server's identity and enable encrypted connections.

### Step 3.2: Configure Server for HTTPS

**Action:** If using Node.js directly, configure HTTPS:

```javascript
// In your server configuration
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/path/to/private-key.pem'),
  cert: fs.readFileSync('/path/to/certificate.pem')
};

https.createServer(options, app).listen(443);
```

**Action:** If using a reverse proxy (nginx/Apache), configure SSL there (recommended for production).

**Why:** HTTPS must be configured at the server level to encrypt all traffic.

### Step 3.3: Verify HTTPS Enforcement

**Action:** Test that HTTP redirects to HTTPS:

```bash
# Should redirect to HTTPS
curl -I http://yourdomain.com

# Should return 200 OK with HTTPS
curl -I https://yourdomain.com
```

**Expected Result:** HTTP requests should redirect (301) to HTTPS.

---

## Step 4: Session Cookie Security

### What Are Secure Cookies?

Secure cookies have flags that protect them from theft:
- `HttpOnly`: Prevents JavaScript from accessing the cookie (prevents XSS attacks)
- `Secure`: Only sends cookie over HTTPS (prevents interception)
- `SameSite`: Prevents cross-site requests from sending the cookie (prevents CSRF)

### Step 4.1: Verify Cookie Configuration

**Action:** Check that cookies are configured correctly in `Cyrano/auth-server/server.js`:

The code should already have:
```javascript
cookie: { 
  secure: true,        // ✅ Only over HTTPS
  httpOnly: true,      // ✅ No JavaScript access
  sameSite: 'strict',  // ✅ CSRF protection
  maxAge: 24 * 60 * 60 * 1000  // ✅ 24 hour expiration
}
```

**Why Each Flag:**
- `secure: true`: Cookie only sent over encrypted HTTPS connections
- `httpOnly: true`: JavaScript cannot access cookie (prevents XSS cookie theft)
- `sameSite: 'strict'`: Cookie not sent on cross-site requests (prevents CSRF)
- `maxAge`: Cookie expires after 24 hours (limits exposure if stolen)

### Step 4.2: Test Cookie Security

**Action:** Use browser developer tools to verify cookie flags:

1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Click Cookies
4. Find your session cookie
5. Verify it has:
   - ✅ HttpOnly flag checked
   - ✅ Secure flag checked
   - ✅ SameSite set to Strict

**Why:** This confirms your cookies are properly protected.

---

## Step 5: Database Security

### What Is Database Security?

Database security involves encrypting connections, using strong passwords, and restricting access.

### Step 5.1: Enable SSL for Database Connections

**Action:** Ensure your `DATABASE_URL` includes SSL:

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

**Why:** SSL encrypts data between your application and database, preventing interception.

### Step 5.2: Use Strong Database Passwords

**Action:** Generate a strong database password:

```bash
# Generate 32-character random password
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Why:** Strong passwords prevent unauthorized database access.

### Step 5.3: Restrict Database Access

**Action:** Configure database firewall to only allow your application server's IP address.

**Why:** Limits who can connect to your database, reducing attack surface.

---

## Step 6: Monitoring and Logging

### What Is Security Monitoring?

Security monitoring tracks security events (failed logins, suspicious activity) so you can detect and respond to attacks.

### Step 6.1: Enable Security Event Logging

**Action:** Verify logging is enabled in your application:

The code already logs:
- Access to wellness data (`hipaaCompliance.logAccess`)
- Authentication attempts
- Security violations

**Why:** Logs help you detect attacks and investigate security incidents.

### Step 6.2: Set Up Log Aggregation

**Action:** Choose a log aggregation service:

**Option A: Cloud Logging (Easiest)**
- AWS CloudWatch
- Google Cloud Logging
- Azure Monitor

**Option B: Self-Hosted (More Control)**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana Loki

**Why:** Centralized logging makes it easier to search and analyze security events.

### Step 6.3: Configure Alerts

**Action:** Set up alerts for suspicious activity:

Examples:
- Multiple failed login attempts
- Unusual access patterns
- Security policy violations

**Why:** Alerts notify you immediately when security issues occur.

---

## Step 7: Verification Checklist

**Action:** Complete this checklist to verify your security configuration:

### Environment Variables
- [ ] All required environment variables set
- [ ] Secrets are random and strong (64+ characters)
- [ ] `.env.production` is NOT committed to git
- [ ] Environment variables loaded correctly in production

### CORS Configuration
- [ ] `ALLOWED_ORIGINS` contains only your domains
- [ ] Unauthorized origins are rejected
- [ ] Authorized origins can access API

### HTTPS/TLS
- [ ] SSL certificate installed and valid
- [ ] HTTP redirects to HTTPS
- [ ] HTTPS works correctly
- [ ] Certificate auto-renewal configured

### Session Cookies
- [ ] Cookies have `HttpOnly` flag
- [ ] Cookies have `Secure` flag
- [ ] Cookies have `SameSite=Strict`
- [ ] Cookies expire after reasonable time

### Database Security
- [ ] Database connection uses SSL
- [ ] Database password is strong
- [ ] Database access is restricted by IP
- [ ] Database backups are encrypted

### Monitoring
- [ ] Security events are logged
- [ ] Logs are aggregated centrally
- [ ] Alerts are configured
- [ ] Log retention policy is set

---

## Common Issues and Solutions

### Issue: CORS errors in production

**Solution:** 
1. Check `ALLOWED_ORIGINS` includes your frontend domain
2. Verify origin format (must include `https://`)
3. Check browser console for exact error message

### Issue: Cookies not working

**Solution:**
1. Verify `secure: true` only when using HTTPS
2. Check `sameSite` setting matches your use case
3. Ensure domain matches between frontend and backend

### Issue: HTTPS redirect loop

**Solution:**
1. Check `X-Forwarded-Proto` header is set by reverse proxy
2. Verify `trust proxy` is enabled in Express
3. Check reverse proxy SSL configuration

---

## Next Steps

After completing this walkthrough:

1. **Test Everything:** Test all security features in staging environment
2. **Document Your Setup:** Document your specific configuration for future reference
3. **Regular Reviews:** Review security configuration quarterly
4. **Stay Updated:** Keep dependencies and security patches up to date

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Common security vulnerabilities
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/) - Free SSL certificates
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Document Owner:** David W Towne / Cognisint LLC  
**Last Updated:** 2025-12-17  
**Status:** Active


