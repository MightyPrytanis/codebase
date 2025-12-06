import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AwardButton } from "@/components/award-button";
import { ActionDropdown } from "@/components/action-dropdown";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AIResponse } from "@shared/schema";

interface ResponseCardProps {
  response: AIResponse;
  onAward: (responseId: string, awardType: string) => void;
  onAction: (responseId: string, action: string) => void;
}

export function ResponseCard({ response, onAward, onAction }: ResponseCardProps) {
  const { toast } = useToast();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(response.content);
    toast({ title: "Copied to clipboard" });
  }, [response.content, toast]);

  return (
    <Card className="relative bg-white border-2 border-blue-200 hover:border-blue-400 transition-all shadow-lg">
      <CardContent className="p-6">
        {/* Header with provider and status */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              {response.provider}
            </Badge>
            <Badge 
              variant={response.status === 'completed' ? 'default' : 'secondary'}
              className={response.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
            >
              {response.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <ActionDropdown responseId={response.id} onAction={onAction} />
          </div>
        </div>

        {/* Response content */}
        <div className="mb-4">
          <p className="text-gray-800 whitespace-pre-wrap">{response.content}</p>
        </div>

        {/* Award buttons section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <AwardButton responseId={response.id} awardType="gold" onAward={onAward} />
            <AwardButton responseId={response.id} awardType="silver" onAward={onAward} />
            <AwardButton responseId={response.id} awardType="bronze" onAward={onAward} />
            <AwardButton responseId={response.id} awardType="finished" onAward={onAward} />
            <AwardButton responseId={response.id} awardType="quit" onAward={onAward} />
            <AwardButton responseId={response.id} awardType="titanic" onAward={onAward} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}