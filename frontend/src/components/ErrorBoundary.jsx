import React, { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <h5>Something went wrong</h5>
          <p style={{ color: '#666', marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button onClick={this.handleReset} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#06402B', color: 'white', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export class ErrorBoundaryRoute extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <h5>Page failed to load</h5>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#06402B', color: 'white', cursor: 'pointer' }}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

