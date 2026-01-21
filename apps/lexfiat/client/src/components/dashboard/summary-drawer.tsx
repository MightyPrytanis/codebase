/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Calendar, FileText, Mail, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { openInWord, openInEmail, openInClio, openInCalendar } from "@/lib/deep-links";

export type EntityType = "matter" | "event" | "document" | "communication";

export interface BaseEntity {
  id: string;
  type: EntityType;
  title: string;
  deepLinkUrl?: string;
}

export interface MatterEntity extends BaseEntity {
  type: "matter";
  matterId: string;
  clientName: string;
  caseNumber?: string;
  status: string;
  practiceArea?: string;
  openedDate?: string;
  lastActivity?: string;
}

export interface EventEntity extends BaseEntity {
  type: "event";
  eventId: string;
  date: string;
  time: string;
  court?: string;
  location?: string;
  description?: string;
  attendees?: string[];
}

export interface DocumentEntity extends BaseEntity {
  type: "document";
  documentId: string;
  documentType: string; // motion, pleading, notice, etc.
  status: string;
  matterId?: string;
  createdDate?: string;
  lastModified?: string;
  filePath?: string;
}

export interface CommunicationEntity extends BaseEntity {
  type: "communication";
  communicationId: string;
  from: string;
  to: string[];
  subject: string;
  excerpt?: string;
  date: string;
  attachments?: number;
}

export type Entity = MatterEntity | EventEntity | DocumentEntity | CommunicationEntity;

interface SummaryDrawerProps {
  entity: Entity | null;
  isOpen: boolean;
  onClose: () => void;
}

const getEntityIcon = (type: EntityType) => {
  switch (type) {
    case "matter":
      return <Briefcase className="h-5 w-5" />;
    case "event":
      return <Calendar className="h-5 w-5" />;
    case "document":
      return <FileText className="h-5 w-5" />;
    case "communication":
      return <Mail className="h-5 w-5" />;
  }
};

const getActionLabel = (type: EntityType) => {
  switch (type) {
    case "matter":
      return "Open in Clio";
    case "event":
      return "Open in Calendar";
    case "document":
      return "Open in Editor";
    case "communication":
      return "Open in Email Client";
  }
};

export function SummaryDrawer({ entity, isOpen, onClose }: SummaryDrawerProps) {
  if (!entity) return null;

  const handleDeepLink = () => {
    // Use specific deep-link handlers based on entity type
    switch (entity.type) {
      case "matter":
        if (entity.type === "matter") {
          openInClio(entity.matterId);
        }
        break;
      case "document":
        if (entity.type === "document") {
          openInWord(entity.documentId, entity.filePath);
        }
        break;
      case "communication":
        if (entity.type === "communication") {
          // Determine email client (default to gmail, could be enhanced with user preference)
          const emailClient = 'gmail'; // TODO: Get from user preferences
          openInEmail(entity.communicationId, emailClient);
        }
        break;
      case "event":
        if (entity.type === "event") {
          // Determine calendar provider (default to google, could be enhanced with user preference)
          const calendarProvider = 'google'; // TODO: Get from user preferences
          openInCalendar(entity.eventId, calendarProvider);
        }
        break;
      default:
        // Fallback to generic deepLinkUrl if provided
        if (entity.deepLinkUrl) {
          window.open(entity.deepLinkUrl, "_blank");
        }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            {getEntityIcon(entity.type)}
            <SheetTitle className="text-xl">{entity.title}</SheetTitle>
          </div>
          <SheetDescription>
            {entity.type === "matter" && "Case details and information"}
            {entity.type === "event" && "Calendar event information"}
            {entity.type === "document" && "Document details and status"}
            {entity.type === "communication" && "Communication details"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Matter-specific content */}
          {entity.type === "matter" && (
            <>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Client</span>
                  <p className="text-base">{entity.clientName}</p>
                </div>
                {entity.caseNumber && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Case Number</span>
                    <p className="text-base">{entity.caseNumber}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <div className="mt-1">
                    <Badge variant="outline">{entity.status}</Badge>
                  </div>
                </div>
                {entity.practiceArea && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Practice Area</span>
                    <p className="text-base">{entity.practiceArea}</p>
                  </div>
                )}
                {entity.openedDate && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Opened</span>
                    <p className="text-base">{new Date(entity.openedDate).toLocaleDateString()}</p>
                  </div>
                )}
                {entity.lastActivity && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Last Activity</span>
                    <p className="text-base">{new Date(entity.lastActivity).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Event-specific content */}
          {entity.type === "event" && (
            <>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Date & Time</span>
                  <p className="text-base">
                    {new Date(entity.date).toLocaleDateString()} at {entity.time}
                  </p>
                </div>
                {entity.court && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Court</span>
                    <p className="text-base">{entity.court}</p>
                  </div>
                )}
                {entity.location && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Location</span>
                    <p className="text-base">{entity.location}</p>
                  </div>
                )}
                {entity.description && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Description</span>
                    <p className="text-base">{entity.description}</p>
                  </div>
                )}
                {entity.attendees && entity.attendees.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Attendees</span>
                    <ul className="list-disc list-inside mt-1">
                      {entity.attendees.map((attendee, idx) => (
                        <li key={idx} className="text-base">{attendee}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Document-specific content */}
          {entity.type === "document" && (
            <>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Document Type</span>
                  <div className="mt-1">
                    <Badge variant="outline">{entity.documentType}</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <div className="mt-1">
                    <Badge variant="outline">{entity.status}</Badge>
                  </div>
                </div>
                {entity.matterId && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Matter ID</span>
                    <p className="text-base">{entity.matterId}</p>
                  </div>
                )}
                {entity.createdDate && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Created</span>
                    <p className="text-base">{new Date(entity.createdDate).toLocaleDateString()}</p>
                  </div>
                )}
                {entity.lastModified && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Last Modified</span>
                    <p className="text-base">{new Date(entity.lastModified).toLocaleDateString()}</p>
                  </div>
                )}
                {entity.filePath && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">File Path</span>
                    <p className="text-base font-mono text-sm">{entity.filePath}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Communication-specific content */}
          {entity.type === "communication" && (
            <>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">From</span>
                  <p className="text-base">{entity.from}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">To</span>
                  <p className="text-base">{entity.to.join(", ")}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Date</span>
                  <p className="text-base">{new Date(entity.date).toLocaleString()}</p>
                </div>
                {entity.excerpt && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Excerpt</span>
                    <p className="text-base mt-1 p-3 bg-muted rounded-md">{entity.excerpt}</p>
                  </div>
                )}
                {entity.attachments !== undefined && entity.attachments > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Attachments</span>
                    <p className="text-base">{entity.attachments} file(s)</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <SheetFooter className="mt-6">
          {entity.deepLinkUrl && (
            <Button onClick={handleDeepLink} className="w-full sm:w-auto">
              <ExternalLink className="mr-2 h-4 w-4" />
              {getActionLabel(entity.type)}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Hook to manage summary drawer state
 */
export function useSummaryDrawer() {
  const [entity, setEntity] = React.useState<Entity | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const openDrawer = (newEntity: Entity) => {
    setEntity(newEntity);
    setIsOpen(true);
  };

  const closeDrawer = () => {
    setIsOpen(false);
    // Clear entity after animation
    setTimeout(() => setEntity(null), 300);
  };

  return {
    entity,
    isOpen,
    openDrawer,
    closeDrawer,
  };
