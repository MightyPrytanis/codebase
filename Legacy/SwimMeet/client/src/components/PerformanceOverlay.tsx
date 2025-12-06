import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minimize2,
  Maximize2,
  X
} from 'lucide-react';

interface ProviderMetrics {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  responseTime: number;
  successRate: number;
  totalQueries: number;
  recentTrend: 'up' | 'down' | 'stable';
  lastQuery: string;
}

interface PerformanceOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export function PerformanceOverlay({ isVisible, onClose }: PerformanceOverlayProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Fetch real-time performance data
  const { data: providers = [], isLoading } = useQuery<ProviderMetrics[]>({
    queryKey: ['/api/performance/metrics'],
    refetchInterval: 2000, // Update every 2 seconds
    enabled: isVisible,
  });

  const { data: systemMetrics } = useQuery<{
    totalQueries: number;
    activeProviders: number;
    avgResponseTime: number;
  }>({
    queryKey: ['/api/performance/system'],
    refetchInterval: 3000,
    enabled: isVisible,
  });

  if (!isVisible) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#16a34a';
      case 'disconnected': return '#6b7280';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={12} className="text-green-500" />;
      case 'down': return <TrendingDown size={12} className="text-red-500" />;
      default: return <Activity size={12} className="text-gray-500" />;
    }
  };

  return (
    <div 
      className="performance-overlay"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: isMinimized ? '300px' : '400px',
        maxHeight: isMinimized ? '60px' : '500px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 123, 255, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        zIndex: 10000,
        transition: 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
      data-testid="performance-overlay"
    >
      {/* Header */}
      <div 
        style={{
          padding: '12px 16px',
          borderBottom: isMinimized ? 'none' : '1px solid rgba(0, 123, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #007BFF10 0%, #0056D610 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: '#007BFF' }} />
          <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e40af' }}>
            Performance Monitor
          </span>
          {systemMetrics && (
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Zap size={10} />
              {systemMetrics?.avgResponseTime || 1500}ms
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            data-testid="button-minimize-overlay"
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            data-testid="button-close-overlay"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100px',
              color: '#6b7280'
            }}>
              Loading metrics...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* System Overview */}
              {systemMetrics && (
                <div 
                  style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#374151',
                    marginBottom: '8px' 
                  }}>
                    System Performance
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      Active Providers: {systemMetrics?.activeProviders || 0}/8
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      Total Queries: {systemMetrics?.totalQueries || 0}
                    </div>
                  </div>
                </div>
              )}

              {/* Provider Metrics */}
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  style={{
                    background: selectedProvider === provider.id 
                      ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                      : 'white',
                    border: `1px solid ${getStatusColor(provider.status)}40`,
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setSelectedProvider(
                    selectedProvider === provider.id ? null : provider.id
                  )}
                  data-testid={`provider-metric-${provider.id}`}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: getStatusColor(provider.status),
                          boxShadow: `0 0 8px ${getStatusColor(provider.status)}40`
                        }}
                      />
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>
                        {provider.name}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getTrendIcon(provider.recentTrend)}
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {provider.responseTime}ms
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      Success: {provider.successRate}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      Queries: {provider.totalQueries}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedProvider === provider.id && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #e5e7eb',
                      fontSize: '11px',
                      color: '#6b7280'
                    }}>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Last Query:</strong> {provider.lastQuery || 'None'}
                      </div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div>Status: {provider.status}</div>
                        <div>Trend: {provider.recentTrend}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}