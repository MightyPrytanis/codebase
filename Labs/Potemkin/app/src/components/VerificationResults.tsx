import React from 'react';

interface VerificationResultsProps {
  results: unknown[];
}

/**
 * Verification Results Component
 * 
 * Displays verification results from Potemkin engine, including:
 * - Verification status
 * - Confidence scores
 * - Detected issues
 * - Recommendations
 */
export function VerificationResults({ results }: VerificationResultsProps) {
  if (results.length === 0) {
    return (
      <div className="verification-results">
        <h2>Verification Results</h2>
        <p>No verification results yet. Upload a document to get started.</p>
      </div>
    );
  }

  return (
    <div className="verification-results">
      <h2>Verification Results</h2>
      {results.map((result, index) => (
        <div key={index} className="result-card">
          <h3>Document {index + 1}</h3>
          <div className="result-details">
            <p><strong>Status:</strong> {result.status || 'Unknown'}</p>
            <p><strong>Confidence:</strong> {result.confidence || 'N/A'}</p>
            {result.issues && result.issues.length > 0 && (
              <div className="issues">
                <strong>Issues Detected:</strong>
                <ul>
                  {result.issues.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="recommendations">
                <strong>Recommendations:</strong>
                <ul>
                  {result.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

