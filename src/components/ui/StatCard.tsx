import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon?: LucideIcon;
  actionNeeded?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  actionNeeded = false,
  onClick,
  className = '',
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={`bg-white rounded-[16px] border border-[#E3EAE6] p-5 shadow-[0_1px_2px_rgba(16,37,31,0.06)] transition-all ${
        isClickable
          ? 'hover:border-[#1F4D3F] hover:shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3F]'
          : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-medium text-[#5B6B66]">
        <span>{label}</span>
        {Icon && <Icon className="w-4 h-4 text-[#5B6B66]" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`text-2xl lg:text-3xl font-bold font-mono tabular-nums tracking-tight ${
            actionNeeded && Number(value) > 0 ? 'text-[#B45309]' : 'text-[#10251F]'
          }`}
        >
          {value}
        </span>
        {actionNeeded && Number(value) > 0 && (
          <span className="w-2 h-2 rounded-full bg-[#B45309] shrink-0" aria-label="Action needed" />
        )}
      </div>
      {subtext && <p className="mt-1 text-xs text-[#5B6B66]">{subtext}</p>}
    </div>
  );
};
