import React from 'react';
import { AlertTriangle, Info, AlertCircle, CheckCircle, X } from 'lucide-react';

export type BannerVariant = 'info' | 'warning' | 'error' | 'success' | 'demo';

interface BannerProps {
  variant?: BannerVariant;
  message: string;
  subtext?: string;
  onDismiss?: () => void;
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({
  variant = 'demo',
  message,
  subtext,
  onDismiss,
  className = '',
}) => {
  const styles: Record<BannerVariant, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    demo: {
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#B45309]',
      border: 'border-[#FDE68A]',
      icon: <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />,
    },
    warning: {
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#B45309]',
      border: 'border-[#FDE68A]',
      icon: <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />,
    },
    error: {
      bg: 'bg-[#FEE2E2]',
      text: 'text-[#B91C1C]',
      border: 'border-[#FECACA]',
      icon: <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />,
    },
    success: {
      bg: 'bg-[#DCFCE7]',
      text: 'text-[#15803D]',
      border: 'border-[#BBF7D0]',
      icon: <CheckCircle className="w-4 h-4 text-[#15803D] shrink-0" />,
    },
    info: {
      bg: 'bg-[#DBEAFE]',
      text: 'text-[#1D4ED8]',
      border: 'border-[#BFDBFE]',
      icon: <Info className="w-4 h-4 text-[#1D4ED8] shrink-0" />,
    },
  };

  const current = styles[variant];

  return (
    <div
      role="status"
      className={`w-full px-4 py-2 border-b ${current.bg} ${current.border} ${current.text} text-xs font-medium flex items-center justify-between transition-colors z-30 ${className}`}
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        {current.icon}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold tracking-wide uppercase text-[11px]">{message}</span>
          {subtext && <span className="opacity-90 font-normal">· {subtext}</span>}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss banner"
            className="ml-auto p-1 rounded hover:bg-black/5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
