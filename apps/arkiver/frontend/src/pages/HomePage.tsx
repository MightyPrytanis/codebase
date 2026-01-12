/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    // Check onboarding status
    const checkOnboarding = async () => {
      try {
        const API_URL = import.meta.env.VITE_CYRANO_API_URL || 'http://localhost:5002';
        const response = await fetch(`${API_URL}/api/onboarding/status?userId=default-user&appId=arkiver`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.completed) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/onboarding', { replace: true });
          }
        } else {
          // If check fails, redirect to onboarding
          navigate('/onboarding', { replace: true });
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // On error, redirect to onboarding
        navigate('/onboarding', { replace: true });
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#D89B6A' }}></div>
        <p style={{ color: '#5B8FA3' }}>Redirecting to dashboard...</p>
      </div>
    </div>
  );

}
)
}