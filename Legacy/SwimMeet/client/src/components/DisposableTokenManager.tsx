import React, { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, Clock, Check, X, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface DisposableToken {
  id: string;
  description: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  ipAddress: string | null;
  isExpired: boolean;
  isUsed: boolean;
}

export function DisposableTokenManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTokenDescription, setNewTokenDescription] = useState('');
  const [expirationHours, setExpirationHours] = useState(24);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['/api/disposable-tokens'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const createTokenMutation = useMutation({
    mutationFn: async (data: { description: string; expirationHours: number }) => {
      const response = await apiRequest('/api/disposable-tokens', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/disposable-tokens'] });
      setShowCreateForm(false);
      setNewTokenDescription('');
      
      // Show the full URL and copy to clipboard
      const fullUrl = data.fullUrl;
      navigator.clipboard.writeText(fullUrl);
      
      toast({
        title: "✅ Disposable Access Token Created",
        description: `URL copied to clipboard! Share: ${fullUrl}`,
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating token",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      await apiRequest(`/api/disposable-tokens/${tokenId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/disposable-tokens'] });
      toast({
        title: "Token Revoked",
        description: "Access token has been disabled",
        variant: "default"
      });
    }
  });

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenDescription.trim()) return;

    createTokenMutation.mutate({
      description: newTokenDescription.trim(),
      expirationHours
    });
  };

  const copyTokenUrl = async (token: DisposableToken) => {
    const baseUrl = window.location.origin;
    const tokenUrl = `${baseUrl}/ai-access/${token.id}`;
    
    try {
      await navigator.clipboard.writeText(tokenUrl);
      setCopiedTokenId(token.id);
      setTimeout(() => setCopiedTokenId(null), 2000);
      
      toast({
        title: "URL Copied",
        description: "Access URL copied to clipboard",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (token: DisposableToken) => {
    if (token.isUsed) return '#16a34a'; // Green
    if (token.isExpired) return '#dc2626'; // Red
    return '#eab308'; // Yellow (active)
  };

  const getStatusText = (token: DisposableToken) => {
    if (token.isUsed) return 'Used';
    if (token.isExpired) return 'Expired';
    return 'Active';
  };

  if (isLoading) {
    return (
      <div className="glass-panel-large swim-section">
        <h3 className="panel-heading" style={{ color: '#ffd700' }}>
          🔗 AI Access Links
        </h3>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading access tokens...
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel-large swim-section">
      <h3 className="panel-heading" style={{ color: '#ffd700' }}>
        🔗 Secure AI Access Links
      </h3>
      
      <div className="swim-panel" style={{ background: 'linear-gradient(135deg, #ffd700 5%, #ffffff 100%)' }}>
        
        {/* Info section */}
        <div style={{ 
          background: '#e3f2fd', 
          padding: '16px', 
          marginBottom: '20px', 
          border: '1px solid #2196f3',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>🤖 Passwordless AI Access</h4>
          <p style={{ margin: '0 0 8px 0', color: '#333' }}>
            Create secure, one-time-use URLs that let AIs access SwimMeet without passwords. 
            Perfect for sharing with Claude, ChatGPT, or other AIs for analysis.
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#555' }}>
            <li>Each link works only once and then self-destructs</li>
            <li>Set custom expiration times (1 hour to 1 week)</li>
            <li>Track when and where links are used</li>
            <li>Revoke active links anytime</li>
          </ul>
        </div>

        {/* Create token button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            className="swim-button swim-button--primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Create AI Access Link
          </button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <form onSubmit={handleCreateToken} style={{ 
            background: '#f0f8ff', 
            padding: '20px', 
            marginBottom: '20px',
            border: '1px solid #2196f3'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#1976d2' }}>Create New Access Link</h4>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Description (what this link is for)
              </label>
              <input
                type="text"
                value={newTokenDescription}
                onChange={(e) => setNewTokenDescription(e.target.value)}
                placeholder="e.g., ChatGPT analysis of marketing data, Claude review of code"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Expires in
              </label>
              <select
                value={expirationHours}
                onChange={(e) => setExpirationHours(Number(e.target.value))}
                style={{ 
                  padding: '8px', 
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours (default)</option>
                <option value={72}>3 days</option>
                <option value={168}>1 week</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="swim-button swim-button--primary"
                disabled={createTokenMutation.isPending || !newTokenDescription.trim()}
                style={{ fontSize: '14px' }}
              >
                {createTokenMutation.isPending ? 'Creating...' : 'Create Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="swim-button swim-button--secondary"
                style={{ fontSize: '14px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tokens list */}
        {tokens.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            background: '#f9f9f9',
            border: '1px solid #ddd'
          }}>
            <ExternalLink size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
            <p>No AI access links created yet.</p>
            <p style={{ fontSize: '14px' }}>Create your first link to securely share SwimMeet with AI assistants.</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '12px'
          }}>
            {tokens.map((token: DisposableToken) => (
              <div key={token.id} style={{
                background: 'white',
                border: '1px solid #ddd',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {token.description}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Created: {new Date(token.createdAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Expires: {new Date(token.expiresAt).toLocaleString()}
                  </div>
                  {token.usedAt && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Used: {new Date(token.usedAt).toLocaleString()}
                      {token.ipAddress && ` from ${token.ipAddress}`}
                    </div>
                  )}
                </div>

                <div style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  background: getStatusColor(token),
                  textAlign: 'center',
                  minWidth: '60px'
                }}>
                  {getStatusText(token)}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {!token.isUsed && !token.isExpired && (
                    <button
                      onClick={() => copyTokenUrl(token)}
                      className="swim-button swim-button--ghost"
                      style={{ 
                        padding: '6px 8px', 
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Copy access URL"
                    >
                      {copiedTokenId === token.id ? (
                        <Check size={14} style={{ color: '#16a34a' }} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  )}
                  
                  {!token.isUsed && (
                    <button
                      onClick={() => revokeTokenMutation.mutate(token.id)}
                      className="swim-button swim-button--ghost"
                      style={{ 
                        padding: '6px 8px', 
                        fontSize: '12px',
                        color: '#dc2626'
                      }}
                      title="Revoke access"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}