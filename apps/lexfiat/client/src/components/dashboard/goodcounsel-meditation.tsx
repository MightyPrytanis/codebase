/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Play, Pause, RotateCcw, X } from "lucide-react";

interface MeditationProps {
  onClose?: () => void;
  onComplete?: () => void;
}

/**
 * GoodCounsel Meditation Component
 * 
 * Visual centering/reflection/meditation feature inspired by Comet browser's "zen" mode.
 * Provides breathing exercises (4-7-8 pattern) with calming visuals.
 */
export function GoodCounselMeditation({ onClose, onComplete }: MeditationProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showPostPrompt, setShowPostPrompt] = useState(false);
  
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const phaseStartTimeRef = useRef<number>(0);

  // Breathing pattern: 4 seconds inhale, 7 seconds hold, 8 seconds exhale
  const BREATHING_PATTERN = {
    inhale: 4000,   // 4 seconds
    hold: 7000,     // 7 seconds
    exhale: 8000,   // 8 seconds
    rest: 2000,     // 2 seconds rest between cycles
  };

  useEffect(() => {
    if (isActive && !isPaused) {
      const animate = () => {
        const now = Date.now();
        const elapsed = now - phaseStartTimeRef.current;
        
        // Determine current phase based on elapsed time
        let currentPhase: typeof phase = 'inhale';
        let currentTimeRemaining = 0;
        
        if (elapsed < BREATHING_PATTERN.inhale) {
          currentPhase = 'inhale';
          currentTimeRemaining = BREATHING_PATTERN.inhale - elapsed;
        } else if (elapsed < BREATHING_PATTERN.inhale + BREATHING_PATTERN.hold) {
          currentPhase = 'hold';
          currentTimeRemaining = BREATHING_PATTERN.inhale + BREATHING_PATTERN.hold - elapsed;
        } else if (elapsed < BREATHING_PATTERN.inhale + BREATHING_PATTERN.hold + BREATHING_PATTERN.exhale) {
          currentPhase = 'exhale';
          currentTimeRemaining = BREATHING_PATTERN.inhale + BREATHING_PATTERN.hold + BREATHING_PATTERN.exhale - elapsed;
        } else {
          // Rest phase - move to next cycle
          setCycle(prev => prev + 1);
          phaseStartTimeRef.current = now;
          currentPhase = 'inhale';
          currentTimeRemaining = BREATHING_PATTERN.inhale;
        }
        
        setPhase(currentPhase);
        setTimeRemaining(currentTimeRemaining);
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      phaseStartTimeRef.current = Date.now();
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isActive, isPaused]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
    setCycle(0);
    phaseStartTimeRef.current = Date.now();
    startTimeRef.current = Date.now();
  };

  const handlePause = () => {
    setIsPaused(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    phaseStartTimeRef.current = Date.now() - (BREATHING_PATTERN.inhale + BREATHING_PATTERN.hold + BREATHING_PATTERN.exhale - timeRemaining);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    setCycle(0);
    setPhase('inhale');
    setTimeRemaining(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleComplete = () => {
    handleStop();
    setShowPostPrompt(true);
  };

  // Calculate circle size based on phase (0.5 to 1.0 scale)
  const getCircleScale = () => {
    if (!isActive) return 0.5;
    
    const phaseProgress = (BREATHING_PATTERN[phase] - timeRemaining) / BREATHING_PATTERN[phase];
    
    switch (phase) {
      case 'inhale':
        return 0.5 + (phaseProgress * 0.5); // Expand from 0.5 to 1.0
      case 'hold':
        return 1.0; // Hold at full size
      case 'exhale':
        return 1.0 - (phaseProgress * 0.5); // Contract from 1.0 to 0.5
      case 'rest':
        return 0.5;
      default:
        return 0.5;
    }
  };

  const circleScale = getCircleScale();

  return (
    <div className="fixed inset-0 z-50 bg-primary-dark flex items-center justify-center">
      {/* Background particles/gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/10 via-primary-dark to-status-success/10 animate-pulse" />
      
      {/* Main meditation interface */}
      <Card className="bg-card-dark/95 border-border-gray w-full max-w-2xl mx-4 relative z-10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Heart className="w-5 h-5 text-accent-gold" />
            Centering & Reflection
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-secondary hover:text-primary"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Breathing circle visualization */}
          <div className="flex items-center justify-center py-12">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer glow */}
              <div
                className="absolute rounded-full bg-accent-gold/20 transition-all duration-300 ease-in-out"
                style={{
                  width: `${circleScale * 256}px`,
                  height: `${circleScale * 256}px`,
                  transform: 'translate(-50%, -50%)',
                  top: '50%',
                  left: '50%',
                }}
              />
              
              {/* Main circle */}
              <div
                className="absolute rounded-full bg-gradient-to-br from-accent-gold/40 to-status-success/40 border-2 border-accent-gold/60 transition-all duration-300 ease-in-out flex items-center justify-center"
                style={{
                  width: `${circleScale * 200}px`,
                  height: `${circleScale * 200}px`,
                  transform: 'translate(-50%, -50%)',
                  top: '50%',
                  left: '50%',
                }}
              >
                <div className="text-center">
                  <div className="text-2xl font-semibold text-primary mb-2">
                    {phase === 'inhale' && 'Breathe In'}
                    {phase === 'hold' && 'Hold'}
                    {phase === 'exhale' && 'Breathe Out'}
                    {phase === 'rest' && 'Rest'}
                  </div>
                  {isActive && (
                    <div className="text-sm text-secondary">
                      {Math.ceil(timeRemaining / 1000)}s
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cycle counter */}
          {isActive && (
            <div className="text-center text-secondary">
              Cycle {cycle + 1}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isActive ? (
              <Button
                onClick={handleStart}
                className="bg-accent-gold hover:bg-accent-gold/90 text-slate-900 font-semibold"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Breathing Exercise
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button
                    onClick={handleResume}
                    className="bg-accent-gold hover:bg-accent-gold/90 text-slate-900 font-semibold"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    className="border-border-gray"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button
                  onClick={handleStop}
                  variant="outline"
                  className="border-border-gray"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Stop
                </Button>
                {cycle >= 3 && (
                  <Button
                    onClick={handleComplete}
                    className="bg-status-success hover:bg-status-success/90 text-white"
                  >
                    Complete Session
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Instructions */}
          {!isActive && (
            <div className="text-center text-sm text-secondary space-y-2 pt-4 border-t border-border-gray">
              <p>Follow the breathing circle:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Breathe in for 4 seconds (circle expands)</li>
                <li>Hold for 7 seconds (circle stays large)</li>
                <li>Breathe out for 8 seconds (circle contracts)</li>
                <li>Repeat for 3+ cycles</li>
              </ul>
            </div>
          )}

          {/* Post-meditation prompt */}
          {showPostPrompt && (
            <div className="mt-6 p-4 bg-card-light rounded-lg border border-accent-gold/30">
              <p className="text-sm text-primary mb-4">
                How are you feeling after this session? Would you like to journal about it?
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowPostPrompt(false);
                    onComplete?.();
                  }}
                  className="bg-accent-gold hover:bg-accent-gold/90 text-slate-900"
                  size="sm"
                >
                  Yes, Journal Now
                </Button>
                <Button
                  onClick={() => setShowPostPrompt(false)}
                  variant="outline"
                  size="sm"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

}
