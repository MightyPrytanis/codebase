# Beta Portal Integration Guide

**Date:** 2025-12-29  
**Purpose:** Guide for integrating the cognisint.com beta portal (separate repo) with Cyrano backend services

---

## Overview

The beta portal frontend (in a separate repository) communicates with the Cyrano backend via REST API endpoints exposed by the HTTP Bridge. This guide explains how to set up the integration.

---

## Architecture

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

---

## Backend Setup (Cyrano Repository)

### 1. Add Beta Portal API Routes

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
});

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

### 2. Register Routes in HTTP Bridge

Add to `Cyrano/src/http-bridge.ts`:

```typescript
import betaRoutes from './routes/beta.js';

// ... existing code ...

// Mount beta portal routes
app.use('/api/beta', betaRoutes);
```

### 3. Configure CORS

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

---

## Frontend Setup (Beta Portal Repository)

### 1. Environment Variables

Create `.env.local` in the beta portal repo:

```bash
# Cyrano API URL
NEXT_PUBLIC_CYRANO_API_URL=https://api.cognisint.com
# Or for local development:
# NEXT_PUBLIC_CYRANO_API_URL=http://localhost:5002
```

### 2. API Client

Create `lib/cyrano-api.ts`:

```typescript
/**
 * Cyrano API Client for Beta Portal
 */

const API_URL = process.env.NEXT_PUBLIC_CYRANO_API_URL || 'http://localhost:5002';

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
}

export interface InvitationValidation {
  valid: boolean;
  email?: string;
  expires_at?: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  invitation_token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface FeedbackData {
  type: 'bug' | 'feature-request' | 'general' | 'praise';
  title: string;
  description: string;
  steps_to_reproduce?: string;
}

export interface PathfinderRequest {
  message: string;
  context?: Record<string, any>;
}

/**
 * Validate invitation token
 */
export async function validateInvitation(token: string): Promise<InvitationValidation> {
  const response = await fetch(`${API_URL}/api/beta/validate-invitation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to validate invitation');
  }
  
  return response.json();
}

/**
 * Register beta tester
 */
export async function registerBetaTester(data: RegistrationData): Promise<ApiResponse> {
  const response = await fetch(`${API_URL}/api/beta/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  
  return response.json();
}

/**
 * Login beta tester
 */
export async function loginBetaTester(data: LoginData): Promise<ApiResponse<{ token: string }>> {
  const response = await fetch(`${API_URL}/api/beta/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  
  return response.json();
}

/**
 * Submit feedback
 */
export async function submitFeedback(data: FeedbackData): Promise<ApiResponse> {
  const response = await fetch(`${API_URL}/api/beta/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Feedback submission failed');
  }
  
  return response.json();
}

/**
 * Get installation guide
 */
export async function getInstallationGuide(platform?: string): Promise<ApiResponse> {
  const url = new URL(`${API_URL}/api/beta/install-guide`);
  if (platform) {
    url.searchParams.set('platform', platform);
  }
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to get installation guide');
  }
  
  return response.json();
}

/**
 * Call Cyrano Pathfinder
 */
export async function callPathfinder(request: PathfinderRequest): Promise<ApiResponse> {
  const response = await fetch(`${API_URL}/api/beta/pathfinder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Pathfinder request failed');
  }
  
  return response.json();
}
```

### 3. Cyrano Pathfinder Component

Create `components/CyranoPathfinder.tsx`:

```typescript
'use client';

import React, { useState } from 'react';
import { callPathfinder } from '@/lib/cyrano-api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

interface CyranoPathfinderProps {
  context?: Record<string, any>;
  className?: string;
}

export function CyranoPathfinder({ context = {}, className }: CyranoPathfinderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await callPathfinder({
        message: input,
        context: {
          portal: 'beta',
          ...context,
        },
      });

      if (response.data?.content) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.content[0]?.text || 'No response',
          error: response.data.isError,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'An error occurred',
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`cyrano-pathfinder ${className}`}>
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role} ${msg.error ? 'error' : ''}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask for help..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

### 4. Usage in Pages

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

---

## Authentication Flow

### 1. Invitation Validation

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

### 2. Registration

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

### 3. Session Management

Store JWT token in httpOnly cookie (handled by backend) or use Next.js session management.

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/beta/validate-invitation` | No | Validate invitation token |
| POST | `/api/beta/register` | No | Register beta tester |
| POST | `/api/beta/login` | No | Login beta tester |
| POST | `/api/beta/feedback` | Yes | Submit feedback |
| GET | `/api/beta/install-guide` | No | Get installation guide |
| POST | `/api/beta/pathfinder` | Yes | Call Cyrano Pathfinder |

---

## Security Considerations

### 1. CORS Configuration
- Only allow specific origins (cognisint.com)
- Use environment variables for configuration
- Never allow `*` in production

### 2. Authentication
- Use JWT tokens with httpOnly cookies
- Implement CSRF protection
- Rate limit authentication endpoints

### 3. API Security
- Validate all inputs with Zod schemas
- Sanitize user input
- Use HTTPS in production
- Implement rate limiting

### 4. Error Handling
- Don't expose internal errors to frontend
- Log errors server-side
- Return generic error messages to users

---

## Deployment

### Backend (Cyrano)
1. Deploy HTTP Bridge to production server
2. Set `ALLOWED_ORIGINS` environment variable
3. Configure database for beta testers
4. Set up SSL/TLS certificates

### Frontend (Beta Portal)
1. Deploy to cognisint.com
2. Set `NEXT_PUBLIC_CYRANO_API_URL` environment variable
3. Configure CORS in Next.js if needed
4. Set up authentication session management

---

## Testing

### Local Development
1. Start Cyrano HTTP Bridge: `npm run http` (port 5002)
2. Start Beta Portal: `npm run dev` (port 3000)
3. Set `NEXT_PUBLIC_CYRANO_API_URL=http://localhost:5002`

### Integration Testing
1. Test invitation validation flow
2. Test registration and login
3. Test feedback submission
4. Test Cyrano Pathfinder integration
5. Test error handling

---

## Troubleshooting

### CORS Errors
- Check `ALLOWED_ORIGINS` environment variable
- Verify frontend URL matches allowed origin
- Check browser console for specific CORS error

### Authentication Errors
- Verify JWT token is being sent (check cookies)
- Check token expiration
- Verify backend authentication middleware

### API Connection Errors
- Verify `NEXT_PUBLIC_CYRANO_API_URL` is set correctly
- Check if HTTP Bridge is running
- Verify network connectivity

---

**Last Updated:** 2025-12-29
