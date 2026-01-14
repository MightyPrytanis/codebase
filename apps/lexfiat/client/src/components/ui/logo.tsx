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

  if (variant === 'icon') {
    return (
      <div className={`inline-flex ${className}`}>
        <img 
          src="/assets/logo/lexfiat-logo-alt-b.png" 
          alt="LexFiat Logo" 
          width={iconSize}
          height={iconSize}
          className="object-contain"
        />
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
      <img 
        src="/assets/logo/lexfiat-logo-corrected.png" 
        alt="LexFiat Logo" 
        width={iconSize}
        height={iconSize}
        className="object-contain"
      />
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

}
}
}
)