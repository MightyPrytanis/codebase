/**
 * Ambient Audio Hook
 * 
 * Generates space-y, science-y ambient sounds using Web Audio API
 * Inspired by: Marvin the Martian atmosphere + Tubular Bells + Kurzgesagt aesthetic
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { useEffect, useRef, useState } from 'react';

interface UseAmbientAudioOptions {
  enabled?: boolean;
  volume?: number; // 0.0 to 1.0
  onToggle?: (muted: boolean) => void;
}

/**
 * Generates ambient space-y sounds using Web Audio API
 * Creates a subtle, atmospheric background that enhances the onboarding experience
 */
export function useAmbientAudio({ 
  enabled = true, 
  volume = 0.15, // Very subtle by default
  onToggle 
}: UseAmbientAudioOptions = {}) {
  const [isMuted, setIsMuted] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Enable audio on first user interaction (handles autoplay policies)
  useEffect(() => {
    if (userInteracted) return;
    
    const handleInteraction = () => {
      setUserInteracted(true);
    };
    
    // Listen for any user interaction
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [userInteracted]);

  // Initialize audio context
  useEffect(() => {
    if (!enabled || isMuted || !userInteracted) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API not supported');
        return;
      }

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      // Master gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // Create ambient pad (low, evolving tone - like Marvin's ship)
      const createAmbientPad = () => {
        const oscillator = audioContext.createOscillator();
        const padGain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 110; // Low A (space-y base)
        
        // Add subtle filtering for warmer, more atmospheric sound
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        
        padGain.gain.value = 0.06; // Even more subtle
        oscillator.connect(filter);
        filter.connect(padGain);
        padGain.connect(gainNode);
        
        // Slow frequency modulation for evolving texture
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.08; // Very slow modulation (even slower)
        lfoGain.gain.value = 3; // Subtle pitch variation
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        oscillator.start();
        lfo.start();
        
        oscillatorsRef.current.push(oscillator, lfo);
      };

      // Create bell-like harmonics (tubular bells aesthetic) - Kurzgesagt style
      const createBellLayer = () => {
        const frequencies = [220, 330, 440, 554.37]; // A3, E4, A4, C#5 (harmonic series)
        
        frequencies.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const bellGain = audioContext.createGain();
          const filter = audioContext.createBiquadFilter();
          
          oscillator.type = 'sine';
          oscillator.frequency.value = freq;
          
          // Clean, bright filter for Kurzgesagt aesthetic
          filter.type = 'lowpass';
          filter.frequency.value = 2000;
          filter.Q.value = 0.5;
          
          // Each harmonic fades in/out at different rates (longer, more subtle)
          bellGain.gain.value = 0;
          const startTime = audioContext.currentTime + index * 1.5;
          bellGain.gain.setValueAtTime(0, startTime);
          bellGain.gain.linearRampToValueAtTime(0.02, startTime + 3); // Very subtle
          bellGain.gain.linearRampToValueAtTime(0.02, startTime + 10);
          bellGain.gain.linearRampToValueAtTime(0, startTime + 15);
          
          oscillator.connect(filter);
          filter.connect(bellGain);
          bellGain.connect(gainNode);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + 15);
          
          oscillatorsRef.current.push(oscillator);
        });
      };

      // Create subtle function sounds (Marvin-style beeps) - very sparse
      const createFunctionLayer = () => {
        // Periodic subtle beeps (every 15-20 seconds - very sparse)
        const scheduleBeep = (delay: number) => {
          const timeoutId = setTimeout(() => {
            if (!audioContextRef.current || isMuted || !userInteracted) return;
            
            const beep = audioContext.createOscillator();
            const beepGain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            beep.type = 'sine';
            beep.frequency.value = 880; // High A (clean, science-y)
            
            // Subtle filtering for cleaner sound
            filter.type = 'bandpass';
            filter.frequency.value = 880;
            filter.Q.value = 2;
            
            beepGain.gain.value = 0;
            beepGain.gain.setValueAtTime(0, audioContext.currentTime);
            beepGain.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.05); // Quieter
            beepGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25); // Shorter
            
            beep.connect(filter);
            filter.connect(beepGain);
            beepGain.connect(gainNode);
            
            beep.start();
            beep.stop(audioContext.currentTime + 0.25);
            
            // Schedule next beep (longer intervals)
            scheduleBeep(15000 + Math.random() * 5000);
          }, delay);
          
          return timeoutId;
        };
        
        const timeoutId = scheduleBeep(5000); // First beep after 5 seconds
        
        return () => clearTimeout(timeoutId);
      };

      // Start layers
      createAmbientPad();
      createBellLayer();
      const cleanupFunction = createFunctionLayer();

      // Cleanup function
      return () => {
        if (cleanupFunction) cleanupFunction();
        
        oscillatorsRef.current.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {
            // Ignore errors from already-stopped oscillators
          }
        });
        oscillatorsRef.current = [];
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
        }
      };
    } catch (error) {
      console.warn('Failed to initialize ambient audio:', error);
    }
  }, [enabled, isMuted, volume, userInteracted]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    onToggle?.(newMuted);
  };

  return {
    isMuted,
    toggleMute,
  };
}

/**
 * Play brass fanfare - Star Trek DS9/Voyager style with Zarathustra opening
 * Canadian brass-like reveal tones for beginning/end of onboarding
 */
export function playFanfare(volume: number = 0.4) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported');
      return;
    }

    const audioContext = new AudioContextClass();
    const masterGain = audioContext.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(audioContext.destination);

    const startTime = audioContext.currentTime + 0.1; // Small delay for context

    // Zarathustra opening progression: C2, C3, E3, G3, C4
    const zarathustraNotes = [
      { freq: 65.41, time: 0, duration: 1.2 },    // C2
      { freq: 130.81, time: 1.0, duration: 0.8 }, // C3
      { freq: 164.81, time: 1.6, duration: 0.6 }, // E3
      { freq: 196.00, time: 2.0, duration: 0.6 }, // G3
      { freq: 261.63, time: 2.4, duration: 1.5 }, // C4 (held longer)
    ];

    // Create brass ensemble effect with multiple voices
    zarathustraNotes.forEach((note, index) => {
      const noteStart = startTime + note.time;
      
      // Create 3-4 voices per note for ensemble effect
      for (let voice = 0; voice < 3; voice++) {
        const oscillator = audioContext.createOscillator();
        const noteGain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const compressor = audioContext.createDynamicsCompressor();
        
        // Slight detuning for ensemble effect (brass players never perfectly in tune)
        const detune = (voice - 1) * 2; // -2, 0, +2 cents
        oscillator.frequency.value = note.freq;
        oscillator.detune.value = detune;
        
        // Brass-like waveform (sawtooth with some square for brightness)
        oscillator.type = voice === 1 ? 'sawtooth' : 'triangle';
        
        // Bandpass filter to simulate brass timbre
        filter.type = 'bandpass';
        filter.frequency.value = note.freq * (1.5 + voice * 0.3);
        filter.Q.value = 2 + voice * 0.5;
        
        // Compressor for brass-like dynamics
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.1;
        
        // Envelope: quick attack, sustain, release (brass articulation)
        const attackTime = 0.05;
        const sustainLevel = index === 4 ? 0.25 : 0.2; // Last note louder
        const releaseTime = 0.3;
        
        noteGain.gain.setValueAtTime(0, noteStart);
        noteGain.gain.linearRampToValueAtTime(sustainLevel, noteStart + attackTime);
        noteGain.gain.setValueAtTime(sustainLevel, noteStart + note.duration - releaseTime);
        noteGain.gain.linearRampToValueAtTime(0, noteStart + note.duration);
        
        oscillator.connect(filter);
        filter.connect(compressor);
        compressor.connect(noteGain);
        noteGain.connect(masterGain);
        
        oscillator.start(noteStart);
        oscillator.stop(noteStart + note.duration);
      }
    });

    // Add harmonic support (brass section harmony) - Star Trek style
    const harmonyNotes = [
      { freq: 98.00, time: 2.0, duration: 0.8 },  // G2 (supporting G3)
      { freq: 123.47, time: 2.4, duration: 1.5 }, // Bb2 (supporting C4)
      { freq: 146.83, time: 2.6, duration: 1.3 }, // D3 (supporting C4)
    ];

    harmonyNotes.forEach((note) => {
      const noteStart = startTime + note.time;
      
      for (let voice = 0; voice < 2; voice++) {
        const oscillator = audioContext.createOscillator();
        const noteGain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = note.freq;
        oscillator.detune.value = voice * 1.5;
        
        filter.type = 'lowpass';
        filter.frequency.value = note.freq * 3;
        filter.Q.value = 1;
        
        noteGain.gain.setValueAtTime(0, noteStart);
        noteGain.gain.linearRampToValueAtTime(0.12, noteStart + 0.1);
        noteGain.gain.setValueAtTime(0.12, noteStart + note.duration - 0.2);
        noteGain.gain.linearRampToValueAtTime(0, noteStart + note.duration);
        
        oscillator.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(masterGain);
        
        oscillator.start(noteStart);
        oscillator.stop(noteStart + note.duration);
      }
    });

    // Final flourish (DS9/Voyager style ascending brass)
    const flourishStart = startTime + 3.5;
    const flourishNotes = [329.63, 392.00, 493.88, 523.25]; // E4, G4, B4, C5
    
    flourishNotes.forEach((freq, index) => {
      const noteStart = flourishStart + index * 0.15;
      
      const oscillator = audioContext.createOscillator();
      const noteGain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = freq;
      
      filter.type = 'bandpass';
      filter.frequency.value = freq * 1.2;
      filter.Q.value = 3;
      
      noteGain.gain.setValueAtTime(0, noteStart);
      noteGain.gain.linearRampToValueAtTime(0.15, noteStart + 0.05);
      noteGain.gain.linearRampToValueAtTime(0, noteStart + 0.25);
      
      oscillator.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(masterGain);
      
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.25);
    });

    // Cleanup after fanfare completes
    setTimeout(() => {
      audioContext.close().catch(() => {});
    }, 5000);
    
  } catch (error) {
    console.warn('Failed to play fanfare:', error);
