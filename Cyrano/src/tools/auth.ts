/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db.js'; // Import database connection
import { users } from '../schema.js'; // Import schema
import { eq } from 'drizzle-orm';
import { BaseTool } from './base-tool.js';

const AuthSchema = z.object({
  action: z.enum(['register', 'login', 'logout']),
  username: z.string().optional(),
  password: z.string().optional(),
  email: z.string().email().optional(),
});

export const authTool = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'auth',
      description: 'User authentication tool for registration, login, and logout',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['register', 'login', 'logout'],
            description: 'The authentication action to perform'
          },
          username: {
            type: 'string',
            description: 'Username for registration/login'
          },
          password: {
            type: 'string',
            description: 'Password for registration/login'
          },
          email: {
            type: 'string',
            description: 'Email address for registration'
          }
        },
        required: ['action']
      }
    };
  }

  async execute(args: any) {
    const { action, username, password, email } = AuthSchema.parse(args);

    switch (action) {
      case 'register':
        return await this.register(username!, password!, email!);

      case 'login':
        return await this.login(username!, password!);

      case 'logout':
        return await this.logout();

      default:
        return this.createErrorResult(`Unknown auth action: ${action}`);
    }
  }

  async register(username: string, password: string, email: string) {
    try {
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existingUser.length > 0) {
        return this.createErrorResult('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      await db.insert(users).values({
        username,
        email,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return this.createSuccessResult('User registered successfully');
    } catch (error) {
      return this.createErrorResult(`Registration failed: ${(error as Error).message}`);
    }
  }

  async login(username: string, password: string) {
    try {
      // Find user
      const userResult = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (userResult.length === 0) {
        return this.createErrorResult('User not found');
      }

      const user = userResult[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return this.createErrorResult('Invalid password');
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      return this.createSuccessResult(`Login successful. Token: ${token}`);
    } catch (error) {
      return this.createErrorResult(`Login failed: ${(error as Error).message}`);
    }
  }

  async logout() {
    // For stateless JWT, logout is just client-side token removal
    return this.createSuccessResult('Logged out successfully');
  }
})();