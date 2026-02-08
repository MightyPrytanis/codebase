/**
 * Beta Portal API Routes
 * 
 * Routes for the cognisint.com beta portal (separate repository)
 * Handles invitation validation, registration, login, feedback, and Pathfinder integration
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { betaTestSupport } from '../tools/beta-test-support.js';
import { cyranoPathfinder } from '../tools/cyrano-pathfinder.js';
import { authenticateJWT } from '../middleware/security.js';

const router = Router();

/**
 * Validate invitation token
 * POST /api/beta/validate-invitation
 */
router.post('/validate-invitation', async (req: Request, res: Response) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    
    // Use beta test support tool to validate invitation
    const result = await betaTestSupport.execute({
      action: 'registration',
      user_query: `Validate invitation token: ${token}`,
      context: {
        invitation_token: token,
      },
    });
    
    const firstContent = result.content?.[0];
    const errorText = firstContent && firstContent.type === 'text' && 'text' in firstContent
      ? firstContent.text
      : 'Invalid invitation token';

    if (result.isError) {
      return res.status(400).json({ 
        valid: false, 
        error: errorText 
      });
    }
    
    // Extract validation result from tool response
    // TODO: Parse result.content to get email, expiration, etc.
    res.json({ valid: true });
  } catch (error) {
    res.status(400).json({ 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid request' 
    });
  }
});

/**
 * Register beta tester
 * POST /api/beta/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      invitation_token: z.string(),
    });
    
    const data = schema.parse(req.body);
    
    // Use beta test support tool for registration
    const result = await betaTestSupport.execute({
      action: 'registration',
      user_query: `Register beta tester with email: ${data.email}`,
      context: {
        invitation_token: data.invitation_token,
        email: data.email,
        password: data.password,
      },
    });
    
    const firstContent = result.content?.[0];
    const errorText = firstContent && firstContent.type === 'text' && 'text' in firstContent
      ? firstContent.text
      : 'Registration failed';

    if (result.isError) {
      return res.status(400).json({ 
        success: false, 
        error: errorText 
      });
    }
    
    // TODO: Create actual user account, hash password, generate JWT
    // For now, return success
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration failed' 
    });
  }
});

/**
 * Login beta tester
 * POST /api/beta/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string(),
    }).parse(req.body);
    
    // TODO: Implement actual login
    // Verify credentials, generate JWT, set httpOnly cookies
    
    // For now, return placeholder
    res.json({ 
      success: true, 
      token: 'jwt-token-placeholder',
      user: { email },
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid credentials' 
    });
  }
});

/**
 * Submit feedback
 * POST /api/beta/feedback
 * Requires authentication
 */
router.post('/feedback', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      type: z.enum(['bug', 'feature-request', 'general', 'praise']),
      title: z.string(),
      description: z.string(),
      steps_to_reproduce: z.string().optional(),
      expected_behavior: z.string().optional(),
      actual_behavior: z.string().optional(),
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
    
    const firstContent = result.content?.[0];
    const errorText = firstContent && firstContent.type === 'text' && 'text' in firstContent
      ? firstContent.text
      : 'Feedback submission failed';

    if (result.isError) {
      return res.status(400).json({ 
        success: false, 
        error: errorText 
      });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Feedback submission failed' 
    });
  }
});

/**
 * Get installation guide
 * GET /api/beta/install-guide?platform=macos|windows|linux
 */
router.get('/install-guide', async (req: Request, res: Response) => {
  try {
    const platform = (req.query.platform as string) || 'auto';
    
    // Use beta test support tool to get installation guide
    const result = await betaTestSupport.execute({
      action: 'installation',
      user_query: `Get installation guide for ${platform}`,
      context: { platform },
    });
    
    const firstContent = result.content?.[0];
    const errorText = firstContent && firstContent.type === 'text' && 'text' in firstContent
      ? firstContent.text
      : 'Failed to get installation guide';

    if (result.isError) {
      return res.status(500).json({ 
        error: errorText 
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get installation guide' 
    });
  }
});

/**
 * Cyrano Pathfinder endpoint (for embedded chat)
 * POST /api/beta/pathfinder
 * Requires authentication
 */
router.post('/pathfinder', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { message, context } = z.object({
      message: z.string(),
      context: z.record(z.string(), z.any()).optional(),
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
    
    const firstContent = result.content?.[0];
    const errorText = firstContent && firstContent.type === 'text' && 'text' in firstContent
      ? firstContent.text
      : 'Pathfinder request failed';

    if (result.isError) {
      return res.status(500).json({ 
        error: errorText 
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Pathfinder request failed' 
    });
  }
});

/**
 * Get beta tester status
 * GET /api/beta/status
 * Requires authentication
 */
router.get('/status', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    // TODO: Get beta tester status from database
    res.json({
      user_id: userId,
      status: 'active',
      registered_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get status' 
    });
  }
});

export default router;
)
)
)
)