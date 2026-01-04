# Beta Test Portal Architecture

**Date:** 2025-12-29  
**Status:** Design Phase  
**Purpose:** Architecture for invite-only beta test portal at cognisint.com with integrated Cyrano Pathfinder support

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

## Architecture Components

### 1. Portal Frontend (cognisint.com/beta)

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

### 2. Authentication & Authorization

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

### 3. Beta Test Skill Integration

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

### 4. Backend Services

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

### 5. Installation Automation

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

### 6. Feedback Management

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

### 7. Support System

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

---

## User Flow

### Registration Flow (Single Email Link)

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

---

## Security

### Invitation Security
- Unique, cryptographically secure tokens
- Token expiration (30 days)
- Single-use tokens
- Rate limiting on validation attempts
- IP-based fraud detection

### Access Control
- Invite-only registration
- Role-based access (beta_tester role)
- Application access tokens
- Session management
- Audit logging

### Data Protection
- Encrypted data at rest
- HTTPS for all communications
- Secure password storage (bcrypt)
- PII protection compliance
- GDPR/privacy compliance

---

## Integration with Cyrano Pathfinder

### Embedded Component
- React component: `<CyranoPathfinder context={{ portal: 'beta', user_id, invitation_token }} />`
- Available on all portal pages
- Context-aware (knows user is in beta portal)
- Access to beta test skill

### Skill Execution
- Pathfinder automatically uses `beta-test-support-skill` when:
  - User asks about registration/onboarding
  - User has installation issues
  - User wants to submit feedback
  - User needs process guidance

### Context Passing
- Portal context: `{ portal: 'beta', page: 'install', step: 'downloading' }`
- User context: `{ user_id, email, registration_date }`
- Error context: `{ error_message, error_code, step }`

---

## Database Schema

### beta_invitations
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

### beta_testers
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

### beta_feedback
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

### beta_support_tickets
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

---

## Implementation Plan

### Phase 1: Core Portal (Week 1)
- [ ] Portal frontend setup (Next.js)
- [ ] Invitation validation system
- [ ] Registration flow
- [ ] Authentication system
- [ ] Basic dashboard

### Phase 2: Installation Automation (Week 2)
- [ ] Platform detection
- [ ] Installer generation
- [ ] Installation walkthrough
- [ ] Verification system
- [ ] Error handling

### Phase 3: Pathfinder Integration (Week 2-3)
- [ ] Beta test skill creation
- [ ] Pathfinder embedding
- [ ] Context passing
- [ ] Skill testing
- [ ] Portal integration

### Phase 4: Feedback System (Week 3)
- [ ] Feedback forms
- [ ] File upload (screenshots, logs)
- [ ] Feedback database
- [ ] Auto-categorization
- [ ] Acknowledgment system

### Phase 5: Support Automation (Week 4)
- [ ] Common issue resolution
- [ ] Escalation system
- [ ] Ticket management
- [ ] Response tracking
- [ ] Analytics

---

## Success Metrics

### Onboarding
- ✅ 95%+ of users complete registration in < 10 minutes
- ✅ 90%+ of users complete installation without support
- ✅ Zero technical support required for setup
- ✅ Single email link success rate > 98%

### Support
- ✅ 90%+ of issues resolved via Pathfinder
- ✅ Average resolution time < 5 minutes
- ✅ Beta tester satisfaction > 4.5/5
- ✅ Escalation rate < 10%

### Feedback
- ✅ 100% of feedback collected in structured format
- ✅ Average feedback submission time < 3 minutes
- ✅ All feedback acknowledged within 24 hours
- ✅ Bug reports include reproduction steps 95%+ of time

---

## File Structure

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

**Last Updated:** 2025-12-29  
**Status:** Design Complete - Ready for Implementation
