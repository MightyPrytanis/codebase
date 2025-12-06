import { cn } from "@/lib/utils";

interface EventIconProps {
  event: "freestyle" | "backstroke" | "relay";
  className?: string;
}

export function EventIcon({ event, className }: EventIconProps) {
  const baseClasses = "inline-flex items-center justify-center";
  
  if (event === "freestyle") {
    return (
      <svg className={cn(baseClasses, className)} viewBox="0 0 24 24" fill="currentColor">
        {/* Single swimmer in freestyle stroke */}
        <path d="M3 12c0-1 1-2 2-2h2c1 0 2 1 2 2v4c0 1-1 2-2 2H5c-1 0-2-1-2-2v-4z"/>
        <path d="M10 8c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"/>
        <path d="M15 12l6 2-6 2v-4z"/>
        <path d="M9 14h4v2H9v-2z"/>
      </svg>
    );
  }
  
  if (event === "backstroke") {
    return (
      <svg className={cn(baseClasses, className)} viewBox="0 0 24 24" fill="currentColor">
        {/* Swimmer looking back with verification symbols */}
        <path d="M6 8c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"/>
        <path d="M3 12c0-1 1-2 2-2h2c1 0 2 1 2 2v4c0 1-1 2-2 2H5c-1 0-2-1-2-2v-4z"/>
        <path d="M1 12l4-2v4l-4-2z"/>
        {/* Check marks for verification */}
        <path d="M14 6l2 2 4-4"/>
        <path d="M14 14l2 2 4-4"/>
      </svg>
    );
  }
  
  if (event === "relay") {
    return (
      <svg className={cn(baseClasses, className)} viewBox="0 0 24 24" fill="currentColor">
        {/* Multiple swimmers with arrows showing relay handoff */}
        <circle cx="4" cy="8" r="2"/>
        <circle cx="12" cy="8" r="2"/>
        <circle cx="20" cy="8" r="2"/>
        <path d="M2 12h4v2H2v-2z"/>
        <path d="M10 12h4v2h-4v-2z"/>
        <path d="M18 12h4v2h-4v-2z"/>
        {/* Arrows showing collaboration flow */}
        <path d="M6 10l4 0-1-1"/>
        <path d="M6 11l4 0-1 1"/>
        <path d="M14 10l4 0-1-1"/>
        <path d="M14 11l4 0-1 1"/>
      </svg>
    );
  }
  
  return null;
}