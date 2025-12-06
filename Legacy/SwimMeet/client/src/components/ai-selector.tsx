import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getProviders } from "@/lib/api";
import type { AIProvider } from "@shared/schema";

interface AISelectorProps {
  selectedAIs: string[];
  onSelectionChange: (selectedAIs: string[]) => void;
  onManageCredentials: () => void;
}

export default function AISelector({ selectedAIs, onSelectionChange, onManageCredentials }: AISelectorProps) {
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['/api/providers'],
    queryFn: () => getProviders(),
  });

  const handleSelectAll = () => {
    const connectedProviders = providers.filter(p => p.status === 'connected').map(p => p.id);
    onSelectionChange(connectedProviders);
  };

  const handleProviderToggle = (providerId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedAIs, providerId]);
    } else {
      onSelectionChange(selectedAIs.filter(id => id !== providerId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-emerald-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Select AI Models</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSelectAll}
            className="text-blue-600 hover:text-blue-700"
            data-testid="button-select-all"
          >
            Select All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.map((provider) => (
            <div key={provider.id} className="relative">
              <label 
                className={`flex flex-col p-4 bg-slate-50 border-2 rounded-lg cursor-pointer transition-all hover:bg-slate-100 ${
                  selectedAIs.includes(provider.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200'
                }`}
                data-testid={`label-provider-${provider.id}`}
              >
                <Checkbox
                  checked={selectedAIs.includes(provider.id)}
                  onCheckedChange={(checked) => 
                    handleProviderToggle(provider.id, checked as boolean)
                  }
                  disabled={provider.status === 'error'}
                  className="sr-only"
                  data-testid={`checkbox-${provider.id}`}
                />
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-900 flex items-center gap-2">
                    <span className="text-lg">{getProviderIcon(provider.id)}</span>
                    {provider.name}
                  </span>
                  <div 
                    className={`w-2 h-2 rounded-full ${getStatusColor(provider.status)}`}
                    title={provider.status === 'connected' ? 'Connected' : 'Setup Required'}
                    data-testid={`status-${provider.id}`}
                  />
                </div>
                <span className="text-sm text-slate-600">{provider.company}</span>
              </label>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
              <span>Setup Required</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onManageCredentials}
            className="text-blue-600 hover:text-blue-700"
            data-testid="button-manage-credentials"
          >
            Manage API Keys
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
