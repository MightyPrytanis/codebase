/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, CheckCircle, Clock, Play, FileText } from 'lucide-react';
import { runIntegrityTest, queryInsights } from '../lib/arkiver-api';

type TestType = 'opinion_drift' | 'bias' | 'honesty' | 'ten_rules' | 'fact_check';

const TEST_TYPES: { value: TestType; label: string; description: string }[] = [
  { value: 'opinion_drift', label: 'Opinion Drift', description: 'Detect changes in AI opinions over time' },
  { value: 'bias', label: 'Bias Detection', description: 'Identify potential biases in AI responses' },
  { value: 'honesty', label: 'Honesty Assessment', description: 'Evaluate truthfulness and accuracy' },
  { value: 'ten_rules', label: 'Ten Rules Compliance (v1.4)', description: 'Check adherence to ethical guidelines (Version 1.4 — 16 Dec 2025)' },
  { value: 'fact_check', label: 'Fact Check', description: 'Verify factual accuracy of claims' },
];

export default function AiIntegrity() {
  const [selectedTest, setSelectedTest] = useState<TestType>('opinion_drift');
  const [selectedLLM, setSelectedLLM] = useState<string>('model-1');
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);

  const { data: insightsData } = useQuery({
    queryKey: ['insights-for-integrity'],
    queryFn: () => queryInsights({ pagination: { limit: 100, offset: 0 } }),
  });

  const insights = insightsData?.insights || [];
  const availableLLMs = Array.from(new Set(insights.map(i => i.sourceLLM).filter(Boolean)));

  const testMutation = useMutation({
    mutationFn: (params: { testType: TestType; insightIds: string[]; llmSource: string }) =>
      runIntegrityTest(params),
  });

  const handleRunTest = () => {
    const insightIds = selectedInsights.length > 0 
      ? selectedInsights 
      : insights.slice(0, 10).map(i => i.insightId);
    
    testMutation.mutate({
      testType: selectedTest,
      insightIds,
      llmSource: selectedLLM,
    });
  };

  const results = testMutation.data?.results;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C3E50' }}>AI Integrity Testing</h1>
          <p style={{ color: '#5B8FA3' }}>Test and monitor AI-generated content for integrity, bias, and compliance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#2C3E50' }}>
                <Shield className="w-5 h-5" style={{ color: '#D89B6A' }} />
                Test Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Type
                  </label>
                  <select
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value as TestType)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TEST_TYPES.map(test => (
                      <option key={test.value} value={test.value}>
                        {test.label} - {test.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LLM Source
                  </label>
                  <select
                    value={selectedLLM}
                    onChange={(e) => setSelectedLLM(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableLLMs.length > 0 ? (
                      availableLLMs.map((llm, idx) => (
                        <option key={llm} value={llm}>Model {idx + 1}</option>
                      ))
                    ) : (
                      <option value="model-1">Model 1</option>
                    )}
                  </select>
                </div>

    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insights to Test ({selectedInsights.length} selected, or all if none)
                  </label>
                  <div className="max-h-40 overflow-y-auto bg-gray-50 border border-gray-300 rounded-lg p-2 space-y-1">
                    {insights.slice(0, 20).map(insight => (
                      <label key={insight.insightId} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedInsights.includes(insight.insightId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInsights([...selectedInsights, insight.insightId]);
                            } else {
                              setSelectedInsights(selectedInsights.filter(id => id !== insight.insightId));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 truncate">{insight.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRunTest}
                  disabled={testMutation.isPending}
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#D89B6A' }}
                >
                  {testMutation.isPending ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      Running Test...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run Integrity Test
                    </>
                  )}
                </button>
              </div>
            </div>

            {testMutation.data && results && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#2C3E50' }}>
                  <FileText className="w-5 h-5" style={{ color: '#D89B6A' }} />
                  Test Results
                </h2>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <div className="text-2xl font-bold" style={{ color: '#5B8FA3' }}>{results.insightsTested}</div>
                    <div className="text-sm" style={{ color: '#5B8FA3' }}>Tested</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-300">
                    <div className="text-2xl font-bold text-green-600">{results.passed}</div>
                    <div className="text-sm" style={{ color: '#5B8FA3' }}>Passed</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center border border-red-300">
                    <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                    <div className="text-sm" style={{ color: '#5B8FA3' }}>Failed</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-300">
                    <div className="text-2xl font-bold text-blue-600">{results.warnings}</div>
                    <div className="text-sm" style={{ color: '#5B8FA3' }}>Warnings</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold" style={{ color: '#2C3E50' }}>Detailed Results</h3>
                  {results.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        detail.status === 'passed'
                          ? 'bg-green-50 border-green-300'
                          : detail.status === 'failed'
                          ? 'bg-red-50 border-red-300'
                          : 'bg-blue-50 border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>
                          Insight {detail.insightId.slice(0, 8)}...
                        </span>
                        <div className="flex items-center gap-2">
                          {detail.status === 'passed' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : detail.status === 'failed' ? (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-blue-600" />
                          )}
                          <span className={`text-sm font-semibold ${
                            detail.status === 'passed' ? 'text-green-600' :
                            detail.status === 'failed' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {detail.status.toUpperCase()}
                          </span>
                          {detail.score !== undefined && (
                            <span className="text-sm" style={{ color: '#5B8FA3' }}>
                              Score: {Math.round(detail.score * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                      {detail.issues && detail.issues.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Issues:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {detail.issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {detail.recommendations && detail.recommendations.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Recommendations:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {detail.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testMutation.isError && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-600">
                Error running test: {testMutation.error instanceof Error ? testMutation.error.message : 'Unknown error'}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#2C3E50' }}>About Integrity Tests</h3>
              <div className="space-y-3 text-sm" style={{ color: '#5B8FA3' }}>
                <p>
                  Integrity tests help ensure AI-generated content maintains quality, accuracy, and ethical standards.
                </p>
                <p>
                  Run tests regularly to monitor for drift, bias, or compliance issues in your AI outputs.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#2C3E50' }}>Test Types</h3>
              <div className="space-y-2 text-sm">
                {TEST_TYPES.map(test => (
                  <div key={test.value} className="p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="font-medium" style={{ color: '#2C3E50' }}>{test.label}</div>
                    <div className="text-xs" style={{ color: '#5B8FA3' }}>{test.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
