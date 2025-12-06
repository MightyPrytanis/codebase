import { storage } from "./storage";
import { AUTHORIZED_USERS, isUserWhitelisted } from "./whitelist";
import bcrypt from 'bcrypt';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  status: 'active' | 'disabled';
  createdAt: Date;
  lastLogin?: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  name?: string;
  status?: 'active' | 'disabled';
}

export class AdminService {
  async getAllUsers(): Promise<AdminUser[]> {
    try {
      // Get all users from storage
      const users = await storage.getAllUsers();
      return users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email || '',
        name: user.name || user.username,
        status: user.status || 'active',
        createdAt: user.createdAt || new Date(),
        lastLogin: user.lastLogin
      }));
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async createUser(userData: CreateUserRequest): Promise<AdminUser> {
    // Validate email is in whitelist
    const authorizedUser = AUTHORIZED_USERS.find(u => u.email === userData.email);
    if (!authorizedUser) {
      throw new Error('Email not in authorized user list');
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const newUser = await storage.createUser({
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
      name: userData.name,
      status: 'active'
    });

    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email || '',
      name: newUser.name || newUser.username,
      status: newUser.status || 'active',
      createdAt: newUser.createdAt || new Date()
    };
  }

  async updateUser(userId: string, updates: UpdateUserRequest): Promise<AdminUser> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If updating email, validate it's in whitelist
    if (updates.email) {
      const authorizedUser = AUTHORIZED_USERS.find(u => u.email === updates.email);
      if (!authorizedUser) {
        throw new Error('Email not in authorized user list');
      }
    }

    const updatedUser = await storage.updateUser(userId, updates);
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email || '',
      name: updatedUser.name || updatedUser.username,
      status: updatedUser.status || 'active',
      createdAt: updatedUser.createdAt || new Date(),
      lastLogin: updatedUser.lastLogin
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Don't allow deleting admin users
    if (user.username === 'davidtowne' || user.username === 'demo') {
      throw new Error('Cannot delete admin users');
    }

    await storage.deleteUser(userId);
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await storage.updateUser(userId, { password: hashedPassword });
  }

  getAuthorizedEmails(): string[] {
    return AUTHORIZED_USERS.map(user => user.email);
  }
}

export const adminService = new AdminService();