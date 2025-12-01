/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface ToastProps {
  id: string;
  description: string;
  title?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  onClose: () => void;
}

export function Toast({ 
  id: _id, 
  description, 
  title, 
  variant = 'default',
  duration = 5000,
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor = variant === 'destructive' 
    ? 'bg-red-50 border-red-200' 
    : 'bg-white border-gray-200';
  const textColor = variant === 'destructive'
    ? 'text-red-800'
    : 'text-gray-900';
  const titleColor = variant === 'destructive'
    ? 'text-red-900'
    : 'text-gray-900';

  return (
    <div
      className={`fixed bottom-6 right-6 ${bgColor} border rounded-lg p-4 max-w-sm shadow-lg transform transition-all duration-300 z-50`}
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-1">
          {title && (
            <p className={`font-medium text-sm ${titleColor} mb-1`}>{title}</p>
          )}
          <p className={`text-sm ${textColor}`}>{description}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export interface ToastContextType {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: () => removeToast(id),
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

