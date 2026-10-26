import React from 'react';

export type StatusType =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'answered'
  | 'marked';

interface StatusChipProps {
  status: StatusType;
  label: string;
  withDot?: boolean;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  label,
  withDot = true,
  className = '',
}) => {
  const styles: Record<StatusType, { bg: string; text: string; dot: string; border: string }> = {
    success: {
      bg: 'bg-[#DCFCE7]',
      text: 'text-[#15803D]',
      dot: 'bg-[#15803D]',
      border: 'border-[#BBF7D0]',
    },
    warning: {
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#B45309]',
      dot: 'bg-[#B45309]',
      border: 'border-[#FDE68A]',
    },
    danger: {
      bg: 'bg-[#FEE2E2]',
      text: 'text-[#B91C1C]',
      dot: 'bg-[#B91C1C]',
      border: 'border-[#FECACA]',
    },
    info: {
      bg: 'bg-[#DBEAFE]',
      text: 'text-[#1D4ED8]',
      dot: 'bg-[#1D4ED8]',
      border: 'border-[#BFDBFE]',
    },
    neutral: {
      bg: 'bg-[#F6F9F6]',
      text: 'text-[#5B6B66]',
      dot: 'bg-[#5B6B66]',
      border: 'border-[#E3EAE6]',
    },
    answered: {
      bg: 'bg-[#D6EBDD]',
      text: 'text-[#1F4D3F]',
      dot: 'bg-[#1F4D3F]',
      border: 'border-[#1F4D3F]/20',
    },
    marked: {
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#B45309]',
      dot: 'bg-[#B45309]',
      border: 'border-[#B45309]/30',
    },
  };

  const current = styles[status] || styles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border} whitespace-nowrap shrink-0 ${className}`}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot} shrink-0`} />}
      <span>{label}</span>
    </span>
  );
};
