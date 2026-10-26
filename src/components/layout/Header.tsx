import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Bell,
  Cpu,
  User,
  ChevronDown,
  X,
  ChevronRight,
  Shield,
  Palette,
} from 'lucide-react';
import type { UserProfile } from '../../types/exam.ts';
import type { ActiveTab } from './Sidebar.tsx';
import { INITIAL_USERS } from '../../firebase/seedData.ts';

interface HeaderProps {
  currentTab: ActiveTab;
  currentUser: UserProfile;
  onNewExam?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenSidePanel: () => void;
  onOpenAuthModal?: () => void;
  onSwitchUser?: (user: UserProfile) => void;
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentUser,
  onNewExam,
  searchQuery = '',
  onSearchChange,
  onOpenSidePanel,
  onOpenAuthModal,
  onSwitchUser,
  notificationCount = 0,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDemoTools, setShowDemoTools] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDemoMode =
    typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSingleLineTitle = () => {
    switch (currentTab) {
      case 'coe_dashboard':
        return 'Controller of Examinations Control Room';
      case 'faculty_dashboard':
        return 'Faculty Examination Dashboard';
      case 'faculty_planner':
        return 'Exam Blueprint & Delivery Specification';
      case 'faculty_syllabus_rag':
      case 'faculty_questions':
        return 'Syllabus RAG & Question Studio';
      case 'faculty_node_graph':
        return 'Agentic DAG Execution Pipeline';
      case 'faculty_reviews':
        return 'Integrity Audits & Subjective Evaluation Gate';
      case 'faculty_grievances':
        return 'Grievance Adjudication & Revaluation Board';
      case 'verification_protocol':
        return 'Pre-Deployment Verification Suite';
      case 'design_system':
        return 'Design System & Shared Components';
      default:
        return 'Online Examination Management';
    }
  };

  return (
    <header
      id="institutional-header"
      className="bg-white h-16 border-b border-[#E3EAE6] px-6 flex items-center justify-between gap-4 shrink-0 select-none font-sans z-20"
    >
      {/* 1. Page Title on ONE Line (No Truncation) */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-base font-semibold text-[#10251F] whitespace-nowrap">
          {getSingleLineTitle()}
        </h1>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F6F9F6] text-[#5B6B66] border border-[#E3EAE6] whitespace-nowrap">
          {currentUser.role === 'author' ? 'COE Author' : 'Faculty'}
        </span>
      </div>

      {/* 2. Actions: Search, ONE Primary "New Exam" Button (Deep Green), Bell, Profile Menu */}
      <div className="flex items-center gap-3 shrink-0" ref={menuRef}>
        {/* Search */}
        <div className="relative hidden md:block w-48 lg:w-60">
          <Search className="w-4 h-4 text-[#5B6B66] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search exams, courses..."
            aria-label="Search exams, courses"
            className="w-full bg-[#F6F9F6] focus:bg-white text-xs pl-9 pr-7 py-2 rounded-[10px] border border-[#E3EAE6] focus:border-[#1F4D3F] focus:ring-1 focus:ring-[#1F4D3F] text-[#10251F] placeholder:text-[#5B6B66] focus:outline-none min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5B6B66] hover:text-[#10251F]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ONE Primary Button per screen: "New Exam" (Deep Green with white text) */}
        {onNewExam && (
          <button
            id="header-btn-new-exam"
            onClick={onNewExam}
            className="flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-[10px] bg-[#1F4D3F] hover:bg-[#173B30] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3F]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Exam</span>
          </button>
        )}

        {/* Bell Notifications */}
        <div className="relative">
          <button
            id="header-notifications-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            aria-label="View notifications"
            className="relative p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[10px] text-[#10251F] hover:bg-[#F6F9F6] border border-transparent hover:border-[#E3EAE6] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3F]"
          >
            <Bell className="w-4 h-4 text-[#10251F]" />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#B45309] ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-[16px] shadow-lg border border-[#E3EAE6] py-2 z-50 animate-in fade-in duration-100">
              <div className="px-4 py-2 border-b border-[#E3EAE6] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#10251F]">Notifications</span>
                <span className="text-[11px] text-[#5B6B66] font-mono tabular-nums">
                  {notificationCount} action items
                </span>
              </div>
              <div className="px-4 py-3 text-xs text-[#5B6B66]">
                {notificationCount > 0 ? (
                  <p>Faculty review gate: submissions and proctor variances await evaluation.</p>
                ) : (
                  <p>All evaluation queues are currently clear.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu with Overflow Tools */}
        <div className="relative">
          <button
            id="header-profile-menu-btn"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            aria-expanded={showProfileMenu}
            aria-haspopup="true"
            className="flex items-center gap-2 min-h-[44px] pl-2 pr-1 border-l border-[#E3EAE6] hover:bg-[#F6F9F6] rounded-[10px] transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3F]"
          >
            <div className="w-7 h-7 rounded-full bg-[#D6EBDD] text-[#1F4D3F] flex items-center justify-center text-xs font-semibold">
              {currentUser.displayName.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-[#10251F] leading-tight">
                {currentUser.displayName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#F6F9F6] text-[#5B6B66] border border-[#E3EAE6] font-medium whitespace-nowrap">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#5B6B66]" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-[16px] shadow-xl border border-[#E3EAE6] py-2 z-50 animate-in fade-in duration-100 divide-y divide-[#E3EAE6]">
              {/* Profile summary */}
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-[#10251F]">{currentUser.displayName}</p>
                <p className="text-[11px] text-[#5B6B66] truncate font-mono">{currentUser.email}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#F6F9F6] text-[#5B6B66] border border-[#E3EAE6] font-medium">
                  {currentUser.roleTitle || currentUser.department || 'Academic Board'}
                </span>
              </div>

              {/* Operations & AI (moved inside menu as requested) */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenSidePanel();
                  }}
                  className="w-full px-4 py-2.5 text-xs text-left text-[#10251F] hover:bg-[#F6F9F6] flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-[#1F4D3F]" />
                    <span className="font-medium">Operations & AI Assistant</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5B6B66]" />
                </button>
              </div>

              {/* Demo Tools Accordion (visible strictly when VITE_DEMO_MODE=true) */}
              {isDemoMode && onSwitchUser && (
                <div className="py-1">
                  <button
                    onClick={() => setShowDemoTools(!showDemoTools)}
                    className="w-full px-4 py-2 text-xs text-left text-[#10251F] hover:bg-[#F6F9F6] flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#B45309]" />
                      <span className="font-medium">Demo tools</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#5B6B66] transition-transform ${
                        showDemoTools ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showDemoTools && (
                    <div className="px-4 py-2 bg-[#F6F9F6] space-y-1.5 border-t border-[#E3EAE6]">
                      <label className="text-[11px] font-medium text-[#5B6B66] block">
                        Switch demo profile:
                      </label>
                      <select
                        aria-label="Switch demo profile"
                        className="w-full text-xs bg-white border border-[#E3EAE6] rounded-[8px] p-1.5 text-[#10251F] focus:outline-none focus:border-[#1F4D3F]"
                        value={currentUser.id}
                        onChange={(e) => {
                          const user = INITIAL_USERS.find((u) => u.id === e.target.value);
                          if (user) {
                            onSwitchUser(user);
                            setShowProfileMenu(false);
                          }
                        }}
                      >
                        {INITIAL_USERS.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.displayName} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Account / Auth trigger */}
              <div className="py-1">
                {onOpenAuthModal && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenAuthModal();
                    }}
                    className="w-full px-4 py-2 text-xs text-left text-[#5B6B66] hover:text-[#10251F] hover:bg-[#F6F9F6] flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Manage account</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
