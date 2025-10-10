import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Check, X, Settings } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AiProvider } from "@shared/schema";

export function AiProviderSetup() {
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: providers = [] } = useQuery({
    queryKey: ["/api/ai-providers"],
  });

  const updateProvider = useMutation({
    mutationFn: async ({ providerId, data }: { providerId: string; data: Partial<AiProvider> }) => {
      const response = await fetch(`/api/ai-providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-providers"] });
      setEditingProvider(null);
      setApiKeyInput("");
      toast({
        title: "Provider Updated",
        description: "AI provider settings saved successfully.",
      });
    },
  });

  const createProvider = useMutation({
    mutationFn: async (data: { provider: string; apiKey: string; enabled: boolean }) => {
      const response = await fetch("/api/ai-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-providers"] });
      setEditingProvider(null);
      setApiKeyInput("");
      toast({
        title: "Provider Added",
        description: "AI provider configured successfully.",
      });
    },
  });

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const handleSaveProvider = (provider: AiProvider | { provider: string }) => {
    if (!apiKeyInput.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
      return;
    }

    if ('id' in provider) {
      // Update existing
      updateProvider.mutate({
        providerId: provider.id,
        data: { apiKey: apiKeyInput, enabled: true },
      });
    } else {
      // Create new
      createProvider.mutate({
        provider: provider.provider,
        apiKey: apiKeyInput,
        enabled: true,
      });
    }
  };

  const availableProviders = [
    { key: "anthropic", name: "Claude", icon: "🧠", description: "Advanced reasoning and analysis capabilities" },
    { key: "gemini", name: "Gemini", icon: "💎", description: "Google's multimodal AI with document analysis" },
    { key: "openai", name: "ChatGPT", icon: "🤖", description: "OpenAI's GPT models" },
    { key: "grok", name: "Grok", icon: "🔥", description: "xAI's conversational AI" },
    { key: "perplexity", name: "Perplexity", icon: "🔍", description: "Research-focused AI" },
  ];

  const getProviderConfig = (providerKey: string) => {
    return (providers as AiProvider[]).find((p: AiProvider) => p.provider === providerKey);
  };

  const getStatusBadge = (provider: AiProvider | undefined) => {
    if (!provider) {
      return <Badge variant="outline" className="text-slate-400">Not Configured</Badge>;
    }
    if (provider.enabled && provider.apiKey) {
      return <Badge variant="default" className="bg-green-600 text-white">Active</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-600 text-black">Configured</Badge>;
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-gold flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          AI Provider Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300 text-sm">
          Configure multiple AI providers for cross-checking and redundancy. 
          Each provider can be used for secondary analysis validation.
        </p>
        
        {availableProviders.map((availableProvider) => {
          const configuredProvider = getProviderConfig(availableProvider.key);
          const isEditing = editingProvider === availableProvider.key;
          
          return (
            <div key={availableProvider.key} className="bg-slate-700 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{availableProvider.icon}</span>
                  <div>
                    <h4 className="font-medium text-white">{availableProvider.name}</h4>
                    <p className="text-sm text-slate-400">{availableProvider.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(configuredProvider)}
                  {configuredProvider && (
                    <Switch
                      checked={configuredProvider.enabled}
                      onCheckedChange={(enabled) =>
                        updateProvider.mutate({
                          providerId: configuredProvider.id,
                          data: { enabled },
                        })
                      }
                    />
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`api-key-${availableProvider.key}`} className="text-slate-300">
                      API Key
                    </Label>
                    <Input
                      id={`api-key-${availableProvider.key}`}
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Enter API key..."
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveProvider(configuredProvider || { provider: availableProvider.key })}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingProvider(null);
                        setApiKeyInput("");
                      }}
                      className="border-slate-500 text-slate-300 hover:bg-slate-600"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  {configuredProvider?.apiKey ? (
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-slate-600 px-2 py-1 rounded">
                        {showApiKeys[configuredProvider.id] 
                          ? configuredProvider.apiKey 
                          : "••••••••••••••••"
                        }
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleApiKeyVisibility(configuredProvider.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {showApiKeys[configuredProvider.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">No API key configured</span>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingProvider(availableProvider.key);
                      setApiKeyInput(configuredProvider?.apiKey || "");
                    }}
                    className="border-slate-600 text-slate-300 hover:bg-slate-600"
                  >
                    {configuredProvider ? "Edit" : "Configure"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        
        <div className="bg-blue-900/20 border border-blue-700 p-3 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Security Note:</strong> API keys are encrypted and stored securely. 
            They are only used for cross-checking analysis and never shared externally.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}