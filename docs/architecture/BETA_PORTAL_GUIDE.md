---
Document ID: BETA-PORTAL-GUIDE
Title: Beta Test Portal Guide
Subject(s): Architecture | Beta Portal | Integration
Project: Cyrano
Version: v602
Created: 2025-12-29 (2025-W52)
Last Substantive Revision: 2026-01-07 (2026-W02)
Last Format Update: 2026-01-07 (2026-W02)
Owner: Documentation Agent / Cognisint LLC
Copyright: © 2026 Cognisint LLC
Summary: Complete guide for Beta Test Portal architecture and integration with Cyrano backend services.
Status: Active
---

# Beta Test Portal Guide

**Date:** 2026-01-07 (2026-W02)  
**Status:** Active  
**Purpose:** Complete guide for Beta Test Portal architecture and integration

---

## Overview

The Beta Test Portal provides a self-service, invite-only platform for beta testers to:
- Register and create accounts (single email link)
- Install and set up Cyrano/LexFiat/Arkiver
- Access beta applications
- Submit feedback
- Get automated support via Cyrano Pathfinder

**Key Requirement:** An attorney of typical intelligence and technical skill should be able to set up everything from a single email link with no added support.

---

## Part I: Architecture

### Architecture Components

#### 1. Portal Frontend (cognisint.com/beta)

**Technology Stack:**
- React/Next.js for SSR and routing
- Tailwind CSS for styling
- TypeScript for type safety
- Cyrano Pathfinder embedded component

**Key Pages:**
- `/beta` - Landing page (invite validation)
- `/beta/register` - Registration (from email link)
- `/beta/login` - Login page
- `/beta/dashboard` - Beta tester dashboard
- `/beta/install` - Installation guide and walkthrough
- `/beta/feedback` - Feedback submission
- `/beta/support` - Support with embedded Pathfinder

**Features:**
- Invite-only access (token validation)
- Single-click registration from email
- Embedded Cyrano Pathfinder for support
- Mobile-responsive design
- Progressive disclosure of features

#### 2. Authentication & Authorization

**Invitation System:**
- Unique invitation tokens (UUID v4)
- Token expiration (30 days)
- Single-use tokens (after registration)
- Email delivery via invitation service

**Registration Flow:**
1. User clicks invitation link: `https://cognisint.com/beta?token={invitation_token}`
2. Portal validates token
3. If valid, redirects to registration form (pre-filled email)
4. User creates password
5. Account created automatically
6. Redirects to installation guide

**Authentication:**
- JWT-based authentication
- Secure session management
- Password reset capability
- Two-factor authentication (optional)

#### 3. Beta Test Skill Integration

**Location:** `Cyrano/src/skills/beta-test-support-skill.md`

**Integration Points:**
- Embedded in portal support pages
- Available via Cyrano Pathfinder
- Context-aware (knows user is in beta portal)
- Access to beta tester registry

**Capabilities:**
- Registration assistance
- Onboarding walkthrough
- Installation troubleshooting
- Feedback collection
- Process guidance

#### 4. Backend Services

**API Endpoints:**
- `POST /api/beta/validate-invitation` - Validate invitation token
- `POST /api/beta/register` - Create beta tester account
- `POST /api/beta/login` - Authenticate user
- `GET /api/beta/install-guide` - Get installation instructions
- `POST /api/beta/feedback` - Submit feedback
- `GET /api/beta/status` - Get beta tester status

**Database:**
- `beta_invitations` - Invitation tokens and metadata
- `beta_testers` - Registered beta tester accounts
- `beta_feedback` - Submitted feedback
- `beta_support_tickets` - Support tickets (escalated issues)

#### 5. Installation Automation

**One-Click Setup:**
- Automated environment detection
- Platform-specific installers (macOS, Windows, Linux)
- Dependency checking and installation
- Configuration file generation
- Verification and testing

**Installation Flow:**
1. User clicks "Install" button
2. System detects platform
3. Downloads appropriate installer
4. Runs installer with guided steps
5. Verifies installation
6. Launches application

**Troubleshooting:**
- Automated error detection
- Common issue resolution
- System requirement checking
- Dependency installation
- Log collection for support

#### 6. Feedback Management

**Feedback Types:**
- Bug reports (with steps to reproduce)
- Feature requests
- General feedback
- Praise/positive feedback

**Feedback Collection:**
- Structured forms
- Screenshot upload
- Log file attachment
- Priority classification
- Auto-categorization

**Feedback Processing:**
- Automatic categorization
- Priority assignment
- Ticket creation for bugs
- Acknowledgment emails
- Follow-up tracking

#### 7. Support System

**Automated Support (Cyrano Pathfinder):**
- 90%+ of issues resolved automatically
- Context-aware assistance
- Step-by-step guidance
- Resource linking

**Escalation:**
- Complex issues → Support tickets
- Human review for edge cases
- Response time tracking
- Resolution follow-up

### User Flow

#### Registration Flow (Single Email Link)

1. **User receives invitation email**
   - Subject: "You're Invited to Beta Test Cyrano"
   - Contains unique invitation link
   - Clear call-to-action button

2. **User clicks invitation link**
   - URL: `https://cognisint.com/beta?token={token}`
   - Portal validates token
   - If valid → Registration page
   - If invalid → Error message with support link

3. **Registration page**
   - Email pre-filled (from invitation)
   - Password creation
   - Terms acceptance
   - "Create Account" button

4. **Account created**
   - Automatic account creation
   - Welcome message
   - Redirect to installation guide

5. **Installation guide**
   - Platform detection
   - Download installer button
   - Step-by-step instructions
   - Verification steps

6. **Installation complete**
   - Launch application
   - First-time setup wizard
   - Access to beta applications

**Total Time:** < 10 minutes for typical user

### Security

#### Invitation Security
- Unique, cryptographically secure tokens
- Token expiration (30 days)
- Single-use tokens
- Rate limiting on validation attempts
- IP-based fraud detection

#### Access Control
- Invite-only registration
- Role-based access (beta_tester role)
- Application access tokens
- Session management
- Audit logging

#### Data Protection
- Encrypted data at rest
- HTTPS for all communications
- Secure password storage (bcrypt)
- PII protection compliance
- GDPR/privacy compliance

### Integration with Cyrano Pathfinder

#### Embedded Component
- React component: `<CyranoPathfinder context={{ portal: 'beta', user_id, invitation_token }} />`
- Available on all portal pages
- Context-aware (knows user is in beta portal)
- Access to beta test skill

#### Skill Execution
- Pathfinder automatically uses `beta-test-support-skill` when:
  - User asks about registration/onboarding
  - User has installation issues
  - User wants to submit feedback
  - User needs process guidance

#### Context Passing
- Portal context: `{ portal: 'beta', page: 'install', step: 'downloading' }`
- User context: `{ user_id, email, registration_date }`
- Error context: `{ error_message, error_code, step }`

### Database Schema

#### beta_invitations
```sql
CREATE TABLE beta_invitations (
  id UUID PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_by VARCHAR(255),
  metadata JSONB
);
```

#### beta_testers
```sql
CREATE TABLE beta_testers (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  invitation_id UUID REFERENCES beta_invitations(id),
  registered_at TIMESTAMP NOT NULL,
  last_login TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB
);
```

#### beta_feedback
```sql
CREATE TABLE beta_feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES beta_testers(id),
  type VARCHAR(50) NOT NULL, -- bug, feature-request, general, praise
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  priority VARCHAR(50),
  status VARCHAR(50) DEFAULT 'new',
  submitted_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  metadata JSONB
);
```

#### beta_support_tickets
```sql
CREATE TABLE beta_support_tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES beta_testers(id),
  feedback_id UUID REFERENCES beta_feedback(id),
  issue_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50),
  assigned_to VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  metadata JSONB
);
```

### Implementation Plan

#### Phase 1: Core Portal (Week 1)
- [ ] Portal frontend setup (Next.js)
- [ ] Invitation validation system
- [ ] Registration flow
- [ ] Authentication system
- [ ] Basic dashboard

#### Phase 2: Installation Automation (Week 2)
- [ ] Platform detection
- [ ] Installer generation
- [ ] Installation walkthrough
- [ ] Verification system
- [ ] Error handling

#### Phase 3: Pathfinder Integration (Week 2-3)
- [ ] Beta test skill creation
- [ ] Pathfinder embedding
- [ ] Context passing
- [ ] Skill testing
- [ ] Portal integration

#### Phase 4: Feedback System (Week 3)
- [ ] Feedback forms
- [ ] File upload (screenshots, logs)
- [ ] Feedback database
- [ ] Auto-categorization
- [ ] Acknowledgment system

#### Phase 5: Support Automation (Week 4)
- [ ] Common issue resolution
- [ ] Escalation system
- [ ] Ticket management
- [ ] Response tracking
- [ ] Analytics

### Success Metrics

#### Onboarding
- ✅ 95%+ of users complete registration in < 10 minutes
- ✅ 90%+ of users complete installation without support
- ✅ Zero technical support required for setup
- ✅ Single email link success rate > 98%

#### Support
- ✅ 90%+ of issues resolved via Pathfinder
- ✅ Average resolution time < 5 minutes
- ✅ Beta tester satisfaction > 4.5/5
- ✅ Escalation rate < 10%

#### Feedback
- ✅ 100% of feedback collected in structured format
- ✅ Average feedback submission time < 3 minutes
- ✅ All feedback acknowledged within 24 hours
- ✅ Bug reports include reproduction steps 95%+ of time

### File Structure

```
cognisint-beta-portal/
├── frontend/
│   ├── pages/
│   │   ├── beta/
│   │   │   ├── index.tsx          # Landing (invite validation)
│   │   │   ├── register.tsx       # Registration
│   │   │   ├── login.tsx          # Login
│   │   │   ├── dashboard.tsx     # Beta tester dashboard
│   │   │   ├── install.tsx        # Installation guide
│   │   │   ├── feedback.tsx      # Feedback submission
│   │   │   └── support.tsx       # Support with Pathfinder
│   ├── components/
│   │   ├── CyranoPathfinder.tsx   # Embedded Pathfinder
│   │   ├── InstallationWizard.tsx # Installation walkthrough
│   │   └── FeedbackForm.tsx      # Feedback form
│   └── lib/
│       ├── auth.ts                # Authentication
│       ├── api.ts                 # API client
│       └── invitation.ts          # Invitation handling
├── backend/
│   ├── api/
│   │   ├── beta/
│   │   │   ├── validate-invitation.ts
│   │   │   ├── register.ts
│   │   │   ├── login.ts
│   │   │   ├── feedback.ts
│   │   │   └── support.ts
│   └── services/
│       ├── invitation-service.ts
│       ├── installer-service.ts
│       └── feedback-service.ts
└── database/
    └── migrations/
        └── beta-portal-schema.sql
```

---

## Part II: Integration Guide

### Architecture

```
┌─────────────────────────────────┐
│  cognisint.com/beta (Frontend)  │
│  (Separate Repository)          │
│  - Next.js/React                 │
│  - TypeScript                    │
└──────────────┬──────────────────┘
               │ HTTP/REST API
               │ (CORS-enabled)
               ▼
┌─────────────────────────────────┐
│  Cyrano HTTP Bridge              │
│  (This Repository)                │
│  - Port: 5002 (default)           │
│  - Endpoints: /api/beta/*         │
│  - CORS: ALLOWED_ORIGINS          │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Cyrano Services                 │
│  - Beta Test Support Skill       │
│  - Cyrano Pathfinder             │
│  - Authentication                │
│  - Database                      │
└─────────────────────────────────┘
```

### Backend Setup (Cyrano Repository)

#### 1. Add Beta Portal API Routes

Create `Cyrano/src/routes/beta.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { betaTestSupport } from '../tools/beta-test-support.js';
import { cyranoPathfinder } from '../tools/cyrano-pathfinder.js';
import { authenticateJWT } from '../middleware/security.js';

const router = Router();

// Validate invitation token
router.post('/validate-invitation', async (req: Request, res: Response) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    
    // TODO: Implement invitation validation
    // Check token in database, verify expiration, etc.
    
    res.json({ valid: true, email: 'user@example.com' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid invitation token' });
  }
});

// Register beta tester
router.post('/register', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      invitation_token: z.string(),
    });
    
    const data = schema.parse(req.body);
    
    // TODO: Implement registration
    // Create account, hash password, link to invitation
    
    res.json({ success: true, user_id: 'uuid' });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string(),
    }).parse(req.body);
    
    // TODO: Implement login
    // Verify credentials, generate JWT, set cookies
    
    res.json({ success: true, token: 'jwt-token' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Submit feedback
router.post('/feedback', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      type: z.enum(['bug', 'feature-request', 'general', 'praise']),
      title: z.string(),
      description: z.string(),
      steps_to_reproduce: z.string().optional(),
    });
    
    const data = schema.parse(req.body);
    
    // Use beta test support tool to submit feedback
    const result = await betaTestSupport.execute({
      action: 'feedback',
      user_query: `Submit feedback: ${data.title}`,
      context: {
        feedback_type: data.type,
        ...data,
        user_id: (req as any).user?.userId,
      },
    });
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Feedback submission failed' });
  }
;

// Get installation guide
router.get('/install-guide', async (req: Request, res: Response) => {
  try {
    const platform = req.query.platform as string || 'auto';
    
    // Use beta test support tool to get installation guide
    const result = await betaTestSupport.execute({
      action: 'installation',
      user_query: `Get installation guide for ${platform}`,
      context: { platform },
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get installation guide' });
  }
});

// Cyrano Pathfinder endpoint (for embedded chat)
router.post('/pathfinder', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { message, context } = z.object({
      message: z.string(),
      context: z.record(z.any()).optional(),
    }).parse(req.body);
    
    const result = await cyranoPathfinder.execute({
      message,
      context: {
        portal: 'beta',
        user_id: (req as any).user?.userId,
        ...context,
      },
      mode: 'execute',
      model: 'perplexity',
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Pathfinder request failed' });
  }
});

export default router;
```

#### 2. Register Routes in HTTP Bridge

Add to `Cyrano/src/http-bridge.ts`:

```typescript
import betaRoutes from './routes/beta.js';

// ... existing code ...

// Mount beta portal routes
app.use('/api/beta', betaRoutes);
```

#### 3. Configure CORS

Update CORS configuration in `Cyrano/src/http-bridge.ts`:

```typescript
// Add cognisint.com to allowed origins
const allowedOrigins = [
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
  'https://cognisint.com',
  'https://www.cognisint.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined,
].filter(Boolean);
```

Set environment variable:
```bash
ALLOWED_ORIGINS=https://cognisint.com,https://www.cognisint.com
```

### Frontend Setup (Beta Portal Repository)

#### 1. Environment Variables

Create `.env.local` in the beta portal repo:

```bash
# Cyrano API URL
NEXT_PUBLIC_CYRANO_API_URL=https://api.cognisint.com
# Or for local development:
# NEXT_PUBLIC_CYRANO_API_URL=http://localhost:5002
```

#### 2. API Client

Create `lib/cyrano-api.ts` (see full implementation in original integration guide)

#### 3. Cyrano Pathfinder Component

Create `components/CyranoPathfinder.tsx` (see full implementation in original integration guide)

#### 4. Usage in Pages

Example usage in `pages/beta/support.tsx`:

```typescript
import { CyranoPathfinder } from '@/components/CyranoPathfinder';

export default function SupportPage() {
  return (
    <div>
      <h1>Beta Test Support</h1>
      <p>Ask Cyrano Pathfinder for help with registration, installation, or feedback.</p>
      <CyranoPathfinder context={{ page: 'support' }} />
    </div>
  );
}
```

### Authentication Flow

#### 1. Invitation Validation

```typescript
// pages/beta/index.tsx
import { validateInvitation } from '@/lib/cyrano-api';
import { useRouter } from 'next/router';

export default function BetaLanding() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token) {
      validateInvitation(token as string)
        .then((result) => {
          if (result.valid) {
            router.push(`/beta/register?token=${token}&email=${result.email}`);
          } else {
            // Show error
          }
        });
    }
  }, [token]);

  return <div>Validating invitation...</div>;
}
```

#### 2. Registration

```typescript
// pages/beta/register.tsx
import { registerBetaTester } from '@/lib/cyrano-api';

export default function RegisterPage() {
  const handleRegister = async (data: RegistrationData) => {
    try {
      const result = await registerBetaTester(data);
      if (result.success) {
        router.push('/beta/dashboard');
      }
    } catch (error) {
      // Handle error
    }
  };

  // ... registration form
}
```

#### 3. Session Management

Store JWT token in httpOnly cookie (handled by backend) or use Next.js session management.

### API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/beta/validate-invitation` | No | Validate invitation token |
| POST | `/api/beta/register` | No | Register beta tester |
| POST | `/api/beta/login` | No | Login beta tester |
| POST | `/api/beta/feedback` | Yes | Submit feedback |
| GET | `/api/beta/install-guide` | No | Get installation guide |
| POST | `/api/beta/pathfinder` | Yes | Call Cyrano Pathfinder |

### Security Considerations

#### 1. CORS Configuration
- Only allow specific origins (cognisint.com)
- Use environment variables for configuration
- Never allow `*` in production

#### 2. Authentication
- Use JWT tokens with httpOnly cookies
- Implement CSRF protection
- Rate limit authentication endpoints

#### 3. API Security
- Validate all inputs with Zod schemas
- Sanitize user input
- Use HTTPS in production
- Implement rate limiting

#### 4. Error Handling
- Don't expose internal errors to frontend
- Log errors server-side
- Return generic error messages to users

### Deployment

#### Backend (Cyrano)
1. Deploy HTTP Bridge to production server
2. Set `ALLOWED_ORIGINS` environment variable
3. Configure database for beta testers
4. Set up SSL/TLS certificates

#### Frontend (Beta Portal)
1. Deploy to cognisint.com
2. Set `NEXT_PUBLIC_CYRANO_API_URL` environment variable
3. Configure CORS in Next.js if needed
4. Set up authentication session management

### Testing

#### Local Development
1. Start Cyrano HTTP Bridge: `npm run http` (port 5002)
2. Start Beta Portal: `npm run dev` (port 3000)
3. Set `NEXT_PUBLIC_CYRANO_API_URL=http://localhost:5002`

#### Integration Testing
1. Test invitation validation flow
2. Test registration and login
3. Test feedback submission
4. Test Cyrano Pathfinder integration
5. Test error handling

### Troubleshooting

#### CORS Errors
- Check `ALLOWED_ORIGINS` environment variable
- Verify frontend URL matches allowed origin
- Check browser console for specific CORS error

#### Authentication Errors
- Verify JWT token is being sent (check cookies)
- Check token expiration
- Verify backend authentication middleware

#### API Connection Errors
- Verify `NEXT_PUBLIC_CYRANO_API_URL` is set correctly
- Check if HTTP Bridge is running
- Verify network connectivity

---

**Last Updated:** 2026-01-07 (2026-W02)  
**Status:** Active - Consolidated from BETA_PORTAL_ARCHITECTURE.md and BETA_PORTAL_INTEGRATION_GUIDE.md
