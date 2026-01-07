/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface CalendarViewProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewType = "2-day" | "work-week" | "4-week";

export function CalendarView({ isOpen, onClose }: CalendarViewProps) {
  const [viewType, setViewType] = useState<ViewType>("work-week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysForView = () => {
    const days: Date[] = [];
    const start = new Date(currentDate);
    
    switch (viewType) {
      case "2-day":
        for (let i = 0; i < 2; i++) {
          const day = new Date(start);
          day.setDate(start.getDate() + i);
          days.push(day);
        }
        break;
      case "work-week":
        // Monday to Friday
        const dayOfWeek = start.getDay();
        const monday = new Date(start);
        monday.setDate(start.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        for (let i = 0; i < 5; i++) {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          days.push(day);
        }
        break;
      case "4-week":
        // 4 weeks starting from current week's Monday
        const weekStart = new Date(start);
        const weekDay = weekStart.getDay();
        weekStart.setDate(start.getDate() - (weekDay === 0 ? 6 : weekDay - 1));
        for (let week = 0; week < 4; week++) {
          for (let day = 0; day < 7; day++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + (week * 7) + day);
            days.push(date);
          }
        }
        break;
    }
    
    return days;
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewType === "2-day") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 2 : -2));
    } else if (viewType === "work-week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 28 : -28));
    }
    setCurrentDate(newDate);
  };

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const days = getDaysForView();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-7xl bg-charcoal border-gray-800 overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold text-white">Calendar View</SheetTitle>
        </SheetHeader>
      <div className="calendar-view-container" style={{ padding: '1.5rem' }}>
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2-day">2-Day View</SelectItem>
                <SelectItem value="work-week">Work Week</SelectItem>
                <SelectItem value="4-week">4-Week View</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate("prev")}
                className="p-2 hover-interactive transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 hover-interactive transition-colors text-sm"
              >
                Today
              </button>
              <button
                onClick={() => navigateDate("next")}
                className="p-2 hover-interactive transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid" style={{
          display: 'grid',
          gridTemplateColumns: viewType === "4-week" ? "repeat(7, 1fr)" : `repeat(${days.length}, 1fr)`,
          gap: '1rem'
        }}>
          {viewType === "4-week" && (
            <>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-header" style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {day}
                </div>
              ))}
            </>
          )}
          
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            
            return (
              <div
                key={index}
                className="calendar-day"
                style={{
                  background: isToday 
                    ? 'rgba(59, 130, 246, 0.2)' 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isToday 
                    ? '2px solid rgba(59, 130, 246, 0.6)' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '1rem',
                  minHeight: viewType === "4-week" ? '120px' : '200px',
                  opacity: isWeekend && viewType === "4-week" ? 0.6 : 1
                }}
              >
                <div className="calendar-day-header" style={{
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    fontWeight: isToday ? '600' : '500',
                    color: isToday ? 'rgba(59, 130, 246, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    fontSize: viewType === "4-week" ? "0.875rem" : "1rem"
                  }}>
                    {viewType === "4-week" 
                      ? day.getDate() 
                      : formatDateHeader(day)}
                  </div>
                </div>
                <div className="calendar-day-events" style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {/* Events would go here */}
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    No events
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </SheetContent>
    </Sheet>
  );
}

