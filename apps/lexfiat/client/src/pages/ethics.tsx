/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from 'react';
import Header from "@/components/layout/header";
import { EthicsDashboard } from "@/components/ethics/ethics-dashboard";
import { useQuery } from "@tanstack/react-query";

export default function EthicsPage() {
  // Get current user ID (would come from auth in production)
  const { data: attorney } = useQuery({
    queryKey: ["/api/attorneys/current"],
  });

  const userId = attorney?.id?.toString() || 'default-user';

  return (
    <div className="min-h-screen bg-primary-dark">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <EthicsDashboard userId={userId} />
      </main>
    </div>
  );
}
