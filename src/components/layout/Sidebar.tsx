import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FileSpreadsheet,
  ShieldAlert,
  GraduationCap,
  LifeBuoy,
  ShieldCheck,
  Crown,
  Activity,
  Layers,
  Palette,
} from 'lucide-react';
import type { UserProfile } from '../../types/exam.ts';

export type ActiveTab =
  | 'coe_dashboard'
  | 'faculty_dashboard'
  | 'faculty_planner'
  | 'faculty_syllabus_rag'
  | 'faculty_node_graph'
  | 'faculty_reviews'
  | 'faculty_grievances'
  | 'faculty_questions'
  | 'faculty_exams'
  | 'student_study_hub'
  | 'student_exams'
  | 'student_testing_hall'
  | 'student_scorecard'
  | 'student_practice'
  | 'student_grievances'
  | 'verification_protocol'
  | 'design_system';

interface SidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: UserProfile;
  pendingReviewsCount: number;
  integrityFlagsCount: number;
  grievancesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  pendingReviewsCount,
  integrityFlagsCount,
  grievancesCount,
}) => {
  const isAuthor = currentUser.role === 'author';

  const navItemClass = (isActive: boolean) =>
    `w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors text-left select-none cursor-pointer ${
      isActive
        ? 'border-l-[3px] border-[#D6EBDD] bg-[#173B30] text-white font-semibold'
        : 'border-l-[3px] border-transparent text-white/70 hover:text-white hover:bg-white/5'
    }`;

  return (
    <aside
      id="institutional-sidebar"
      aria-label="Institutional Navigation"
      className="w-[240px] bg-[#1F4D3F] text-white flex flex-col h-screen shrink-0 select-none font-sans"
    >
      {/* 1. KLE Logo Large at Top */}
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-[#173B30] border border-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
          <span className="font-mono font-bold tracking-tight text-white">KLE</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-white tracking-tight leading-tight truncate">
            KLE Tech
          </h1>
          <p className="text-xs text-white/70 truncate">Examination Portal</p>
        </div>
      </div>

      {/* 2. Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {/* COE Author Section */}
        {isAuthor && (
          <div>
            <div className="px-4 mb-2 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-[#FEF3C7]" />
              <span className="text-[11px] font-semibold text-white/70">
                COE Administration
              </span>
            </div>
            <nav className="space-y-0.5">
              <button
                id="nav-coe-dashboard"
                onClick={() => onSelectTab('coe_dashboard')}
                className={navItemClass(currentTab === 'coe_dashboard')}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <ShieldCheck className="w-4 h-4 text-white/80 shrink-0" />
                  <span className="truncate">COE Ratification</span>
                </div>
              </button>

              <button
                id="nav-coe-rag-studio"
                onClick={() => onSelectTab('faculty_syllabus_rag')}
                className={navItemClass(
                  currentTab === 'faculty_syllabus_rag' || currentTab === 'faculty_questions',
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Sparkles className="w-4 h-4 text-white/80 shrink-0" />
                  <span className="truncate">Syllabus RAG Studio</span>
                </div>
              </button>

              <button
                id="nav-coe-blueprint-planner"
                onClick={() => onSelectTab('faculty_planner')}
                className={navItemClass(
                  currentTab === 'faculty_planner' || currentTab === 'faculty_exams',
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileSpreadsheet className="w-4 h-4 text-white/80 shrink-0" />
                  <span className="truncate">Blueprint Config</span>
                </div>
              </button>
            </nav>
          </div>
        )}

        {/* Faculty Operations Section */}
        <div>
          <div className="px-4 mb-2 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-white/70" />
            <span className="text-[11px] font-semibold text-white/70">
              Examination Operations
            </span>
          </div>
          <nav className="space-y-0.5">
            <button
              id="nav-faculty-dashboard"
              onClick={() => onSelectTab('faculty_dashboard')}
              className={navItemClass(currentTab === 'faculty_dashboard')}
            >
              <div className="flex items-center gap-2.5 truncate">
                <LayoutDashboard className="w-4 h-4 text-white/80 shrink-0" />
                <span className="truncate">Overview & Table</span>
              </div>
            </button>

            <button
              id="nav-faculty-reviews"
              onClick={() => onSelectTab('faculty_reviews')}
              className={navItemClass(currentTab === 'faculty_reviews')}
            >
              <div className="flex items-center gap-2.5 truncate">
                <ShieldAlert className="w-4 h-4 text-white/80 shrink-0" />
                <span className="truncate">Evaluation Gate</span>
              </div>
              {pendingReviewsCount + integrityFlagsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FEF3C7] text-[#B45309]">
                  {pendingReviewsCount + integrityFlagsCount}
                </span>
              )}
            </button>

            <button
              id="nav-faculty-grievances"
              onClick={() => onSelectTab('faculty_grievances')}
              className={navItemClass(currentTab === 'faculty_grievances')}
            >
              <div className="flex items-center gap-2.5 truncate">
                <LifeBuoy className="w-4 h-4 text-white/80 shrink-0" />
                <span className="truncate">Grievance Board</span>
              </div>
              {grievancesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/20 text-white">
                  {grievancesCount}
                </span>
              )}
            </button>

            <button
              id="nav-faculty-node-graph"
              onClick={() => onSelectTab('faculty_node_graph')}
              className={navItemClass(currentTab === 'faculty_node_graph')}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Activity className="w-4 h-4 text-white/80 shrink-0" />
                <span className="truncate">Agent Pipeline</span>
              </div>
            </button>

            <button
              id="nav-verification-protocol"
              onClick={() => onSelectTab('verification_protocol')}
              className={navItemClass(currentTab === 'verification_protocol')}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Layers className="w-4 h-4 text-white/80 shrink-0" />
                <span className="truncate">Verification Labs</span>
              </div>
            </button>

            {/* Design System Reference Link */}
            <button
              id="nav-design-system"
              onClick={() => onSelectTab('design_system')}
              className={navItemClass(currentTab === 'design_system')}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Palette className="w-4 h-4 text-white/80 shrink-0" />
                <span className="truncate">Design System (Prompt 0)</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* 3. User Card at Bottom */}
      <div className="p-4 border-t border-white/10 bg-[#173B30]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#D6EBDD] text-[#1F4D3F] flex items-center justify-center text-xs font-semibold shrink-0">
            {currentUser.displayName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {currentUser.displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/90 font-medium">
                {currentUser.role === 'author' ? 'COE Author' : 'Faculty'}
              </span>
              <span className="text-[10px] text-white/60 truncate">
                {currentUser.department || 'Academic'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
