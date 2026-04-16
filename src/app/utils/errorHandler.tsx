import { toast } from 'sonner';
import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// Map of common HTTP status codes to user-friendly messages
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'We couldn\u2019t process your request. Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You don\u2019t have permission to perform this action.',
  404: 'The resource you\u2019re looking for doesn\u2019t exist.',
  408: 'The request timed out. Please check your connection and retry.',
  409: 'There was a conflict with your request. Please refresh and try again.',
  413: 'The file or data you\u2019re sending is too large.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'Something went wrong on our end. We\u2019re working on it!',
  502: 'Our server is temporarily unavailable. Please try again shortly.',
  503: 'Service is currently under maintenance. Please try again later.',
};

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface CustomToastProps {
  t: string | number;
  title: string;
  description?: string;
  type: ToastType;
}

const CustomToast = ({ t, title, description, type }: CustomToastProps) => {
  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={18} className="text-emerald-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    warning: <AlertTriangle size={18} className="text-amber-500" />,
    info: <Info size={18} className="text-blue-500" />,
  };

  const bgMap: Record<ToastType, string> = {
    success: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    error: 'bg-red-500/10 dark:bg-red-400/10',
    warning: 'bg-amber-500/10 dark:bg-amber-400/10',
    info: 'bg-blue-500/10 dark:bg-blue-400/10',
  };

  return (
    <div className="relative flex w-[360px] max-w-[90vw] items-start gap-4 rounded-2xl border border-stone-200/50 bg-white/95 p-4 pr-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl dark:border-white/5 dark:bg-[#1a1a1a]/95 dark:shadow-[0_8px_30px_rgb(0,0,0,0.6)]">
      {/* Icon with colored background circular halo */}
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bgMap[type]}`}>
        {iconMap[type]}
      </div>
      
      {/* Text Content */}
      <div className="flex flex-1 flex-col pt-[2px]">
        <span className="text-[14px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 leading-snug">
          {title}
        </span>
        {description && (
          <span className="mt-1 text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed max-w-[250px]">
            {description}
          </span>
        )}
      </div>

      {/* Dismiss Button */}
      <button 
        onClick={() => toast.dismiss(t)}
        className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 dark:text-stone-500 dark:hover:bg-white/10 dark:hover:text-stone-300"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export function showErrorToast(title: string, description?: string, options?: { duration?: number }) {
  toast.custom((t) => <CustomToast t={t} title={title} description={description} type="error" />, {
    duration: options?.duration ?? 5000,
  });
}

export function showSuccessToast(title: string, description?: string, options?: { duration?: number }) {
  toast.custom((t) => <CustomToast t={t} title={title} description={description} type="success" />, {
    duration: options?.duration ?? 4000,
  });
}

export function showWarningToast(title: string, description?: string, options?: { duration?: number }) {
  toast.custom((t) => <CustomToast t={t} title={title} description={description} type="warning" />, {
    duration: options?.duration ?? 5000,
  });
}

export async function handleApiError(response: Response, fallbackTitle = 'Request Failed'): Promise<string> {
  const friendlyMessage = HTTP_ERROR_MESSAGES[response.status] || `An unexpected error occurred.`;
  let serverMessage = '';
  try {
    const body = await response.json();
    serverMessage = body.error || body.message || '';
  } catch {
    // Response body is not JSON
  }
  showErrorToast(fallbackTitle, serverMessage || friendlyMessage);
  return serverMessage || friendlyMessage;
}

export function handleNetworkError(error: unknown, context = 'Request') {
  const isNetworkError = error instanceof TypeError && error.message.toLowerCase().includes('fetch');
  if (isNetworkError) {
    showErrorToast(
      'Network Error',
      'Unable to connect to the server. Please check your internet connection and try again.'
    );
    return;
  }
  const message = 'Something went wrong. Please check your connection or try again later.';
  showErrorToast(`${context} Failed`, message);
}

export function setupGlobalErrorHandlers() {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Global] Unhandled promise rejection:', event.reason);
    showErrorToast('Unexpected Error', 'An unexpected error occurred in the background.');
  });
  window.addEventListener('error', (event) => {
    if (event.message?.includes('Script error')) return;
    console.error('[Global] Uncaught error:', event.error || event.message);
    showErrorToast('Application Error', 'Something unexpected happened. If this persists, try refreshing the page.');
  });
  window.addEventListener('offline', () => {
    showWarningToast('You\u2019re Offline', 'Internet connection lost. Some features may not work until you\u2019re back online.', { duration: 8000 });
  });
  window.addEventListener('online', () => {
    showSuccessToast('Back Online!', 'Your internet connection has been restored.', { duration: 3000 });
  });
}
