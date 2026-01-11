/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ARKIVER_ONBOARDING_CONFIG } from '../lib/onboarding-config';

const ONBOARDING_CONFIG = ARKIVER_ONBOARDING_CONFIG;
const { steps: STEPS, references } = ONBOARDING_CONFIG;
const { extractionModes, insightTypes, llmProviders } = references;

interface OnboardingFormData {
  userProfile: {
    email: string;
    displayName: string;
  };
  llmProvider: string;
  extractionSettings: {
    defaultMode: 'standard' | 'deep' | 'fast';
    enableOCR: boolean;
    extractCitations: boolean;
    extractEntities: boolean;
    extractTimeline: boolean;
    defaultInsightType: 'general' | 'legal' | 'medical' | 'business';
  };
  aiIntegrity: {
    enabled: boolean;
    driftThreshold: number;
    biasThreshold: number;
    notificationMethod: 'in_app' | 'email' | 'both';
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
  };
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    userProfile: {
      email: '',
      displayName: '',
    },
    llmProvider: '',
    extractionSettings: {
      defaultMode: 'standard',
      enableOCR: false,
      extractCitations: true,
      extractEntities: true,
      extractTimeline: true,
      defaultInsightType: 'general',
    },
    aiIntegrity: {
      enabled: true,
      driftThreshold: 75,
      biasThreshold: 80,
      notificationMethod: 'in_app',
    },
    preferences: {
      theme: 'auto',
      notifications: true,
    },
  });
  const [testingLLM, setTestingLLM] = useState(false);
  const [llmTestResult, setLLMTestResult] = useState<'success' | 'error' | null>(null);
  const [llmTestError, setLLMTestError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Clear LLM test result when provider changes
  useEffect(() => {
    setLLMTestResult(null);
    setLLMTestError(null);
  }, [formData.llmProvider]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestLLM = async () => {
    if (!formData.llmProvider) {
      setLLMTestResult('error');
      setLLMTestError('Please select a provider first.');
      return;
    }

    setTestingLLM(true);
    setLLMTestResult(null);
    setLLMTestError(null);

    try {
      const API_URL = import.meta.env.VITE_CYRANO_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/onboarding/test-llm-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: formData.llmProvider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setLLMTestResult('error');
        setLLMTestError(errorData.error || 'Connection failed. Please check server configuration.');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setLLMTestResult('success');
        setLLMTestError(null);
      } else {
        setLLMTestResult('error');
        setLLMTestError(data.error || 'Connection test failed.');
      }
    } catch (error) {
      console.error('Failed to test LLM provider:', error);
      setLLMTestResult('error');
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setLLMTestError('Unable to reach server. Please ensure Cyrano is running.');
      } else {
        setLLMTestError('Network error. Please check your connection and try again.');
      }
    } finally {
      setTestingLLM(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const API_URL = import.meta.env.VITE_CYRANO_API_URL || 'http://localhost:5002';
      
      // Save Arkiver onboarding configuration
      const response = await fetch(`${API_URL}/api/onboarding/arkiver-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'default-user', // TODO: Get from auth
          ...formData,
          llmProviderTested: llmTestResult === 'success',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save onboarding configuration');
      }

      // Mark onboarding as complete
      await fetch(`${API_URL}/api/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'default-user',
          appId: 'arkiver',
        }),
      });

      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    const stepKey = STEPS.find(s => s.id === currentStep)?.key;
    switch (stepKey) {
      case 'user_profile':
        return formData.userProfile.email && formData.userProfile.displayName;
      case 'ai_provider':
        return formData.llmProvider !== '';
      case 'extraction_settings':
        return true; // All fields have defaults
      case 'ai_integrity':
        return true; // Optional step
      case 'preferences':
        return true; // Optional step
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <main className="container mx-auto px-4 py-8 max-w-4xl" role="main" aria-label="Onboarding wizard">
        {/* Progress Steps */}
        <nav className="mb-8" aria-label="Onboarding progress">
          <div className="flex items-center justify-between" role="list">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1" role="listitem">
                  <div className="flex flex-col items-center flex-1">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                      style={isCompleted ? {} : isActive ? { backgroundColor: '#5B8FA3' } : {}}
                      aria-current={isActive ? 'step' : undefined}
                      aria-label={`Step ${step.id}: ${step.title}${isCompleted ? ' - Completed' : isActive ? ' - Current' : ''}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-white" aria-hidden="true" />
                      ) : (
                        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-600'}`} aria-hidden="true" />
                      )}
                    </div>
                    <p className={`text-xs mt-2 text-center ${
                      isActive ? 'font-semibold' : 'text-gray-600'
                    }`} style={isActive ? { color: '#2C3E50' } : {}}>
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div 
                      className={`flex-1 h-0.5 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Form Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {/* Step 1: User Profile */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2C3E50' }}>
                User Profile
              </h2>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.userProfile.email}
                  onChange={(e) => updateFormData('userProfile', {
                    ...formData.userProfile,
                    email: e.target.value
                  })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-required="true"
                  aria-describedby="email-help"
                />
                <p id="email-help" className="text-xs text-gray-500 mt-1">
                  Your email address for account management
                </p>
              </div>

              <div>
                <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={formData.userProfile.displayName}
                  onChange={(e) => updateFormData('userProfile', {
                    ...formData.userProfile,
                    displayName: e.target.value
                  })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-required="true"
                  aria-describedby="display-name-help"
                />
                <p id="display-name-help" className="text-xs text-gray-500 mt-1">
                  How your name appears in Arkiver
                </p>
              </div>
            </div>
          )}

          {/* Step 2: AI Provider */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2C3E50' }}>
                AI Provider Configuration
              </h2>
              
              <p className="text-gray-600 text-sm mb-4">
                Choose your AI provider for document extraction and insights.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LLM Provider *
                </label>
                <div className="space-y-2">
                  {llmProviders.map(provider => (
                    <label 
                      key={provider} 
                      className="flex items-center gap-3 text-gray-900 cursor-pointer hover:bg-gray-50 p-3 rounded border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 transition-all"
                    >
                      <input
                        type="radio"
                        name="llmProvider"
                        value={provider}
                        checked={formData.llmProvider === provider}
                        onChange={(e) => updateFormData('llmProvider', e.target.value)}
                        className="form-radio focus:ring-2 focus:ring-blue-500"
                        aria-label={`Select ${provider} as LLM provider`}
                      />
                      <div className="flex-1">
                        <div className="font-semibold capitalize">{provider}</div>
                        <div className="text-xs text-gray-500">
                          {provider === 'perplexity' && 'Perplexity for research and analysis'}
                          {provider === 'anthropic' && 'Claude for document analysis'}
                          {provider === 'openai' && 'GPT-4 for extraction and insights'}
                          {provider === 'google' && 'Google Gemini for processing'}
                          {provider === 'xai' && 'Grok for analysis'}
                          {provider === 'deepseek' && 'DeepSeek for processing'}
                          {provider === 'openrouter' && 'OpenRouter for multiple models'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {formData.llmProvider && (
                <div>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-gray-700">
                      <strong className="text-blue-600">Note:</strong> API keys are configured server-side. Click "Test Connection" to verify your provider is set up correctly.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleTestLLM}
                    disabled={testingLLM}
                    aria-label={`Test ${formData.llmProvider} API connection`}
                    className="w-full px-4 py-2 bg-white text-gray-900 rounded border border-gray-300 hover:border-blue-500 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {testingLLM ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Testing Connection...</span>
                      </>
                    ) : (
                      <span>Test API Connection</span>
                    )}
                  </button>

                  {llmTestResult === 'success' && (
                    <div 
                      role="alert"
                      aria-live="polite"
                      className="mt-3 p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2 text-green-800"
                    >
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">API connection successful!</p>
                        <p className="text-xs text-green-700 mt-1">
                          Your {formData.llmProvider} provider is configured and ready to use.
                        </p>
                      </div>
                    </div>
                  )}

                  {llmTestResult === 'error' && (
                    <div 
                      role="alert"
                      aria-live="assertive"
                      className="mt-3 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-red-800"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div className="flex-1">
                        <p className="font-semibold">Connection failed</p>
                        <p className="text-xs text-red-700 mt-1">
                          {llmTestError || `Please check that the ${formData.llmProvider} API key is configured in your server environment.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Extraction Settings */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2C3E50' }}>
                Extraction Settings
              </h2>
              
              <p className="text-gray-600 text-sm mb-4">
                Configure default extraction preferences for document processing.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Extraction Mode
                </label>
                <select
                  value={formData.extractionSettings.defaultMode}
                  onChange={(e) => updateFormData('extractionSettings', {
                    ...formData.extractionSettings,
                    defaultMode: e.target.value as 'standard' | 'deep' | 'fast'
                  })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {extractionModes.map(mode => (
                    <option key={mode} value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Standard: Balanced speed and accuracy. Deep: Maximum detail. Fast: Quick processing.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Insight Type
                </label>
                <select
                  value={formData.extractionSettings.defaultInsightType}
                  onChange={(e) => updateFormData('extractionSettings', {
                    ...formData.extractionSettings,
                    defaultInsightType: e.target.value as 'general' | 'legal' | 'medical' | 'business'
                  })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {insightTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 text-gray-900 cursor-pointer hover:bg-gray-50 p-3 rounded border border-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.extractionSettings.enableOCR}
                    onChange={(e) => updateFormData('extractionSettings', {
                      ...formData.extractionSettings,
                      enableOCR: e.target.checked
                    })}
                    className="rounded"
                  />
                  <div>
                    <div className="font-semibold">Enable OCR</div>
                    <div className="text-xs text-gray-500">Extract text from scanned documents and images</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 text-gray-900 cursor-pointer hover:bg-gray-50 p-3 rounded border border-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.extractionSettings.extractCitations}
                    onChange={(e) => updateFormData('extractionSettings', {
                      ...formData.extractionSettings,
                      extractCitations: e.target.checked
                    })}
                    className="rounded"
                  />
                  <div>
                    <div className="font-semibold">Extract Citations</div>
                    <div className="text-xs text-gray-500">Identify and extract citation references</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 text-gray-900 cursor-pointer hover:bg-gray-50 p-3 rounded border border-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.extractionSettings.extractEntities}
                    onChange={(e) => updateFormData('extractionSettings', {
                      ...formData.extractionSettings,
                      extractEntities: e.target.checked
                    })}
                    className="rounded"
                  />
                  <div>
                    <div className="font-semibold">Extract Entities</div>
                    <div className="text-xs text-gray-500">Identify people, organizations, and locations</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 text-gray-900 cursor-pointer hover:bg-gray-50 p-3 rounded border border-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.extractionSettings.extractTimeline}
                    onChange={(e) => updateFormData('extractionSettings', {
                      ...formData.extractionSettings,
                      extractTimeline: e.target.checked
                    })}
                    className="rounded"
                  />
                  <div>
                    <div className="font-semibold">Extract Timeline</div>
                    <div className="text-xs text-gray-500">Identify chronological events and dates</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: AI Integrity Monitoring */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2C3E50' }}>
                AI Integrity Monitoring
              </h2>
              
              <p className="text-gray-600 text-sm mb-4">
                Configure drift and bias detection thresholds for AI outputs.
              </p>

              <div>
                <label className="flex items-center gap-3 text-gray-900 cursor-pointer hover:bg-gray-50 p-3 rounded border border-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.aiIntegrity.enabled}
                    onChange={(e) => updateFormData('aiIntegrity', {
                      ...formData.aiIntegrity,
                      enabled: e.target.checked
                    })}
                    className="rounded"
                  />
                  <div>
                    <div className="font-semibold">Enable Proactive Integrity Monitoring</div>
                    <div className="text-xs text-gray-500">Monitor AI outputs for drift and bias</div>
                  </div>
                </label>
              </div>

              {formData.aiIntegrity.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Drift Threshold: {formData.aiIntegrity.driftThreshold}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.aiIntegrity.driftThreshold}
                      onChange={(e) => updateFormData('aiIntegrity', {
                        ...formData.aiIntegrity,
                        driftThreshold: parseInt(e.target.value)
                      })}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Alert when output drift exceeds this threshold
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bias Threshold: {formData.aiIntegrity.biasThreshold}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.aiIntegrity.biasThreshold}
                      onChange={(e) => updateFormData('aiIntegrity', {
                        ...formData.aiIntegrity,
                        biasThreshold: parseInt(e.target.value)
                      })}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Alert when bias detection exceeds this threshold
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Method
                    </label>
                    <select
                      value={formData.aiIntegrity.notificationMethod}
                      onChange={(e) => updateFormData('aiIntegrity', {
                        ...formData.aiIntegrity,
                        notificationMethod: e.target.value as 'in_app' | 'email' | 'both'
                      })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="in_app">In-App Only</option>
                      <option value="email">Email</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 5: Preferences */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2C3E50' }}>
                Preferences
              </h2>
              
              <p className="text-gray-600 text-sm mb-4">
                Configure general application preferences.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={formData.preferences.theme}
                  onChange={(e) => updateFormData('preferences', {
                    ...formData.preferences,
                    theme: e.target.value as 'light' | 'dark' | 'auto'
                  })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-3 text-gray-900 cursor-pointer hover:bg-gray-50 p-3 rounded border border-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.preferences.notifications}
                    onChange={(e) => updateFormData('preferences', {
                      ...formData.preferences,
                      notifications: e.target.checked
                    })}
                    className="rounded"
                  />
                  <div>
                    <div className="font-semibold">Enable Notifications</div>
                    <div className="text-xs text-gray-500">Receive in-app notifications for processing updates</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              aria-label="Go to previous step"
              className="px-6 py-2 bg-white text-gray-900 rounded border border-gray-300 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={() => setCurrentStep(Math.min(STEPS.length, currentStep + 1))}
                disabled={!canProceed()}
                aria-label={`Go to step ${currentStep + 1}`}
                className="px-6 py-2 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: '#5B8FA3' }}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || saving}
                aria-label="Complete onboarding setup"
                className="px-6 py-2 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: '#10B981' }}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Complete Setup</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

}
}
}
}
}
)
}
)
}
)
}
}
}
)