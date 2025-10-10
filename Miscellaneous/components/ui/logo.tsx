import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'wordmark';
  className?: string;
}

export function Logo({ size = 'md', variant = 'full', className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-2xl' },
    lg: { icon: 48, text: 'text-4xl' },
    xl: { icon: 64, text: 'text-6xl' }
  };

  const iconSize = sizes[size].icon;
  const textClass = sizes[size].text;

  const LightBulbIcon = () => (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      {/* Background circle with gradient */}
      <defs>
        <radialGradient id="bulbGradient" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        <linearGradient id="baseGradient" cx="50%" cy="0%" r="50%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
      </defs>
      
      {/* Outer bulb shape - simplified and flatter */}
      <circle 
        cx="50" 
        cy="42" 
        r="28" 
        fill="url(#bulbGradient)"
        stroke="#1f2937" 
        strokeWidth="4"
      />
      
      {/* Filament - bold geometric design */}
      <path 
        d="M42 35 L50 42 L58 35 M42 48 L50 41 L58 48" 
        stroke="#1f2937" 
        strokeWidth="3" 
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Center post - bolder */}
      <rect 
        x="48" 
        y="55" 
        width="4" 
        height="12" 
        fill="#1f2937"
        rx="1"
      />
      
      {/* Base/screw threads - simplified bold lines */}
      <rect 
        x="42" 
        y="67" 
        width="16" 
        height="3" 
        fill="url(#baseGradient)"
        rx="1.5"
      />
      <rect 
        x="42" 
        y="72" 
        width="16" 
        height="3" 
        fill="url(#baseGradient)"
        rx="1.5"
      />
      <rect 
        x="42" 
        y="77" 
        width="16" 
        height="4" 
        fill="url(#baseGradient)"
        rx="2"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex ${className}`}>
        <LightBulbIcon />
      </div>
    );
  }

  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className={`font-bold ${textClass} tracking-tight`}>
          <span className="text-gold">Lex</span>
          <span className="text-white">Fiat</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <LightBulbIcon />
      <span className={`font-bold ${textClass} tracking-tight`}>
        <span className="text-gold">Lex</span>
        <span className="text-white">Fiat</span>
      </span>
    </div>
  );
}

// Export individual components for flexibility
export const LexFiatIcon = () => <Logo variant="icon" />;
export const LexFiatWordmark = () => <Logo variant="wordmark" />;
export const LexFiatFull = () => <Logo variant="full" />;