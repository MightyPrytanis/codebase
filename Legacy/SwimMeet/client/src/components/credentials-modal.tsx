import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Shield, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProviders, testConnection, saveCredentials } from "@/lib/api";
import type { Credentials } from "@shared/schema";

interface CredentialsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CredentialsModal({ open, onClose }: CredentialsModalProps) {
  const [credentials, setCredentials] = useState<Credentials>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: providers = [] } = useQuery({
    queryKey: ['/api/providers'],
    queryFn: () => getProviders(),
    enabled: open,
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
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (credentials: Credentials) => saveCredentials(credentials),
    onSuccess: () => {
      toast({
        title: "Credentials Saved",
        description: "Your API keys have been securely saved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/providers'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save credentials",
        variant: "destructive",
      });
    },
  });

  const handleCredentialChange = (provider: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const togglePasswordVisibility = (provider: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
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

  const handleSave = () => {
    saveMutation.mutate(credentials);
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
      llama: '🦙'
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
      llama: 'bg-yellow-500'
    };
    return colors[id] || 'bg-gray-500';
  };

  const getProviderPlaceholder = (id: string) => {
    const placeholders: Record<string, string> = {
      openai: 'sk-...',
      anthropic: 'sk-ant-...',
      google: 'AIza...',
      microsoft: 'Enter Microsoft credentials...',
      perplexity: 'pplx-...',
      deepseek: 'sk-...',
      grok: 'xai-...',
      llama: 'Not required'
    };
    return placeholders[id] || 'Enter API key...';
  };

  // Filter to only show providers that require API keys
  const apiKeyProviders = providers.filter(p => p.requiresApiKey);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-credentials">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>API Key Management</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600"
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {apiKeyProviders.map((provider) => (
            <div key={provider.id} className="border border-slate-200 rounded-lg p-4" data-testid={`provider-card-${provider.id}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${getProviderColor(provider.id)} rounded-lg flex items-center justify-center text-white text-sm`}>
                    {getProviderIcon(provider.id)}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{provider.name}</h3>
                    <p className="text-sm text-slate-500">{provider.company}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${provider.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <Badge variant={provider.status === 'connected' ? 'default' : 'secondary'} className={provider.status === 'connected' ? 'bg-emerald-500 text-white' : ''}>
                    {provider.status === 'connected' ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor={`api-key-${provider.id}`} className="block text-sm font-medium text-slate-700 mb-1">
                    API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id={`api-key-${provider.id}`}
                      type={showPasswords[provider.id] ? "text" : "password"}
                      value={credentials[provider.id as keyof Credentials] || ""}
                      onChange={(e) => handleCredentialChange(provider.id, e.target.value)}
                      placeholder={getProviderPlaceholder(provider.id)}
                      className="pr-10 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid={`input-api-key-${provider.id}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0 h-auto text-slate-400 hover:text-slate-600"
                      onClick={() => togglePasswordVisibility(provider.id)}
                      data-testid={`button-toggle-password-${provider.id}`}
                    >
                      {showPasswords[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-slate-600">Encrypted & Secure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection(provider.id)}
                      disabled={testMutation.isPending || !credentials[provider.id as keyof Credentials]}
                      className="text-blue-600 hover:text-blue-700"
                      data-testid={`button-test-connection-${provider.id}`}
                    >
                      {testMutation.isPending ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCredentialChange(provider.id, "")}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-remove-key-${provider.id}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-emerald-500" />
              API keys are encrypted and stored securely. Never shared or transmitted except to the respective AI services.
            </div>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-save-credentials"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
