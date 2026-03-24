/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Anonymization Manager
 *
 * UI component for managing user-defined anonymization rules:
 *  • Custom Sensitive Terms – terms that are always anonymized
 *  • Allowed Exceptions     – terms that bypass anonymization
 *  • Live Preview           – side-by-side original vs. anonymized text
 *
 * Communicates with /api/anonymization/* endpoints on the Cyrano HTTP bridge.
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Plus,
  Trash2,
  Eye,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  getAnonymizationTerms,
  addAnonymizationTerm,
  removeAnonymizationTerm,
  getAnonymizationExceptions,
  addAnonymizationException,
  removeAnonymizationException,
  previewAnonymization,
  type CustomTerm,
  type AllowedExceptionEntry,
  type AnonymizableEntityType,
} from "@/lib/cyrano-api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENTITY_TYPES: { value: AnonymizableEntityType; label: string }[] = [
  { value: "person", label: "Person" },
  { value: "organization", label: "Organization" },
  { value: "location", label: "Location" },
  { value: "date", label: "Date" },
  { value: "money", label: "Money / Amount" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "ssn", label: "SSN" },
  { value: "account", label: "Account Number" },
  { value: "statute", label: "Statute / Code" },
  { value: "case", label: "Case Reference" },
];

const ENTITY_TYPE_LABELS: Record<AnonymizableEntityType, string> = Object.fromEntries(
  ENTITY_TYPES.map(({ value, label }) => [value, label])
) as Record<AnonymizableEntityType, string>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnonymizationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Custom terms form state ---
  const [newTerm, setNewTerm] = useState("");
  const [newTermType, setNewTermType] = useState<AnonymizableEntityType>("organization");

  // --- Exceptions form state ---
  const [newException, setNewException] = useState("");

  // --- Preview state ---
  const [previewInput, setPreviewInput] = useState("");
  const [previewResult, setPreviewResult] = useState<{
    anonymizedText: string;
    entitiesReplaced: number;
    riskCategory: 1 | 2 | 3;
    summary: Record<string, number>;
  } | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const { data: termsData } = useQuery({
    queryKey: ["anonymization-terms"],
    queryFn: getAnonymizationTerms,
  });

  const { data: exceptionsData } = useQuery({
    queryKey: ["anonymization-exceptions"],
    queryFn: getAnonymizationExceptions,
  });

  const terms: CustomTerm[] = termsData?.data ?? [];
  const exceptions: AllowedExceptionEntry[] = exceptionsData?.data ?? [];

  // ---------------------------------------------------------------------------
  // Mutations – Custom Terms
  // ---------------------------------------------------------------------------

  const addTermMutation = useMutation({
    mutationFn: ({ term, entityType }: { term: string; entityType: AnonymizableEntityType }) =>
      addAnonymizationTerm(term, entityType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anonymization-terms"] });
      setNewTerm("");
      toast({ title: "Custom term added", description: `"${newTerm}" will now be anonymized.` });
    },
    onError: () => {
      toast({ title: "Failed to add term", variant: "destructive" });
    },
  });

  const removeTermMutation = useMutation({
    mutationFn: (id: string) => removeAnonymizationTerm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anonymization-terms"] });
      toast({ title: "Custom term removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove term", variant: "destructive" });
    },
  });

  // ---------------------------------------------------------------------------
  // Mutations – Allowed Exceptions
  // ---------------------------------------------------------------------------

  const addExceptionMutation = useMutation({
    mutationFn: (term: string) => addAnonymizationException(term),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anonymization-exceptions"] });
      setNewException("");
      toast({
        title: "Allowed exception added",
        description: `"${newException}" will not be anonymized.`,
      });
    },
    onError: () => {
      toast({ title: "Failed to add exception", variant: "destructive" });
    },
  });

  const removeExceptionMutation = useMutation({
    mutationFn: (id: string) => removeAnonymizationException(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anonymization-exceptions"] });
      toast({ title: "Exception removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove exception", variant: "destructive" });
    },
  });

  // ---------------------------------------------------------------------------
  // Preview
  // ---------------------------------------------------------------------------

  const handlePreview = async () => {
    if (!previewInput.trim()) return;
    setIsPreviewing(true);
    try {
      const result = await previewAnonymization(previewInput);
      if (result.success && result.data) {
        setPreviewResult(result.data);
      } else {
        toast({ title: "Preview failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Preview failed", variant: "destructive" });
    } finally {
      setIsPreviewing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    addTermMutation.mutate({ term: newTerm.trim(), entityType: newTermType });
  };

  const handleAddException = () => {
    if (!newException.trim()) return;
    addExceptionMutation.mutate(newException.trim());
  };

  const riskBadgeVariant = (cat: 1 | 2 | 3) => {
    if (cat === 1) return "secondary";
    if (cat === 2) return "outline";
    return "destructive";
  };

  const riskLabel = (cat: 1 | 2 | 3) => {
    if (cat === 1) return "Low Risk";
    if (cat === 2) return "Moderate Risk";
    return "High Risk – Do Not Send";
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Section: Custom Sensitive Terms                                     */}
      {/* ------------------------------------------------------------------ */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-gold flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Custom Terms to Anonymize
          </CardTitle>
          <p className="text-sm text-slate-400">
            Add practice-specific terms that should always be anonymized before
            text is sent to an AI provider (e.g., a client's company name,
            local landmark, or opposing party). These supplement the default
            regex and NLP patterns.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add term row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Label htmlFor="custom-term-input" className="text-slate-300 text-xs mb-1 block">
                Term to anonymize
              </Label>
              <Input
                id="custom-term-input"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder='e.g., "SpecialCorp" or "Cascade Road NE"'
                className="bg-slate-900 border-slate-600 text-white"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddTerm(); }}
              />
            </div>
            <div className="sm:w-48">
              <Label className="text-slate-300 text-xs mb-1 block">
                Anonymize as
              </Label>
              <Select
                value={newTermType}
                onValueChange={(v) => setNewTermType(v as AnonymizableEntityType)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddTerm}
                disabled={!newTerm.trim() || addTermMutation.isPending}
                className="bg-gold text-black hover:bg-gold/90 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Terms list */}
          {terms.length === 0 ? (
            <p className="text-slate-500 text-sm italic">
              No custom terms defined yet. Add a term above to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {terms.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between bg-slate-900 rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{t.term}</span>
                    <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                      {ENTITY_TYPE_LABELS[t.entityType] ?? t.entityType}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTermMutation.mutate(t.id)}
                    disabled={removeTermMutation.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Section: Allowed Exceptions                                         */}
      {/* ------------------------------------------------------------------ */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-gold flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Allowed Exceptions
          </CardTitle>
          <p className="text-sm text-slate-400">
            Specify terms that should <em>not</em> be anonymized even if they
            would otherwise match a built-in pattern. Common examples include
            well-known institutions like "Supreme Court" or legal boilerplate
            like "Now Comes".
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add exception row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="exception-input" className="text-slate-300 text-xs mb-1 block">
                Term to allow
              </Label>
              <Input
                id="exception-input"
                value={newException}
                onChange={(e) => setNewException(e.target.value)}
                placeholder='e.g., "Supreme Court" or "United States"'
                className="bg-slate-900 border-slate-600 text-white"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddException(); }}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddException}
                disabled={!newException.trim() || addExceptionMutation.isPending}
                className="bg-gold text-black hover:bg-gold/90"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Exceptions list */}
          {exceptions.length === 0 ? (
            <p className="text-slate-500 text-sm italic">
              No exceptions defined. Terms you add here will never be anonymized.
            </p>
          ) : (
            <ul className="space-y-2">
              {exceptions.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between bg-slate-900 rounded-md px-3 py-2"
                >
                  <span className="text-white text-sm">{e.term}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExceptionMutation.mutate(e.id)}
                    disabled={removeExceptionMutation.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Section: Live Preview                                               */}
      {/* ------------------------------------------------------------------ */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-gold flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Preview Anonymization
          </CardTitle>
          <p className="text-sm text-slate-400">
            Paste a sample of text to see how your current anonymization rules
            (including any custom terms and exceptions above) will transform it.
            No session is created and no data leaves this device during the
            preview.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300 text-xs mb-1 block">
              Sample text
            </Label>
            <Textarea
              value={previewInput}
              onChange={(e) => setPreviewInput(e.target.value)}
              placeholder="Paste or type text here to preview anonymization…"
              rows={5}
              className="bg-slate-900 border-slate-600 text-white resize-none"
            />
          </div>

          <Button
            onClick={handlePreview}
            disabled={!previewInput.trim() || isPreviewing}
            className="bg-gold text-black hover:bg-gold/90"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isPreviewing ? "Processing…" : "Preview"}
          </Button>

          {previewResult && (
            <div className="space-y-3">
              {/* Stats row */}
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-slate-300 border-slate-600">
                  {previewResult.entitiesReplaced} entities replaced
                </Badge>
                <Badge variant={riskBadgeVariant(previewResult.riskCategory)}>
                  {riskLabel(previewResult.riskCategory)}
                </Badge>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Original
                  </p>
                  <pre className="bg-slate-950 rounded p-3 text-sm text-slate-300 whitespace-pre-wrap break-words">
                    {previewInput}
                  </pre>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Anonymized</span>
                  </p>
                  <pre className="bg-slate-950 rounded p-3 text-sm text-emerald-300 whitespace-pre-wrap break-words">
                    {previewResult.anonymizedText}
                  </pre>
                </div>
              </div>

              {/* Summary table */}
              {Object.entries(previewResult.summary).some(([, count]) => count > 0) && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                    Replacement summary
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(previewResult.summary)
                      .filter(([, count]) => count > 0)
                      .map(([type, count]) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {ENTITY_TYPE_LABELS[type as AnonymizableEntityType] ?? type}: {count}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
