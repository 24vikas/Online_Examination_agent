import React, { useState } from 'react';
import { UserCheck, X, ChevronUp, ChevronDown, Shield } from 'lucide-react';
import type { UserProfile } from '../../types/exam.ts';
import { INITIAL_USERS } from '../../firebase/seedData.ts';

interface DemoProfileDrawerProps {
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
}

export const DemoProfileDrawer: React.FC<DemoProfileDrawerProps> = ({
  currentUser,
  onSwitchUser,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Check demo mode environment flag
  const isDemoMode =
    typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_DEMO_MODE === 'true';

  if (!isDemoMode) {
    return null;
  }

  return (
    <aside
      aria-label="Demo Profile Switcher"
      className="fixed bottom-4 right-4 z-50 select-none font-sans"
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer"
          title="Switch Demo Profile (Visible only in demo mode)"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Switch Demo Profile</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        <div className="w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-white border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <div>
                <h4 className="text-xs font-semibold">Demo Role Switcher</h4>
                <p className="text-[10px] text-slate-400">VITE_DEMO_MODE is active</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close demo profile drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 max-h-80 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
            {INITIAL_USERS.map((user) => {
              const isSelected = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    onSwitchUser(user);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-950'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                        user.role === 'author'
                          ? 'bg-amber-600'
                          : user.role === 'faculty'
                          ? 'bg-slate-900'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {user.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{user.displayName}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {user.roleTitle || user.department}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase shrink-0 ${
                      user.role === 'author'
                        ? 'bg-amber-100 text-amber-800'
                        : user.role === 'faculty'
                        ? 'bg-slate-100 text-slate-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Active: <strong className="text-slate-800 font-medium">{currentUser.displayName}</strong></span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
