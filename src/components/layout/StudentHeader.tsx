import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Bot,
  ChevronDown,
} from 'lucide-react';
import type { UserProfile } from '../../types/exam.ts';
import type { ActiveTab } from './Sidebar.tsx';

interface StudentHeaderProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: UserProfile;
  onOpenAIChat: (role: 'student_advisor') => void;
  onOpenAuthModal?: () => void;
  grievancesCount?: number;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenAIChat,
  onOpenAuthModal,
  grievancesCount = 0,
}) => {
  const isAttendanceEligible = currentUser.attendanceRate >= 75;
  const isFeeEligible = currentUser.feeCleared;

  return (
    <header className="bg-white h-16 border-b border-[#E3EAE6] px-6 shrink-0 font-sans select-none flex items-center justify-between gap-6 z-20">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
        {/* Brand & Wordmark: Zone 1 */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#1F4D3F] text-white flex items-center justify-center font-bold text-xs shrink-0">
            <span className="font-mono">KLE</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-[#10251F] tracking-tight leading-none">
              Student Examination Portal
            </div>
            <div className="text-xs text-[#5B6B66] font-mono tabular-nums mt-0.5 truncate max-w-[200px]">
              {currentUser.email || '01fe23bci094@kletech.ac.in'}
            </div>
          </div>
        </div>

        {/* Simplified Student Navigation Links: Zone 2 */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Student primary navigation">
          <button
            onClick={() => onSelectTab('student_exams')}
            className={`px-3 py-2 rounded-[10px] text-xs font-medium transition-colors cursor-pointer min-h-[44px] flex items-center ${
              currentTab === 'student_exams'
                ? 'bg-[#D6EBDD] text-[#1F4D3F] font-semibold'
                : 'text-[#5B6B66] hover:text-[#10251F] hover:bg-[#F6F9F6]'
            }`}
          >
            Courses &amp; Eligibility
          </button>

          <button
            onClick={() => onSelectTab('student_testing_hall')}
            className={`px-3 py-2 rounded-[10px] text-xs font-medium transition-colors cursor-pointer min-h-[44px] flex items-center ${
              currentTab === 'student_testing_hall' || currentTab === 'student_practice'
                ? 'bg-[#D6EBDD] text-[#1F4D3F] font-semibold'
                : 'text-[#5B6B66] hover:text-[#10251F] hover:bg-[#F6F9F6]'
            }`}
          >
            Testing Hall &amp; Practice
          </button>

          <button
            onClick={() => onSelectTab('student_scorecard')}
            className={`px-3 py-2 rounded-[10px] text-xs font-medium transition-colors cursor-pointer min-h-[44px] flex items-center ${
              currentTab === 'student_scorecard'
                ? 'bg-[#D6EBDD] text-[#1F4D3F] font-semibold'
                : 'text-[#5B6B66] hover:text-[#10251F] hover:bg-[#F6F9F6]'
            }`}
          >
            Scorecards &amp; Transcripts
          </button>

          <button
            onClick={() => onSelectTab('student_grievances')}
            className={`px-3 py-2 rounded-[10px] text-xs font-medium transition-colors cursor-pointer min-h-[44px] flex items-center gap-1.5 ${
              currentTab === 'student_grievances'
                ? 'bg-[#D6EBDD] text-[#1F4D3F] font-semibold'
                : 'text-[#5B6B66] hover:text-[#10251F] hover:bg-[#F6F9F6]'
            }`}
          >
            <span>Grievances</span>
            {grievancesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#B45309]" />
            )}
          </button>
        </nav>

        {/* Clearances & Actions: Zone 3 */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Institutional Clearances */}
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-[10px] bg-[#F6F9F6] border border-[#E3EAE6] text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[#5B6B66]">Attendance:</span>
              <span
                className={`font-mono font-semibold ${
                  isAttendanceEligible ? 'text-[#15803D]' : 'text-[#B91C1C]'
                }`}
              >
                {currentUser.attendanceRate}%
              </span>
              {isAttendanceEligible ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-[#B91C1C]" />
              )}
            </div>
            <div className="w-px h-3.5 bg-[#E3EAE6]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[#5B6B66]">Fees:</span>
              <span
                className={`font-semibold ${
                  isFeeEligible ? 'text-[#15803D]' : 'text-[#B45309]'
                }`}
              >
                {isFeeEligible ? 'Cleared' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Ask Advisor AI */}
          <button
            onClick={() => onOpenAIChat('student_advisor')}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-[10px] border border-[#1F4D3F] text-[#1F4D3F] hover:bg-[#F6F9F6] text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3F]"
          >
            <Bot className="w-3.5 h-3.5 text-[#1F4D3F]" />
            <span className="hidden sm:inline">Ask Advisor AI</span>
          </button>

          {/* User Profile */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 min-h-[44px] pl-2 pr-1 border-l border-[#E3EAE6] hover:bg-[#F6F9F6] rounded-[10px] transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3F]"
          >
            <div className="w-7 h-7 rounded-full bg-[#D6EBDD] text-[#1F4D3F] flex items-center justify-center text-xs font-semibold">
              {currentUser.displayName.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[#10251F] leading-tight">
                {currentUser.displayName}
              </p>
              <p className="text-[10px] text-[#5B6B66]">Student</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#5B6B66]" />
          </button>
        </div>
      </div>
    </header>
  );
};
