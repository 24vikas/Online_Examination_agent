import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Award,
  Sparkles,
  Users,
  Search,
  Lock,
  Unlock,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Layers,
  Cpu,
  RefreshCw,
  Building2,
  Globe,
  Sliders,
} from 'lucide-react';
import type { Exam, UserProfile } from '../../types/exam.ts';
import { updateExam } from '../../firebase/services.ts';
import { CoeDocumentAgentStudio } from './CoeDocumentAgentStudio.tsx';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { StatusChip } from '../ui/StatusChip.tsx';

interface CoeDashboardProps {
  exams: Exam[];
  currentUser: UserProfile;
  onNavigateToTab: (tab: any) => void;
  onRefreshExams: () => void;
  onSwitchUser?: (user: UserProfile) => void;
}

export const CoeDashboard: React.FC<CoeDashboardProps> = ({
  exams,
  currentUser,
  onNavigateToTab,
  onRefreshExams,
  onSwitchUser,
}) => {
  const [coeViewMode, setCoeViewMode] = useState<'document_agent' | 'statutory_cohorts'>('document_agent');
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [approvalNote, setApprovalNote] = useState<string>('Standard institutional examination blueprint verified against UGC & ABET academic regulations.');
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const selectedExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const handleRatifyExam = async (examId: string, approve: boolean) => {
    setIsApproving(true);
    setSuccessBanner(null);
    try {
      await updateExam(examId, {
        coeApproved: approve,
        coeApprovedBy: currentUser.displayName,
        coeApprovedAt: new Date().toISOString(),
        status: approve ? 'published' : 'draft',
      });
      setSuccessBanner(
        approve
          ? `Exam "${selectedExam?.title}" formally ratified and released to Student Registration Gate.`
          : `Exam "${selectedExam?.title}" reverted to Draft for faculty revision.`
      );
      onRefreshExams();
    } catch (err: any) {
      console.error('COE ratification error:', err);
    } finally {
      setIsApproving(false);
    }
  };

  const totalExams = exams.length;
  const approvedExams = exams.filter((e) => e.coeApproved).length;
  const pendingApproval = exams.filter((e) => !e.coeApproved).length;

  return (
    <div id="coe-dashboard-view" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Primary Mode Selector */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <button
            id="btn-mode-document-agent"
            type="button"
            onClick={() => setCoeViewMode('document_agent')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              coeViewMode === 'document_agent'
                ? 'bg-[#0B2545] text-white'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0B2545]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#F97316]" />
            <span>Document Processing, Vector RAG & PDF Appender Agent</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[#E8F0F8] text-[#0F4C81]">
              Specialized pipeline
            </span>
          </button>

          <button
            id="btn-mode-statutory-cohorts"
            type="button"
            onClick={() => setCoeViewMode('statutory_cohorts')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              coeViewMode === 'statutory_cohorts'
                ? 'bg-[#0B2545] text-white'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0B2545]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#0F4C81]" />
            <span>Statutory Exam Cohort Ratification</span>
          </button>
        </div>

        <span className="text-xs text-[#475569] font-mono hidden md:inline">
          Office of the Controller of Examinations • KLE Tech
        </span>
      </div>

      {coeViewMode === 'document_agent' ? (
        <CoeDocumentAgentStudio currentUser={currentUser} onSwitchUser={onSwitchUser} />
      ) : (
        <>
          {/* Top Banner */}
          <Card className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#E8F0F8] text-[#0F4C81] border border-[#CBD5E1]">
                  Exam Author & Controller Portal
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Statutory Ratification Authority
                </span>
              </div>
              <h2 className="text-xl font-semibold text-[#0B2545] tracking-tight">
                Office of the Controller of Examinations (COE)
              </h2>
              <p className="text-xs text-[#475569] mt-1 max-w-2xl leading-relaxed">
                Authoritative examination governance center. Standardize curriculum blueprints, verify Deep Search question pools, ratify faculty grading rubrics, and publish official student results.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="grid grid-cols-3 gap-0 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] shrink-0 divide-x divide-[#E2E8F0]">
              <div className="text-center px-4 py-3">
                <span className="text-xs text-[#475569] block font-mono">Total cohorts</span>
                <span className="text-lg font-bold text-[#0B2545]">{totalExams}</span>
              </div>
              <div className="text-center px-4 py-3">
                <span className="text-xs text-[#475569] block font-mono">Ratified</span>
                <span className="text-lg font-bold text-[#15803D]">{approvedExams}</span>
              </div>
              <div className="text-center px-4 py-3">
                <span className="text-xs text-[#475569] block font-mono">Awaiting COE</span>
                <span className={`text-lg font-bold ${pendingApproval > 0 ? 'text-[#F97316]' : 'text-[#0B2545]'}`}>
                  {pendingApproval}
                </span>
              </div>
            </div>
          </Card>

          {successBanner && (
            <div className="p-3.5 bg-[#DCFCE7] border border-[#BBF7D0] text-[#15803D] rounded-lg text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Exam Cohort Blueprint Inspection & Approval Gate (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Examination Blueprint Approval Gate</h3>
                <p className="text-xs text-slate-500">
                  Select an examination to audit academic parameters and authorize release
                </p>
              </div>

              {/* Exam Selector */}
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.courseCode}: {ex.title} {ex.coeApproved ? '✓ Ratified' : '⚠️ Pending'}
                  </option>
                ))}
              </select>
            </div>

            {selectedExam && (
              <div className="space-y-4">
                {/* Status Card */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                      Course & Examination
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {selectedExam.courseCode} — {selectedExam.title}
                    </h4>
                    <p className="text-xs text-slate-600">
                      Faculty Author: <strong>{selectedExam.facultyName || 'Dr. Eleanor Vance'}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    {selectedExam.coeApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ratified by COE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Pending Ratification
                      </span>
                    )}
                    {selectedExam.coeApprovedAt && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Signed: {new Date(selectedExam.coeApprovedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Key Blueprint Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 uppercase block">Duration</span>
                    <span className="text-sm font-bold text-slate-900">{selectedExam.durationMinutes} min</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 uppercase block">Total Marks</span>
                    <span className="text-sm font-bold text-slate-900">{selectedExam.totalMarks} marks</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 uppercase block">Passing Mark</span>
                    <span className="text-sm font-bold text-slate-900">{selectedExam.passingScore} ({Math.round((selectedExam.passingScore / selectedExam.totalMarks) * 100)}%)</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 uppercase block">Format</span>
                    <span className="text-sm font-bold text-slate-900 capitalize">{selectedExam.type}</span>
                  </div>
                </div>

                {/* Proctoring Protocol Verification */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    COE Proctoring Security Requirements
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Webcam Verification: <strong>{selectedExam.proctoringRules?.requireWebcam ? 'Mandatory' : 'Optional'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Fullscreen Lock: <strong>{selectedExam.proctoringRules?.fullscreenRequired ? 'Enforced' : 'Off'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Max Tab Switches: <strong>{selectedExam.proctoringRules?.maxTabSwitches ?? 3} allowed</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Clipboard Intercept: <strong>{selectedExam.proctoringRules?.blockCopyPaste ? 'Active' : 'Disabled'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Ratification Sign-off Action */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Official COE Ratification Minute / Memorandum:
                    </label>
                    <textarea
                      rows={2}
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      className="w-full text-xs font-sans bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onNavigateToTab('faculty_syllabus_rag')}
                    >
                      <Sparkles className="w-4 h-4 text-[#0F4C81]" />
                      <span>Inspect RAG Question Bank</span>
                    </Button>

                    <div className="flex items-center gap-2">
                      {selectedExam.coeApproved ? (
                        <Button
                          variant="secondary"
                          disabled={isApproving}
                          onClick={() => handleRatifyExam(selectedExam.id, false)}
                        >
                          Revoke Approval
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          disabled={isApproving}
                          onClick={() => handleRatifyExam(selectedExam.id, true)}
                        >
                          {isApproving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>Ratify & Authorize Exam Release</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Author Tools & Standards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Nav Card */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              COE Examination Author Tools
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('faculty_syllabus_rag')}
                className="w-full p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    Deep Search & RAG Question Studio
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Synthesize questions grounded in IEEE/ACM curriculum with Google Deep Search
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTab('faculty_reviews')}
                className="w-full p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    Review & Subjective Gradebook Gate
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Bulk export verified student transcripts, audit integrity logs, and approve grades
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTab('verification_protocol')}
                className="w-full p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-600" />
                    Pre-Deployment Verification Suite
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Run automated system diagnostics across Labs 1-8 before final graduation releases
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
              </button>
            </div>
          </div>

          {/* Academic Governance Guidelines Card */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Statutory COE Directives
            </span>
            <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4">
              <li>
                <strong>Eligibility Threshold:</strong> Students with attendance below 75% or unapproved bursar fees are strictly barred from hall tickets.
              </li>
              <li>
                <strong>Human-in-the-Loop:</strong> AI subjective grades and proctoring flags are strictly non-punitive proposals until faculty and COE confirm.
              </li>
              <li>
                <strong>Two-Tier Isolation:</strong> Live exam keystrokes and student ephemeral state cannot leak into shared question indexes.
              </li>
            </ul>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
