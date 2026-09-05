/**
 * ErrorBoundary.tsx — Per-tab error boundary component.
 *
 * PURPOSE:
 *   Catches runtime errors within a tab so that one broken tab
 *   doesn't crash the entire dashboard. Shows a friendly error
 *   message with a "Try Again" button.
 */

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  tabName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.tabName}] Error:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ margin: 20, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h3 style={{ fontSize: 16, color: "#374151", marginBottom: 8 }}>
            Something went wrong in {this.props.tabName}
          </h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, maxWidth: 400, margin: "0 auto 16px" }}>
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
