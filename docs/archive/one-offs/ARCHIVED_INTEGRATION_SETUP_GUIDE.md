---
Document ID: ARCHIVED-INTEGRATION_SETUP_GUIDE
Title: Integration Setup Guide
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
Document ID: INTEGRATION-SETUP-GUIDE
Title: Integration Setup Guide
Subject(s): Cyrano | Guide | UI
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# Integration Setup Guide
**Created:** 2025-11-26  
**Purpose:** Complete guide for setting up all integrations to make LexFiat 100% functional  
**Status:** Required for Beta Testing

---

## Overview

This guide provides **exact** instructions for making all integrations 100% functional. Follow these steps in order to ensure complete setup.

---

## Prerequisites: Business Setup

**⚠️ IMPORTANT:** Complete these business/legal requirements BEFORE setting up technical integrations. Some API registrations require business verification.

### 1. Business Entity Setup
- [ ] **Register LLC** (or appropriate business entity)
  - State: [Your State]
  - Business name: [Your Business Name]
  - Registered agent: [Name/Address]
  - Operating agreement: [Status]
  - **Timeline:** 1-2 weeks (varies by state)

- [ ] **Obtain New Tax ID (EIN)**
  - Apply at: https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-ein-online
  - EIN: [To be filled after application]
  - **Timeline:** Immediate (online) or 4-5 weeks (mail)
  - **Note:** Required for business bank accounts and some API registrations

- [ ] **Business Bank Account**
  - Bank: [To be selected]
  - Account number: [To be filled]
  - **Timeline:** 1-2 weeks after EIN received
  - **Note:** Required for payment processing and some service subscriptions

### 2. Developer Program Registrations

- [ ] **Clio Developer Program**
  - Register at: https://www.clio.com/partnerships/developers/
  - Developer account email: [To be filled]
  - API access level: [To be determined]
  - Approval status: [Pending/Approved]
  - **Timeline:** 3-7 business days for approval
  - **Note:** May require business verification (EIN, business registration) and approval process

- [ ] **MiFile Developer Program** (Michigan Electronic Filing)
  - Contact: Michigan One Court of Justice
  - Website: [To be verified]
  - Developer program enrollment: [Pending]
  - API documentation access: [Pending]
  - **Timeline:** Unknown - requires contact with Michigan Courts
  - **Note:** Requires enrollment in developer program to access API specifications. May require attorney credentials and business verification.

---

## API Endpoint Verification Checklist

**⚠️ VERIFY BEFORE PROCEEDING:** These endpoints are based on standard API patterns but should be verified against official documentation before production use.

Before proceeding, verify these endpoints match official documentation:

### Clio API Verification
- [ ] Verify base URL: `https://app.clio.com/api/v4`
- [ ] Verify endpoint: `/matters/{id}` (matter information)
- [ ] Verify endpoint: `/contacts` (contacts list/search)
- [ ] Verify endpoint: `/tasks` or `/activities` (tasks/to-dos)
- [ ] Verify endpoint: `/documents` (document management)
- [ ] Verify endpoint: `/calendar_entries` (calendar events)
- [ ] Verify authentication method: Bearer token
- [ ] Verify response format: JSON
- [ ] **Documentation:** https://docs.developers.clio.com/api-reference/

### Gmail/Google Services Verification
- [ ] Verify Gmail API: `https://gmail.googleapis.com/gmail/v1`
- [ ] Verify endpoint: `/users/me/messages` (email list)
- [ ] Verify endpoint: `/users/me/messages/{id}` (email details)
- [ ] Verify Google Calendar API: `https://www.googleapis.com/calendar/v3`
- [ ] Verify endpoint: `/calendars/{id}/events` (calendar events)
- [ ] Verify Google Tasks API: `https://tasks.googleapis.com/tasks/v1`
- [ ] Verify endpoint: `/lists/{id}/tasks` (tasks)
- [ ] Verify Google People API: `https://people.googleapis.com/v1`
- [ ] Verify endpoint: `/people/me/connections` (contacts)
- [ ] Verify OAuth2 endpoints: `https://accounts.google.com/o/oauth2/v2/auth`
- [ ] **Documentation:** https://developers.google.com/gmail/api

### Microsoft/Outlook Services Verification
- [ ] Verify Microsoft Graph API: `https://graph.microsoft.com/v1.0`
- [ ] Verify endpoint: `/me/messages` (email)
- [ ] Verify endpoint: `/me/calendars/{id}/calendarView` (calendar events)
- [ ] Verify endpoint: `/me/todo/lists` (task lists)
- [ ] Verify endpoint: `/me/todo/lists/{id}/tasks` (tasks)
- [ ] Verify endpoint: `/me/contacts` (contacts)
- [ ] Verify OAuth2 endpoints: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`
- [ ] **Documentation:** https://learn.microsoft.com/en-us/graph/overview

### MiFile API Verification
- [ ] **Status:** Speculative - requires developer program enrollment
- [ ] Verify base URL: [To be determined]
- [ ] Verify case lookup endpoint: [To be determined]
- [ ] Verify filing submission endpoint: [To be determined]
- [ ] Verify authentication method: [To be determined]
- [ ] **Action Required:** Contact Michigan Courts for API access

### Legal Research Services Verification
- [ ] **CourtListener:** Already integrated, verify API key setup
- [ ] **Google Scholar:** No official API - verify scraping approach or alternative
- [ ] **Justia:** Verify if API exists or scraping required
- [ ] **Michigan Legal Help:** Verify if API exists or scraping required

---

## Integration Setup Instructions

### 1. Gmail Integration

#### Step 1.1: Create Google Cloud Project
1. Go to: https://console.cloud.google.com/
2. Create new project or select existing
3. Project name: [Your Project Name]
4. Project ID: [Auto-generated]

#### Step 1.2: Enable APIs
Enable these APIs in Google Cloud Console:
- [ ] Gmail API
- [ ] Google Calendar API
- [ ] Google Tasks API
- [ ] Google People API (Contacts)

#### Step 1.3: Create OAuth2 Credentials
1. Navigate to: APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "LexFiat Gmail Integration"
5. Authorized redirect URIs:
   - `http://localhost:5002/auth/gmail/callback` (development)
   - `https://yourdomain.com/auth/gmail/callback` (production)
6. Save Client ID and Client Secret

#### Step 1.4: Configure Environment Variables
Add to `.env` file:
```bash
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:5002/auth/gmail/callback
```

#### Step 1.5: Complete OAuth Flow
1. Run application
2. Visit authorization URL (generated by `GmailService.getAuthorizationUrl()`)
3. Grant permissions
4. Copy authorization code from redirect
5. Exchange for access token using `GmailService.getAccessToken()`
6. Save tokens to `.env`:
```bash
GMAIL_ACCESS_TOKEN=your_access_token_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here
```

**Required Scopes:**
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/tasks.readonly`
- `https://www.googleapis.com/auth/contacts.readonly`

---

### 2. Outlook Integration

#### Step 2.1: Register Azure AD Application
1. Go to: https://portal.azure.com/
2. Navigate to: Azure Active Directory → App registrations
3. Click "New registration"
4. Name: "LexFiat Outlook Integration"
5. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
6. Redirect URI: `http://localhost:5002/auth/outlook/callback`
7. Register and note:
   - Application (client) ID
   - Directory (tenant) ID

#### Step 2.2: Create Client Secret
1. In app registration, go to: Certificates & secrets
2. Click "New client secret"
3. Description: "LexFiat Integration Secret"
4. Expires: [Choose expiration]
5. **IMPORTANT:** Copy secret value immediately (shown only once)

#### Step 2.3: Configure API Permissions
Add these Microsoft Graph API permissions:
- [ ] `Mail.Read` (Delegated)
- [ ] `Calendars.Read` (Delegated)
- [ ] `Tasks.Read` (Delegated)
- [ ] `Contacts.Read` (Delegated)
- [ ] Click "Grant admin consent" (if required)

#### Step 2.4: Configure Environment Variables
Add to `.env` file:
```bash
OUTLOOK_CLIENT_ID=your_application_id_here
OUTLOOK_CLIENT_SECRET=your_client_secret_here
OUTLOOK_TENANT_ID=your_tenant_id_here
OUTLOOK_REDIRECT_URI=http://localhost:5002/auth/outlook/callback
```

#### Step 2.5: Complete OAuth Flow
1. Run application
2. Visit authorization URL (generated by `OutlookService.getAuthorizationUrl()`)
3. Grant permissions
4. Copy authorization code from redirect
5. Exchange for access token using `OutlookService.getAccessToken()`
6. Save tokens to `.env`:
```bash
OUTLOOK_ACCESS_TOKEN=your_access_token_here
OUTLOOK_REFRESH_TOKEN=your_refresh_token_here
```

---

### 3. Clio Integration

#### Step 3.1: Register for Clio Developer Program
1. Go to: https://www.clio.com/partnerships/developers/
2. Complete registration form
3. Provide business information (EIN may be required)
4. Wait for approval (may take several business days)
5. Receive developer account credentials

#### Step 3.2: Create Clio API Application
1. Log into Clio Developer Portal
2. Create new application
3. Application name: "LexFiat Integration"
4. Note: Application ID and Secret

#### Step 3.3: Obtain API Key
1. In Clio Developer Portal, generate API key
2. **IMPORTANT:** Save API key securely (may not be shown again)

#### Step 3.4: Verify API Endpoints
Before using, verify these endpoints in Clio API documentation:
- [ ] `/api/v4/matters` - Matter information
- [ ] `/api/v4/contacts` - Contacts
- [ ] `/api/v4/tasks` or `/api/v4/activities` - Tasks
- [ ] `/api/v4/documents` - Document management
- [ ] `/api/v4/calendar_entries` - Calendar events

#### Step 3.5: Configure Environment Variables
Add to `.env` file:
```bash
CLIO_API_KEY=your_clio_api_key_here
```

**Note:** If API key is not set, Clio integration will use mock data fallback.

---

### 4. MiFile Integration

#### Step 4.1: Contact Michigan Courts
1. Contact: Michigan One Court of Justice
2. Request: MiFile Developer Program enrollment
3. Provide: Business information, EIN, attorney credentials
4. Wait for: Program approval and API documentation access

#### Step 4.2: Obtain API Credentials
Once approved:
1. Receive API documentation
2. Obtain API key/credentials
3. Verify base URL and endpoints
4. Update `mifile-service.ts` with correct endpoints

#### Step 4.3: Configure Environment Variables
Add to `.env` file (after receiving credentials):
```bash
MIFILE_API_KEY=your_mifile_api_key_here
MIFILE_API_SECRET=your_mifile_api_secret_here
MIFILE_BASE_URL=https://mifile.courts.michigan.gov/api/v1
```

**Current Status:** Speculative implementation - requires developer program access

---

### 5. Legal Research Services

#### Step 5.1: CourtListener (Optional but Recommended)
1. Go to: https://www.courtlistener.com/api/
2. Register for free API key
3. Add to `.env`:
```bash
COURTLISTENER_API_KEY=your_courtlistener_api_key_here
```

**Note:** CourtListener has free tier with rate limits. Integration works without key but with limited functionality.

#### Step 5.2: Google Scholar
- **Status:** No official API
- **Current Implementation:** Placeholder for search URL
- **Action Required:** Determine if scraping is acceptable or use alternative service

#### Step 5.3: Justia
- **Status:** Verify if API exists
- **Action Required:** Contact Justia or verify scraping approach

#### Step 5.4: Michigan Legal Help
- **Status:** Verify if API exists
- **Action Required:** Contact Michigan Legal Help or verify scraping approach

---

## Environment Variables Summary

Add all of these to your `.env` file:

```bash
# Gmail/Google Services
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=http://localhost:5002/auth/gmail/callback
GMAIL_ACCESS_TOKEN=
GMAIL_REFRESH_TOKEN=

# Outlook/Microsoft Services
OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
OUTLOOK_TENANT_ID=common
OUTLOOK_REDIRECT_URI=http://localhost:5002/auth/outlook/callback
OUTLOOK_ACCESS_TOKEN=
OUTLOOK_REFRESH_TOKEN=

# Clio
CLIO_API_KEY=

# MiFile (after developer program enrollment)
MIFILE_API_KEY=
MIFILE_API_SECRET=
MIFILE_BASE_URL=

# Legal Research
COURTLISTENER_API_KEY=

# Existing AI Services (already configured)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=
# ... (other AI keys)
```

---

## Testing Integrations

After setup, test each integration:

### Test Gmail
```bash
# Use email_artifact_collector tool
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "email_provider": "gmail"
}
```

### Test Outlook
```bash
# Use email_artifact_collector tool
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "email_provider": "outlook"
}
```

### Test Google Calendar
```bash
# Use calendar_artifact_collector tool
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "calendar_provider": "google"
}
```

### Test Outlook Calendar
```bash
# Use calendar_artifact_collector tool
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "calendar_provider": "outlook"
}
```

### Test Clio
```bash
# Use clio_integration tool
{
  "action": "get_matter_info",
  "matter_id": "test_matter_id"
}
```

---

## Troubleshooting

### OAuth2 Issues
- **Problem:** "redirect_uri_mismatch"
- **Solution:** Ensure redirect URI in `.env` exactly matches registered URI in developer console

### Token Expiration
- **Problem:** 401 Unauthorized errors
- **Solution:** Refresh tokens are handled automatically, but verify refresh token is saved

### API Endpoint Errors
- **Problem:** 404 Not Found
- **Solution:** Verify endpoint paths match official API documentation

### Rate Limiting
- **Problem:** 429 Too Many Requests
- **Solution:** Implement rate limiting and retry logic (future enhancement)

---

## Next Steps After Setup

1. **Verify all integrations work** using test commands above
2. **Update production redirect URIs** before deploying
3. **Set up token refresh automation** (if not already implemented)
4. **Monitor API usage** to stay within rate limits
5. **Document any endpoint differences** found during testing

---

## Support Resources

- **Clio API Docs:** https://docs.developers.clio.com/api-reference/
- **Gmail API Docs:** https://developers.google.com/gmail/api
- **Microsoft Graph Docs:** https://learn.microsoft.com/en-us/graph/overview
- **CourtListener API:** https://www.courtlistener.com/api/
- **MiFile:** Contact Michigan Courts (no public docs available)

---

**Last Updated:** 2025-11-26  
**Status:** Ready for user setup

