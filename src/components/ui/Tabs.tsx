import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  actionNeeded?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  className = '',
}) => {
  return (
    <div className={`border-b border-[#E3EAE6] ${className}`}>
      <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const showBadge = typeof tab.count === 'number';
          const isAction = Boolean(tab.actionNeeded && tab.count && tab.count > 0);

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3F] ${
                isActive
                  ? 'border-[#1F4D3F] text-[#1F4D3F] font-semibold'
                  : 'border-transparent text-[#5B6B66] hover:text-[#10251F] hover:border-[#E3EAE6]'
              }`}
            >
              <span>{tab.label}</span>
              {showBadge && (
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono tabular-nums font-medium ${
                    isAction
                      ? 'bg-[#FEF3C7] text-[#B45309] font-bold border border-[#FDE68A]'
                      : 'bg-[#F6F9F6] text-[#5B6B66] border border-[#E3EAE6]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
