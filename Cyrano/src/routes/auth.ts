/**
 * Authentication Routes - Week 1 Implementation
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

export default router;
