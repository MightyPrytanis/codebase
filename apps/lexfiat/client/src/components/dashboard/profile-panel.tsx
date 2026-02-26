/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { User, Mail, Briefcase, Edit, Phone, MapPin, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  attorney?: {
    name: string;
    specialization?: string;
  };
}

export default function ProfilePanel({ isOpen, onClose, attorney }: ProfilePanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [contactData, setContactData] = useState({
    email: "",
    phone: "",
    address: "",
  });
  const [practiceData, setPracticeData] = useState({
    specialization: "",
    barNumber: "",
    firmName: "",
  });

  const { data: attorneyData, isLoading: isLoadingAttorney } = useQuery({
    queryKey: ["/api/attorneys/current"],
  });

  useEffect(() => {
    if (attorneyData) {
      setContactData({
        email: attorneyData.email || "",
        phone: attorneyData.phone || "",
        address: attorneyData.address || "",
      });
      setPracticeData({
        specialization: attorneyData.specialization || "",
        barNumber: attorneyData.barNumber || "",
        firmName: attorneyData.firmName || "",
      });
    }
  }, [attorneyData]);

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      // Validate attorney ID exists before making request
      if (!attorneyData?.id) {
        throw new Error("Attorney data not loaded. Please wait and try again.");
      }
      const response = await fetch(`/api/attorneys/${attorneyData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attorneys/current"] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Validate attorney ID exists before saving
    if (!attorneyData?.id) {
      toast({
        title: "Error",
        description: "Attorney data not loaded. Please wait and try again.",
        variant: "destructive",
      });
      return;
    }
    updateProfile.mutate({
      ...contactData,
      ...practiceData,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-charcoal border-gray-600">
        <SheetHeader>
          <SheetTitle className="text-warm-white">Profile</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          <div className="flex items-center gap-4 p-4 bg-black/30 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-warm-white">{attorney?.name || attorneyData?.name || "Mekel S. Miller"}</h3>
              <p className="text-sm text-muted-foreground">{attorney?.specialization || attorneyData?.specialization || "Family Law"}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="insight-card info p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5" />
                <h3 className="font-semibold text-warm-white">Contact Information</h3>
              </div>
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  disabled={isLoadingAttorney || !attorneyData?.id}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactData.email}
                    onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-black/20 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm text-muted-foreground">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-black/20 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-sm text-muted-foreground">Address</Label>
                  <Input
                    id="address"
                    value={contactData.address}
                    onChange={(e) => setContactData(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-black/20 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                {contactData.email && <div><Mail className="h-4 w-4 inline mr-2" />{contactData.email}</div>}
                {contactData.phone && <div><Phone className="h-4 w-4 inline mr-2" />{contactData.phone}</div>}
                {contactData.address && <div><MapPin className="h-4 w-4 inline mr-2" />{contactData.address}</div>}
                {!contactData.email && !contactData.phone && !contactData.address && (
                  <p className="text-xs">No contact information on file</p>
                )}
              </div>
            )}
          </div>

          {/* Practice Details */}
          <div className="insight-card info p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5" />
                <h3 className="font-semibold text-warm-white">Practice Details</h3>
              </div>
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  disabled={isLoadingAttorney || !attorneyData?.id}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="specialization" className="text-sm text-muted-foreground">Specialization</Label>
                  <Input
                    id="specialization"
                    value={practiceData.specialization}
                    onChange={(e) => setPracticeData(prev => ({ ...prev, specialization: e.target.value }))}
                    className="bg-black/20 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="barNumber" className="text-sm text-muted-foreground">Bar Number</Label>
                  <Input
                    id="barNumber"
                    value={practiceData.barNumber}
                    onChange={(e) => setPracticeData(prev => ({ ...prev, barNumber: e.target.value }))}
                    className="bg-black/20 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="firmName" className="text-sm text-muted-foreground">Firm Name</Label>
                  <Input
                    id="firmName"
                    value={practiceData.firmName}
                    onChange={(e) => setPracticeData(prev => ({ ...prev, firmName: e.target.value }))}
                    className="bg-black/20 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                {practiceData.specialization && <div><strong>Specialization:</strong> {practiceData.specialization}</div>}
                {practiceData.barNumber && <div><strong>Bar Number:</strong> {practiceData.barNumber}</div>}
                {practiceData.firmName && <div><strong>Firm:</strong> {practiceData.firmName}</div>}
                {!practiceData.specialization && !practiceData.barNumber && !practiceData.firmName && (
                  <p className="text-xs">No practice details on file</p>
                )}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="flex-1 bg-gold hover:bg-gold/90 text-slate-900"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  // Reset to original values
                  if (attorneyData) {
                    setContactData({
                      email: attorneyData.email || "",
                      phone: attorneyData.phone || "",
                      address: attorneyData.address || "",
                    });
                    setPracticeData({
                      specialization: attorneyData.specialization || "",
                      barNumber: attorneyData.barNumber || "",
                      firmName: attorneyData.firmName || "",
                    });
                  }
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          <Link to="/settings">
            <div className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors" onClick={() => navigate("/settings")}>
              <div className="flex items-center gap-3 mb-2">
                <Edit className="h-5 w-5" />
                <h3 className="font-semibold text-warm-white">Full Settings Page</h3>
              </div>
              <p className="text-sm text-muted-foreground">Access all settings, integrations, and preferences</p>
            </div>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );

}
