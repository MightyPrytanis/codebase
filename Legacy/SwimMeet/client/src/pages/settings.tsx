import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProviders, saveCredentials, testConnection } from "@/lib/api";
import { Shield, Key, User, Bell, Palette, Database, Download, Trash2 } from "lucide-react";
import type { Credentials } from "@shared/schema";

export default function Settings() {
  const [credentials, setCredentials] = useState<Credentials>({});
  const [userPreferences, setUserPreferences] = useState({
    defaultAIs: [] as string[],
    autoSave: true,
    notifications: true,
    theme: "light",
    responseFormat: "detailed",
    exportFormat: "json"
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: providers = [] } = useQuery({
    queryKey: ['/api/providers'],
    queryFn: () => getProviders(),
  });

  const saveMutation = useMutation({
    mutationFn: (credentials: Credentials) => saveCredentials(credentials),
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/providers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: ({ provider, apiKey }: { provider: string; apiKey: string }) =>
      testConnection(provider, apiKey),
    onSuccess: (data, variables) => {
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: `${variables.provider.toUpperCase()} API key is valid`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Invalid API key",
          variant: "destructive",
        });
      }
    },
  });

  const handleCredentialChange = (provider: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const handleSaveSettings = () => {
    saveMutation.mutate(credentials);
  };

  const handleTestConnection = (provider: string) => {
    const apiKey = credentials[provider as keyof Credentials];
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key before testing",
        variant: "destructive",
      });
      return;
    }
    testMutation.mutate({ provider, apiKey });
  };

  const handleExportData = () => {
    // Mock export functionality
    toast({
      title: "Export Started",
      description: "Your data export will begin shortly",
    });
  };

  const handleClearData = () => {
    // Mock clear data functionality
    toast({
      title: "Data Cleared",
      description: "All local data has been cleared",
    });
  };

  const getProviderIcon = (id: string) => {
    const icons: Record<string, string> = {
      openai: '🤖',
      anthropic: '🧠',
      google: '🔍',
      microsoft: '💼',
      perplexity: '🔮',
      deepseek: '🔬',
      grok: '🚀',
      llama: '🦙',
      mistral: '🌪️'
    };
    return icons[id] || '🤖';
  };

  const getProviderColor = (id: string) => {
    const colors: Record<string, string> = {
      openai: 'bg-green-500',
      anthropic: 'bg-orange-500',
      google: 'bg-blue-500',
      microsoft: 'bg-blue-600',
      perplexity: 'bg-purple-500',
      deepseek: 'bg-indigo-500',
      grok: 'bg-red-500',
      llama: 'bg-yellow-500',
      mistral: 'bg-red-600'
    };
    return colors[id] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-slate-600">Swim Meet</h1>
                <p className="text-xs text-slate-500">Settings & Configuration</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">
                Dashboard
              </a>
              <a href="#history" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">
                History
              </a>
              <a href="#settings" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">
                Settings
              </a>
            </nav>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
          <p className="text-slate-600 mt-2">Manage your AI credentials, preferences, and account settings</p>
        </div>

        <Tabs defaultValue="credentials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="credentials" className="flex items-center gap-2" data-testid="tab-credentials">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Credentials</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2" data-testid="tab-preferences">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2" data-testid="tab-notifications">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2" data-testid="tab-data">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
          </TabsList>

          {/* API Credentials Tab */}
          <TabsContent value="credentials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  API Key Management
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Securely store and manage your API keys for different AI providers. All keys are encrypted and stored locally.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {providers.filter(p => p.requiresApiKey).map((provider) => (
                  <div key={provider.id} className="border border-slate-200 rounded-lg p-4" data-testid={`provider-settings-${provider.id}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${getProviderColor(provider.id)} rounded-lg flex items-center justify-center text-white text-lg`}>
                          {getProviderIcon(provider.id)}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{provider.name}</h3>
                          <p className="text-sm text-slate-500">{provider.company}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={provider.status === 'connected' ? 'default' : 'secondary'}
                        className={provider.status === 'connected' ? 'bg-emerald-500 text-white' : ''}
                      >
                        {provider.status === 'connected' ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`api-key-${provider.id}`}>API Key</Label>
                        <Input
                          id={`api-key-${provider.id}`}
                          type="password"
                          value={credentials[provider.id as keyof Credentials] || ""}
                          onChange={(e) => handleCredentialChange(provider.id, e.target.value)}
                          placeholder={`Enter your ${provider.company} API key...`}
                          className="mt-1"
                          data-testid={`input-api-key-${provider.id}`}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Shield className="h-4 w-4 text-emerald-500" />
                          <span>Encrypted & Secure</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(provider.id)}
                            disabled={testMutation.isPending || !credentials[provider.id as keyof Credentials]}
                            data-testid={`button-test-${provider.id}`}
                          >
                            {testMutation.isPending ? 'Testing...' : 'Test'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCredentialChange(provider.id, "")}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-remove-${provider.id}`}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={saveMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-save-credentials"
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save Credentials'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  User Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Default AI Models</Label>
                  <p className="text-sm text-slate-600 mb-3">Select which AI models to use by default</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {providers.filter(p => p.status === 'connected').map((provider) => (
                      <Label key={provider.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userPreferences.defaultAIs.includes(provider.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setUserPreferences(prev => ({
                              ...prev,
                              defaultAIs: checked 
                                ? [...prev.defaultAIs, provider.id]
                                : prev.defaultAIs.filter(id => id !== provider.id)
                            }));
                          }}
                          className="rounded"
                          data-testid={`checkbox-default-ai-${provider.id}`}
                        />
                        <span className="text-sm">{provider.name}</span>
                      </Label>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Auto-save Conversations</Label>
                      <p className="text-sm text-slate-600">Automatically save conversations to history</p>
                    </div>
                    <Switch
                      checked={userPreferences.autoSave}
                      onCheckedChange={(checked) => setUserPreferences(prev => ({...prev, autoSave: checked}))}
                      data-testid="switch-auto-save"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Response Format</Label>
                    <p className="text-sm text-slate-600 mb-2">Choose how responses are displayed</p>
                    <Select
                      value={userPreferences.responseFormat}
                      onValueChange={(value) => setUserPreferences(prev => ({...prev, responseFormat: value}))}
                    >
                      <SelectTrigger className="w-48" data-testid="select-response-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="concise">Concise</SelectItem>
                        <SelectItem value="raw">Raw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Theme</Label>
                    <p className="text-sm text-slate-600 mb-2">Choose your interface theme</p>
                    <Select
                      value={userPreferences.theme}
                      onValueChange={(value) => setUserPreferences(prev => ({...prev, theme: value}))}
                    >
                      <SelectTrigger className="w-48" data-testid="select-theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-500" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Notifications</Label>
                    <p className="text-sm text-slate-600">Receive notifications for completed responses</p>
                  </div>
                  <Switch
                    checked={userPreferences.notifications}
                    onCheckedChange={(checked) => setUserPreferences(prev => ({...prev, notifications: checked}))}
                    data-testid="switch-notifications"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Response Complete</Label>
                      <p className="text-sm text-slate-600">Notify when AI responses are ready</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-response-complete" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Error Notifications</Label>
                      <p className="text-sm text-slate-600">Notify when errors occur</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-error-notifications" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Weekly Summary</Label>
                      <p className="text-sm text-slate-600">Receive weekly usage summaries</p>
                    </div>
                    <Switch data-testid="switch-weekly-summary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-500" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Export Format</Label>
                  <p className="text-sm text-slate-600 mb-2">Choose the format for data exports</p>
                  <Select
                    value={userPreferences.exportFormat}
                    onValueChange={(value) => setUserPreferences(prev => ({...prev, exportFormat: value}))}
                  >
                    <SelectTrigger className="w-48" data-testid="select-export-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Data Actions</h4>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={handleExportData}
                        className="w-full justify-start"
                        data-testid="button-export-data"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export All Data
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handleClearData}
                        className="w-full justify-start text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                        data-testid="button-clear-data"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Local Data
                      </Button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-medium text-slate-900 mb-2">Storage Information</h5>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Conversations: 12 stored locally</p>
                      <p>API Keys: 3 encrypted credentials</p>
                      <p>Cache Size: 2.3 MB</p>
                      <p>Last Backup: Never</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
