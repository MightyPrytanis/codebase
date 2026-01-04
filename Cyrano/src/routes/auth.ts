/**
 * Authentication Routes - Week 1 Implementation
 * Includes Clio OAuth routes (Track Alpha)
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies,
  authLimiter,
} from '../middleware/security.js';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';
import {
  validateClioCredentials,
  generateOAuthState,
  validateOAuthState,
  generateClioAuthUrl,
  exchangeAuthorizationCode,
  validateRedirectUri,
  oauthStateStore,
} from '../integrations/clio-oauth.js';
import { logSecurityEvent, logUserAction } from '../services/audit-logger.js';

const router = Router();
router.use(authLimiter);

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, username } = RegisterSchema.parse(req.body);
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({ email, passwordHash, username }).returning();
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: 'user' });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: 'user' });
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({ success: true, user: { id: user.id, email: user.email, username: user.username }, accessToken });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: 'user' });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: 'user' });
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ success: true, user: { id: user.id, email: user.email, username: user.username }, accessToken });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const RefreshTokenSchema = z.object({
      refreshToken: z.string().optional(), // Optional if in cookie
    });
    
    const validationResult = RefreshTokenSchema.safeParse(req.body);
    if (!validationResult.success && req.body && Object.keys(req.body).length > 0) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.errors,
      });
    }
    
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'Missing refresh token' });
    
    // Validate token format (basic check)
    if (typeof refreshToken !== 'string' || refreshToken.length < 10) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    const payload = verifyToken(refreshToken);
    if (payload.type !== 'refresh') return res.status(401).json({ error: 'Invalid token type' });
    const newAccessToken = generateAccessToken({ userId: payload.userId, email: payload.email, role: payload.role });
    res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 15 * 60 * 1000 });
    res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

router.post('/verify', (req: Request, res: Response) => {
  try {
    // Validate request body
    const VerifyTokenSchema = z.object({
      token: z.string().optional(), // Optional if in Authorization header
    });
    
    const validationResult = VerifyTokenSchema.safeParse(req.body);
    if (!validationResult.success && req.body && Object.keys(req.body).length > 0) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.errors,
      });
    }
    
    const token = req.body.token || req.headers.authorization?.substring(7);
    if (!token) return res.status(400).json({ error: 'Missing token' });
    
    // Validate token format (basic check)
    if (typeof token !== 'string' || token.length < 10) {
      return res.status(400).json({ error: 'Invalid token format' });
    }
    
    const payload = verifyToken(token);
    res.json({ valid: true, user: { userId: payload.userId, email: payload.email, role: payload.role } });
  } catch (error) {
    res.json({ valid: false, error: error instanceof Error ? error.message : 'Invalid token' });
  }
});

// --- Clio OAuth Routes (Track Alpha) ---

/**
 * Initiate Clio OAuth flow
 * GET /auth/clio/authorize
 */
router.get('/clio/authorize', authLimiter, (req: Request, res: Response) => {
  try {
    const validation = validateClioCredentials();
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Clio OAuth not configured',
        message: validation.error,
        instructions: 'Set CLIO_CLIENT_ID and CLIO_CLIENT_SECRET environment variables when Clio credentials are approved.'
      });
    }

    const redirectUri = req.query.redirect_uri as string || process.env.CLIO_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/clio/callback`;
    const scopes = (req.query.scopes as string)?.split(' ') || ['read', 'write'];
    const userId = (req as any).user?.userId; // From auth middleware if available

    // Generate secure OAuth state
    const state = generateOAuthState(redirectUri, scopes, userId);
    oauthStateStore.store(state);

    // Generate authorization URL
    const { url, error } = generateClioAuthUrl(redirectUri, scopes, state.state);
    if (error) {
      return res.status(500).json({ error });
    }

    logSecurityEvent('info', 'clio_oauth_initiated', `Clio OAuth flow initiated for user ${userId}`, userId);
    res.redirect(url);
  } catch (error) {
    logSecurityEvent('error', 'clio_oauth_error', `Clio OAuth initiation failed: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to initiate Clio OAuth flow' });
  }
});

/**
 * Clio OAuth callback
 * GET /auth/clio/callback
 */
router.get('/clio/callback', authLimiter, async (req: Request, res: Response) => {
  try {
    const { code, state: receivedState, error: oauthError } = req.query;

    if (oauthError) {
      logSecurityEvent('error', 'clio_oauth_error', `Clio OAuth error: ${oauthError}`);
      return res.status(400).json({ error: `OAuth error: ${oauthError}` });
    }

    if (!code || !receivedState) {
      return res.status(400).json({ error: 'Missing authorization code or state parameter' });
    }

    // Retrieve and validate OAuth state
    const storedState = oauthStateStore.get(receivedState as string);
    if (!storedState) {
      logSecurityEvent('warning', 'clio_oauth_state_mismatch', 'Invalid or expired OAuth state parameter');
      return res.status(400).json({ error: 'Invalid or expired OAuth state parameter' });
    }

    const stateValidation = validateOAuthState(receivedState as string, storedState);
    if (!stateValidation.valid) {
      logSecurityEvent('warning', 'clio_oauth_state_validation_failed', stateValidation.error || 'State validation failed');
      return res.status(400).json({ error: stateValidation.error });
    }

    // Validate redirect URI
    const redirectUri = storedState.redirectUri;
    const redirectValidation = validateRedirectUri(req.url.split('?')[0], redirectUri);
    if (!redirectValidation.valid) {
      logSecurityEvent('warning', 'clio_oauth_redirect_mismatch', redirectValidation.error || 'Redirect URI mismatch');
      return res.status(400).json({ error: redirectValidation.error });
    }

    // Exchange authorization code for access token
    const { token, error: tokenError } = await exchangeAuthorizationCode(
      code as string,
      redirectUri,
      storedState
    );

    if (tokenError) {
      logSecurityEvent('error', 'clio_oauth_token_exchange_failed', tokenError);
      return res.status(500).json({ error: tokenError });
    }

    // Delete used state (single-use)
    oauthStateStore.delete(receivedState as string);

    // Store token securely (in production, store in database with encryption)
    // For now, return token to client (client should store securely)
    logSecurityEvent('info', 'clio_oauth_success', `Clio OAuth completed successfully for user ${storedState.userId}`, storedState.userId);
    logUserAction(storedState.userId || 'unknown', 'clio_oauth_completed', 'Clio OAuth flow completed successfully');

    // Redirect to success page or return token
    const successUrl = process.env.CLIO_OAUTH_SUCCESS_URL || '/integrations/clio/success';
    res.redirect(`${successUrl}?token=${encodeURIComponent(token.access_token)}`);
  } catch (error) {
    logSecurityEvent('error', 'clio_oauth_callback_error', `Clio OAuth callback failed: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Clio OAuth callback failed' });
  }
});

export default router;
