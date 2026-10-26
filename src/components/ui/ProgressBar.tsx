import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  subtext?: string;
  variant?: 'primary' | 'warning' | 'danger' | 'success';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  subtext,
  variant = 'primary',
  className = '',
}) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const fillColors = {
    primary: 'bg-[#1F4D3F]',
    warning: 'bg-[#B45309]',
    danger: 'bg-[#B91C1C]',
    success: 'bg-[#15803D]',
  }[variant];

  return (
    <div className={`space-y-1 ${className}`}>
      {(label || subtext) && (
        <div className="flex items-center justify-between text-xs text-[#5B6B66]">
          {label && <span className="font-medium text-[#10251F]">{label}</span>}
          {subtext && <span className="font-mono tabular-nums">{subtext}</span>}
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-[#E3EAE6] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${fillColors}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};
