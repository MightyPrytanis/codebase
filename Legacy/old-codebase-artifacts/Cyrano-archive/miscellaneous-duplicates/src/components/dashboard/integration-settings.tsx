import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Check, X, Link, Mail, Calendar, Scale, Gavel } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function IntegrationSettings() {
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [gmailCredentials, setGmailCredentials] = useState({
    accessToken: "",
    refreshToken: "",
  });
  const [outlookCredentials, setOutlookCredentials] = useState({
    clientId: "",
    clientSecret: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attorney } = useQuery({
    queryKey: ["/api/attorneys/current"],
  });

  const updateIntegration = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/attorneys/${attorney?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attorneys/current"] });
      toast({
        title: "Integration Updated",
        description: "Your integration settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update integration settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (integration: string) => {
    const updateData: any = {};
    
    switch (integration) {
      case "clio":
        updateData.clioApiKey = apiKeyInput;
        break;
      case "anthropic":
        updateData.anthropicApiKey = apiKeyInput;
        break;
      case "outlook":
        updateData.outlookCredentials = {
          clientId: outlookCredentials.clientId,
          clientSecret: outlookCredentials.clientSecret,
        };
        break;
      case "westlaw":
        updateData.westlawApiKey = apiKeyInput;
        break;
    }

    updateIntegration.mutate(updateData);
    setEditingIntegration(null);
    setApiKeyInput("");
  };

  const handleGmailConnect = () => {
    const updateData: any = {};
    updateData.gmailCredentials = {
      accessToken: gmailCredentials.accessToken,
      refreshToken: gmailCredentials.refreshToken,
    };

    updateIntegration.mutate(updateData);
    setEditingIntegration(null);
    setGmailCredentials({ accessToken: "", refreshToken: "" });
  };

  const isConnected = (integration: string) => {
    switch (integration) {
      case "gmail":
        return !!attorney?.gmailCredentials;
      case "clio":
        return !!attorney?.clioApiKey;
      case "anthropic":
        return !!attorney?.anthropicApiKey;
      case "outlook":
        return !!attorney?.outlookCredentials;
      case "westlaw":
        return !!attorney?.westlawApiKey;
      default:
        return false;
    }
  };

  const integrations = [
    {
      id: "gmail",
      name: "Gmail",
      description: "Monitor and process incoming legal communications",
      icon: <Mail className="w-5 h-5" />,
      color: "bg-red-600",
      requiresOAuth: true,
    },
    {
      id: "clio",
      name: "Clio Practice Management",
      description: "Sync matters, clients, and billing information",
      icon: <Scale className="w-5 h-5" />,
      color: "bg-blue-600",
      requiresOAuth: false,
    },
    {
      id: "anthropic",
      name: "Claude AI (Anthropic)",
      description: "Primary AI analysis for document processing",
      icon: <Gavel className="w-5 h-5" />,
      color: "bg-orange-600",
      requiresOAuth: false,
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      description: "Alternative email monitoring and processing",
      icon: <Calendar className="w-5 h-5" />,
      color: "bg-cyan-600",
      requiresOAuth: true,
    },
    {
      id: "westlaw",
      name: "Westlaw Edge API",
      description: "Legal research and case law integration",
      icon: <Link className="w-5 h-5" />,
      color: "bg-green-600",
      requiresOAuth: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gold mb-2">External Integrations</h2>
        <p className="text-slate-400">
          Connect LexFiat to your essential legal workflow tools
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-white space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${integration.color} flex-shrink-0`}>
                    {integration.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base">{integration.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 font-normal break-words">
                      {integration.description}
                    </p>
                  </div>
                </div>
                {isConnected(integration.id) ? (
                  <Badge className="bg-green-600 hover:bg-green-700 text-white">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    <X className="w-3 h-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {editingIntegration === integration.id ? (
                <div className="space-y-4">
                  {integration.id === "gmail" ? (
                    <>
                      <div>
                        <Label className="text-slate-300">Access Token</Label>
                        <Input
                          type="password"
                          value={gmailCredentials.accessToken}
                          onChange={(e) =>
                            setGmailCredentials(prev => ({
                              ...prev,
                              accessToken: e.target.value
                            }))
                          }
                          placeholder="Enter Gmail access token"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Refresh Token</Label>
                        <Input
                          type="password"
                          value={gmailCredentials.refreshToken}
                          onChange={(e) =>
                            setGmailCredentials(prev => ({
                              ...prev,
                              refreshToken: e.target.value
                            }))
                          }
                          placeholder="Enter Gmail refresh token"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          onClick={handleGmailConnect}
                          disabled={updateIntegration.isPending}
                          className="flex-1 bg-gold hover:bg-gold/90 text-slate-900"
                        >
                          Connect Gmail
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingIntegration(null)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 sm:flex-shrink-0"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : integration.id === "outlook" ? (
                    <>
                      <div>
                        <Label className="text-slate-300">Client ID</Label>
                        <Input
                          value={outlookCredentials.clientId}
                          onChange={(e) =>
                            setOutlookCredentials(prev => ({
                              ...prev,
                              clientId: e.target.value
                            }))
                          }
                          placeholder="Enter Outlook client ID"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Client Secret</Label>
                        <Input
                          type="password"
                          value={outlookCredentials.clientSecret}
                          onChange={(e) =>
                            setOutlookCredentials(prev => ({
                              ...prev,
                              clientSecret: e.target.value
                            }))
                          }
                          placeholder="Enter Outlook client secret"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          onClick={() => handleConnect(integration.id)}
                          disabled={updateIntegration.isPending}
                          className="flex-1 bg-gold hover:bg-gold/90 text-slate-900"
                        >
                          Connect Outlook
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingIntegration(null)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 sm:flex-shrink-0"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-slate-300">API Key</Label>
                        <div className="relative">
                          <Input
                            type={showApiKeys[integration.id] ? "text" : "password"}
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder={`Enter ${integration.name} API key`}
                            className="bg-slate-700 border-slate-600 text-white pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                            onClick={() =>
                              setShowApiKeys(prev => ({
                                ...prev,
                                [integration.id]: !prev[integration.id]
                              }))
                            }
                          >
                            {showApiKeys[integration.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          onClick={() => handleConnect(integration.id)}
                          disabled={updateIntegration.isPending}
                          className="flex-1 bg-gold hover:bg-gold/90 text-slate-900"
                        >
                          Connect {integration.name}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingIntegration(null)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 sm:flex-shrink-0"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {isConnected(integration.id) ? (
                    <div className="bg-slate-700 p-3 rounded-lg">
                      <p className="text-sm text-green-400 mb-2">✓ Integration Active</p>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingIntegration(integration.id)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-600 flex-1"
                        >
                          Update Connection
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            /* Add disconnect logic */
                          }}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white flex-1 sm:flex-initial"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setEditingIntegration(integration.id)}
                      className="w-full bg-gold hover:bg-gold/90 text-slate-900"
                    >
                      Connect {integration.name}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}