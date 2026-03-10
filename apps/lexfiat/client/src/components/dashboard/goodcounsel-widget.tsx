import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Heart, TrendingUp, Users, Lightbulb, RefreshCw } from 'lucide-react';

interface GoodCounselInsight {
  id: string;
  type: 'wellness' | 'growth' | 'efficiency' | 'balance';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  category: string;
}

interface GoodCounselWidgetProps {
  className?: string;
}

export const GoodCounselWidget: React.FC<GoodCounselWidgetProps> = ({ className }) => {
  const [insights, setInsights] = useState<GoodCounselInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/goodcounsel/insights');
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch GoodCounsel insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'wellness': return <Heart className="h-4 w-4" />;
      case 'growth': return <TrendingUp className="h-4 w-4" />;
      case 'efficiency': return <Lightbulb className="h-4 w-4" />;
      case 'balance': return <Users className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'wellness': return 'text-green-600';
      case 'growth': return 'text-blue-600';
      case 'efficiency': return 'text-purple-600';
      case 'balance': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className={`goodcounsel-widget ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            GoodCounsel Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInsights}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading insights...</span>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No insights available. GoodCounsel is here to support you.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className="p-3 rounded-lg border border-gray-200 bg-gradient-to-r from-yellow-50 to-green-50 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={getTypeColor(insight.type)}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm">
                      {insight.title}
                    </h4>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getPriorityColor(insight.priority)}`}
                  >
                    {insight.priority}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {insight.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 capitalize">
                    {insight.category}
                  </span>
                  {insight.actionable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2 text-green-600 hover:text-green-700"
                    >
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {insights.length > 3 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-gray-600 hover:text-gray-700"
                >
                  View All {insights.length} Insights
                </Button>
              </div>
            )}
          </div>
        )}
        
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>GoodCounsel • Supportive Guidance</span>
            <span className="text-green-600">✓ Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoodCounselWidget;
