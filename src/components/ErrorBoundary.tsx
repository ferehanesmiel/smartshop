import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      try {
        const errorInfo = JSON.parse(this.state.errorMessage);
        return (
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">An error occurred: {errorInfo.error}</p>
            <p className="text-gray-500 text-sm">Operation: {errorInfo.operationType} on {errorInfo.path}</p>
          </div>
        );
      } catch (e) {
        return (
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">{this.state.errorMessage}</p>
          </div>
        );
      }
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
