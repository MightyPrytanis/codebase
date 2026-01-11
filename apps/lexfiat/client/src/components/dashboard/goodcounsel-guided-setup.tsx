/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Heart, Target, TrendingDown, Users, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PrivacyAssurance } from "./goodcounsel-privacy-assurance";
import { safeSetJSON, safeSetItem } from "@/lib/secure-storage";

interface GuidedSetupProps {
  onComplete: (data: GoodCounselSetupData) => void;
  onCancel?: () => void;
}

export interface GoodCounselSetupData {
  // Personal/Professional Goals
  personalGoals: string[];
  professionalGoals: string[];
  disappointments: string[];
  setbacks: string[];
  
  // Mood & Baseline
  currentMood: string;
  phq9Scores: PHQ9Scores;
  
  // Important People & Things
  importantPeople: ImportantPerson[];
  importantOrganizations: string[];
  religiousFaith?: string;
  politicalAdvocacy?: string;
  
  // Core Values
  coreValues: string[];
  
  // AI-Assisted Insights
  aiInsights?: string;
}

interface PHQ9Scores {
  interest: number; // 0-3
  mood: number; // 0-3
  sleep: number; // 0-3
  energy: number; // 0-3
  appetite: number; // 0-3
  selfWorth: number; // 0-3
  concentration: number; // 0-3
  psychomotor: number; // 0-3
  suicidal: number; // 0-3
}

interface ImportantPerson {
  name: string;
  relationship: string;
  importance: 'high' | 'medium' | 'low';
}

const STEPS = [
  { id: 'privacy', title: 'Privacy Protections', icon: Shield },
  { id: 'goals', title: 'Goals & Aspirations', icon: Target },
  { id: 'mood', title: 'Mood & Baseline', icon: Heart },
  { id: 'people', title: 'Important People', icon: Users },
  { id: 'values', title: 'Core Values', icon: Sparkles },
  { id: 'review', title: 'Review & Complete', icon: CheckCircle2 },
];

export function GuidedSetup({ onComplete, onCancel }: GuidedSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  
  // Form state
  const [personalGoals, setPersonalGoals] = useState<string[]>(['']);
  const [professionalGoals, setProfessionalGoals] = useState<string[]>(['']);
  const [disappointments, setDisappointments] = useState<string[]>(['']);
  const [setbacks, setSetbacks] = useState<string[]>(['']);
  const [currentMood, setCurrentMood] = useState('');
  const [phq9Scores, setPhq9Scores] = useState<PHQ9Scores>({
    interest: 0, mood: 0, sleep: 0, energy: 0, appetite: 0,
    selfWorth: 0, concentration: 0, psychomotor: 0, suicidal: 0
  });
  const [importantPeople, setImportantPeople] = useState<ImportantPerson[]>([]);
  const [importantOrganizations, setImportantOrganizations] = useState<string[]>(['']);
  const [religiousFaith, setReligiousFaith] = useState('');
  const [politicalAdvocacy, setPoliticalAdvocacy] = useState('');
  const [coreValues, setCoreValues] = useState<string[]>(['']);
  const [aiInsights, setAiInsights] = useState('');

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Generate AI insights based on collected data
    const insights = await generateAIInsights({
      personalGoals, professionalGoals, disappointments, setbacks,
      currentMood, phq9Scores, importantPeople, importantOrganizations,
      religiousFaith, politicalAdvocacy, coreValues
    });
    
    setAiInsights(insights);
    
    const setupData: GoodCounselSetupData = {
      personalGoals: personalGoals.filter(g => g.trim()),
      professionalGoals: professionalGoals.filter(g => g.trim()),
      disappointments: disappointments.filter(d => d.trim()),
      setbacks: setbacks.filter(s => s.trim()),
      currentMood,
      phq9Scores,
      importantPeople,
      importantOrganizations: importantOrganizations.filter(o => o.trim()),
      religiousFaith: religiousFaith.trim() || undefined,
      politicalAdvocacy: politicalAdvocacy.trim() || undefined,
      coreValues: coreValues.filter(v => v.trim()),
      aiInsights: insights
    };
    
    // Store in localStorage using secure wrapper
    safeSetJSON('goodcounsel-setup-data', setupData);
    safeSetItem('goodcounsel-setup-complete', 'true');
    safeSetItem('goodcounsel-setup-date', new Date().toISOString());
    
    onComplete(setupData);
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'privacy':
        return (
          <PrivacyAssurance 
            onAcknowledge={() => setPrivacyAcknowledged(true)}
          />
        );
      case 'goals':
        return <GoalsStep 
          personalGoals={personalGoals}
          setPersonalGoals={setPersonalGoals}
          professionalGoals={professionalGoals}
          setProfessionalGoals={setProfessionalGoals}
          disappointments={disappointments}
          setDisappointments={setDisappointments}
          setbacks={setbacks}
          setSetbacks={setSetbacks}
        />;
      case 'mood':
        return <MoodStep 
          currentMood={currentMood}
          setCurrentMood={setCurrentMood}
          phq9Scores={phq9Scores}
          setPhq9Scores={setPhq9Scores}
        />;
      case 'people':
        return <PeopleStep 
          importantPeople={importantPeople}
          setImportantPeople={setImportantPeople}
          importantOrganizations={importantOrganizations}
          setImportantOrganizations={setImportantOrganizations}
          religiousFaith={religiousFaith}
          setReligiousFaith={setReligiousFaith}
          politicalAdvocacy={politicalAdvocacy}
          setPoliticalAdvocacy={setPoliticalAdvocacy}
        />;
      case 'values':
        return <ValuesStep 
          coreValues={coreValues}
          setCoreValues={setCoreValues}
        />;
      case 'review':
        return <ReviewStep 
          data={{
            personalGoals, professionalGoals, disappointments, setbacks,
            currentMood, phq9Scores, importantPeople, importantOrganizations,
            religiousFaith, politicalAdvocacy, coreValues, aiInsights
          }}
        />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'privacy':
        return privacyAcknowledged;
      case 'goals':
        return personalGoals.some(g => g.trim()) || professionalGoals.some(g => g.trim());
      case 'mood':
        return currentMood.trim().length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-primary-dark/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card-dark border-2 border-accent-gold/30">
        <CardHeader className="bg-gradient-to-r from-accent-gold/20 to-status-success/10 border-b border-accent-gold/30 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-3 text-primary">
              <Heart className="w-6 h-6 text-accent-gold" />
              <span>GoodCounsel Guided Setup</span>
            </CardTitle>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-sm text-secondary">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {renderStep()}
          
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border-gray">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-accent-gold hover:bg-accent-gold/90 text-slate-900"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-status-success hover:bg-status-success/90"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step Components
function GoalsStep({ personalGoals, setPersonalGoals, professionalGoals, setProfessionalGoals, disappointments, setDisappointments, setbacks, setSetbacks }: any) {
  const addGoal = (type: 'personal' | 'professional') => {
    if (type === 'personal') {
      setPersonalGoals([...personalGoals, '']);
    } else {
      setProfessionalGoals([...professionalGoals, '']);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
          <Target className="w-5 h-5 text-accent-gold" />
          Personal & Professional Goals
        </h3>
        <p className="text-sm text-secondary mb-4">
          Tell us about your aspirations. What are you working toward?
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-primary mb-2 block">Personal Goals</Label>
          {personalGoals.map((goal: string, idx: number) => (
            <Input
              key={idx}
              value={goal}
              onChange={(e) => {
                const newGoals = [...personalGoals];
                newGoals[idx] = e.target.value;
                setPersonalGoals(newGoals);
              }}
              placeholder="e.g., Better work-life balance, more time with family..."
              className="mb-2 bg-primary-dark border-border-gray"
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addGoal('personal')}
            className="mt-2"
          >
            + Add Personal Goal
          </Button>
        </div>

        <div>
          <Label className="text-primary mb-2 block">Professional Goals</Label>
          {professionalGoals.map((goal: string, idx: number) => (
            <Input
              key={idx}
              value={goal}
              onChange={(e) => {
                const newGoals = [...professionalGoals];
                newGoals[idx] = e.target.value;
                setProfessionalGoals(newGoals);
              }}
              placeholder="e.g., Build expertise in family law, grow practice..."
              className="mb-2 bg-primary-dark border-border-gray"
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addGoal('professional')}
            className="mt-2"
          >
            + Add Professional Goal
          </Button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border-gray">
        <h4 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-accent-gold" />
          Challenges & Setbacks
        </h4>
        <p className="text-sm text-secondary mb-4">
          Understanding challenges helps us provide better support.
        </p>

        <div className="space-y-4">
          <div>
            <Label className="text-primary mb-2 block">Recent Disappointments</Label>
            {disappointments.map((disappointment: string, idx: number) => (
              <Textarea
                key={idx}
                  value={disappointment}
                  onChange={(e) => {
                    const updated = [...disappointments];
                    updated[idx] = e.target.value;
                    setDisappointments(updated);
                }}
                placeholder="What has been disappointing lately?"
                className="mb-2 bg-primary-dark border-border-gray min-h-[60px]"
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisappointments([...disappointments, ''])}
              className="mt-2"
            >
              + Add
            </Button>
          </div>

          <div>
            <Label className="text-primary mb-2 block">Setbacks</Label>
            {setbacks.map((setback: string, idx: number) => (
              <Textarea
                key={idx}
                  value={setback}
                  onChange={(e) => {
                    const updated = [...setbacks];
                    updated[idx] = e.target.value;
                    setSetbacks(updated);
                }}
                placeholder="What setbacks have you experienced?"
                className="mb-2 bg-primary-dark border-border-gray min-h-[60px]"
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSetbacks([...setbacks, ''])}
              className="mt-2"
            >
              + Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoodStep({ currentMood, setCurrentMood, phq9Scores, setPhq9Scores }: any) {
  const phq9Questions = [
    { key: 'interest', label: 'Little interest or pleasure in doing things' },
    { key: 'mood', label: 'Feeling down, depressed, or hopeless' },
    { key: 'sleep', label: 'Trouble falling or staying asleep, or sleeping too much' },
    { key: 'energy', label: 'Feeling tired or having little energy' },
    { key: 'appetite', label: 'Poor appetite or overeating' },
    { key: 'selfWorth', label: 'Feeling bad about yourself or that you are a failure' },
    { key: 'concentration', label: 'Trouble concentrating on things' },
    { key: 'psychomotor', label: 'Moving or speaking so slowly/fast that others noticed' },
    { key: 'suicidal', label: 'Thoughts of hurting yourself' },
  ];

  const updatePhq9Score = (key: keyof PHQ9Scores, value: number) => {
    setPhq9Scores({ ...phq9Scores, [key]: value });
  };

  const totalScore = Object.values(phq9Scores).reduce((sum, score) => sum + score, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
          <Heart className="w-5 h-5 text-accent-gold" />
          Current Mood & Baseline Assessment
        </h3>
        <p className="text-sm text-secondary mb-4">
          How are you feeling right now? This helps us understand where you're starting from.
        </p>
      </div>

      <div>
        <Label className="text-primary mb-2 block">How are you feeling today?</Label>
        <Textarea
          value={currentMood}
          onChange={(e) => setCurrentMood(e.target.value)}
          placeholder="Describe your current mood, energy level, and overall state..."
          className="bg-primary-dark border-border-gray min-h-[100px]"
        />
      </div>

      <div className="mt-6 pt-6 border-t border-border-gray">
        <h4 className="text-lg font-semibold text-primary mb-2">PHQ-9 Assessment</h4>
        <p className="text-sm text-secondary mb-4">
          Over the last 2 weeks, how often have you been bothered by any of the following problems?
        </p>

        <div className="space-y-4">
          {phq9Questions.map((q) => (
            <div key={q.key} className="bg-card-light p-4 rounded border border-border-gray">
              <Label className="text-primary mb-3 block">{q.label}</Label>
              <RadioGroup
                value={phq9Scores[q.key as keyof PHQ9Scores].toString()}
                onValueChange={(value) => updatePhq9Score(q.key as keyof PHQ9Scores, parseInt(value))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id={`${q.key}-0`} />
                  <Label htmlFor={`${q.key}-0`} className="text-sm text-secondary cursor-pointer">Not at all</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id={`${q.key}-1`} />
                  <Label htmlFor={`${q.key}-1`} className="text-sm text-secondary cursor-pointer">Several days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id={`${q.key}-2`} />
                  <Label htmlFor={`${q.key}-2`} className="text-sm text-secondary cursor-pointer">More than half</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id={`${q.key}-3`} />
                  <Label htmlFor={`${q.key}-3`} className="text-sm text-secondary cursor-pointer">Nearly every day</Label>
                </div>
              </RadioGroup>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-card-light rounded border border-border-gray">
          <div className="flex items-center justify-between">
            <span className="font-medium text-primary">Total PHQ-9 Score:</span>
            <span className={`text-xl font-bold ${totalScore >= 20 ? 'text-status-critical' : totalScore >= 15 ? 'text-status-warning' : totalScore >= 10 ? 'text-accent-gold' : 'text-status-success'}`}>
              {totalScore} / 27
            </span>
          </div>
          <p className="text-xs text-secondary mt-2">
            {totalScore < 5 && 'Minimal or no depression'}
            {totalScore >= 5 && totalScore < 10 && 'Mild depression'}
            {totalScore >= 10 && totalScore < 15 && 'Moderate depression'}
            {totalScore >= 15 && totalScore < 20 && 'Moderately severe depression'}
            {totalScore >= 20 && 'Severe depression'}
          </p>
        </div>
      </div>
    </div>
  );
}

function PeopleStep({ importantPeople, setImportantPeople, importantOrganizations, setImportantOrganizations, religiousFaith, setReligiousFaith, politicalAdvocacy, setPoliticalAdvocacy }: any) {
  const addPerson = () => {
    setImportantPeople([...importantPeople, { name: '', relationship: '', importance: 'medium' }]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-accent-gold" />
          Who & What Matters to You
        </h3>
        <p className="text-sm text-secondary mb-4">
          Understanding who and what is important to you helps us provide personalized support.
        </p>
      </div>

      <div>
        <Label className="text-primary mb-2 block">Important People</Label>
        {importantPeople.map((person: ImportantPerson, idx: number) => (
          <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
            <Input
                value={person.name}
                onChange={(e) => {
                  const updated = [...importantPeople];
                  updated[idx].name = e.target.value;
                  setImportantPeople(updated);
              }}
              placeholder="Name"
              className="bg-primary-dark border-border-gray"
            />
            <Input
                value={person.relationship}
                onChange={(e) => {
                  const updated = [...importantPeople];
                  updated[idx].relationship = e.target.value;
                  setImportantPeople(updated);
              }}
              placeholder="Relationship"
              className="bg-primary-dark border-border-gray"
            />
            <select
                value={person.importance}
                onChange={(e) => {
                  const updated = [...importantPeople];
                  updated[idx].importance = e.target.value as 'high' | 'medium' | 'low';
                  setImportantPeople(updated);
              }}
              className="bg-primary-dark border border-border-gray rounded px-3 py-2 text-sm"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addPerson}
          className="mt-2"
        >
          + Add Person
        </Button>
      </div>

      <div>
        <Label className="text-primary mb-2 block">Important Organizations</Label>
        {importantOrganizations.map((org: string, idx: number) => (
          <Input
            key={idx}
            value={org}
            onChange={(e) => {
              const updated = [...importantOrganizations];
              updated[idx] = e.target.value;
              setImportantOrganizations(updated);
            }}
            placeholder="e.g., Local bar association, community group..."
            className="mb-2 bg-primary-dark border-border-gray"
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImportantOrganizations([...importantOrganizations, ''])}
          className="mt-2"
        >
          + Add Organization
        </Button>
      </div>

      <div>
        <Label className="text-primary mb-2 block">Religious Faith (Optional)</Label>
        <Input
          value={religiousFaith}
          onChange={(e) => setReligiousFaith(e.target.value)}
          placeholder="If applicable, your religious or spiritual faith..."
          className="bg-primary-dark border-border-gray"
        />
      </div>

      <div>
        <Label className="text-primary mb-2 block">Political & Advocacy (Optional)</Label>
        <Input
          value={politicalAdvocacy}
          onChange={(e) => setPoliticalAdvocacy(e.target.value)}
          placeholder="Political views or advocacy causes important to you..."
          className="bg-primary-dark border-border-gray"
        />
      </div>
    </div>
  );
}

function ValuesStep({ coreValues, setCoreValues }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-gold" />
          Core Personal Values
        </h3>
        <p className="text-sm text-secondary mb-4">
          What values guide your decisions and actions? These help us understand what matters most to you.
        </p>
      </div>

      <div>
        <Label className="text-primary mb-2 block">Your Core Values</Label>
        {coreValues.map((value: string, idx: number) => (
          <Input
            key={idx}
            value={value}
            onChange={(e) => {
              const updated = [...coreValues];
              updated[idx] = e.target.value;
              setCoreValues(updated);
            }}
            placeholder="e.g., Integrity, Family, Justice, Growth..."
            className="mb-2 bg-primary-dark border-border-gray"
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCoreValues([...coreValues, ''])}
          className="mt-2"
        >
          + Add Value
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({ data }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-status-success" />
          Review Your Setup
        </h3>
        <p className="text-sm text-secondary mb-4">
          Please review your information. You can go back to make changes.
        </p>
      </div>

      <div className="space-y-4">
        {/* Summary sections */}
        <div className="bg-card-light p-4 rounded border border-border-gray">
          <h4 className="font-semibold text-primary mb-2">Goals & Aspirations</h4>
          <p className="text-sm text-secondary">
            {data.personalGoals.filter((g: string) => g.trim()).length} personal goals,{' '}
            {data.professionalGoals.filter((g: string) => g.trim()).length} professional goals
          </p>
        </div>

        <div className="bg-card-light p-4 rounded border border-border-gray">
          <h4 className="font-semibold text-primary mb-2">Mood & Assessment</h4>
          <p className="text-sm text-secondary">
            PHQ-9 Score: {Object.values(data.phq9Scores).reduce((sum: number, score: number) => sum + score, 0)} / 27
          </p>
        </div>

        <div className="bg-card-light p-4 rounded border border-border-gray">
          <h4 className="font-semibold text-primary mb-2">Important People & Values</h4>
          <p className="text-sm text-secondary">
            {data.importantPeople.length} important people,{' '}
            {data.coreValues.filter((v: string) => v.trim()).length} core values
          </p>
        </div>
      </div>

      {data.aiInsights && (
        <div className="bg-accent-gold/10 border border-accent-gold/30 p-4 rounded">
          <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-gold" />
            AI-Generated Insights
          </h4>
          <p className="text-sm text-secondary whitespace-pre-wrap">{data.aiInsights}</p>
        </div>
      )}
    </div>
  );
}

async function generateAIInsights(data: any): Promise<string> {
  // TODO: Integrate with AI service to generate personalized insights
  // For now, return a placeholder
  return "Based on your responses, GoodCounsel will provide personalized support tailored to your goals, values, and current state. Your privacy is protected, and we're here to help you practice law with excellence and balance.";
}



}
)
}
)
}
)
}
)
}
)
}
)
}
)
}
}
)
}
)
)
}
)
)
}
)
)
}
}
)
}
}
)
}
)
)
}
)
)
}
)
)
}
}
)