import { db } from "./db";
import { users, conversations, responses } from "@shared/schema";
import { type User, type InsertUser, type Conversation, type InsertConversation, type Response, type InsertResponse } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserCredentials(userId: string, credentials: string): Promise<void> {
    await db
      .update(users)
      .set({ encryptedCredentials: { encrypted: credentials } })
      .where(eq(users.id, userId));
  }

  // Conversation methods
  async createConversation(userId: string, insertConversation: InsertConversation): Promise<Conversation> {
    const conversationData = {
      userId,
      title: insertConversation.title,
      query: insertConversation.query,
      mode: insertConversation.mode,
      attachedFiles: insertConversation.attachedFiles || [],
      workflowState: insertConversation.workflowState || {}
    };
    
    const [conversation] = await db
      .insert(conversations)
      .values(conversationData)
      .returning();
    return conversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set(data)
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async updateConversationWorkflow(conversationId: string, workflowState: any): Promise<void> {
    await db
      .update(conversations)
      .set({ workflowState })
      .where(eq(conversations.id, conversationId));
  }

  // Response methods
  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const responseData = {
      conversationId: insertResponse.conversationId,
      aiProvider: insertResponse.aiProvider,
      content: insertResponse.content,
      status: insertResponse.status || 'pending',
      workStep: insertResponse.workStep || null,
      handoffData: insertResponse.handoffData || {},
      metadata: insertResponse.metadata || {}
    };
    
    const [response] = await db.insert(responses).values(responseData).returning();
    return response;
  }

  async getConversationResponses(conversationId: string): Promise<Response[]> {
    return await db
      .select()
      .from(responses)
      .where(eq(responses.conversationId, conversationId))
      .orderBy(responses.createdAt);
  }

  async updateResponseContent(id: string, content: string, status: string): Promise<void> {
    await db
      .update(responses)
      .set({ content, status })
      .where(eq(responses.id, id));
  }

  async updateResponse(id: string, updates: Partial<Response>): Promise<Response> {
    const [response] = await db
      .update(responses)
      .set(updates)
      .where(eq(responses.id, id))
      .returning();
    return response;
  }

  async updateResponseMetadata(id: string, metadata: Record<string, any>): Promise<Response> {
    const [response] = await db
      .update(responses)
      .set({ metadata })
      .where(eq(responses.id, id))
      .returning();
    return response;
  }

  async getResponse(id: string): Promise<Response | undefined> {
    const [response] = await db.select().from(responses).where(eq(responses.id, id));
    return response;
  }

  async getProviderStats(): Promise<Record<string, any>> {
    const allResponses = await db.select().from(responses);
    const stats: Record<string, any> = {};

    // Group responses by AI provider
    const responsesByProvider = allResponses.reduce((acc, response) => {
      if (!acc[response.aiProvider]) {
        acc[response.aiProvider] = [];
      }
      acc[response.aiProvider].push(response);
      return acc;
    }, {} as Record<string, Response[]>);

    // Calculate stats for each provider
    Object.entries(responsesByProvider).forEach(([provider, responses]) => {
      const completeResponses = responses.filter(r => r.status === 'complete');
      const verifiedResponses = responses.filter(r => r.verificationStatus === 'complete');
      const awardCounts = { gold: 0, silver: 0, bronze: 0, finished: 0, quit: 0, titanic: 0 };
      
      let totalResponseTime = 0;
      let responseTimeCount = 0;
      let totalAccuracyScore = 0;
      let accuracyCount = 0;

      completeResponses.forEach(response => {
        // Count awards
        if (response.award && awardCounts.hasOwnProperty(response.award)) {
          awardCounts[response.award as keyof typeof awardCounts]++;
        }
        
        // Calculate average response times
        if (response.responseTimeMs) {
          totalResponseTime += parseInt(response.responseTimeMs);
          responseTimeCount++;
        }

        // Calculate verification scores
        if (response.verificationResults && response.verificationResults.length > 0) {
          response.verificationResults.forEach(verification => {
            totalAccuracyScore += verification.accuracyScore;
            accuracyCount++;
          });
        }
      });

      stats[provider] = {
        totalResponses: responses.length,
        completeResponses: completeResponses.length,
        verifiedResponses: verifiedResponses.length,
        awards: awardCounts,
        avgResponseTimeMs: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : null,
        avgAccuracyScore: accuracyCount > 0 ? Math.round((totalAccuracyScore / accuracyCount) * 10) / 10 : null,
        successRate: responses.length > 0 ? Math.round((completeResponses.length / responses.length) * 100) : 0,
        verificationRate: completeResponses.length > 0 ? Math.round((verifiedResponses.length / completeResponses.length) * 100) : 0
      };
    });

    return stats;
  }

  // File attachment methods (stub implementations for database storage)
  async createFileAttachment(attachment: any): Promise<any> {
    // Implementation would create file attachment record in database
    // For now, return the attachment object
    return { ...attachment, id: attachment.id, createdAt: new Date() };
  }

  async getFileAttachment(fileId: string): Promise<any> {
    // Implementation would fetch file attachment from database
    return null;
  }

  async getUserFileAttachments(userId: string): Promise<any[]> {
    // Implementation would fetch user's file attachments from database
    return [];
  }

  async deleteFileAttachment(fileId: string): Promise<void> {
    // Implementation would delete file attachment from database
  }
}