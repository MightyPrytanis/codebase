import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Cloud, 
  HardDrive, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Trash2, 
  ExternalLink,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CloudProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresAuth: boolean;
  maxFileSize: number;
  costModel: 'user_owned' | 'platform_paid' | 'free';
}

interface CloudConnection {
  id: string;
  providerId: string;
  displayName: string;
  connectedAt: string;
  lastUsed?: string;
  isActive: boolean;
}

interface CloudSettings {
  preferredProvider: string;
  fallbackToLocal: boolean;
  maxFileAge: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

interface CloudStorageSettingsProps {
  authToken: string;
}

export function CloudStorageSettings({ authToken }: CloudStorageSettingsProps) {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState<string | null>(null);

  const makeAuthRequest = (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // Fetch available providers
  const { data: providers = [] } = useQuery<CloudProvider[]>({
    queryKey: ['/api/cloud/providers'],
    queryFn: () => makeAuthRequest('/api/cloud/providers').then(res => res.json()),
    enabled: !!authToken,
  });

  // Fetch user's connections
  const { data: connections = [] } = useQuery<CloudConnection[]>({
    queryKey: ['/api/cloud/connections'],
    queryFn: () => makeAuthRequest('/api/cloud/connections').then(res => res.json()),
    enabled: !!authToken,
  });

  // Fetch user settings
  const { data: settings } = useQuery<CloudSettings>({
    queryKey: ['/api/cloud/settings'],
    queryFn: () => makeAuthRequest('/api/cloud/settings').then(res => res.json()),
    enabled: !!authToken,
  });

  // Connect to cloud provider
  const connectMutation = useMutation({
    mutationFn: async (providerId: string) => {
      setConnecting(providerId);
      
      // Handle different provider connections
      if (providerId === 'google_drive') {
        // Google Drive OAuth flow
        const authUrl = `https://accounts.google.com/oauth/authorize?client_id=your-client-id&redirect_uri=${encodeURIComponent('http://localhost:5000/auth/google/callback')}&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.file')}&response_type=code&access_type=offline`;
        
        const popup = window.open(authUrl, 'google-oauth', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        // Simulate successful connection for demo
        return new Promise((resolve) => {
          setTimeout(() => {
            popup?.close();
            resolve({ success: true, provider: 'Google Drive', message: 'Connected successfully!' });
          }, 3000);
        });
      }
      
      if (providerId === 'dropbox') {
        alert('Dropbox integration: Visit dropbox.com/developers to create an app and get API credentials. Once configured, you can connect your Dropbox account for cloud file storage.');
        return { success: false, message: 'Requires setup' };
      }
      
      if (providerId === 'onedrive') {
        alert('OneDrive integration: Visit portal.azure.com to register your app and configure Microsoft Graph API access. This enables secure OneDrive file storage.');
        return { success: false, message: 'Requires setup' };
      }
      
      if (providerId === 'icloud') {
        alert('iCloud integration: iCloud does not provide public APIs for third-party access. Consider using Google Drive, Dropbox, or OneDrive for cloud storage needs.');
        return { success: false, message: 'Not supported' };
      }
      
      // Default local filesystem
      return { success: true, provider: 'Local Filesystem', message: 'Using local storage' };
    },
    onSuccess: (data: any) => {
      if (data.success) {
        alert(`✓ ${data.provider} connected successfully!\n\n${data.message}`);
        queryClient.invalidateQueries({ queryKey: ['/api/cloud/connections'] });
      }
      setConnecting(null);
    },
    onError: (error) => {
      console.error('Connection error:', error);
      alert(`❌ Connection failed: ${error.message}`);
      setConnecting(null);
    }
  });

  // Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<CloudSettings>) => {
      const response = await makeAuthRequest('/api/cloud/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloud/settings'] });
    }
  });

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google_drive': return '🗂️';
      case 'dropbox': return '📦';
      case 'onedrive': return '☁️';
      case 'icloud': return '☁️';
      case 'local_filesystem': return '💾';
      default: return '📁';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getConnectionForProvider = (providerId: string) => {
    return connections.find(conn => conn.providerId === providerId && conn.isActive);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Cloud Storage Settings</h2>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const connection = getConnectionForProvider(provider.id);
          const isConnected = !!connection;
          const isConnecting = connecting === provider.id;

          const isLocalStorage = provider.id === 'local_filesystem';
          const isInDevelopment = !isLocalStorage;
          
          return (
            <Card key={provider.id} className={`relative ${isInDevelopment ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getProviderIcon(provider.id)}</span>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {provider.name}
                        {isInDevelopment && (
                          <Badge variant="outline" className="bg-gray-100 text-gray-600 text-xs">
                            In Development
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {provider.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isLocalStorage && isConnected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : isLocalStorage ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Ready
                      </Badge>
                    ) : isConnected ? (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected (Dev)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        In Development
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {provider.costModel === 'user_owned' ? 'User Owned' : 
                       provider.costModel === 'free' ? 'Free' : 'Paid'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <div>Max file size: {formatFileSize(provider.maxFileSize)}</div>
                    {connection && (
                      <div className="mt-1">
                        <div>Account: {connection.displayName}</div>
                        <div>Connected: {new Date(connection.connectedAt).toLocaleDateString()}</div>
                        {connection.lastUsed && (
                          <div>Last used: {new Date(connection.lastUsed).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isLocalStorage ? (
                      <Button
                        size="sm"
                        onClick={() => connectMutation.mutate(provider.id)}
                        disabled={isConnected}
                        className="flex items-center gap-1"
                        variant={isConnected ? "outline" : "default"}
                      >
                        {isConnected ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <HardDrive className="w-3 h-3" />
                            Enable Local Storage
                          </>
                        )}
                      </Button>
                    ) : !isConnected ? (
                      <Button
                        size="sm"
                        onClick={() => {}}
                        disabled={true}
                        className="flex items-center gap-1 opacity-50 cursor-not-allowed"
                        variant="outline"
                      >
                        <span className="text-gray-500">Coming Soon</span>
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {}}
                          disabled={true}
                          className="opacity-50"
                        >
                          {settings?.preferredProvider === provider.id ? 'Default (Dev)' : 'Set Default (Dev)'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="px-2 opacity-50"
                          disabled={true}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Settings Panel */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Storage Preferences
            </CardTitle>
            <CardDescription>
              Configure how files are stored and managed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preferred Provider
                </label>
                <select
                  value={settings.preferredProvider}
                  onChange={(e) => updateSettingsMutation.mutate({ 
                    preferredProvider: e.target.value 
                  })}
                  className="w-full p-2 border rounded-md"
                >
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  File Retention (days)
                </label>
                <input
                  type="number"
                  value={settings.maxFileAge}
                  onChange={(e) => updateSettingsMutation.mutate({ 
                    maxFileAge: parseInt(e.target.value) 
                  })}
                  min="1"
                  max="365"
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.fallbackToLocal}
                  onChange={(e) => updateSettingsMutation.mutate({ 
                    fallbackToLocal: e.target.checked 
                  })}
                />
                <span className="text-sm">Fallback to local storage if cloud fails</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.compressionEnabled}
                  onChange={(e) => updateSettingsMutation.mutate({ 
                    compressionEnabled: e.target.checked 
                  })}
                />
                <span className="text-sm">Enable compression</span>
              </label>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Cloud className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900 mb-1">
                    Platform Independence Benefits
                  </div>
                  <div className="text-blue-800">
                    Your files are stored in your own cloud accounts, giving you complete data ownership 
                    and zero vendor lock-in. Switch providers anytime or use multiple accounts simultaneously.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}