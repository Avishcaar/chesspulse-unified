import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 m-4 rounded-xl bg-stone-900/80 border border-amber-500/30 text-stone-300 text-center">
          <p className="text-amber-400 font-semibold mb-2">Something went wrong in this section.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-medium hover:bg-amber-500/30 transition-all cursor-pointer"
          >
            Reload Section
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
