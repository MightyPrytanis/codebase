import { db } from '../db';
import { disposableTokens, users } from '../../shared/schema';
import { eq, and, lt } from 'drizzle-orm';
import crypto from 'crypto';

export class DisposableTokenService {
  // Generate a secure disposable access token
  static async createToken({
    createdBy,
    description,
    expirationHours = 24
  }: {
    createdBy: string;
    description: string;
    expirationHours?: number;
  }) {
    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const [newToken] = await db.insert(disposableTokens).values({
      token,
      createdBy,
      description,
      expiresAt
    }).returning();

    return {
      token,
      url: `/ai-access/${token}`,
      fullUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/ai-access/${token}`,
      expiresAt: expiresAt.toISOString(),
      description
    };
  }

  // Validate and consume a disposable token
  static async validateAndUseToken(token: string, ipAddress?: string, userAgent?: string) {
    const now = new Date();
    
    // Find valid, unused, non-expired token
    const [tokenRecord] = await db
      .select()
      .from(disposableTokens)
      .where(
        and(
          eq(disposableTokens.token, token),
          eq(disposableTokens.usedAt, null),
          lt(now, disposableTokens.expiresAt)
        )
      );

    if (!tokenRecord) {
      return { valid: false, reason: 'Token not found, expired, or already used' };
    }

    // Mark token as used
    await db
      .update(disposableTokens)
      .set({
        usedAt: now,
        ipAddress,
        userAgent
      })
      .where(eq(disposableTokens.id, tokenRecord.id));

    // Get creator info
    const [creator] = await db
      .select({ username: users.username, name: users.name })
      .from(users)
      .where(eq(users.id, tokenRecord.createdBy));

    return {
      valid: true,
      tokenId: tokenRecord.id,
      description: tokenRecord.description,
      createdBy: creator?.username || 'Unknown',
      creatorName: creator?.name || 'Unknown User'
    };
  }

  // List active tokens for a user
  static async getUserTokens(userId: string) {
    const now = new Date();
    
    return await db
      .select()
      .from(disposableTokens)
      .where(
        and(
          eq(disposableTokens.createdBy, userId),
          lt(now, disposableTokens.expiresAt)
        )
      )
      .orderBy(disposableTokens.createdAt);
  }

  // Clean up expired tokens
  static async cleanupExpiredTokens() {
    const now = new Date();
    
    const result = await db
      .delete(disposableTokens)
      .where(lt(disposableTokens.expiresAt, now));
    
    return result;
  }

  // Revoke a specific token
  static async revokeToken(tokenId: string, userId: string) {
    const now = new Date();
    
    await db
      .update(disposableTokens)
      .set({
        usedAt: now,
        description: 'Manually revoked'
      })
      .where(
        and(
          eq(disposableTokens.id, tokenId),
          eq(disposableTokens.createdBy, userId)
        )
      );
  }
}