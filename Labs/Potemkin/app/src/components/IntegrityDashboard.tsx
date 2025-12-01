import React, { useEffect, useState } from 'react';
import { potemkinService } from '../services/potemkinService';

/**
 * Integrity Dashboard Component
 * 
 * Displays integrity monitoring dashboard with:
 * - Overall integrity metrics
 * - Trend analysis
 * - Recent alerts
 * - Integrity score over time
 */
export function IntegrityDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await potemkinService.getIntegrityMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load integrity metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="integrity-dashboard">Loading...</div>;
  }

  return (
    <div className="integrity-dashboard">
      <h2>Integrity Monitoring Dashboard</h2>
      
      {metrics ? (
        <div className="metrics">
          <div className="metric-card">
            <h3>Overall Integrity Score</h3>
            <p className="score">{metrics.overallScore || 'N/A'}</p>
          </div>
          
          <div className="metric-card">
            <h3>Documents Verified</h3>
            <p>{metrics.documentsVerified || 0}</p>
          </div>
          
          <div className="metric-card">
            <h3>Issues Detected</h3>
            <p>{metrics.issuesDetected || 0}</p>
          </div>
          
          <div className="metric-card">
            <h3>Recent Alerts</h3>
            {metrics.recentAlerts && metrics.recentAlerts.length > 0 ? (
              <ul>
                {metrics.recentAlerts.map((alert: any, i: number) => (
                  <li key={i}>{alert.message}</li>
                ))}
              </ul>
            ) : (
              <p>No recent alerts</p>
            )}
          </div>
        </div>
      ) : (
        <p>No metrics available</p>
      )}
    </div>
  );
}

