import React from 'react';
import type { StatusType } from './StatusChip.tsx';
import { StatusChip } from './StatusChip.tsx';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  actor?: string;
  description?: string;
  status?: {
    type: StatusType;
    label: string;
  };
  highlight?: boolean;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className = '' }) => {
  if (events.length === 0) {
    return <p className="text-xs text-[#5B6B66] py-4 text-center">No timeline events recorded.</p>;
  }

  return (
    <div className={`relative pl-4 space-y-6 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E3EAE6] ${className}`}>
      {events.map((evt) => (
        <div key={evt.id} className="relative flex items-start gap-3">
          {/* Timeline Dot */}
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 border-white -ml-4 mt-0.5 shrink-0 ${
              evt.highlight ? 'bg-[#B45309] ring-2 ring-[#FEF3C7]' : 'bg-[#1F4D3F]'
            }`}
          />

          <div className="flex-1 bg-white rounded-[10px] border border-[#E3EAE6] p-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#10251F]">{evt.title}</span>
              <span className="text-[11px] font-mono tabular-nums text-[#5B6B66]">{evt.timestamp}</span>
            </div>

            {evt.actor && (
              <p className="text-[11px] text-[#5B6B66] mt-0.5">
                Actor: <span className="font-medium text-[#10251F]">{evt.actor}</span>
              </p>
            )}

            {evt.description && (
              <p className="text-xs text-[#5B6B66] mt-1 leading-relaxed">{evt.description}</p>
            )}

            {evt.status && (
              <div className="mt-2">
                <StatusChip status={evt.status.type} label={evt.status.label} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
