/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

// import React from 'react';
import { FileText } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="bg-card-dark border-b border-border-gray py-4 px-6">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-accent-gold" />
        <span className="text-xl font-bold text-primary">Arkiver</span>
      </div>
    </header>
  );

}