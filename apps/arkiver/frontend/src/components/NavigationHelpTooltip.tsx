import React from 'react';

interface NavigationHelpTooltipProps {
  label: string;
  description: string;
}

export function NavigationHelpTooltip({ label, description }: NavigationHelpTooltipProps) {
  return (
    <span title={description}>
      {label}
    </span>
  );

}