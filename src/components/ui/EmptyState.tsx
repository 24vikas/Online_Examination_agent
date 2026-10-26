import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { Button } from './Button.tsx';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className = '',
}) => {
  return (
    <div
      className={`p-10 text-center flex flex-col items-center justify-center bg-white rounded-[16px] border border-[#E3EAE6] ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#F6F9F6] border border-[#E3EAE6] flex items-center justify-center text-[#5B6B66] mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-[#10251F]">{title}</h3>
      {description && <p className="text-xs text-[#5B6B66] mt-1 max-w-sm">{description}</p>}
      {action && (
        <Button size="sm" variant="primary" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
};
