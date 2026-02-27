/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ 
          padding: "20px", 
          color: "white", 
          fontFamily: "monospace",
          background: "#1a1a1a",
          minHeight: "100vh"
        }}>
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message || "Unknown error"}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: "20px", padding: "10px 20px" }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;

}
}