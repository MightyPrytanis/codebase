import { Brain, TrendingUp, AlertCircle, RefreshCw, Heart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface GoodCounselWidgetProps {
  onClick?: () => void;
}

export function GoodCounselWidget({ onClick }: GoodCounselWidgetProps) {
  const [refreshing, setRefreshing] = useState(false);

  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ["/api/goodcounsel/insights"],
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const { data: nextActions } = useQuery({
    queryKey: ["/api/goodcounsel/next-actions"],
    refetchInterval: 600000, // Refetch every 10 minutes
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Enhanced data processing
  const workPatterns = insights?.workPatterns;
  const clientRelationships = insights?.clientRelationships;
  const nextActions = insights?.nextActions || [];
  const recommendations = insights?.recommendations || [];
  const resetSuggestions = insights?.resetSuggestions || [];

  // Create comprehensive insights with wellness focus
  const comprehensiveInsights = [
    // Wellness indicators from work patterns
    ...(workPatterns?.wellnessIndicators ? [{
      type: "wellness",
      text: `Wellness: ${workPatterns.wellnessIndicators.emotionalWellness} emotional state, ${workPatterns.wellnessIndicators.stressLevel} stress level`,
      priority: workPatterns.wellnessIndicators.stressLevel === 'critical' ? 'urgent' : 
                workPatterns.wellnessIndicators.emotionalWellness === 'excellent' ? 'affirmation' : 'support'
    }] : []),
    
    // Work-life balance insights
    ...(workPatterns?.wellnessIndicators ? [{
      type: "wellness",
      text: `Work-life balance: ${Math.round(workPatterns.wellnessIndicators.workLifeBalance * 100)}% - ${workPatterns.wellnessIndicators.workLifeBalance > 0.7 ? 'Excellent balance!' : 'Needs attention'}`,
      priority: workPatterns.wellnessIndicators.workLifeBalance > 0.7 ? "affirmation" : "support"
    }] : []),
    
    // Sustainable growth insights
    ...(workPatterns?.wellnessIndicators ? [{
      type: "wellness",
      text: `Sustainable growth: ${Math.round(workPatterns.wellnessIndicators.sustainableGrowth * 100)}% - ${workPatterns.wellnessIndicators.sustainableGrowth > 0.7 ? 'Building for the long-term!' : 'Focus on sustainable practices'}`,
      priority: workPatterns.wellnessIndicators.sustainableGrowth > 0.7 ? "affirmation" : "support"
    }] : []),
    
    // Relationship health insights
    ...(workPatterns?.wellnessIndicators ? [{
      type: "wellness",
      text: `Relationship health: ${Math.round(workPatterns.wellnessIndicators.relationshipHealth * 100)}% - ${workPatterns.wellnessIndicators.relationshipHealth > 0.7 ? 'Strong client bonds!' : 'Invest in relationships'}`,
      priority: workPatterns.wellnessIndicators.relationshipHealth > 0.7 ? "affirmation" : "support"
    }] : []),
    
    // Burnout risk insights
    ...(workPatterns?.wellnessIndicators ? [{
      type: "wellness",
      text: `Burnout risk: ${workPatterns.wellnessIndicators.burnoutRisk} - ${workPatterns.wellnessIndicators.burnoutRisk === 'high' ? '💛 Prioritize self-care' : 'Good risk management'}`,
      priority: workPatterns.wellnessIndicators.burnoutRisk === 'high' ? 'urgent' : 'affirmation'
    }] : []),
    
    // Client relationship insights
    ...(clientRelationships ? [{
      type: "relationship",
      text: `${clientRelationships.highValueClients} high-value clients, ${clientRelationships.atRiskClients} need attention`,
      priority: clientRelationships.atRiskClients > 0 ? "support" : "affirmation"
    }] : []),
    
    // Next action insights
    ...(nextActions.length > 0 ? [{
      type: "action",
      text: nextActions[0].action,
      priority: nextActions[0].priority === 'urgent' ? 'urgent' : 'growth'
    }] : []),
    
    // Wellness recommendations
    ...recommendations.slice(0, 2).map(rec => ({
      type: "wellness",
      text: rec,
      priority: "support"
    }))
  ];

  const activeRecommendation = comprehensiveInsights[0] || {
    type: "wellness",
    text: "GoodCounsel is here to support your practice",
    priority: "support"
  };

  return (
    <Card 
      className="swim-panel stat-card cursor-pointer transition-all relative overflow-hidden"
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(217, 119, 6, 0.12) 100%)',
        borderColor: 'rgba(251, 191, 36, 0.4)',
        borderWidth: '2px'
      }}
    >
      {/* Subtle gold shimmer effect */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.3) 0%, transparent 60%)'
        }}
      />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base panel-heading" style={{ color: '#fbbf24' }}>
            <Brain className="w-4 h-4" style={{ color: '#10b981' }} />
            <Heart className="w-3 h-3" style={{ color: '#10b981' }} />
            GoodCounsel
          </CardTitle>
          <div className="flex items-center gap-2">
          <Badge 
            className="text-xs"
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.4)'
            }}
          >
              {comprehensiveInsights.length} insights
          </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              disabled={refreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: '#10b981' }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#fbbf24' }}>{activeRecommendation.text}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(251, 191, 36, 0.7)' }}>
                {activeRecommendation.type === "ethical" && "Guidance & support"}
                {activeRecommendation.type === "wellness" && "Personal wellness"}
                {activeRecommendation.type === "workflow" && "Growth opportunity"}
              </p>
            </div>
          </div>
          
          {comprehensiveInsights.length > 1 && (
            <div className="pt-2 border-t" style={{ borderColor: 'rgba(251, 191, 36, 0.2)' }}>
              <p className="text-xs" style={{ color: 'rgba(16, 185, 129, 0.8)' }}>
                +{comprehensiveInsights.length - 1} more insights available
                {nextActions.length > 0 && ` • ${nextActions.length} next actions`}
                {clientRelationships && ` • ${clientRelationships.totalClients} clients`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
