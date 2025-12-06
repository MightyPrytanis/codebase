import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleDropdown, SimpleDropdownItem } from "@/components/simple-dropdown";
import { Copy, MoreVertical, Search, UserCog, Reply, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { humanizeResponse, factCheckResponse, generateReply } from "@/lib/api";
import { AIProviderIcon, getProviderDisplayName } from "@/components/ai-provider-icons";
import { ResponseRating } from "@/components/response-rating";
import type { AIResponse } from "@shared/schema";

interface ResponseGridProps {
  responses: AIResponse[];
  originalQuery?: string;
  onFactCheck?: (response: AIResponse) => void;
  onReply?: (response: AIResponse) => void;
}

interface ResponseWithRating extends AIResponse {
  userRating?: string;
}

export default function ResponseGrid({ responses, originalQuery, onFactCheck, onReply }: ResponseGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [factCheckModalOpen, setFactCheckModalOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [humanizeModalOpen, setHumanizeModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [selectedResponse, setSelectedResponse] = useState<AIResponse | null>(null);
  const [responseRatings, setResponseRatings] = useState<Record<string, string>>({});

  const humanizeMutation = useMutation({
    mutationFn: (responseText: string) => humanizeResponse(responseText),
    onSuccess: (data, variables) => {
      setModalContent(data.humanizedResponse);
      setHumanizeModalOpen(true);
      toast({
        title: "Response Humanized",
        description: "The response has been humanized successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to humanize response",
        variant: "destructive",
      });
    },
  });

  const factCheckMutation = useMutation({
    mutationFn: ({ responseText, query }: { responseText: string; query: string }) => 
      factCheckResponse(responseText, query),
    onSuccess: (data, variables) => {
      setModalContent(data.factCheck);
      setFactCheckModalOpen(true);
      toast({
        title: "Fact Check Complete",
        description: "The response has been fact-checked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fact-check response",
        variant: "destructive",
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ responseText, query }: { responseText: string; query: string }) => 
      generateReply(responseText, query),
    onSuccess: (data, variables) => {
      setModalContent(data.reply);
      setReplyModalOpen(true);
      toast({
        title: "Reply Generated",
        description: "A thoughtful reply has been generated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate reply",
        variant: "destructive",
      });
    },
  });



  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      openai: 'ChatGPT-4',
      anthropic: 'Claude 3.5',
      google: 'Gemini Pro',
      microsoft: 'Copilot',
      perplexity: 'Perplexity',
      deepseek: 'DeepSeek',
      grok: 'Grok',
      llama: 'Llama 3.2'
    };
    return names[provider] || provider;
  };

  const getProviderColor = (provider: string) => {
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
    return colors[provider] || 'bg-gray-500';
  };

  const handleCopyResponse = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied",
        description: "Response copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy response",
        variant: "destructive",
      });
    }
  };

  const handleHumanizeAndSubmit = (response: AIResponse) => {
    if (response.content) {
      setSelectedResponse(response);
      humanizeMutation.mutate(response.content);
    }
  };

  const handleFactCheck = (response: AIResponse) => {
    if (response.content && originalQuery) {
      setSelectedResponse(response);
      factCheckMutation.mutate({ responseText: response.content, query: originalQuery });
    } else {
      toast({
        title: "Cannot Fact Check",
        description: "Original query not available for fact checking",
        variant: "destructive",
      });
    }
  };

  const handleReply = (response: AIResponse) => {
    if (response.content && originalQuery) {
      setSelectedResponse(response);
      replyMutation.mutate({ responseText: response.content, query: originalQuery });
    } else {
      toast({
        title: "Cannot Generate Reply",
        description: "Original query not available for reply generation",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  if (responses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-slate-400 text-2xl">💭</span>
        </div>
        <h3 className="text-lg font-varsity text-slate-900 mb-2">Ready for Analysis</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Submit your query above to get diverse perspectives from multiple AI models. 
          Compare accuracy and insights across different approaches.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-varsity-bold text-slate-900">AI Responses</h2>
        <div className="text-sm text-slate-600">
          {responses.filter(r => r.status === 'complete').length} of {responses.length} complete
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {responses.map((response) => (
          <Card key={response.id} className="border-slate-200 hover:shadow-md transition-shadow" data-testid={`card-response-${response.id}`}>
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AIProviderIcon provider={response.aiProvider} className="w-10 h-10" status="connected" />
                  <div>
                    <h3 className="font-semibold text-slate-900" data-testid={`text-provider-name-${response.id}`}>
                      {getProviderDisplayName(response.aiProvider)}
                    </h3>
                    <p className="text-sm text-slate-500" data-testid={`text-timestamp-${response.id}`}>
                      {formatTimestamp(response.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={response.status === 'complete' ? 'default' : response.status === 'error' ? 'destructive' : 'secondary'}
                    className={
                      response.status === 'complete' 
                        ? 'bg-emerald-500 text-white' 
                        : response.status === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }
                    data-testid={`badge-status-${response.id}`}
                  >
                    {response.status === 'complete' ? 'Complete' : response.status === 'error' ? 'Error' : 'Analyzing'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyResponse(response.content || '')}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    data-testid={`button-copy-${response.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <SimpleDropdown>
                    <SimpleDropdownItem 
                      onClick={() => handleFactCheck(response)}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Fact Check
                    </SimpleDropdownItem>
                    <SimpleDropdownItem 
                      onClick={() => handleHumanizeAndSubmit(response)}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Humanize
                    </SimpleDropdownItem>
                    <SimpleDropdownItem 
                      onClick={() => handleReply(response)}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </SimpleDropdownItem>
                  </SimpleDropdown>
                </div>
              </div>
            </div>
          
          <CardContent className="p-4">
            {response.status === 'pending' && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-slate-600">Generating response...</span>
              </div>
            )}
            
            {response.status === 'error' && (
              <div className="py-4 text-center">
                <div className="text-red-500 text-lg mb-2">⚠️</div>
                <p className="text-red-600 font-medium">Error generating response</p>
                <p className="text-sm text-slate-600 mt-1">{response.content}</p>
              </div>
            )}
            
            {response.status === 'complete' && response.content && (
              <>
                <div className="prose prose-sm max-w-none text-slate-700" data-testid={`text-content-${response.id}`}>
                  {response.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <ResponseRating 
                  responseId={response.id}
                  currentRating={responseRatings[response.id]}
                  onRatingChange={(id, rating) => 
                    setResponseRatings(prev => ({ ...prev, [id]: rating }))
                  }
                />
              </>
            )}
            
            {response.status === 'complete' && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFactCheck(response)}
                      disabled={factCheckMutation.isPending}
                      className="text-blue-600 hover:text-blue-700"
                      data-testid={`button-fact-check-${response.id}`}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {factCheckMutation.isPending ? 'Checking...' : 'Fact Check'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHumanizeAndSubmit(response)}
                      disabled={humanizeMutation.isPending}
                      className="text-blue-600 hover:text-blue-700"
                      data-testid={`button-humanize-${response.id}`}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      {humanizeMutation.isPending ? 'Processing...' : 'Humanize & Submit'}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReply(response)}
                    disabled={replyMutation.isPending}
                    className="text-slate-600 hover:text-slate-900"
                    data-testid={`button-reply-${response.id}`}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    {replyMutation.isPending ? 'Generating...' : 'Reply'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      </div>

      {/* Fact Check Modal */}
      <Dialog open={factCheckModalOpen} onOpenChange={setFactCheckModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Fact Check Results
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">Original Response from {selectedResponse ? getProviderDisplayName(selectedResponse.aiProvider) : 'AI'}:</h4>
              <p className="text-blue-800">{selectedResponse?.content}</p>
            </div>
            <div className="prose prose-sm max-w-none">
              {modalContent.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5 text-blue-600" />
              Suggested Reply
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Response from {selectedResponse ? getProviderDisplayName(selectedResponse.aiProvider) : 'AI'}:</h4>
              <p className="text-gray-800 text-sm">{selectedResponse?.content?.substring(0, 200)}...</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Suggested Follow-up:</h4>
              <p className="text-blue-800">{modalContent}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Humanize Modal */}
      <Dialog open={humanizeModalOpen} onOpenChange={setHumanizeModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-purple-600" />
              Humanized Response
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-purple-900 mb-2">Original Response:</h4>
              <p className="text-purple-800 text-sm">{selectedResponse?.content?.substring(0, 300)}...</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Humanized Version:</h4>
              <div className="prose prose-sm max-w-none">
                {modalContent.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 last:mb-0 text-green-800">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
