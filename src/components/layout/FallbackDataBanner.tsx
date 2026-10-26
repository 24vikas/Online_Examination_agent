import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

interface FallbackDataBannerProps {
  isSimulated?: boolean;
}

export const FallbackDataBanner: React.FC<FallbackDataBannerProps> = ({
  isSimulated = true,
}) => {
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (!isSimulated || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#FEF3C7] text-[#B45309] border-b border-[#FDE68A] px-4 py-1.5 flex items-center justify-between text-xs font-sans select-none shrink-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Info className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
        <span className="font-semibold uppercase tracking-wider text-[11px]">
          SIMULATED
        </span>
        <span className="text-[#92400E] truncate">
          Institutional assessment dataset active with local fallback persistence.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss simulated data notice"
        className="text-[#B45309] hover:text-[#78350F] p-1 rounded hover:bg-[#FDE68A]/50 transition-colors shrink-0 ml-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B45309]"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
