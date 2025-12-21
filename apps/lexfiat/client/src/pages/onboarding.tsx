/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  ChevronRight, 
  ChevronLeft, 
  Scale, 
  MapPin, 
  Tag, 
  HardDrive, 
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Header from '@/components/layout/header';
import { savePracticeProfile, PracticeProfile } from '@/lib/library-api';

const STEPS = [
  { id: 1, title: 'Jurisdiction & Practice Areas', icon: Scale },
  { id: 2, title: 'Counties & Courts', icon: MapPin },
  { id: 3, title: 'Issue Tags', icon: Tag },
  { id: 4, title: 'Storage Locations', icon: HardDrive },
  { id: 5, title: 'AI Provider', icon: Sparkles },
  { id: 6, title: 'Time Tracking Setup', icon: Clock },
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const PRACTICE_AREAS = [
  'Family Law',
  'Criminal Defense',
  'Personal Injury',
  'Estate Planning',
  'Real Estate',
  'Business Law',
  'Employment Law',
  'Immigration',
  'Bankruptcy',
  'Tax Law',
  'Intellectual Property',
  'Civil Litigation'
];

const COMMON_ISSUE_TAGS = [
  'divorce', 'custody', 'parenting-time', 'child-support', 'spousal-support',
  'property-division', 'restraining-order', 'adoption', 'guardianship',
  'criminal-charges', 'dui', 'expungement', 'appeals',
  'personal-injury', 'medical-malpractice', 'workers-comp',
  'estate-planning', 'wills', 'trusts', 'probate',
  'contracts', 'business-formation', 'partnership-disputes'
];

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
  llmApiKey: string;
  chronometricBaseline: {
    minimumHoursPerWeek: number;
    minimumHoursPerDay?: number;
    typicalSchedule?: { [dayOfWeek: string]: number };
    useBaselineUntilDataAvailable: boolean;
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
    llmApiKey: '',
    chronometricBaseline: {
      minimumHoursPerWeek: 40,
      useBaselineUntilDataAvailable: true,
    },
  });
  const [customCounty, setCustomCounty] = useState('');
  const [customCourt, setCustomCourt] = useState('');
  const [customIssueTag, setCustomIssueTag] = useState('');
  const [testingLLM, setTestingLLM] = useState(false);
  const [llmTestResult, setLLMTestResult] = useState<'success' | 'error' | null>(null);
  const [saving, setSaving] = useState(false);

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
    setTestingLLM(true);
    setLLMTestResult(null);
    
    // Simulate API test call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For now, just check if key is provided
    if (formData.llmApiKey.length > 10) {
      setLLMTestResult('success');
    } else {
      setLLMTestResult('error');
    }
    
    setTestingLLM(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Save practice profile
      await savePracticeProfile({
        userId: 'default-user', // TODO: Get from auth
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
      const API_URL = import.meta.env.VITE_CYRANO_API_URL || 'http://localhost:5002';
      const baselineResponse = await fetch(`${API_URL}/api/onboarding/baseline-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'default-user', // TODO: Get from auth
          ...formData.chronometricBaseline,
        }),
      });
      
      if (!baselineResponse.ok) {
        console.warn('Failed to save baseline config:', await baselineResponse.text());
        // Don't fail onboarding if baseline save fails
      }
      
      // Redirect to dashboard
      setLocation('/dashboard');
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.primaryJurisdiction && formData.practiceAreas.length > 0;
      case 2:
        return formData.counties.length > 0;
      case 3:
        return formData.issueTags.length > 0;
      case 4:
        return true; // Optional step
      case 5:
        return formData.llmProvider !== '';
      case 6:
        return formData.chronometricBaseline.minimumHoursPerWeek > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-light-green' : isActive ? 'bg-aqua' : 'bg-gray-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-primary-dark" />
                      ) : (
                        <Icon className={`h-5 w-5 ${isActive ? 'text-primary-dark' : 'text-warm-white/50'}`} />
                      )}
                    </div>
                    <p className={`text-xs mt-2 text-center ${
                      isActive ? 'text-warm-white font-semibold' : 'text-warm-white/60'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 ${
                      isCompleted ? 'bg-light-green' : 'bg-gray-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-charcoal border border-gray-600 rounded-lg p-6">
          {/* Step 1: Jurisdiction & Practice Areas */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-warm-white mb-4">
                Jurisdiction & Practice Areas
              </h2>
              
              <div>
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Primary Jurisdiction *
                </label>
                <select
                  value={formData.primaryJurisdiction}
                  onChange={(e) => updateFormData('primaryJurisdiction', e.target.value)}
                  className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white"
                >
                  <option value="">Select a state...</option>
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
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
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Counties You Practice In *
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customCounty}
                    onChange={(e) => setCustomCounty(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCustomItem('counties', customCounty, () => setCustomCounty(''));
                      }
                    }}
                    placeholder="Enter county name..."
                    className="flex-1 bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white"
                  />
                  <button
                    onClick={() => addCustomItem('counties', customCounty, () => setCustomCounty(''))}
                    className="px-4 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.counties.map(county => (
                    <span
                      key={county}
                      className="px-3 py-1 bg-navy text-warm-white rounded flex items-center gap-2"
                    >
                      {county}
                      <button
                        onClick={() => toggleArrayItem('counties', county)}
                        className="text-alert-red hover:text-warm-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Courts You Appear In
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customCourt}
                    onChange={(e) => setCustomCourt(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCustomItem('courts', customCourt, () => setCustomCourt(''));
                      }
                    }}
                    placeholder="Enter court name..."
                    className="flex-1 bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white"
                  />
                  <button
                    onClick={() => addCustomItem('courts', customCourt, () => setCustomCourt(''))}
                    className="px-4 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.courts.map(court => (
                    <span
                      key={court}
                      className="px-3 py-1 bg-navy text-warm-white rounded flex items-center gap-2"
                    >
                      {court}
                      <button
                        onClick={() => toggleArrayItem('courts', court)}
                        className="text-alert-red hover:text-warm-white"
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
                <label className="block text-sm font-semibold text-warm-white mb-2">
                  Custom Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customIssueTag}
                    onChange={(e) => setCustomIssueTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCustomItem('issueTags', customIssueTag, () => setCustomIssueTag(''));
                      }
                    }}
                    placeholder="Enter custom tag..."
                    className="flex-1 bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white"
                  />
                  <button
                    onClick={() => addCustomItem('issueTags', customIssueTag, () => setCustomIssueTag(''))}
                    className="px-4 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors"
                  >
                    Add
                  </button>
                </div>
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
                    <label key={provider} className="flex items-center gap-3 text-warm-white cursor-pointer hover:bg-navy p-3 rounded border border-gray-600">
                      <input
                        type="radio"
                        name="llmProvider"
                        value={provider}
                        checked={formData.llmProvider === provider}
                        onChange={(e) => updateFormData('llmProvider', e.target.value)}
                        className="form-radio"
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
                  <label className="block text-sm font-semibold text-warm-white mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.llmApiKey}
                    onChange={(e) => updateFormData('llmApiKey', e.target.value)}
                    placeholder="Enter your API key..."
                    className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-warm-white mb-3"
                  />
                  
                  <button
                    onClick={handleTestLLM}
                    disabled={!formData.llmApiKey || testingLLM}
                    className="w-full px-4 py-2 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {testingLLM ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      'Test API Connection'
                    )}
                  </button>

                  {llmTestResult === 'success' && (
                    <div className="mt-3 p-3 bg-light-green/20 border border-light-green rounded flex items-center gap-2 text-light-green">
                      <CheckCircle className="h-4 w-4" />
                      API connection successful!
                    </div>
                  )}

                  {llmTestResult === 'error' && (
                    <div className="mt-3 p-3 bg-alert-red/20 border border-alert-red rounded flex items-center gap-2 text-alert-red">
                      <AlertCircle className="h-4 w-4" />
                      Connection failed. Please check your API key.
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

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-600">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 bg-navy text-warm-white rounded border border-gray-600 hover:border-aqua transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={() => setCurrentStep(Math.min(STEPS.length, currentStep + 1))}
                disabled={!canProceed()}
                className="px-6 py-2 bg-aqua text-primary-dark rounded hover:bg-light-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || saving}
                className="px-6 py-2 bg-light-green text-primary-dark rounded hover:bg-aqua transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Complete Setup
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
