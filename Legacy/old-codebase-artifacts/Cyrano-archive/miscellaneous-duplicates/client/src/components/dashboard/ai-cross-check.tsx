import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Eye, RefreshCw } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AiAnalysis } from "@shared/schema";

interface AiCrossCheckProps {
  documentId: string;
  primaryAnalysis: AiAnalysis;
}

export function AiCrossCheck({ documentId, primaryAnalysis }: AiCrossCheckProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  
  const { data: availableProviders = [] } = useQuery({
    queryKey: ["/api/ai-providers"],
  });

  const crossCheckMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await fetch(`/api/documents/${documentId}/cross-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, primaryAnalysisId: primaryAnalysis.id }),
      });
      return response.json();
    },
  });

  const handleCrossCheck = () => {
    if (selectedProvider) {
      crossCheckMutation.mutate(selectedProvider);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "chatgpt": return "🤖";
      case "grok": return "🔥";
      case "copilot": return "🧠";
      case "gemini": return "💎";
      case "perplexity": return "🔍";
      default: return "🤖";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600 text-white"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case "conflict":
        return <Badge variant="destructive" className="bg-red-600 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Conflict</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-600 text-white"><RefreshCw className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">Not Checked</Badge>;
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-gold flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          Another Set of AEyes - Cross-Check Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Select AI provider for cross-check" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {(availableProviders as any[]).filter((p: any) => p.enabled)?.map((provider: any) => (
                <SelectItem key={provider.id} value={provider.provider} className="text-white hover:bg-slate-700">
                  <span className="flex items-center">
                    <span className="mr-2">{getProviderIcon(provider.provider)}</span>
                    {provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleCrossCheck}
            disabled={!selectedProvider || crossCheckMutation.isPending}
            className="bg-gold hover:bg-gold/90 text-slate-900"
          >
            {crossCheckMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            Cross-Check
          </Button>
        </div>

        {primaryAnalysis.secondaryReview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-300">Secondary Review:</span>
                <span className="text-sm text-gold">
                  {getProviderIcon(primaryAnalysis.secondaryReviewProvider || "")} 
                  {primaryAnalysis.secondaryReviewProvider?.charAt(0).toUpperCase() + 
                   primaryAnalysis.secondaryReviewProvider?.slice(1)}
                </span>
              </div>
              {getStatusBadge(primaryAnalysis.reviewStatus || "pending")}
            </div>
            
            {primaryAnalysis.secondaryReview && (
              <div className="bg-slate-700 p-3 rounded-lg">
                <div className="text-sm text-slate-300 space-y-2">
                  <div>
                    <strong className="text-white">Confidence Match:</strong> 
                    <span className={`ml-2 ${(primaryAnalysis.secondaryReview as any)?.confidenceMatch > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {(primaryAnalysis.secondaryReview as any)?.confidenceMatch}%
                    </span>
                  </div>
                  <div>
                    <strong className="text-white">Key Findings:</strong>
                    <p className="mt-1 text-slate-200">{(primaryAnalysis.secondaryReview as any)?.summary}</p>
                  </div>
                  {(primaryAnalysis.secondaryReview as any)?.conflicts && (
                    <div>
                      <strong className="text-red-400">Conflicts Detected:</strong>
                      <ul className="mt-1 text-red-300 list-disc list-inside">
                        {((primaryAnalysis.secondaryReview as any).conflicts || []).map((conflict: string, i: number) => (
                          <li key={i}>{conflict}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {crossCheckMutation.data && (
          <div className="bg-green-900/20 border border-green-700 p-3 rounded-lg">
            <p className="text-green-300 text-sm">
              Cross-check completed successfully! Review results above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}