import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { ToastPayload, ToastType } from '../../utils/toast.ts';

interface ToastProps {
  toasts: ToastPayload[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-[#1D4ED8] shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-[#BBF7D0]';
      case 'warning':
        return 'border-[#FDE68A]';
      case 'error':
        return 'border-[#FECACA]';
      case 'info':
      default:
        return 'border-[#BFDBFE]';
    }
  };

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto bg-white rounded-[12px] border ${getBorderColor(
            toast.type
          )} shadow-lg p-3.5 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200`}
        >
          <div className="mt-0.5">{getIcon(toast.type)}</div>
          <p className="flex-1 text-xs md:text-sm font-medium text-[#10251F] leading-snug">
            {toast.message}
          </p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-[#5B6B66] hover:text-[#10251F] p-0.5 rounded transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
