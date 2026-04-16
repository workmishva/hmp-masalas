import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RefreshCw, X, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleDismiss = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-950/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-200/30 dark:border-red-900/30 bg-white dark:bg-stone-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]"
          >
            {/* Top gradient accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />

            {/* Decorative background circles */}
            <div className="absolute top-0 right-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-red-500/5 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-8 translate-y-8 rounded-full bg-orange-500/5 blur-2xl" />

            <div className="relative p-8 text-center">
              {/* Animated icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10, delay: 0.1 }}
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40 shadow-lg shadow-red-100/50 dark:shadow-red-900/20"
              >
                <Bug size={36} className="text-red-600 dark:text-red-400" />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-2 text-xl font-black text-stone-900 dark:text-white"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Oops! Something went wrong
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 text-sm leading-relaxed text-stone-500 dark:text-stone-400"
              >
                We encountered an unexpected error. Don't worry — your data is safe. 
                Try refreshing the page or dismissing this message.
              </motion.p>

              {/* Error details (collapsible) */}
              {this.state.error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="mb-6 rounded-xl bg-red-50/80 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 text-left"
                >
                  <p className="text-xs font-mono font-semibold text-red-700 dark:text-red-400 break-all leading-relaxed">
                    A critical application error occurred.
                  </p>
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-3"
              >
                <button
                  onClick={this.handleDismiss}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-5 py-3 text-sm font-bold text-stone-700 dark:text-stone-300 transition-all hover:bg-stone-100 dark:hover:bg-stone-700 hover:shadow-sm active:scale-[0.98]"
                >
                  <X size={15} />
                  Dismiss
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-800 px-5 py-3 text-sm font-bold text-white transition-all hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-800/25 active:scale-[0.98]"
                >
                  <RefreshCw size={15} />
                  Reload Page
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
