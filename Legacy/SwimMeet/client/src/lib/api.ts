import { apiRequest } from "./queryClient";
import type { AIProvider, QueryRequest, AIResponse, Credentials } from "@shared/schema";

export async function getProviders(userId?: string): Promise<AIProvider[]> {
  const response = await fetch(`/api/providers?userId=${userId || 'default-user'}`);
  if (!response.ok) throw new Error('Failed to fetch providers');
  return response.json();
}

export async function testConnection(provider: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
  const response = await apiRequest('POST', '/api/credentials/test', { provider, apiKey });
  return response.json();
}

export async function saveCredentials(credentials: Credentials, userId?: string): Promise<void> {
  await apiRequest('POST', '/api/credentials', { 
    credentials, 
    userId: userId || 'default-user' 
  });
}

export async function submitQuery(query: string, selectedAIs: string[], userId?: string, conversationId?: string): Promise<{ conversationId: string; responses: AIResponse[] }> {
  const response = await apiRequest('POST', '/api/query', {
    query,
    selectedAIs,
    userId: userId || 'default-user',
    conversationId
  });
  return response.json();
}

export async function getConversationResponses(conversationId: string): Promise<AIResponse[]> {
  const response = await fetch(`/api/conversations/${conversationId}/responses`);
  if (!response.ok) throw new Error('Failed to fetch responses');
  return response.json();
}

export async function getConversations(userId?: string): Promise<any[]> {
  const response = await fetch(`/api/conversations?userId=${userId || 'default-user'}`);
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return response.json();
}

export async function humanizeResponse(responseText: string, userId?: string): Promise<{ humanizedResponse: string }> {
  const response = await apiRequest('POST', '/api/humanize', {
    response: responseText,
    userId: userId || 'default-user'
  });
  return response.json();
}

export async function factCheckResponse(responseText: string, originalQuery: string, userId?: string): Promise<{ factCheck: string }> {
  const response = await apiRequest('POST', '/api/fact-check', {
    response: responseText,
    query: originalQuery,
    userId: userId || 'default-user'
  });
  return response.json();
}

export async function generateReply(responseText: string, originalQuery: string, context?: string, userId?: string): Promise<{ reply: string }> {
  const response = await apiRequest('POST', '/api/reply', {
    response: responseText,
    originalQuery,
    context,
    userId: userId || 'default-user'
  });
  return response.json();
}

export async function testProviderConnection(providerId: string, userId?: string): Promise<{ success: boolean; error?: string }> {
  const response = await apiRequest('POST', '/api/providers/test', {
    providerId,
    userId: userId || 'default-user'
  });
  return response.json();
}
