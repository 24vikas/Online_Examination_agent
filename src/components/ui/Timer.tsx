import React from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  secondsRemaining: number;
  label?: string;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  secondsRemaining,
  label = 'Time Remaining',
  className = '',
}) => {
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const formattedTime =
    hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Color state rules:
  // > 10 min: Green (#15803D / #DCFCE7)
  // < 10 min: Amber (#B45309 / #FEF3C7)
  // < 2 min: Red (#B91C1C / #FEE2E2)
  const isDanger = secondsRemaining <= 120;
  const isWarning = secondsRemaining > 120 && secondsRemaining <= 600;

  const colorStyles = isDanger
    ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA] animate-pulse'
    : isWarning
    ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
    : 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] border text-xs md:text-sm font-medium ${colorStyles} ${className}`}
      role="timer"
      aria-live="polite"
      aria-label={`${label}: ${formattedTime}`}
    >
      <Clock className="w-4 h-4 shrink-0" />
      {label && <span className="hidden sm:inline font-normal">{label}:</span>}
      <span className="font-mono tabular-nums font-bold tracking-wider">{formattedTime}</span>
    </div>
  );
};
