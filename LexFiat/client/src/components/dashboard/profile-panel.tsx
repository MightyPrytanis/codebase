/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from "react";
import ExpandedPanel from "./expanded-panel";
import { User, Mail, Briefcase, Edit } from "lucide-react";
import { Link } from "wouter";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  attorney?: {
    name: string;
    specialization?: string;
  };
}

export default function ProfilePanel({ isOpen, onClose, attorney }: ProfilePanelProps) {
  return (
    <ExpandedPanel
      title="Profile"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-black/30 rounded-lg">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{attorney?.name || "Mekel S. Miller"}</h3>
            <p className="text-sm text-muted-foreground">{attorney?.specialization || "Family Law"}</p>
          </div>
        </div>
        <Link href="/settings">
          <div className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Edit className="h-5 w-5" />
              <h3 className="font-semibold">Edit Profile</h3>
            </div>
            <p className="text-sm text-muted-foreground">Update your profile information and preferences</p>
          </div>
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="insight-card info p-4">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-5 w-5" />
              <h3 className="font-semibold">Contact Information</h3>
            </div>
            <p className="text-sm text-muted-foreground">Manage email and contact details</p>
          </div>
          <div className="insight-card info p-4">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-5 w-5" />
              <h3 className="font-semibold">Practice Details</h3>
            </div>
            <p className="text-sm text-muted-foreground">Update practice area and specialization</p>
          </div>
        </div>
      </div>
    </ExpandedPanel>
  );
}

