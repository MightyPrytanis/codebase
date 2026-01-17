/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from "react";

export function IconSprite() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
      <symbol id="icon-mail" viewBox="0 0 24 24">
        <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
      </symbol>
      <symbol id="icon-ai" viewBox="0 0 24 24">
        <rect x="7" y="3" width="10" height="18" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
      </symbol>
      <symbol id="icon-clio" viewBox="0 0 24 24">
        <rect x="4" y="8" width="16" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M9 8v-1.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V8" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <rect x="11" y="12" width="2" height="2" rx="1" fill="currentColor"/>
      </symbol>
      <symbol id="icon-calendar" viewBox="0 0 24 24">
        <rect x="4" y="6" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M8 4v4M16 4v4M4 10h16" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M10 16h4M11 14h3" stroke="currentColor" strokeWidth="2"/>
      </symbol>
      <symbol id="icon-research" viewBox="0 0 24 24">
        <defs>
          <mask id="research-left-mask">
            <rect x="0" y="0" width="24" height="24" fill="#fff"/>
            <rect x="5.2" y="8.3" width="6.2" height="1.1" rx="0.55" fill="#000"/>
            <rect x="5.2" y="9.9" width="6.0" height="1.1" rx="0.55" fill="#000"/>
            <rect x="5.2" y="11.5" width="5.8" height="1.1" rx="0.55" fill="#000"/>
            <rect x="5.2" y="13.1" width="5.6" height="1.1" rx="0.55" fill="#000"/>
            <rect x="5.2" y="14.7" width="5.4" height="1.1" rx="0.55" fill="#000"/>
            <rect x="5.2" y="16.3" width="5.2" height="1.1" rx="0.55" fill="#000"/>
            <circle cx="11.8" cy="17.9" r="0.8" fill="#000"/>
          </mask>
          <mask id="research-right-mask">
            <rect x="0" y="0" width="24" height="24" fill="#fff"/>
            <rect x="14.3" y="9.0" width="5.6" height="1.2" rx="0.6" fill="#000"/>
            <rect x="14.3" y="11.1" width="5.0" height="1.2" rx="0.6" fill="#000"/>
            <rect x="14.3" y="13.2" width="4.2" height="1.2" rx="0.6" fill="#000"/>
            <path d="M20 6 L20 8 L18 6 Z" fill="#000"/>
          </mask>
        </defs>
        <path d="M4 6h7.6c1.7 0 3.0 1.2 3.5 2.8h-3.9c-2.1 0-3.8 1.7-3.8 3.8V18H6.3A2.3 2.3 0 0 1 4 15.7V6z" fill="currentColor" mask="url(#research-left-mask)"/>
        <path d="M12 6h8v9.9h-5.9c-1.6 0-3-1.3-3-3V6z" fill="currentColor" mask="url(#research-right-mask)"/>
        <circle cx="17.4" cy="14.6" r="3.2" fill="none" stroke="currentColor" strokeWidth="2.8"/>
        <circle cx="17.4" cy="14.6" r="3.2" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
        <path d="M19.3 16.5l3.1 3.1" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/>
      </symbol>
      <symbol id="icon-priority" viewBox="0 0 24 24">
        <path d="M12 2l10 18H2L12 2z" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        <rect x="11.15" y="7.6" width="1.7" height="6.8" fill="currentColor"/>
        <circle cx="12" cy="16.8" r="1.4" fill="currentColor"/>
      </symbol>
      <symbol id="icon-focus" viewBox="0 0 24 24">
        <path d="M2 12c2.8-4 7-6 10-6s7.2 2 10 6c-2.8 4-7 6-10 6s-7.2-2-10-6z" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2.25"/>
      </symbol>
      <symbol id="icon-goodcounsel" viewBox="0 0 24 24">
        <path d="M12 20s-6-4.2-6-8.2c0-2.2 1.8-4 4-4 1.2 0 2.3 0.6 3 1.5 0.7-0.9 1.8-1.5 3-1.5 2.2 0 4 1.8 4 4 0 4-6 8.2-6 8.2z" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M14 10.2c1.9 0.7 3.7 2.1 4.2 3.9M15.2 11.6c1 0.4 1.8 1.1 2.3 2" stroke="currentColor" strokeWidth="1.8" fill="none"/>
      </symbol>
      <symbol id="icon-performance" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M7 15l3-3 3 2 4-5" stroke="currentColor" strokeWidth="2.25" fill="none"/>
        <circle cx="7" cy="15" r="1.2" fill="currentColor"/>
        <circle cx="10" cy="12" r="1.2" fill="currentColor"/>
        <circle cx="13" cy="14" r="1.2" fill="currentColor"/>
        <circle cx="17" cy="9" r="1.2" fill="currentColor"/>
      </symbol>
      <symbol id="icon-testing" viewBox="0 0 24 24">
        <defs>
          <mask id="m-beta-mask">
            <rect x="0" y="0" width="24" height="24" fill="#fff"/>
            <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#000" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif">β</text>
          </mask>
        </defs>
        <circle cx="12" cy="12" r="9" fill="currentColor" mask="url(#m-beta-mask)"/>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
      </symbol>
      <symbol id="icon-critical" viewBox="0 0 24 24">
        <path d="M12 2l10 18H2L12 2z" fill="#DC2626"/>
        <rect x="11" y="9" width="2" height="6" fill="#fff"/>
        <circle cx="12" cy="17" r="1.3" fill="#fff"/>
      </symbol>
      <symbol id="icon-high" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#F59E0B"/>
        <rect x="11" y="7" width="2" height="7" fill="#fff"/>
        <circle cx="12" cy="16.5" r="1.2" fill="#fff"/>
      </symbol>
      <symbol id="icon-medium" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="3" fill="#60A5FA"/>
        <rect x="7" y="7" width="10" height="10" rx="2" fill="#fff" opacity="0.25"/>
      </symbol>
      <symbol id="icon-low" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="#93C5FD" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="12" r="3" fill="#93C5FD"/>
      </symbol>
      <symbol id="icon-intake" viewBox="0 0 24 24">
        <path d="M6 7h7a2 2 0 0 1 2 2v8H8a2 2 0 0 1-2-2V7z" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M8 5h7a2 2 0 0 1 2 2v8" fill="none" stroke="currentColor" strokeWidth="2.25" opacity="0.6"/>
        <path d="M4 12h7" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M10.5 12l-2.5 -2M10.5 12l-2.5 2" stroke="currentColor" strokeWidth="2.25"/>
      </symbol>
      <symbol id="icon-analysis" viewBox="0 0 24 24">
        <path d="M6 19h12" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M9 13h6" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M10.5 16c0-3 2.2-5 5-5" stroke="currentColor" strokeWidth="2.25" fill="none" strokeLinecap="round"/>
        <path d="M14.5 6v6M15 4h3" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round"/>
        <circle cx="11" cy="13" r="1" fill="currentColor"/>
      </symbol>
      <symbol id="icon-draft" viewBox="0 0 24 24">
        <rect x="5" y="4.5" width="10.5" height="15" rx="1.8" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M7.2 9h6.6M7.2 12h5.5M7.2 15h4.2" stroke="currentColor" strokeWidth="2"/>
        <path d="M15.6 13.2l4.2 4.2" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M17 16l-1.6 1.6" stroke="currentColor" strokeWidth="2.25"/>
      </symbol>
      <symbol id="icon-attorney" viewBox="0 0 24 24">
        <rect x="6" y="5" width="12" height="14" rx="2.5" fill="currentColor"/>
        <path d="M9 9l2 2 4-4" stroke="#60A5FA" strokeWidth="2.25" fill="none"/>
        <path d="M9 13h6M9 16h6" stroke="#60A5FA" strokeWidth="2.25"/>
      </symbol>
      <symbol id="icon-final-review" viewBox="0 0 24 24">
        <circle cx="12" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M9 10l2 2 3-3" stroke="currentColor" strokeWidth="2.25" fill="none"/>
        <path d="M10 16l-2 4 4-2 4 2-2-4" fill="currentColor"/>
      </symbol>
      <symbol id="icon-file-serve" viewBox="0 0 24 24">
        <path d="M6 12h8" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M14 12l4 -2M14 12l4 0M14 12l4 2" stroke="currentColor" strokeWidth="2.25"/>
      </symbol>
      <symbol id="icon-client-update" viewBox="0 0 24 24">
        <path d="M7 5h6v4H7z" fill="currentColor"/>
        <path d="M9 9l5 5" stroke="#60A5FA" strokeWidth="2.25"/>
        <path d="M13 14l4 4" stroke="#60A5FA" strokeWidth="2.25"/>
      </symbol>
      <symbol id="icon-progress-summary" viewBox="0 0 24 24">
        <rect x="4" y="10" width="16" height="4" rx="2.2" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M4 12h12.5" stroke="currentColor" strokeWidth="2.25"/>
      </symbol>
      <symbol id="icon-shield" viewBox="0 0 24 24">
        <path d="M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3z" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M12 8v6" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 10h8" stroke="currentColor" strokeWidth="2"/>
        <path d="M9 10l-2 3h4l-2-3zM17 10l-2 3h4l-2-3z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
      </symbol>
      <symbol id="icon-beta" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.2"/>
        <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#60A5FA">β</text>
      </symbol>
      <symbol id="icon-alert" viewBox="0 0 24 24">
        <path d="M12 3l10 18H2L12 3z" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinejoin="round"/>
        <path d="M12 9v6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round"/>
        <circle cx="12" cy="17" r="1.2" fill="currentColor"/>
      </symbol>
      <symbol id="icon-beta-circle" viewBox="0 0 24 24">
        <defs>
          <mask id="mask-beta">
            <rect width="24" height="24" fill="#fff"/>
            <text x="12" y="16" textAnchor="middle" fontSize="12" fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial" fill="#000">β</text>
          </mask>
        </defs>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="9" fill="currentColor" mask="url(#mask-beta)"/>
      </symbol>
      <symbol id="icon-lightbulb" viewBox="0 0 24 24">
        <path d="M12 3a6 6 0 0 1 6 6c0 2-1 3.5-2.4 4.6-.5.4-.8 1-.8 1.6V17H9.2v-1.8c0-.6-.3-1.2-.8-1.6A6 6 0 0 1 6 9a6 6 0 0 1 6-6z" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M9.5 19h5M10 21h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </symbol>
      <symbol id="icon-book-open" viewBox="0 0 24 24">
        <path d="M4 7h7a2 2 0 0 1 2 2v9H6a2 2 0 0 1-2-2V7z" fill="none" stroke="currentColor" strokeWidth="2.25"/>
        <path d="M20 7h-7a2 2 0 0 0-2 2v9h7a2 2 0 0 0 2-2V7z" fill="none" stroke="currentColor" strokeWidth="2.25"/>
      </symbol>
    </svg>
  );
