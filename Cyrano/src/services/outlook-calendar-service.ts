/**
 * Outlook Calendar Service
 * 
 * Integrates with Microsoft Graph API to access Outlook Calendar, Tasks, and Contacts
 * Extends Outlook email service for calendar, to-do, and contacts functionality
 * 
 * Created: 2025-11-26
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import fetch from 'node-fetch';
import { OutlookService, OutlookConfig } from './outlook-service.js';

export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  body?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: Array<{ email: string; name?: string; type: string }>;
  isAllDay: boolean;
  showAs: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere';
  importance: 'low' | 'normal' | 'high';
  sensitivity: 'normal' | 'personal' | 'private' | 'confidential';
  isCancelled?: boolean;
  responseStatus?: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded';
}

export interface OutlookTask {
  id: string;
  subject: string;
  body?: string;
  status: 'notStarted' | 'inProgress' | 'completed' | 'waitingOnOthers' | 'deferred';
  importance: 'low' | 'normal' | 'high';
  dueDateTime?: string;
  startDateTime?: string;
  completedDateTime?: string;
  reminderDateTime?: string;
  categories?: string[];
}

export interface OutlookContact {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  emailAddresses?: Array<{ address: string; name?: string }>;
  businessPhones?: string[];
  mobilePhone?: string;
  companyName?: string;
  jobTitle?: string;
  officeLocation?: string;
}

export class OutlookCalendarService extends OutlookService {
  constructor(config: OutlookConfig) {
    super(config);
    // baseUrl is inherited from OutlookService
  }

  /**
   * Get calendar events from Outlook
   */
  async getCalendarEvents(
    startDate: string,
    endDate: string,
    calendarId: string = 'calendar'
  ): Promise<OutlookCalendarEvent[]> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }

    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    const url = `${this.baseUrl}/me/calendars/${calendarId}/calendarView?startDateTime=${start}&endDateTime=${end}&$top=100`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'outlook.timezone="UTC"',
      },
    };

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getCalendarEvents(startDate, endDate, calendarId);
      }
      const error = await response.text();
      throw new Error(`Failed to get calendar events: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return (data.value || []).map((event: any) => this.mapToCalendarEvent(event));
  }

  /**
   * Get tasks from Outlook (Microsoft To-Do)
   */
  async getTasks(taskListId?: string): Promise<OutlookTask[]> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }

    // Get default task list if not specified
    let listId = taskListId;
    if (!listId) {
      const lists = await this.getTaskLists();
      listId = lists[0]?.id || 'default';
    }

    const url = `${this.baseUrl}/me/todo/lists/${listId}/tasks?$top=100`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getTasks(listId);
      }
      const error = await response.text();
      throw new Error(`Failed to get tasks: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return (data.value || []).map((task: any) => this.mapToTask(task));
  }

  /**
   * Get task lists
   */
  async getTaskLists(): Promise<Array<{ id: string; displayName: string }>> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }

    const url = `${this.baseUrl}/me/todo/lists`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getTaskLists();
      }
      const error = await response.text();
      throw new Error(`Failed to get task lists: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return (data.value || []).map((list: any) => ({
      id: list.id,
      displayName: list.displayName,
    }));
  }

  /**
   * Get contacts from Outlook
   */
  async getContacts(): Promise<OutlookContact[]> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }

    const url = `${this.baseUrl}/me/contacts?$top=100`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getContacts();
      }
      const error = await response.text();
      throw new Error(`Failed to get contacts: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return (data.value || []).map((contact: any) => this.mapToContact(contact));
  }

  /**
   * Map Microsoft Graph calendar event to OutlookCalendarEvent
   */
  private mapToCalendarEvent(event: any): OutlookCalendarEvent {
    return {
      id: event.id,
      subject: event.subject || '',
      body: event.body?.content,
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location?.displayName,
      attendees: event.attendees?.map((a: any) => ({
        email: a.emailAddress?.address || '',
        name: a.emailAddress?.name,
        type: a.type || 'required',
      })),
      isAllDay: event.isAllDay || false,
      showAs: event.showAs || 'busy',
      importance: event.importance || 'normal',
      sensitivity: event.sensitivity || 'normal',
      isCancelled: event.isCancelled || false,
      responseStatus: event.responseStatus?.response || 'notResponded',
    };
  }

  /**
   * Map Microsoft Graph task to OutlookTask
   */
  private mapToTask(task: any): OutlookTask {
    return {
      id: task.id,
      subject: task.title || '',
      body: task.body?.content,
      status: task.status || 'notStarted',
      importance: task.importance || 'normal',
      dueDateTime: task.dueDateTime?.dateTime,
      startDateTime: task.startDateTime?.dateTime,
      completedDateTime: task.completedDateTime?.dateTime,
      reminderDateTime: task.reminderDateTime?.dateTime,
      categories: task.categories || [],
    };
  }

  /**
   * Map Microsoft Graph contact to OutlookContact
   */
  private mapToContact(contact: any): OutlookContact {
    return {
      id: contact.id,
      displayName: contact.displayName || '',
      givenName: contact.givenName,
      surname: contact.surname,
      emailAddresses: contact.emailAddresses?.map((e: any) => ({
        address: e.address || '',
        name: e.name,
      })),
      businessPhones: contact.businessPhones,
      mobilePhone: contact.mobilePhone,
      companyName: contact.companyName,
      jobTitle: contact.jobTitle,
      officeLocation: contact.officeLocation,
    };

}
}