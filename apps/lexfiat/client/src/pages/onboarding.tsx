/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX,
  Mail,
  Calendar,
  Scale,
  Link as LinkIcon,
  Edit,
  X
} from 'lucide-react';
import Header from '@/components/layout/header';
import { savePracticeProfile, PracticeProfile } from '@/lib/library-api';
import { LEXFIAT_ONBOARDING_CONFIG } from '@/lib/onboarding-config';
import { useAmbientAudio, playFanfare } from '@/hooks/use-ambient-audio';

const ONBOARDING_CONFIG = LEXFIAT_ONBOARDING_CONFIG;
const { steps: STEPS, references } = ONBOARDING_CONFIG;
const { jurisdictions: US_STATES, practiceAreas: PRACTICE_AREAS, commonIssueTags: COMMON_ISSUE_TAGS } = references;

interface OnboardingFormData {
  primaryJurisdiction: string;
  additionalJurisdictions: string[];
  practiceAreas: string[];
  counties: string[];
  courts: string[];
  issueTags: string[];
  storagePreferences: {
    localPath: string;
    oneDriveEnabled: boolean;
    gDriveEnabled: boolean;
    s3Enabled: boolean;
    s3Bucket: string;
    cacheSize: number;
  };
  researchProvider: 'westlaw' | 'courtlistener' | 'other' | '';
  llmProvider: 'openai' | 'anthropic' | 'perplexity' | '';
  chronometricBaseline: {
    minimumHoursPerWeek: number;
    minimumHoursPerDay?: number;
    typicalSchedule?: { [dayOfWeek: string]: number };
    useBaselineUntilDataAvailable: boolean;
  };
  integrations: {
    clio: { connected: boolean; skipped: boolean };
    email: {
      gmail: { connected: boolean; skipped: boolean };
      outlook: { connected: boolean; skipped: boolean };
    };
    calendar: {
      google: { connected: boolean; skipped: boolean };
      outlook: { connected: boolean; skipped: boolean };
    };
    researchProviders: {
      westlaw: { apiKey: string; skipped: boolean };
      courtlistener: { apiKey: string; skipped: boolean };
    };
  };
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    primaryJurisdiction: '',
    additionalJurisdictions: [],
    practiceAreas: [],
    counties: [],
    courts: [],
    issueTags: [],
    storagePreferences: {
      localPath: '',
      oneDriveEnabled: false,
      gDriveEnabled: false,
      s3Enabled: false,
      s3Bucket: '',
      cacheSize: 1024,
    },
    researchProvider: '',
    llmProvider: '',
    chronometricBaseline: {
      minimumHoursPerWeek: 40,
      useBaselineUntilDataAvailable: true,
    },
    integrations: {
      clio: { connected: false, skipped: false },
      email: {
        gmail: { connected: false, skipped: false },
        outlook: { connected: false, skipped: false },
      },
      calendar: {
        google: { connected: false, skipped: false },
        outlook: { connected: false, skipped: false },
      },
      researchProviders: {
        westlaw: { apiKey: '', skipped: false },
        courtlistener: { apiKey: '', skipped: false },
      },
    },
  });
  const [customCounty, setCustomCounty] = useState('');
  const [customCourt, setCustomCourt] = useState('');
  const [customIssueTag, setCustomIssueTag] = useState('');
  const [testingLLM, setTestingLLM] = useState(false);
  const [llmTestResult, setLLMTestResult] = useState<'success' | 'error' | null>(null);
  const [llmTestError, setLLMTestError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Ambient audio for space-y, science-y atmosphere
  const { isMuted, toggleMute } = useAmbientAudio({ 
    enabled: true, 
    volume: 0.12 // Very subtle - background atmosphere only
  });
  
  // Play opening fanfare when onboarding starts
  useEffect(() => {
    // Small delay to ensure audio context is ready
    const timer = setTimeout(() => {
      playFanfare(0.35); // Slightly quieter for opening
    }, 300);
    
    return () => clearTimeout(timer);
  }, []); // Only on mount
  
  // Clear LLM test result when provider changes
  useEffect(() => {
    setLLMTestResult(null);
    setLLMTestError(null);
  }, [formData.llmProvider]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof OnboardingFormData, value: string) => {
    const currentArray = formData[field] as string[];
    if (currentArray.includes(value)) {
      updateFormData(field, currentArray.filter(item => item !== value));
    } else {
      updateFormData(field, [...currentArray, value]);
    }
  };

  const addCustomItem = (field: keyof OnboardingFormData, value: string, clearFn: () => void) => {
    if (value.trim()) {
      const currentArray = formData[field] as string[];
      if (!currentArray.includes(value.trim())) {
        updateFormData(field, [...currentArray, value.trim()]);
      }
      clearFn();
    }
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
      const userId = 'default-user'; // TODO: Get from auth

      // Save practice profile
      await savePracticeProfile({
        userId,
        primaryJurisdiction: formData.primaryJurisdiction,
        additionalJurisdictions: formData.additionalJurisdictions,
        practiceAreas: formData.practiceAreas,
        counties: formData.counties,
        courts: formData.courts,
        issueTags: formData.issueTags,
        storagePreferences: formData.storagePreferences,
        researchProvider: formData.researchProvider as any,
        llmProvider: formData.llmProvider as any,
        llmProviderTested: llmTestResult === 'success',
      } as Partial<PracticeProfile>);
      
      // Save Chronometric baseline config
      const baselineResponse = await fetch(`${API_URL}/api/onboarding/baseline-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...formData.chronometricBaseline,
        }),
      });
      
      if (!baselineResponse.ok) {
        console.warn('Failed to save baseline config:', await baselineResponse.text());
        // Don't fail onboarding if baseline save fails
      }

      // Save integrations
      const integrationsResponse = await fetch(`${API_URL}/api/onboarding/integrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          clio: formData.integrations.clio.connected ? {
            connected: true,
            connectedAt: new Date().toISOString(),
          } : undefined,
          email: {
            gmail: formData.integrations.email.gmail.connected ? { connected: true } : undefined,
            outlook: formData.integrations.email.outlook.connected ? { connected: true } : undefined,
          },
          calendar: {
            google: formData.integrations.calendar.google.connected ? { connected: true } : undefined,
            outlook: formData.integrations.calendar.outlook.connected ? { connected: true } : undefined,
          },
          researchProviders: {
            westlaw: formData.integrations.researchProviders.westlaw.apiKey ? {
              apiKey: formData.integrations.researchProviders.westlaw.apiKey,
            } : undefined,
            courtlistener: formData.integrations.researchProviders.courtlistener.apiKey ? {
              apiKey: formData.integrations.researchProviders.courtlistener.apiKey,
            } : undefined,
          },
        }),
      });

      if (!integrationsResponse.ok) {
        console.warn('Failed to save integrations:', await integrationsResponse.text());
        // Don't fail onboarding if integrations save fails
      }

      // Mark onboarding as complete
      const completeResponse = await fetch(`${API_URL}/api/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          appId: 'lexfiat',
        }),
      });

      if (!completeResponse.ok) {
        console.warn('Failed to mark onboarding complete:', await completeResponse.text());
        // Don't fail onboarding if completion mark fails
      }
      
      // Play completion fanfare before redirect
      playFanfare(0.4); // Slightly louder for completion
      
      // Small delay to let fanfare start, then redirect
      setTimeout(() => {
        setLocation('/dashboard');
      }, 500);
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
      case 'jurisdiction_practice':
        return formData.primaryJurisdiction && formData.practiceAreas.length > 0;
      case 'counties_courts':
        return formData.counties.length > 0;
      case 'issue_tags':
        return formData.issueTags.length > 0;
      case 'storage_locations':
        return true; // Optional step
      case 'ai_provider':
        return formData.llmProvider !== '';
      case 'time_tracking':
        return formData.chronometricBaseline.minimumHoursPerWeek > 0;
      case 'integrations':
        return true; // Optional step - can proceed even if skipped
      case 'review_complete':
        return true; // Always can proceed to completion
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      <Header />
      
      {/* Ambient Audio Control - Subtle, unobtrusive */}
      <button
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
        className="fixed top-20 right-4 z-40 p-2 bg-charcoal/80 hover:bg-charcoal border border-gray-600 rounded-lg text-warm-white/70 hover:text-warm-white transition-all focus:outline-none focus:ring-2 focus:ring-aqua"
        title={isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Volume2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      
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
                        isCompleted ? 'bg-light-green' : isActive ? 'bg-aqua' : 'bg-gray-600'
                      }`}
                      aria-current={isActive ? 'step' : undefined}
                      aria-label={`Step ${step.id}: ${step.title}${isCompleted ? ' - Completed' : isActive ? ' - Current' : ''}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-primary-dark" aria-hidden="true" />
                      ) : (
                        <Icon className={`h-5 w-5 ${isActive ? 'text-primary-dark' : 'text-warm-white/50'}`} aria-hidden="true" />
                      )}
                    </div>
                    <p className={`text-xs mt-2 text-center ${
                      isActive ? 'text-warm-white font-semibold' : 'text-warm-white/60'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div 
                      className={`flex-1 h-0.5 ${
                        isCompleted ? 'bg-light-green' : 'bg-gray-600'
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
        <div className="bg-charcoal border border-gray-600 rounded-lg p-6">
          {/* Step 1: Jurisdiction & Practice Areas */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-warm-white mb-4">
                Jurisdiction & Practice Areas
              </h2>
              
              <div>
                <label htmlFor="primary-jurisdiction" className="block text-sm font-semibold text-warm-white mb-2">
                  Primary Jurisdiction *
                </label>
                <select
                  id="primary-jurisdiction"
                  value={formData.primaryJurisdiction}
                  onChange={(e) => updateFormData('primaryJurisdiction', e.target.value)}
                  className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white focus:outline-none focus:ring-2 focus:ring-aqua focus:border-aqua"
                  aria-required="true"
                  aria-describedby="primary-jurisdiction-help"
                >
                  <option value="">Select a state...</option>
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <p id="primary-jurisdiction-help" className="text-xs text-warm-white/60 mt-1">
                  Select your main jurisdiction for practice
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Additional Jurisdictions (Optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-navy rounded">
                  {US_STATES.map(state => (
                    <label key={state} className="flex items-center gap-2 text-sm text-warm-white cursor-pointer hover:bg-charcoal p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.additionalJurisdictions.includes(state)}
                        onChange={() => toggleArrayItem('additionalJurisdictions', state)}
                        className="form-checkbox"
                      />
                      {state}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Practice Areas *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRACTICE_AREAS.map(area => (
                    <label key={area} className="flex items-center gap-2 text-sm text-warm-white cursor-pointer hover:bg-navy p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.practiceAreas.includes(area)}
                        onChange={() => toggleArrayItem('practiceAreas', area)}
                        className="form-checkbox"
                      />
                      {area}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Counties & Courts */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-warm-white mb-4">
                Counties & Courts
              </h2>
              
              <div>
                <label htmlFor="custom-county" className="block text-sm font-semibold text-warm-white mb-2">
                  Counties You Practice In *
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    id="custom-county"
                    type="text"
                    value={customCounty}
                    onChange={(e) => setCustomCounty(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem('counties', customCounty, () => setCustomCounty(''));
                      }
                    }}
                    placeholder="Enter county name..."
                    className="flex-1 bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white focus:outline-none focus:ring-2 focus:ring-aqua focus:border-aqua"
                    aria-label="Enter county name"
                    aria-describedby="county-help"
                  />
                  <button
                    onClick={() => addCustomItem('counties', customCounty, () => setCustomCounty(''))}
                    aria-label="Add county"
                    className="px-4 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal min-w-[80px]"
                  >
                    Add
                  </button>
                </div>
                <p id="county-help" className="text-xs text-warm-white/60 mb-2">
                  Type a county name and press Enter or click Add
                </p>
                <div className="flex flex-wrap gap-2" role="list" aria-label="Selected counties">
                  {formData.counties.map(county => (
                    <span
                      key={county}
                      className="px-3 py-1 bg-navy text-warm-white rounded flex items-center gap-2"
                      role="listitem"
                    >
                      <span>{county}</span>
                      <button
                        onClick={() => toggleArrayItem('counties', county)}
                        aria-label={`Remove ${county}`}
                        className="text-alert-red hover:text-warm-white focus:outline-none focus:ring-2 focus:ring-alert-red rounded ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="custom-court" className="block text-sm font-semibold text-warm-white mb-2">
                  Courts You Appear In
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    id="custom-court"
                    type="text"
                    value={customCourt}
                    onChange={(e) => setCustomCourt(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem('courts', customCourt, () => setCustomCourt(''));
                      }
                    }}
                    placeholder="Enter court name..."
                    className="flex-1 bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white focus:outline-none focus:ring-2 focus:ring-aqua focus:border-aqua"
                    aria-label="Enter court name"
                    aria-describedby="court-help"
                  />
                  <button
                    onClick={() => addCustomItem('courts', customCourt, () => setCustomCourt(''))}
                    aria-label="Add court"
                    className="px-4 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal min-w-[80px]"
                  >
                    Add
                  </button>
                </div>
                <p id="court-help" className="text-xs text-warm-white/60 mb-2">
                  Type a court name and press Enter or click Add
                </p>
                <div className="flex flex-wrap gap-2" role="list" aria-label="Selected courts">
                  {formData.courts.map(court => (
                    <span
                      key={court}
                      className="px-3 py-1 bg-navy text-warm-white rounded flex items-center gap-2"
                      role="listitem"
                    >
                      <span>{court}</span>
                      <button
                        onClick={() => toggleArrayItem('courts', court)}
                        aria-label={`Remove ${court}`}
                        className="text-alert-red hover:text-warm-white focus:outline-none focus:ring-2 focus:ring-alert-red rounded ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Issue Tags */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-warm-white mb-4">
                Issue Tags
              </h2>
              
              <p className="text-warm-white/70 text-sm mb-4">
                Select common issues you handle. These help filter and organize library items.
              </p>

              <div>
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Common Issues *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {COMMON_ISSUE_TAGS.map(tag => (
                    <label key={tag} className="flex items-center gap-2 text-sm text-warm-white cursor-pointer hover:bg-navy p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.issueTags.includes(tag)}
                        onChange={() => toggleArrayItem('issueTags', tag)}
                        className="form-checkbox"
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="custom-issue-tag" className="block text-sm font-semibold text-warm-white mb-2">
                  Custom Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    id="custom-issue-tag"
                    type="text"
                    value={customIssueTag}
                    onChange={(e) => setCustomIssueTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem('issueTags', customIssueTag, () => setCustomIssueTag(''));
                      }
                    }}
                    placeholder="Enter custom tag..."
                    className="flex-1 bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white focus:outline-none focus:ring-2 focus:ring-aqua focus:border-aqua"
                    aria-label="Enter custom issue tag"
                    aria-describedby="custom-tag-help"
                  />
                  <button
                    onClick={() => addCustomItem('issueTags', customIssueTag, () => setCustomIssueTag(''))}
                    aria-label="Add custom tag"
                    className="px-4 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal min-w-[80px]"
                  >
                    Add
                  </button>
                </div>
                <p id="custom-tag-help" className="text-xs text-warm-white/60 mb-2">
                  Type a custom tag and press Enter or click Add
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Storage Locations */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-warm-white mb-4">
                Storage Locations
              </h2>
              
              <p className="text-warm-white/70 text-sm mb-4">
                Configure where to store and sync your legal library documents.
              </p>

              <div>
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Local Storage Path
                </label>
                <input
                  type="text"
                  value={formData.storagePreferences.localPath}
                  onChange={(e) => updateFormData('storagePreferences', {
                    ...formData.storagePreferences,
                    localPath: e.target.value
                  })}
                  placeholder="/path/to/legal/documents"
                  className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 text-warm-white cursor-pointer hover:bg-navy p-3 rounded">
                  <input
                    type="checkbox"
                    checked={formData.storagePreferences.oneDriveEnabled}
                    onChange={(e) => updateFormData('storagePreferences', {
                      ...formData.storagePreferences,
                      oneDriveEnabled: e.target.checked
                    })}
                    className="form-checkbox"
                  />
                  <div>
                    <div className="font-semibold">Microsoft OneDrive</div>
                    <div className="text-xs text-warm-white/60">Sync with OneDrive for Business</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 text-warm-white cursor-pointer hover:bg-navy p-3 rounded">
                  <input
                    type="checkbox"
                    checked={formData.storagePreferences.gDriveEnabled}
                    onChange={(e) => updateFormData('storagePreferences', {
                      ...formData.storagePreferences,
                      gDriveEnabled: e.target.checked
                    })}
                    className="form-checkbox"
                  />
                  <div>
                    <div className="font-semibold">Google Drive</div>
                    <div className="text-xs text-warm-white/60">Sync with Google Drive</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 text-warm-white cursor-pointer hover:bg-navy p-3 rounded">
                  <input
                    type="checkbox"
                    checked={formData.storagePreferences.s3Enabled}
                    onChange={(e) => updateFormData('storagePreferences', {
                      ...formData.storagePreferences,
                      s3Enabled: e.target.checked
                    })}
                    className="form-checkbox"
                  />
                  <div>
                    <div className="font-semibold">AWS S3</div>
                    <div className="text-xs text-warm-white/60">Store in Amazon S3 bucket</div>
                  </div>
                </label>

                {formData.storagePreferences.s3Enabled && (
                  <input
                    type="text"
                    value={formData.storagePreferences.s3Bucket}
                    onChange={(e) => updateFormData('storagePreferences', {
                      ...formData.storagePreferences,
                      s3Bucket: e.target.value
                    })}
                    placeholder="S3 Bucket Name"
                    className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white ml-9"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Cache Size (MB)
                </label>
                <input
                  type="number"
                  value={formData.storagePreferences.cacheSize}
                  onChange={(e) => updateFormData('storagePreferences', {
                    ...formData.storagePreferences,
                    cacheSize: parseInt(e.target.value) || 1024
                  })}
                  className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white"
                />
              </div>
            </div>
          )}

          {/* Step 5: AI Provider */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-warm-white mb-4">
                AI Provider Configuration
              </h2>
              
              <p className="text-warm-white/70 text-sm mb-4">
                Choose your AI provider for document analysis and legal research assistance.
              </p>

              <div>
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  LLM Provider *
                </label>
                <div className="space-y-2">
                  {(['openai', 'anthropic', 'perplexity'] as const).map(provider => (
                    <label 
                      key={provider} 
                      className="flex items-center gap-3 text-warm-white cursor-pointer hover:bg-navy p-3 rounded border border-gray-600 focus-within:ring-2 focus-within:ring-aqua focus-within:border-aqua transition-all"
                    >
                      <input
                        type="radio"
                        name="llmProvider"
                        value={provider}
                        checked={formData.llmProvider === provider}
                        onChange={(e) => updateFormData('llmProvider', e.target.value)}
                        className="form-radio focus:ring-2 focus:ring-aqua"
                        aria-label={`Select ${provider} as LLM provider`}
                      />
                      <div className="flex-1">
                        <div className="font-semibold capitalize">{provider}</div>
                        <div className="text-xs text-warm-white/60">
                          {provider === 'openai' && 'GPT-4 and embeddings for RAG'}
                          {provider === 'anthropic' && 'Claude for legal analysis'}
                          {provider === 'perplexity' && 'Perplexity for research'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {formData.llmProvider && (
                <div>
                  <div className="mb-4 p-3 bg-navy/50 border border-aqua/30 rounded">
                    <p className="text-xs text-warm-white/70">
                      <strong className="text-aqua">Note:</strong> API keys are configured server-side. Click "Test Connection" to verify your provider is set up correctly.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleTestLLM}
                    disabled={testingLLM}
                    aria-label={`Test ${formData.llmProvider} API connection`}
                    className="w-full px-4 py-2 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua hover:bg-navy/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                  >
                    {testingLLM ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Testing Connection...</span>
                      </>
                    ) : (
                      <>
                        <span>Test API Connection</span>
                      </>
                    )}
                  </button>

                  {llmTestResult === 'success' && (
                    <div 
                      role="alert"
                      aria-live="polite"
                      className="mt-3 p-3 bg-light-green/20 border border-light-green rounded flex items-start gap-2 text-light-green"
                    >
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">API connection successful!</p>
                        <p className="text-xs text-light-green/80 mt-1">
                          Your {formData.llmProvider} provider is configured and ready to use.
                        </p>
                      </div>
                    </div>
                  )}

                  {llmTestResult === 'error' && (
                    <div 
                      role="alert"
                      aria-live="assertive"
                      className="mt-3 p-3 bg-alert-red/20 border border-alert-red rounded flex items-start gap-2 text-alert-red"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div className="flex-1">
                        <p className="font-semibold">Connection failed</p>
                        <p className="text-xs text-alert-red/80 mt-1">
                          {llmTestError || `Please check that the ${formData.llmProvider} API key is configured in your server environment and that your account has sufficient credits.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Research Provider (Optional)
                </label>
                <select
                  value={formData.researchProvider}
                  onChange={(e) => updateFormData('researchProvider', e.target.value)}
                  className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white"
                >
                  <option value="">None</option>
                  <option value="westlaw">Westlaw</option>
                  <option value="courtlistener">CourtListener</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 6: Time Tracking Setup (Chronometric Baseline) */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-warm-white mb-4">
                Time Tracking Setup
              </h2>
              
              <p className="text-warm-white/70 text-sm mb-4">
                Configure your baseline time tracking settings. Chronometric will use this to identify gaps in your billable time until it learns your patterns from 30+ days of historical data.
              </p>

              <div>
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Minimum Hours Per Week *
                </label>
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={formData.chronometricBaseline.minimumHoursPerWeek}
                  onChange={(e) => updateFormData('chronometricBaseline', {
                    ...formData.chronometricBaseline,
                    minimumHoursPerWeek: parseInt(e.target.value) || 40
                  })}
                  className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white"
                />
                <p className="text-xs text-warm-white/60 mt-1">
                  Typical full-time: 40 hours/week
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Minimum Hours Per Day (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={formData.chronometricBaseline.minimumHoursPerDay || Math.round(formData.chronometricBaseline.minimumHoursPerWeek / 5)}
                  onChange={(e) => updateFormData('chronometricBaseline', {
                    ...formData.chronometricBaseline,
                    minimumHoursPerDay: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white"
                />
                <p className="text-xs text-warm-white/60 mt-1">
                  Calculated from weekly hours if not specified (assumes 5-day work week)
                </p>
              </div>

              <div>
                <label className="flex items-center gap-3 text-warm-white cursor-pointer hover:bg-navy p-3 rounded border border-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.chronometricBaseline.useBaselineUntilDataAvailable}
                    onChange={(e) => updateFormData('chronometricBaseline', {
                      ...formData.chronometricBaseline,
                      useBaselineUntilDataAvailable: e.target.checked
                    })}
                    className="form-checkbox"
                  />
                  <div>
                    <div className="font-semibold">Use Baseline Until Pattern Learning Available</div>
                    <div className="text-xs text-warm-white/60">
                      Use baseline configuration until Chronometric has 30+ days of historical data to learn your patterns
                    </div>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-navy/50 border border-aqua/30 rounded">
                <h3 className="text-sm font-semibold text-aqua mb-2">Workflow Archaeology</h3>
                <p className="text-xs text-warm-white/70">
                  Chronometric includes Workflow Archaeology—forensic recreation tools that help reconstruct past hours, days, or weeks when details have been forgotten. These tools use the same artifact collection and reconstruction logic to help you recover lost billable time.
                </p>
              </div>
            </div>
          )}

          {/* Step 7: Integrations */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-warm-white mb-4">
                Integrations
              </h2>
              
              <p className="text-warm-white/70 text-sm mb-4">
                Connect your practice management, email, calendar, and research tools. You can skip any integration and set it up later.
              </p>

              {/* Clio Integration */}
              <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Scale className="h-5 w-5 text-aqua" aria-hidden="true" />
                    <div>
                      <h3 className="font-semibold text-warm-white">Clio Practice Management</h3>
                      <p className="text-xs text-warm-white/60">Sync matters, clients, and billing information</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.integrations.clio.connected && (
                      <span className="px-2 py-1 bg-light-green/20 text-light-green text-xs rounded flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        Connected
                      </span>
                    )}
                    {formData.integrations.clio.skipped && (
                      <span className="px-2 py-1 bg-gray-600 text-warm-white/60 text-xs rounded">Skipped</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // TODO: Implement OAuth flow
                      updateFormData('integrations', {
                        ...formData.integrations,
                        clio: { connected: true, skipped: false },
                      });
                    }}
                    disabled={formData.integrations.clio.connected}
                    aria-label="Connect Clio"
                    className="px-4 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                  >
                    {formData.integrations.clio.connected ? 'Connected' : 'Connect Clio'}
                  </button>
                  <button
                    onClick={() => {
                      updateFormData('integrations', {
                        ...formData.integrations,
                        clio: { connected: false, skipped: true },
                      });
                    }}
                    disabled={formData.integrations.clio.connected}
                    aria-label="Skip Clio integration"
                    className="px-4 py-2 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                  >
                    Skip for now
                  </button>
                </div>
              </div>

              {/* Email Integrations */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-warm-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-aqua" aria-hidden="true" />
                  Email Integrations
                </h3>
                
                {/* Gmail */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-warm-white">Gmail</h4>
                      <p className="text-xs text-warm-white/60">Monitor and process incoming legal communications</p>
                    </div>
                    {formData.integrations.email.gmail.connected && (
                      <span className="px-2 py-1 bg-light-green/20 text-light-green text-xs rounded flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        Connected
                      </span>
                    )}
                    {formData.integrations.email.gmail.skipped && (
                      <span className="px-2 py-1 bg-gray-600 text-warm-white/60 text-xs rounded">Skipped</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // TODO: Implement OAuth flow
                        updateFormData('integrations', {
                          ...formData.integrations,
                          email: {
                            ...formData.integrations.email,
                            gmail: { connected: true, skipped: false },
                          },
                        });
                      }}
                      disabled={formData.integrations.email.gmail.connected}
                      aria-label="Connect Gmail"
                      className="px-4 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      {formData.integrations.email.gmail.connected ? 'Connected' : 'Connect Gmail'}
                    </button>
                    <button
                      onClick={() => {
                        updateFormData('integrations', {
                          ...formData.integrations,
                          email: {
                            ...formData.integrations.email,
                            gmail: { connected: false, skipped: true },
                          },
                        });
                      }}
                      disabled={formData.integrations.email.gmail.connected}
                      aria-label="Skip Gmail integration"
                      className="px-4 py-2 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>

                {/* Outlook */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-warm-white">Microsoft Outlook</h4>
                      <p className="text-xs text-warm-white/60">Alternative email monitoring and processing</p>
                    </div>
                    {formData.integrations.email.outlook.connected && (
                      <span className="px-2 py-1 bg-light-green/20 text-light-green text-xs rounded flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        Connected
                      </span>
                    )}
                    {formData.integrations.email.outlook.skipped && (
                      <span className="px-2 py-1 bg-gray-600 text-warm-white/60 text-xs rounded">Skipped</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // TODO: Implement OAuth flow
                        updateFormData('integrations', {
                          ...formData.integrations,
                          email: {
                            ...formData.integrations.email,
                            outlook: { connected: true, skipped: false },
                          },
                        });
                      }}
                      disabled={formData.integrations.email.outlook.connected}
                      aria-label="Connect Outlook"
                      className="px-4 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      {formData.integrations.email.outlook.connected ? 'Connected' : 'Connect Outlook'}
                    </button>
                    <button
                      onClick={() => {
                        updateFormData('integrations', {
                          ...formData.integrations,
                          email: {
                            ...formData.integrations.email,
                            outlook: { connected: false, skipped: true },
                          },
                        });
                      }}
                      disabled={formData.integrations.email.outlook.connected}
                      aria-label="Skip Outlook integration"
                      className="px-4 py-2 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar Integrations */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-warm-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-aqua" aria-hidden="true" />
                  Calendar Integrations
                </h3>
                
                {/* Google Calendar */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-warm-white">Google Calendar</h4>
                      <p className="text-xs text-warm-white/60">Sync calendar events and deadlines</p>
                    </div>
                    {formData.integrations.calendar.google.connected && (
                      <span className="px-2 py-1 bg-light-green/20 text-light-green text-xs rounded flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        Connected
                      </span>
                    )}
                    {formData.integrations.calendar.google.skipped && (
                      <span className="px-2 py-1 bg-gray-600 text-warm-white/60 text-xs rounded">Skipped</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // TODO: Implement OAuth flow
                        updateFormData('integrations', {
                          ...formData.integrations,
                          calendar: {
                            ...formData.integrations.calendar,
                            google: { connected: true, skipped: false },
                          },
                        });
                      }}
                      disabled={formData.integrations.calendar.google.connected}
                      aria-label="Connect Google Calendar"
                      className="px-4 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      {formData.integrations.calendar.google.connected ? 'Connected' : 'Connect Google Calendar'}
                    </button>
                    <button
                      onClick={() => {
                        updateFormData('integrations', {
                          ...formData.integrations,
                          calendar: {
                            ...formData.integrations.calendar,
                            google: { connected: false, skipped: true },
                          },
                        });
                      }}
                      disabled={formData.integrations.calendar.google.connected}
                      aria-label="Skip Google Calendar integration"
                      className="px-4 py-2 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>

                {/* Outlook Calendar */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-warm-white">Outlook Calendar</h4>
                      <p className="text-xs text-warm-white/60">Sync Outlook calendar events</p>
                    </div>
                    {formData.integrations.calendar.outlook.connected && (
                      <span className="px-2 py-1 bg-light-green/20 text-light-green text-xs rounded flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        Connected
                      </span>
                    )}
                    {formData.integrations.calendar.outlook.skipped && (
                      <span className="px-2 py-1 bg-gray-600 text-warm-white/60 text-xs rounded">Skipped</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // TODO: Implement OAuth flow
                        updateFormData('integrations', {
                          ...formData.integrations,
                          calendar: {
                            ...formData.integrations.calendar,
                            outlook: { connected: true, skipped: false },
                          },
                        });
                      }}
                      disabled={formData.integrations.calendar.outlook.connected}
                      aria-label="Connect Outlook Calendar"
                      className="px-4 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      {formData.integrations.calendar.outlook.connected ? 'Connected' : 'Connect Outlook Calendar'}
                    </button>
                    <button
                      onClick={() => {
                        updateFormData('integrations', {
                          ...formData.integrations,
                          calendar: {
                            ...formData.integrations.calendar,
                            outlook: { connected: false, skipped: true },
                          },
                        });
                      }}
                      disabled={formData.integrations.calendar.outlook.connected}
                      aria-label="Skip Outlook Calendar integration"
                      className="px-4 py-2 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              </div>

              {/* Research Providers */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-warm-white flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-aqua" aria-hidden="true" />
                  Research Providers
                </h3>
                
                {/* Westlaw */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-warm-white">Westlaw Edge API</h4>
                      <p className="text-xs text-warm-white/60">Legal research and case law integration</p>
                    </div>
                    {formData.integrations.researchProviders.westlaw.apiKey && (
                      <span className="px-2 py-1 bg-light-green/20 text-light-green text-xs rounded flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        Configured
                      </span>
                    )}
                    {formData.integrations.researchProviders.westlaw.skipped && (
                      <span className="px-2 py-1 bg-gray-600 text-warm-white/60 text-xs rounded">Skipped</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={formData.integrations.researchProviders.westlaw.apiKey}
                      onChange={(e) => {
                        updateFormData('integrations', {
                          ...formData.integrations,
                          researchProviders: {
                            ...formData.integrations.researchProviders,
                            westlaw: { apiKey: e.target.value, skipped: false },
                          },
                        });
                      }}
                      placeholder="Enter Westlaw API key"
                      className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white focus:outline-none focus:ring-2 focus:ring-aqua focus:border-aqua"
                      aria-label="Westlaw API key"
                    />
                    <button
                      onClick={() => {
                        updateFormData('integrations', {
                          ...formData.integrations,
                          researchProviders: {
                            ...formData.integrations.researchProviders,
                            westlaw: { apiKey: '', skipped: true },
                          },
                        });
                      }}
                      aria-label="Skip Westlaw"
                      className="px-4 py-2 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>

                {/* CourtListener */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-warm-white">CourtListener API</h4>
                      <p className="text-xs text-warm-white/60">Free legal research and case law</p>
                    </div>
                    {formData.integrations.researchProviders.courtlistener.apiKey && (
                      <span className="px-2 py-1 bg-light-green/20 text-light-green text-xs rounded flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        Configured
                      </span>
                    )}
                    {formData.integrations.researchProviders.courtlistener.skipped && (
                      <span className="px-2 py-1 bg-gray-600 text-warm-white/60 text-xs rounded">Skipped</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={formData.integrations.researchProviders.courtlistener.apiKey}
                      onChange={(e) => {
                        updateFormData('integrations', {
                          ...formData.integrations,
                          researchProviders: {
                            ...formData.integrations.researchProviders,
                            courtlistener: { apiKey: e.target.value, skipped: false },
                          },
                        });
                      }}
                      placeholder="Enter CourtListener API key"
                      className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white focus:outline-none focus:ring-2 focus:ring-aqua focus:border-aqua"
                      aria-label="CourtListener API key"
                    />
                    <button
                      onClick={() => {
                        updateFormData('integrations', {
                          ...formData.integrations,
                          researchProviders: {
                            ...formData.integrations.researchProviders,
                            courtlistener: { apiKey: '', skipped: true },
                          },
                        });
                      }}
                      aria-label="Skip CourtListener"
                      className="px-4 py-2 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Review & Complete */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-warm-white mb-4">
                Review & Complete
              </h2>
              
              <p className="text-warm-white/70 text-sm mb-6">
                Review your settings below. You can edit any step by clicking the Edit button.
              </p>

              {/* Summary Cards */}
              <div className="space-y-4">
                {/* Step 1 Summary */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-warm-white mb-2">Jurisdiction & Practice Areas</h3>
                      <div className="text-sm text-warm-white/70 space-y-1">
                        <p><strong>Primary:</strong> {formData.primaryJurisdiction || 'Not set'}</p>
                        {formData.additionalJurisdictions.length > 0 && (
                          <p><strong>Additional:</strong> {formData.additionalJurisdictions.join(', ')}</p>
                        )}
                        <p><strong>Practice Areas:</strong> {formData.practiceAreas.join(', ') || 'None selected'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      aria-label="Edit jurisdiction and practice areas"
                      className="px-3 py-1 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      <Edit className="h-3 w-3" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Step 2 Summary */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-warm-white mb-2">Counties & Courts</h3>
                      <div className="text-sm text-warm-white/70 space-y-1">
                        <p><strong>Counties:</strong> {formData.counties.length > 0 ? formData.counties.join(', ') : 'None added'}</p>
                        <p><strong>Courts:</strong> {formData.courts.length > 0 ? formData.courts.join(', ') : 'None added'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(2)}
                      aria-label="Edit counties and courts"
                      className="px-3 py-1 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      <Edit className="h-3 w-3" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Step 3 Summary */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-warm-white mb-2">Issue Tags</h3>
                      <div className="text-sm text-warm-white/70">
                        <p>{formData.issueTags.length > 0 ? formData.issueTags.join(', ') : 'None selected'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(3)}
                      aria-label="Edit issue tags"
                      className="px-3 py-1 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      <Edit className="h-3 w-3" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Step 4 Summary */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-warm-white mb-2">Storage Locations</h3>
                      <div className="text-sm text-warm-white/70 space-y-1">
                        {formData.storagePreferences.localPath && (
                          <p><strong>Local:</strong> {formData.storagePreferences.localPath}</p>
                        )}
                        <p>
                          <strong>Cloud:</strong>{' '}
                          {[
                            formData.storagePreferences.oneDriveEnabled && 'OneDrive',
                            formData.storagePreferences.gDriveEnabled && 'Google Drive',
                            formData.storagePreferences.s3Enabled && `S3 (${formData.storagePreferences.s3Bucket || 'no bucket'})`,
                          ].filter(Boolean).join(', ') || 'None configured'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(4)}
                      aria-label="Edit storage locations"
                      className="px-3 py-1 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      <Edit className="h-3 w-3" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Step 5 Summary */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-warm-white mb-2">AI Provider</h3>
                      <div className="text-sm text-warm-white/70 space-y-1">
                        <p><strong>LLM:</strong> {formData.llmProvider ? formData.llmProvider.charAt(0).toUpperCase() + formData.llmProvider.slice(1) : 'Not selected'}</p>
                        {formData.researchProvider && (
                          <p><strong>Research:</strong> {formData.researchProvider.charAt(0).toUpperCase() + formData.researchProvider.slice(1)}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(5)}
                      aria-label="Edit AI provider"
                      className="px-3 py-1 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      <Edit className="h-3 w-3" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Step 6 Summary */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-warm-white mb-2">Time Tracking Setup</h3>
                      <div className="text-sm text-warm-white/70">
                        <p><strong>Minimum Hours/Week:</strong> {formData.chronometricBaseline.minimumHoursPerWeek}</p>
                        {formData.chronometricBaseline.minimumHoursPerDay && (
                          <p><strong>Minimum Hours/Day:</strong> {formData.chronometricBaseline.minimumHoursPerDay}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(6)}
                      aria-label="Edit time tracking setup"
                      className="px-3 py-1 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      <Edit className="h-3 w-3" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Step 7 Summary */}
                <div className="p-4 bg-navy/50 border border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-warm-white mb-2">Integrations</h3>
                      <div className="text-sm text-warm-white/70 space-y-1">
                        {formData.integrations.clio.connected && <p>✓ Clio Connected</p>}
                        {formData.integrations.email.gmail.connected && <p>✓ Gmail Connected</p>}
                        {formData.integrations.email.outlook.connected && <p>✓ Outlook Connected</p>}
                        {formData.integrations.calendar.google.connected && <p>✓ Google Calendar Connected</p>}
                        {formData.integrations.calendar.outlook.connected && <p>✓ Outlook Calendar Connected</p>}
                        {formData.integrations.researchProviders.westlaw.apiKey && <p>✓ Westlaw Configured</p>}
                        {formData.integrations.researchProviders.courtlistener.apiKey && <p>✓ CourtListener Configured</p>}
                        {!formData.integrations.clio.connected && 
                         !formData.integrations.email.gmail.connected && 
                         !formData.integrations.email.outlook.connected &&
                         !formData.integrations.calendar.google.connected &&
                         !formData.integrations.calendar.outlook.connected &&
                         !formData.integrations.researchProviders.westlaw.apiKey &&
                         !formData.integrations.researchProviders.courtlistener.apiKey && (
                          <p>No integrations configured (all skipped)</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(7)}
                      aria-label="Edit integrations"
                      className="px-3 py-1 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
                    >
                      <Edit className="h-3 w-3" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="p-4 bg-aqua/10 border border-aqua/30 rounded-lg">
                <h3 className="text-sm font-semibold text-aqua mb-2">What Happens Next</h3>
                <ul className="text-xs text-warm-white/70 space-y-1 list-disc list-inside">
                  <li>Your practice profile will be saved</li>
                  <li>Chronometric baseline will be configured</li>
                  {formData.storagePreferences.localPath && (
                    <li>Initial library scan will begin (if enabled)</li>
                  )}
                  <li>You'll be redirected to your dashboard</li>
                  <li>You can configure integrations later in Settings</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-600">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              aria-label="Go to previous step"
              className="px-6 py-2 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={() => setCurrentStep(Math.min(STEPS.length, currentStep + 1))}
                disabled={!canProceed()}
                aria-label={`Go to step ${currentStep + 1}`}
                className="px-6 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-aqua focus:ring-offset-2 focus:ring-offset-charcoal"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || saving}
                aria-label="Complete onboarding setup"
                className="px-6 py-2 bg-light-green text-primary-dark rounded hover:bg-aqua transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-light-green focus:ring-offset-2 focus:ring-offset-charcoal"
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
)
}
)
}
)
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
)