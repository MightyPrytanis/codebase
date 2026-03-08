import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Send, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface GoodCounselProps {
  caseContext?: string;
  timePressure?: "low" | "medium" | "high" | "critical";
}

export function GoodCounsel({ caseContext = "", timePressure = "medium" }: GoodCounselProps) {
  const [context, setContext] = useState(caseContext);
  const [selectedProvider, setSelectedProvider] = useState<string>("provider-1");
  const [userState, setUserState] = useState<string>("");
  const [ethicalConcerns, setEthicalConcerns] = useState<string>("");

  const providers = [
    { id: "provider-1", name: "AI Provider A", status: "✅ Working", icon: "🔍" },
    { id: "provider-2", name: "AI Provider B", status: "✅ Working", icon: "🧠" },
    { id: "provider-3", name: "AI Provider C", status: "✅ Working", icon: "🤖" },
    { id: "provider-4", name: "AI Provider D", status: "❌ Needs API Key", icon: "💎" },
    { id: "provider-5", name: "AI Provider E", status: "❌ Needs Credits", icon: "🔥" },
    { id: "provider-6", name: "AI Provider F", status: "❌ Needs Balance", icon: "🧮" },
  ];

  const counselMutation = useMutation({
    mutationFn: async (data: {
      context: string;
      ai_provider: string;
      user_state?: string;
      time_pressure: string;
      ethical_concerns?: string[];
    }) => {
      const apiUrl = import.meta.env.VITE_CYRANO_API_URL || "https://cyrano-mcp-server.onrender.com";
      const response = await fetch(`${apiUrl}/mcp/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "goodcounsel_engine",
          arguments: {
            action: "execute_workflow",
            workflow_id: "wellness_check", // Use wellness_check workflow for general guidance
            input: {
              context: data.context,
              user_state: data.user_state,
              time_pressure: data.time_pressure,
              ethical_concerns: data.ethical_concerns,
              ai_provider: data.ai_provider,
            },
            userId: "default-user", // TODO: Get from auth
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
  });

  const handleRequestGuidance = () => {
    if (!context.trim()) return;

    const ethicalConcernsArray = ethicalConcerns
      .split(",")
      .map(c => c.trim())
      .filter(c => c.length > 0);

    counselMutation.mutate({
      context: context.trim(),
      ai_provider: selectedProvider,
      user_state: userState.trim() || undefined,
      time_pressure: timePressure,
      ethical_concerns: ethicalConcernsArray.length > 0 ? ethicalConcernsArray : undefined,
    });
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  return (
    <Card className="bg-card-dark border-border-gray">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Brain className="w-5 h-5" />
          AI Legal Counsel
        </CardTitle>
        <p className="text-secondary text-sm">
          Request AI-powered ethical guidance and workflow optimization for your legal practice
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary">AI Provider</label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="bg-primary-dark border-border-gray">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card-dark border-border-gray">
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id} className="text-white">
                  <div className="flex items-center gap-2">
                    <span>{provider.icon}</span>
                    <span>{provider.name}</span>
                    <Badge variant={provider.status.includes("✅") ? "default" : "destructive"} className="ml-auto">
                      {provider.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Context Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary">
            Legal Context or Situation *
          </label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Describe the legal case, workflow issue, or situation requiring guidance..."
            className="bg-primary-dark border-border-gray min-h-[100px] resize-none"
          />
        </div>

        {/* User State */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary">
            Your Current State (Optional)
          </label>
          <Textarea
            value={userState}
            onChange={(e) => setUserState(e.target.value)}
            placeholder="How are you feeling? Any stress, time pressure, or focus issues?"
            className="bg-primary-dark border-border-gray min-h-[60px] resize-none"
          />
        </div>

        {/* Ethical Concerns */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary">
            Ethical Concerns (Optional)
          </label>
          <Textarea
            value={ethicalConcerns}
            onChange={(e) => setEthicalConcerns(e.target.value)}
            placeholder="Any ethical issues or concerns (comma-separated)..."
            className="bg-primary-dark border-border-gray resize-none"
          />
        </div>

        {/* Time Pressure Display */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-secondary">Time Pressure:</span>
          <Badge variant={
            timePressure === "critical" ? "destructive" :
            timePressure === "high" ? "default" :
            "secondary"
          }>
            {timePressure.toUpperCase()}
          </Badge>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleRequestGuidance}
          disabled={!context.trim() || counselMutation.isPending}
          className="w-full bg-accent-gold hover:bg-accent-gold/90 text-slate-900 font-semibold"
        >
          {counselMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Requesting Guidance...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Request Guidance
            </>
          )}
        </Button>

        {/* Results */}
        {counselMutation.isError && (
          <div className="p-4 bg-status-critical/20 border border-status-critical rounded-lg">
            <div className="flex items-center gap-2 text-status-critical">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Error requesting guidance</span>
            </div>
            <p className="text-sm text-secondary mt-1">
              {counselMutation.error instanceof Error
                ? counselMutation.error.message
                : "Unknown error occurred"}
            </p>
            <p className="text-xs text-secondary mt-2">
              Make sure the Cyrano HTTP bridge is running on port 5002
            </p>
          </div>
        )}

        {counselMutation.isSuccess && counselMutation.data && (
          <div className="p-4 bg-status-success/20 border border-status-success rounded-lg">
            <div className="flex items-center gap-2 text-status-success mb-3">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">AI Counsel Received</span>
              <Badge variant="outline" className="ml-auto">
                {selectedProviderData?.icon} {selectedProviderData?.name}
              </Badge>
            </div>

            <div className="space-y-3 text-sm">
              {counselMutation.data.content?.[0]?.text && (
                <div>
                  <h4 className="font-medium text-primary mb-2">Guidance:</h4>
                  <div className="bg-primary-dark/50 p-3 rounded border border-border-gray text-secondary whitespace-pre-wrap">
                    {counselMutation.data.content[0].text}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

}
