import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { NotebookPen, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getProviders, testProviderConnection } from "@/lib/api";
import { AIProviderIcon, getProviderDisplayName } from "@/components/ai-provider-icons";
import type { AIProvider } from "@shared/schema";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  selectedAIs: string[];
  onSelectionChange: (selectedAIs: string[]) => void;
  isLoading?: boolean;
}

export default function QueryInput({ onSubmit, selectedAIs, onSelectionChange, isLoading = false }: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [providerStatuses, setProviderStatuses] = useState<Record<string, 'connected' | 'setup_required' | 'error'>>({});
  const { toast } = useToast();

  const { data: providers = [] } = useQuery({
    queryKey: ['/api/providers'],
    queryFn: () => getProviders(),
  });

  const testConnectionMutation = useMutation({
    mutationFn: (providerId: string) => testProviderConnection(providerId),
    onSuccess: (data, providerId) => {
      setProviderStatuses(prev => ({
        ...prev,
        [providerId]: data.success ? 'connected' : 'error'
      }));
    },
    onError: (error, providerId) => {
      setProviderStatuses(prev => ({
        ...prev,
        [providerId]: 'error'
      }));
    },
  });

  // Test connections when providers load
  useEffect(() => {
    if (providers.length > 0) {
      providers.forEach(provider => {
        if (provider.status === 'connected') {
          testConnectionMutation.mutate(provider.id);
        } else {
          setProviderStatuses(prev => ({
            ...prev,
            [provider.id]: provider.status as 'connected' | 'error' | 'setup_required'
          }));
        }
      });
    }
  }, [providers]);

  const handleSubmit = () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a question or prompt to submit.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAIs.length === 0) {
      toast({
        title: "No AIs Selected",
        description: "Please select at least one AI model to submit your query.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const handleProviderToggle = (providerId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedAIs, providerId]);
    } else {
      onSelectionChange(selectedAIs.filter(id => id !== providerId));
    }
  };



  const availableProviders = providers; // Show all providers

  return (
    <div className="bg-gradient-to-br from-blue-100 to-cyan-50 border-2 border-blue-300 rounded-xl shadow-xl backdrop-blur-sm">
      <div className="p-8">
        {/* Header with emphasis on accuracy */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-varsity-bold text-slate-900">Ask Multiple AIs</h1>
              <p className="text-slate-600">Get diverse, accurate perspectives from leading AI models</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              Real-time Analysis
            </Badge>
          </div>
        </div>

        {/* AI Selection - Compact boxes with ratings */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Select AI Models ({selectedAIs.length} selected)</h3>
          <div className="flex flex-wrap gap-2">
            {availableProviders.map((provider) => {
              // Calculate positive rating percentage (placeholder logic - would come from stats API)
              const positiveRating = Math.floor(Math.random() * 40) + 60; // 60-100% for demo
              return (
                <label 
                  key={provider.id}
                  className={`relative flex items-center space-x-2 px-2 py-1 rounded border cursor-pointer transition-all text-xs ${
                    selectedAIs.includes(provider.id) 
                      ? 'bg-blue-600 border-blue-700 text-white' 
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-800'
                  }`}
                  data-testid={`label-provider-${provider.id}`}
                >
                  {selectedAIs.includes(provider.id) && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <AIProviderIcon provider={provider.id} className="w-4 h-4" status={providerStatuses[provider.id] || provider.status} />
                  <div className="flex flex-col">
                    <span className="font-medium leading-tight">{getProviderDisplayName(provider.id)}</span>
                    <span className={`text-xs leading-tight ${
                      selectedAIs.includes(provider.id) ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {positiveRating}% positive
                    </span>
                  </div>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    (providerStatuses[provider.id] || provider.status) === 'connected' ? 'bg-emerald-400' : 
                    (providerStatuses[provider.id] || provider.status) === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                  }`} />
                  <input
                    type="checkbox"
                    checked={selectedAIs.includes(provider.id)}
                    onChange={(e) => handleProviderToggle(provider.id, e.target.checked)}
                    disabled={provider.status === 'error'}
                    className="sr-only"
                    data-testid={`checkbox-${provider.id}`}
                  />
                </label>
              );
            })}
          </div>
        </div>
        
        {/* Main Query Input - Prominent */}
        <div className="space-y-4">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-40 text-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter your question or prompt here. Be specific for the most accurate and useful responses from multiple AI perspectives..."
            data-testid="textarea-query"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>Secure & Private</span>
              </div>
              <span>•</span>
              <span>Ctrl+Enter to submit</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="lg"
                className="text-slate-700 border-slate-300 hover:bg-slate-100"
                data-testid="button-clear-query"
                onClick={() => setQuery("")}
              >
                Clear
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !query.trim() || selectedAIs.length === 0}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                data-testid="button-submit-query"
              >
                <NotebookPen className="w-5 h-5 mr-2" />
                {isLoading ? 'Analyzing...' : `Query ${selectedAIs.length} AI${selectedAIs.length === 1 ? '' : 's'}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
