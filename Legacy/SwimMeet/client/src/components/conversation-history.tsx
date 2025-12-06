import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, BookmarkIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/lib/api";

interface ConversationHistoryProps {
  onOpenConversation?: (conversationId: string) => void;
}

export default function ConversationHistory({ onOpenConversation }: ConversationHistoryProps) {
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: () => getConversations(),
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  const getAIProviderDots = () => {
    // Mock data for demonstration - in real app this would come from the conversation data
    return [
      { provider: 'openai', color: 'bg-green-500' },
      { provider: 'anthropic', color: 'bg-orange-500' },
      { provider: 'google', color: 'bg-blue-500' }
    ];
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-slate-200 rounded-lg">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent Conversations</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
            data-testid="button-view-all-history"
          >
            View All
          </Button>
        </div>
      </div>
      
      {conversations.length === 0 ? (
        <CardContent className="p-8 text-center">
          <div className="text-slate-400 text-lg mb-2">💬</div>
          <p className="text-slate-600">No conversations yet</p>
          <p className="text-sm text-slate-500 mt-1">Start by submitting your first query</p>
        </CardContent>
      ) : (
        <div className="divide-y divide-slate-200">
          {conversations.slice(0, 5).map((conversation: any) => (
            <div
              key={conversation.id}
              className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => onOpenConversation?.(conversation.id)}
              data-testid={`conversation-${conversation.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 truncate" data-testid={`text-conversation-title-${conversation.id}`}>
                    {conversation.title}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1 truncate" data-testid={`text-conversation-preview-${conversation.id}`}>
                    {conversation.query}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-slate-500" data-testid={`text-conversation-timestamp-${conversation.id}`}>
                      {formatTimestamp(conversation.timestamp)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">AIs used:</span>
                      <div className="flex space-x-1">
                        {getAIProviderDots().map((ai, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 ${ai.color} rounded-full`}
                            title={ai.provider}
                            data-testid={`dot-ai-${ai.provider}-${conversation.id}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 text-slate-400 hover:text-slate-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle bookmark logic here
                    }}
                    data-testid={`button-bookmark-${conversation.id}`}
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
