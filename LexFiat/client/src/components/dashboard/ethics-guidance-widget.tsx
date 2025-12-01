import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Scale, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

interface EthicsGuidanceWidgetProps {
  onClick?: () => void;
}

export function EthicsGuidanceWidget({ onClick }: EthicsGuidanceWidgetProps) {
  const [refreshing, setRefreshing] = useState(false);

  const { data: ethicsData, isLoading, refetch } = useQuery({
    queryKey: ["/api/goodcounsel/ethics-guidance"],
    refetchInterval: 600000, // Refetch every 10 minutes
  });

  const { data: wellnessEthics } = useQuery({
    queryKey: ["/api/goodcounsel/wellness-ethics"],
    refetchInterval: 900000, // Refetch every 15 minutes
  });

  const { data: checklists } = useQuery({
    queryKey: ["/api/goodcounsel/ethics-checklists"],
    refetchInterval: 1800000, // Refetch every 30 minutes
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Process ethics data
  const guidance = ethicsData?.guidance || [];
  const wellnessGuidance = wellnessEthics?.wellnessGuidance || [];
  const ethicsChecklists = checklists?.checklists || [];

  // Create comprehensive ethics insights
  const ethicsInsights = [
    // Wellness ethics insights
    ...(wellnessGuidance.length > 0 ? [{
      type: "wellness",
      text: "Attorney wellness is an ethical obligation - prioritize self-care for competent practice",
      priority: "support",
      source: "ABA Ethics"
    }] : []),
    
    // General ethics guidance
    ...(guidance.slice(0, 2).map(g => ({
      type: "ethics",
      text: g.title,
      priority: g.priority === 'critical' ? 'urgent' : g.priority === 'high' ? 'support' : 'affirmation',
      source: g.source
    }))),
    
    // Checklist insights
    ...(ethicsChecklists.length > 0 ? [{
      type: "checklist",
      text: `${ethicsChecklists.length} ethics checklists available for common situations`,
      priority: "support",
      source: "Ethics Resources"
    }] : [])
  ];

  const activeInsight = ethicsInsights[0] || {
    type: "ethics",
    text: "Ethics guidance is here to support your practice",
    priority: "support",
    source: "GoodCounsel"
  };

  return (
    <Card 
      className="piquette-theme swim-panel stat-card cursor-pointer transition-all relative overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center gap-2 text-base panel-heading">
            <Scale className="w-4 h-4" />
            Ethics Guidance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              className="text-xs status-indicator"
            >
              {guidance.length + wellnessGuidance.length} sources
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              disabled={refreshing}
              className="text-xs"
              style={{ color: '#10b981' }}
            >
              {refreshing ? '...' : '↻'}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" 
                 style={{ background: 'rgba(251, 191, 36, 0.2)' }}>
              {activeInsight.priority === 'urgent' ? (
                <AlertTriangle className="w-4 h-4" style={{ color: '#fbbf24' }} />
              ) : activeInsight.priority === 'support' ? (
                <BookOpen className="w-4 h-4" style={{ color: '#10b981' }} />
              ) : (
                <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: '#1f2937' }}>
                {activeInsight.text}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{
                    color: activeInsight.priority === 'urgent' ? '#fbbf24' : 
                           activeInsight.priority === 'support' ? '#10b981' : '#10b981',
                    borderColor: activeInsight.priority === 'urgent' ? '#fbbf24' : 
                                 activeInsight.priority === 'support' ? '#10b981' : '#10b981'
                  }}
                >
                  {activeInsight.priority === 'urgent' ? 'Important' :
                   activeInsight.priority === 'support' ? 'Guidance' : 'Affirmation'}
                </Badge>
                <span className="text-xs" style={{ color: '#6b7280' }}>
                  {activeInsight.source}
                </span>
              </div>
            </div>
          </div>
          
          {ethicsInsights.length > 1 && (
            <div className="pt-2 border-t" style={{ borderColor: 'rgba(251, 191, 36, 0.2)' }}>
              <p className="text-xs" style={{ color: 'rgba(16, 185, 129, 0.8)' }}>
                +{ethicsInsights.length - 1} more ethics insights available
                {wellnessGuidance.length > 0 && ` • ${wellnessGuidance.length} wellness ethics`}
                {ethicsChecklists.length > 0 && ` • ${ethicsChecklists.length} checklists`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
