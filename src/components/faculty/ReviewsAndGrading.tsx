import React, { useState } from 'react';
import {
  ShieldAlert,
  Award,
  CheckCircle,
  AlertTriangle,
  Bot,
  Sparkles,
  Eye,
  FileText,
  User,
  Clock,
  Check,
  X,
  MessageSquare,
  Send,
  HelpCircle,
  Printer,
  Download,
  FileDown,
  CheckSquare,
  Square,
  Filter,
  Layers,
  ChevronDown,
} from 'lucide-react';
import type {
  Exam,
  ExamSubmission,
  IntegrityLog,
  FacultyDecision,
  SubjectiveGradeProposal,
} from '../../types/exam.ts';
import { updateIntegrityLog, saveSubmission } from '../../firebase/services.ts';
import {
  generateFacultyExamSummaryPDF,
  generateStudentScorecardPDF,
  generateBulkStudentSummariesPDF,
} from '../../utils/pdfGenerator.ts';

interface ReviewsAndGradingProps {
  exams: Exam[];
  submissions: ExamSubmission[];
  integrityLogs: IntegrityLog[];
  onSubmissionsUpdated: (updatedSubmissions: ExamSubmission[]) => void;
  onIntegrityLogsUpdated: (updatedLogs: IntegrityLog[]) => void;
}

export const ReviewsAndGrading: React.FC<ReviewsAndGradingProps> = ({
  exams,
  submissions,
  integrityLogs,
  onSubmissionsUpdated,
  onIntegrityLogsUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'subjective' | 'integrity'>('subjective');
  const [selectedSubId, setSelectedSubId] = useState<string>(submissions[0]?.id || '');
  const [selectedLogId, setSelectedLogId] = useState<string>(integrityLogs[0]?.id || '');

  // Subjective grading state
  const selectedSubmission = submissions.find((s) => s.id === selectedSubId) || submissions[0];
  const [facultyScores, setFacultyScores] = useState<Record<string, number>>({});
  const [facultyFeedback, setFacultyFeedback] = useState<string>('');
  const [isAiGrading, setIsAiGrading] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAnalyzingIntegrity, setIsAnalyzingIntegrity] = useState<boolean>(false);

  // Integrity decision state
  const selectedLog = integrityLogs.find((l) => l.id === selectedLogId) || integrityLogs[0];
  const [facultyDecision, setFacultyDecision] = useState<FacultyDecision>(
    selectedLog?.facultyDecision || 'pending',
  );
  const [facultyNotes, setFacultyNotes] = useState<string>(selectedLog?.facultyNotes || '');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Bulk PDF Export state
  const [selectedSubIdsForBulk, setSelectedSubIdsForBulk] = useState<string[]>([]);
  const [showBulkExportModal, setShowBulkExportModal] = useState<boolean>(false);
  const [isExportingBulk, setIsExportingBulk] = useState<boolean>(false);
  const [bulkExportStatus, setBulkExportStatus] = useState<string | null>(null);
  const [filterCourseCode, setFilterCourseCode] = useState<string>('all');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<'all' | 'approved' | 'pending'>('all');

  // Distinct courses for filtering
  const courseCodes = Array.from(
    new Set(
      exams
        .map((e) => e.courseCode)
        .concat(
          submissions.map((s) => {
            const ex = exams.find((e) => e.id === s.examId);
            return ex?.courseCode || '';
          })
        )
        .filter(Boolean)
    )
  );

  // Filtered submissions based on user selection
  const filteredSubmissions = submissions.filter((sub) => {
    if (filterCourseCode !== 'all') {
      const matchExam = exams.find((e) => e.id === sub.examId);
      if (matchExam?.courseCode !== filterCourseCode) return false;
    }
    if (filterApprovalStatus === 'approved' && !sub.facultyApproved) return false;
    if (filterApprovalStatus === 'pending' && sub.facultyApproved) return false;
    return true;
  });

  const toggleSelectSub = (subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSubIdsForBulk((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleSelectAllVisible = () => {
    if (selectedSubIdsForBulk.length === filteredSubmissions.length) {
      setSelectedSubIdsForBulk([]);
    } else {
      setSelectedSubIdsForBulk(filteredSubmissions.map((s) => s.id));
    }
  };

  const handleSelectApprovedOnly = () => {
    setSelectedSubIdsForBulk(filteredSubmissions.filter((s) => s.facultyApproved).map((s) => s.id));
  };

  const handleSelectPendingOnly = () => {
    setSelectedSubIdsForBulk(filteredSubmissions.filter((s) => !s.facultyApproved).map((s) => s.id));
  };

  // Bulk Export 1: Single Consolidated Dossier PDF (All or Selected students)
  const handleExportConsolidatedDossier = (targetSubs?: ExamSubmission[]) => {
    const listToExport =
      targetSubs ||
      (selectedSubIdsForBulk.length > 0
        ? submissions.filter((s) => selectedSubIdsForBulk.includes(s.id))
        : filteredSubmissions);

    if (listToExport.length === 0) return;

    setIsExportingBulk(true);
    try {
      generateBulkStudentSummariesPDF({
        submissions: listToExport,
        exams,
        facultyName: 'Dr. Eleanor Vance',
        reportTitle: `Faculty Candidate Evaluations Dossier (${listToExport.length} Students)`,
      });
      setActionMessage(`Generated consolidated PDF dossier for ${listToExport.length} candidates!`);
      setTimeout(() => setActionMessage(null), 4500);
      setShowBulkExportModal(false);
    } catch (err) {
      console.error('Error generating bulk PDF dossier:', err);
    } finally {
      setIsExportingBulk(false);
    }
  };

  // Bulk Export 2: Batch Download Individual Student Scorecards
  const handleExportIndividualScorecardsBatch = async (targetSubs?: ExamSubmission[]) => {
    const listToExport =
      targetSubs ||
      (selectedSubIdsForBulk.length > 0
        ? submissions.filter((s) => selectedSubIdsForBulk.includes(s.id))
        : filteredSubmissions);

    if (listToExport.length === 0) return;

    setIsExportingBulk(true);
    try {
      for (let i = 0; i < listToExport.length; i++) {
        const sub = listToExport[i];
        const matchingExam = exams.find((e) => e.id === sub.examId);
        setBulkExportStatus(`Exporting ${i + 1} of ${listToExport.length}: ${sub.studentName}...`);
        generateStudentScorecardPDF({
          submission: sub,
          exam: matchingExam,
        });
        if (i < listToExport.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
      setActionMessage(`Batch exported ${listToExport.length} individual candidate scorecard PDFs!`);
      setTimeout(() => setActionMessage(null), 5000);
      setShowBulkExportModal(false);
    } catch (err) {
      console.error('Error batch exporting PDFs:', err);
    } finally {
      setIsExportingBulk(false);
      setBulkExportStatus(null);
    }
  };

  // Handle approving subjective grades & publishing results
  const handleApproveAndPublish = async () => {
    if (!selectedSubmission) return;

    let updatedSubjectiveScore = 0;
    const updatedEvaluations: Record<string, SubjectiveGradeProposal> = {
      ...selectedSubmission.subjectiveEvaluations,
    };

    // Calculate sum of approved scores
    Object.keys(updatedEvaluations).forEach((qId) => {
      const currentEval = updatedEvaluations[qId];
      const approvedScore = facultyScores[qId] !== undefined ? facultyScores[qId] : currentEval.suggestedScore;
      updatedEvaluations[qId] = {
        ...currentEval,
        facultyApprovedScore: approvedScore,
        status: 'approved',
      };
      updatedSubjectiveScore += approvedScore;
    });

    const targetExam = exams.find((e) => e.id === selectedSubmission.examId);
    const passingScore = targetExam?.passingScore || 25;
    const totalScore = selectedSubmission.objectiveScore + updatedSubjectiveScore;

    const updatedSub: ExamSubmission = {
      ...selectedSubmission,
      subjectiveScore: updatedSubjectiveScore,
      totalScore,
      isPassed: totalScore >= passingScore,
      subjectiveEvaluations: updatedEvaluations,
      facultyApproved: true,
      facultyFeedback: facultyFeedback || 'Subjective responses approved and certified by Faculty Invigilator.',
      status: 'published',
      updatedAt: new Date().toISOString(),
    };

    await saveSubmission(updatedSub);
    const nextList = submissions.map((s) => (s.id === updatedSub.id ? updatedSub : s));
    onSubmissionsUpdated(nextList);

    setActionMessage(`Grades approved and officially published for ${selectedSubmission.studentName}!`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // On-demand AI grading with gemini-3.1-pro-preview High Thinking
  const handleTriggerAiGrading = async (qId: string, answer: string, rubric: string, maxMarks: number) => {
    setIsAiGrading(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/gemini/grade-subjective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionPrompt: 'Explain how Vector Clocks solve the limitation of Lamport Timestamps...',
          studentAnswer: answer,
          rubric,
          maxMarks,
          model: 'gemini-3.1-pro-preview',
          thinkingLevel: 'HIGH',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'AI grading failed');
      }

      const proposal = json.data;
      if (selectedSubmission) {
        const nextEvaluations = {
          ...selectedSubmission.subjectiveEvaluations,
          [qId]: {
            questionId: qId,
            studentAnswer: answer,
            suggestedScore: proposal.suggestedScore || Math.round(maxMarks * 0.8),
            maxMarks,
            reasoning: proposal.reasoning || '',
            rubricBreakdown: proposal.rubricBreakdown || [],
            strengths: proposal.strengths || [],
            weaknesses: proposal.weaknesses || [],
            facultyNote: proposal.facultyNote || 'AI Evaluated with Gemini 3.1 Pro Thinking Mode.',
            status: 'pending_approval' as const,
          },
        };

        const updatedSub: ExamSubmission = {
          ...selectedSubmission,
          subjectiveEvaluations: nextEvaluations,
          subjectiveScore: Object.values(nextEvaluations).reduce((acc: number, ev: SubjectiveGradeProposal) => acc + (ev.suggestedScore || 0), 0),
        };

        await saveSubmission(updatedSub);
        const nextList = submissions.map((s) => (s.id === updatedSub.id ? updatedSub : s));
        onSubmissionsUpdated(nextList);
      }
    } catch (err: any) {
      console.error('AI grading error:', err);
      setActionMessage(`AI Grading Note: ${err.message}`);
    } finally {
      setIsAiGrading(false);
    }
  };

  // AI Integrity forensic analysis
  const handleAnalyzeIntegrityLogs = async (studentLogs: IntegrityLog[]) => {
    setIsAnalyzingIntegrity(true);
    try {
      const res = await fetch('/api/gemini/analyze-integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedLog?.studentName || 'Student',
          examTitle: selectedLog?.examTitle || 'Midterm Exam',
          integrityEvents: studentLogs.map((l) => ({
            timestamp: l.timestamp,
            flagType: l.flagType,
            severity: l.severity,
            details: l.details,
          })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAiAnalysisResult(json.data.analysis);
      }
    } catch (err) {
      console.error('Integrity analysis error:', err);
    } finally {
      setIsAnalyzingIntegrity(false);
    }
  };

  // Save faculty integrity decision
  const handleSaveIntegrityDecision = async () => {
    if (!selectedLog) return;

    await updateIntegrityLog(selectedLog.id, {
      facultyReviewed: true,
      facultyDecision,
      facultyNotes,
    });

    const nextLogs = integrityLogs.map((l) =>
      l.id === selectedLog.id
        ? { ...l, facultyReviewed: true, facultyDecision, facultyNotes }
        : l,
    );
    onIntegrityLogsUpdated(nextLogs);

    setActionMessage(`Integrity decision recorded for ${selectedLog.studentName}: [${facultyDecision.toUpperCase()}]`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div id="reviews-grading-view" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Switcher Tabs */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Faculty Review & Ratification Center</h2>
          <p className="text-xs text-slate-500">
            Adhere to academic governance: auto-grading requires faculty sign-off, and integrity flags require human context.
          </p>
        </div>

        {/* Header Actions: Bulk PDF Export & Tab Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="btn-open-bulk-pdf-export"
            type="button"
            onClick={() => setShowBulkExportModal(true)}
            className="min-h-[44px] flex items-center gap-2 px-3.5 py-2 border border-[#0B2545] text-[#0B2545] bg-white hover:bg-[#F8FAFC] rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-[#0F4C81]" />
            <span>Bulk PDF Export</span>
            {selectedSubIdsForBulk.length > 0 ? (
              <span className="px-1.5 py-0.5 bg-[#E8F0F8] text-[#0F4C81] rounded-full text-xs font-semibold">
                {selectedSubIdsForBulk.length} selected
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] rounded-full text-xs font-mono">
                {submissions.length} total
              </span>
            )}
          </button>

          {/* Tab Buttons */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0]">
            <button
              id="tab-btn-subjective-grades"
              type="button"
              onClick={() => setActiveSubTab('subjective')}
              className={`min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'subjective'
                  ? 'bg-white text-[#0B2545] shadow-2xs border border-[#E2E8F0]'
                  : 'text-[#475569] hover:text-[#0B2545]'
              }`}
            >
              <Award className="w-4 h-4 text-[#0F4C81]" />
              <span>Subjective Grading</span>
              {submissions.filter((s) => !s.facultyApproved).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#B45309]" />
              )}
            </button>

            <button
              id="tab-btn-integrity-audit"
              type="button"
              onClick={() => setActiveSubTab('integrity')}
              className={`min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'integrity'
                  ? 'bg-white text-[#0B2545] shadow-2xs border border-[#E2E8F0]'
                  : 'text-[#475569] hover:text-[#0B2545]'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-[#B91C1C]" />
              <span>Integrity Flags Audit</span>
              {integrityLogs.filter((l) => !l.facultyReviewed).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#B91C1C]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ===================== TAB 1: SUBJECTIVE GRADING APPROVAL ===================== */}
      {activeSubTab === 'subjective' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Submissions List (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            {/* List Header with Counts and Selection */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Candidate Submissions
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                    {filteredSubmissions.length}
                  </span>
                </div>

                <button
                  onClick={() => setShowBulkExportModal(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Bulk Export</span>
                </button>
              </div>

              {/* Filters & Multi-Select Row */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {/* Course Filter */}
                <select
                  value={filterCourseCode}
                  onChange={(e) => setFilterCourseCode(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">All Courses</option>
                  {courseCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterApprovalStatus}
                  onChange={(e) => setFilterApprovalStatus(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Ratified Only</option>
                  <option value="pending">Needs Review</option>
                </select>
              </div>

              {/* Select All Toggle Bar */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 select-none">
                  <input
                    type="checkbox"
                    checked={
                      filteredSubmissions.length > 0 &&
                      selectedSubIdsForBulk.length === filteredSubmissions.length
                    }
                    onChange={handleSelectAllVisible}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Select All Visible ({filteredSubmissions.length})</span>
                </label>

                {selectedSubIdsForBulk.length > 0 && (
                  <button
                    onClick={() => setSelectedSubIdsForBulk([])}
                    className="text-slate-400 hover:text-slate-600 text-[10px]"
                  >
                    Clear ({selectedSubIdsForBulk.length})
                  </button>
                )}
              </div>
            </div>

            {/* Submissions List with Checkbox per Row */}
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredSubmissions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No submissions match the current filters.
                </div>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isSelected = sub.id === selectedSubmission?.id;
                  const isChecked = selectedSubIdsForBulk.includes(sub.id);

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubId(sub.id)}
                      className={`p-3 transition-colors cursor-pointer relative group flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <div
                        onClick={(e) => toggleSelectSub(sub.id, e)}
                        className="pt-1 shrink-0 cursor-pointer"
                        title="Select for bulk PDF export"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div onClick
                          className="rounded border-slate-300 text-emerald-600 focus:ring-0 w-3.5 h-3.5 pointer-events-none"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {sub.studentName}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold uppercase ${
                              sub.facultyApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {sub.facultyApproved ? 'Approved' : 'Needs Review'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate">{sub.examTitle}</p>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5">
                          <span>Obj: <strong className="text-slate-800">{sub.objectiveScore}m</strong></span>
                          <span>Subj: <strong className="text-indigo-600">{sub.subjectiveScore}m</strong></span>
                          <span>Total: <strong className="text-slate-900">{sub.totalScore}/{sub.maxScore}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Sticky Bulk Action Bar if candidates are checked */}
            {selectedSubIdsForBulk.length > 0 && (
              <div className="p-3 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-emerald-900">
                  {selectedSubIdsForBulk.length} selected
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleExportConsolidatedDossier()}
                    disabled={isExportingBulk}
                    title="Export single consolidated PDF dossier for selected candidates"
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] shadow-xs"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Dossier PDF</span>
                  </button>
                  <button
                    onClick={() => handleExportIndividualScorecardsBatch()}
                    disabled={isExportingBulk}
                    title="Download separate PDF scorecard for each selected candidate"
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium text-[11px] shadow-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Batch PDFs</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submission Review & Ratification Details (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedSubmission ? (
              <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-6">
                {/* Candidate Overview Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{selectedSubmission.studentName}</h3>
                      <span className="text-xs font-mono text-slate-500">({selectedSubmission.studentEmail})</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{selectedSubmission.examTitle}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const targetExam = exams.find((e) => e.id === selectedSubmission.examId);
                        generateFacultyExamSummaryPDF({
                          exam: targetExam || exams[0],
                          submissions,
                          facultyName: 'Dr. Eleanor Vance',
                        });
                        setActionMessage(`Downloaded Cohort Summary PDF for ${targetExam?.courseCode || 'Exam'}`);
                        setTimeout(() => setActionMessage(null), 4000);
                      }}
                      title="Download Cohort Results Summary PDF"
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cohort PDF</span>
                    </button>

                    <button
                      onClick={() => {
                        const targetExam = exams.find((e) => e.id === selectedSubmission.examId);
                        generateStudentScorecardPDF({
                          submission: selectedSubmission,
                          exam: targetExam,
                        });
                        setActionMessage(`Downloaded Candidate Scorecard PDF for ${selectedSubmission.studentName}`);
                        setTimeout(() => setActionMessage(null), 4000);
                      }}
                      title="Download Candidate Scorecard PDF"
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Student PDF</span>
                    </button>

                    <div className="text-right ml-1">
                      <div className="text-xs text-slate-400">Total Awarded</div>
                      <div className="text-lg font-black text-indigo-700">
                        {selectedSubmission.totalScore} / {selectedSubmission.maxScore}
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                        selectedSubmission.isPassed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {selectedSubmission.isPassed ? 'Passed' : 'Needs Retest'}
                    </span>
                  </div>
                </div>

                {/* Objective Score Summary */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">Objective Section (Auto-Graded):</span>
                    <span className="text-slate-500 ml-1">Automated validation against key registry</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedSubmission.objectiveScore} marks awarded
                  </div>
                </div>

                {/* Subjective Essay Responses */}
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Subjective Essay Responses & AI-Assisted Rubric Breakdown
                  </h4>

                  {Object.keys(selectedSubmission.answers)
                    .filter((qId) => qId.includes('4') || qId.includes('5') || selectedSubmission.subjectiveEvaluations[qId])
                    .map((qId, idx) => {
                      const answerText = selectedSubmission.answers[qId];
                      const evaluation = selectedSubmission.subjectiveEvaluations[qId];
                      const currentVal = facultyScores[qId] !== undefined
                        ? facultyScores[qId]
                        : evaluation?.facultyApprovedScore !== undefined
                        ? evaluation.facultyApprovedScore
                        : evaluation?.suggestedScore || 0;

                      return (
                        <div
                          key={qId}
                          className="rounded-lg border border-slate-200 bg-slate-50/40 p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-700">
                              Question {idx + 4}: Subjective Analytical Essay
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              Max: {evaluation?.maxMarks || 15} marks
                            </span>
                          </div>

                          {/* Student Raw Text */}
                          <div>
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                              Student Submitted Answer:
                            </span>
                            <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                              {answerText || 'No response recorded.'}
                            </div>
                          </div>

                          {/* AI Rubric Evaluation Card */}
                          {evaluation ? (
                            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  Gemini 3.1 Pro (High Thinking) Pedagogical Evaluation
                                </span>
                                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                                  AI Suggested: {evaluation.suggestedScore} / {evaluation.maxMarks} marks
                                </span>
                              </div>

                              <p className="text-xs text-indigo-900 leading-relaxed">
                                {evaluation.reasoning}
                              </p>

                              {/* Rubric Criteria table */}
                              {evaluation.rubricBreakdown && evaluation.rubricBreakdown.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <span className="text-[10px] font-bold uppercase text-indigo-800 block">
                                    Grading Rubric Assessment:
                                  </span>
                                  <div className="bg-white rounded border border-indigo-200 divide-y divide-slate-100 text-xs">
                                    {evaluation.rubricBreakdown.map((rb, rIdx) => (
                                      <div key={rIdx} className="p-2 flex items-center justify-between gap-2">
                                        <div className="flex-1">
                                          <span className="font-semibold text-slate-800">{rb.criterion}</span>
                                          <p className="text-[11px] text-slate-500">{rb.comment}</p>
                                        </div>
                                        <div className="text-right shrink-0 font-bold text-indigo-700">
                                          {rb.awarded} / {rb.max}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs flex items-center justify-between">
                              <span className="text-amber-800">
                                AI Evaluation not yet computed for this question.
                              </span>
                              <button
                                disabled={isAiGrading}
                                onClick={() =>
                                  handleTriggerAiGrading(
                                    qId,
                                    answerText,
                                    'Rubric: Accuracy, conceptual clarity, depth of real-world citations',
                                    15,
                                  )
                                }
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                              >
                                {isAiGrading ? 'Grading...' : 'Run Gemini Thinking Grader'}
                              </button>
                            </div>
                          )}

                          {/* Faculty Override & Adjustment */}
                          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <label className="text-xs font-bold text-slate-700">
                                Final Faculty Score:
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={evaluation?.maxMarks || 20}
                                  value={currentVal}
                                  onChange={(e) =>
                                    setFacultyScores({
                                      ...facultyScores,
                                      [qId]: Number(e.target.value),
                                    })
                                  }
                                  className="w-16 text-center text-xs font-bold bg-white border border-slate-300 rounded py-1 px-2 text-indigo-900 focus:outline-none focus:border-indigo-500"
                                />
                                <span className="text-xs text-slate-400">/ {evaluation?.maxMarks || 15} marks</span>
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-500 italic">
                              Faculty retains sovereign authority to modify AI proposal.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Final Sign-off Box */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-800 block">
                    Official Faculty Feedback & Endorsement:
                  </label>
                  <textarea
                    rows={2}
                    value={facultyFeedback}
                    onChange={(e) => setFacultyFeedback(e.target.value)}
                    placeholder="Provide constructive feedback for the candidate upon grade release..."
                    className="w-full text-xs bg-white border border-slate-300 rounded p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-500">
                      Publishing notifies student and updates official academic transcript in Firestore.
                    </div>
                    <button
                      id="btn-approve-publish-grades"
                      onClick={handleApproveAndPublish}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold shadow-xs transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Subjective Grades & Publish Results</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-white rounded-lg border border-slate-200">
                Please select a submission on the left to review.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: INTEGRITY AUDIT ===================== */}
      {activeSubTab === 'integrity' && (
        <div className="space-y-6">
          {/* Institutional Integrity Charter Notice */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong>Human-in-the-Loop Integrity Protocol:</strong> Suspected events (tab switches, webcam blurs,
              copy-paste deterrents) are logged purely as investigative telemetry. The system strictly prohibits
              automatic exam cancellation or automatic penalties. Faculty must assess intent, environmental accidents,
              and context before recording any administrative decision.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Logs List (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Suspected Integrity Telemetry
                </span>
                <button
                  onClick={() => handleAnalyzeIntegrityLogs(integrityLogs)}
                  disabled={isAnalyzingIntegrity}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>{isAnalyzingIntegrity ? 'Analyzing...' : 'AI Forensic Summary'}</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {integrityLogs.map((log) => {
                  const isSelected = log.id === selectedLog?.id;
                  return (
                    <button
                      key={log.id}
                      onClick={() => {
                        setSelectedLogId(log.id);
                        setFacultyDecision(log.facultyDecision);
                        setFacultyNotes(log.facultyNotes || '');
                      }}
                      className={`w-full text-left p-3.5 transition-colors block ${
                        isSelected
                          ? 'bg-rose-50/60 border-l-4 border-rose-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{log.studentName}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            log.severity === 'high'
                              ? 'bg-rose-600 text-white'
                              : log.severity === 'medium'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-indigo-700 font-semibold mb-0.5">
                        {log.flagType.replace(/_/g, ' ')}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{log.details}</p>
                      <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-400">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span
                          className={`capitalize font-medium ${
                            log.facultyReviewed ? 'text-emerald-600' : 'text-rose-600 font-bold'
                          }`}
                        >
                          {log.facultyReviewed ? log.facultyDecision : 'Pending Audit'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Decision & Forensic Details (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {aiAnalysisResult && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>AI Forensic Integrity Synthesis</span>
                  </div>
                  <div className="whitespace-pre-line leading-relaxed">{aiAnalysisResult}</div>
                </div>
              )}

              {selectedLog ? (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-xs font-mono text-slate-400">Incident #{selectedLog.id}</span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedLog.studentName}</h3>
                      <p className="text-xs text-slate-500">{selectedLog.examTitle}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                        selectedLog.severity === 'high'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {selectedLog.severity} Risk Indicator
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        Captured Event Telemetry:
                      </span>
                      <div className="font-semibold text-slate-800 text-sm">
                        {selectedLog.flagType.replace(/_/g, ' ')}
                      </div>
                      <p className="text-slate-600 mt-1">{selectedLog.details}</p>
                      <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Logged at: {new Date(selectedLog.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Faculty Human Decision Controls */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Faculty Adjudication & Action Record
                      </h4>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Adjudication Status:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(
                            [
                              { val: 'cleared', label: 'Cleared (False Alarm)', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
                              { val: 'warning', label: 'Issue Advisory', color: 'border-amber-500 text-amber-700 bg-amber-50' },
                              { val: 'penalty_recommended', label: 'Refer to Committee', color: 'border-rose-500 text-rose-700 bg-rose-50' },
                              { val: 'no_action', label: 'No Action (Archive)', color: 'border-slate-500 text-slate-700 bg-slate-100' },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => setFacultyDecision(opt.val)}
                              className={`p-2 rounded text-xs font-semibold border text-center transition-all ${
                                facultyDecision === opt.val
                                  ? `${opt.color} shadow-xs ring-1 ring-offset-1`
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Faculty Reviewer Notes & Findings:
                        </label>
                        <textarea
                          rows={3}
                          value={facultyNotes}
                          onChange={(e) => setFacultyNotes(e.target.value)}
                          placeholder="Document your evaluation of student explanation, camera feed review, or environmental factors..."
                          className="w-full text-xs bg-white border border-slate-300 rounded p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button
                        id="btn-save-integrity-decision"
                        onClick={handleSaveIntegrityDecision}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                      >
                        Record Formal Adjudication into Institutional Log
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-white rounded-lg border border-slate-200">
                  Select an integrity event from the list to audit.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== BULK PDF EXPORT MODAL ===================== */}
      {showBulkExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Bulk PDF Export • Candidate Submissions & Scores</h3>
                  <p className="text-[11px] text-slate-400">
                    Faculty Review & Evaluation Gate • Individual Objective & Subjective Breakdown Dossiers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkExportModal(false)}
                disabled={isExportingBulk}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Live Export Status Banner */}
              {isExportingBulk && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <div className="text-xs text-emerald-900 font-semibold">
                    {bulkExportStatus || 'Compiling student submissions and preparing high-resolution PDF document...'}
                  </div>
                </div>
              )}

              {/* Selection & Scope Control */}
              {(() => {
                const targetSubs =
                  selectedSubIdsForBulk.length > 0
                    ? submissions.filter((s) => selectedSubIdsForBulk.includes(s.id))
                    : filteredSubmissions;
                const totalTarget = targetSubs.length;
                const passedCount = targetSubs.filter((s) => s.isPassed).length;
                const passRate = totalTarget > 0 ? Math.round((passedCount / totalTarget) * 100) : 0;
                const avgScore =
                  totalTarget > 0
                    ? (targetSubs.reduce((a, b) => a + b.totalScore, 0) / totalTarget).toFixed(1)
                    : '0';
                const approvedCount = targetSubs.filter((s) => s.facultyApproved).length;

                return (
                  <div className="space-y-4">
                    {/* Filter & Selection Bar */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            Export Scope:
                          </span>
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                            {selectedSubIdsForBulk.length > 0
                              ? `${selectedSubIdsForBulk.length} Specific Candidates Selected`
                              : `All ${filteredSubmissions.length} Filtered Candidates`}
                          </span>
                        </div>

                        {/* Quick Selection Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedSubIdsForBulk(filteredSubmissions.map((s) => s.id))}
                            className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-medium"
                          >
                            Select All ({filteredSubmissions.length})
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectApprovedOnly}
                            className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-emerald-700 font-medium"
                          >
                            Only Ratified
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectPendingOnly}
                            className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-amber-700 font-medium"
                          >
                            Only Pending
                          </button>
                          {selectedSubIdsForBulk.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedSubIdsForBulk([])}
                              className="px-2 py-1 text-slate-500 hover:text-slate-800 underline text-[11px]"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Cohort Stats Ribbon */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 text-xs">
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total In Export</span>
                          <span className="text-base font-bold text-slate-900">{totalTarget}</span>
                          <span className="text-[10px] text-slate-500 block">{approvedCount} Ratified</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Average Score</span>
                          <span className="text-base font-bold text-indigo-700">{avgScore} marks</span>
                          <span className="text-[10px] text-slate-500 block">Class composite</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pass Rate</span>
                          <span className="text-base font-bold text-emerald-600">{passRate}%</span>
                          <span className="text-[10px] text-slate-500 block">{passedCount} of {totalTarget}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Academic Lead</span>
                          <span className="text-xs font-bold text-slate-800 truncate block mt-1">Dr. Eleanor Vance</span>
                          <span className="text-[10px] text-slate-500 block">Invigilation Sign-Off</span>
                        </div>
                      </div>
                    </div>

                    {/* TWO EXPORT OPTIONS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option 1: Consolidated Single Dossier PDF */}
                      <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 hover:border-indigo-400 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                              <Layers className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">
                                Option A: Consolidated Master Dossier (Single PDF)
                              </h4>
                              <span className="text-[10px] font-semibold text-indigo-600 uppercase">
                                Recommended for Archiving & External Audit
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            Compiles all {totalTarget} candidate evaluations into a single publication-quality multi-page PDF booklet. Includes a cover roster index on Page 1, followed by dedicated 1-page individual summaries for every student featuring:
                          </p>
                          <ul className="text-[10px] text-slate-500 list-disc list-inside space-y-0.5">
                            <li>Objective MCQ auto-grading verification breakdown</li>
                            <li>Subjective essay rubric scores, criteria & evaluator reasoning</li>
                            <li>Proctoring integrity compliance index & anomaly audit</li>
                            <li>Digital cryptographic seal & faculty certification line</li>
                          </ul>
                        </div>

                        <button
                          id="modal-btn-export-dossier"
                          onClick={() => handleExportConsolidatedDossier(targetSubs)}
                          disabled={isExportingBulk || totalTarget === 0}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Generate Consolidated Dossier ({totalTarget} Students)</span>
                        </button>
                      </div>

                      {/* Option 2: Batch Individual Student PDFs */}
                      <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                              <Download className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">
                                Option B: Batch Individual Student Scorecards
                              </h4>
                              <span className="text-[10px] font-semibold text-emerald-700 uppercase">
                                Separate PDF Per Candidate
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            Sequentially generates and triggers individual browser downloads for each student's official transcript PDF (e.g. <span className="font-mono text-slate-800">CS402_Scorecard_Alex_Chen.pdf</span>):
                          </p>
                          <ul className="text-[10px] text-slate-500 list-disc list-inside space-y-0.5">
                            <li>Separate PDF transcripts for direct email / student distribution</li>
                            <li>Sequential download pipeline with anti-popup block throttling</li>
                            <li>Live progress tracker showing candidate by candidate completion</li>
                            <li>Full rubric details, integrity status, and signature seal</li>
                          </ul>
                        </div>

                        <button
                          id="modal-btn-export-batch-individual"
                          onClick={() => handleExportIndividualScorecardsBatch(targetSubs)}
                          disabled={isExportingBulk || totalTarget === 0}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download {totalTarget} Individual Scorecards</span>
                        </button>
                      </div>
                    </div>

                    {/* Roster Table Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Candidate Roster Table Preview ({targetSubs.length})
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Toggle checkboxes to include/exclude specific students
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                            <tr>
                              <th className="p-2 w-8 text-center">Inc</th>
                              <th className="p-2">Roll No</th>
                              <th className="p-2">Candidate Name</th>
                              <th className="p-2">Course</th>
                              <th className="p-2 text-center">Objective</th>
                              <th className="p-2 text-center">Subjective</th>
                              <th className="p-2 text-center">Total</th>
                              <th className="p-2 text-center">Result</th>
                              <th className="p-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredSubmissions.map((sub) => {
                              const isChecked = selectedSubIdsForBulk.length === 0 || selectedSubIdsForBulk.includes(sub.id);
                              const matchExam = exams.find((e) => e.id === sub.examId);

                              return (
                                <tr
                                  key={sub.id}
                                  onClick={(e) => toggleSelectSub(sub.id, e)}
                                  className={`hover:bg-slate-50 cursor-pointer ${
                                    isChecked ? 'bg-indigo-50/20' : 'opacity-60'
                                  }`}
                                >
                                  <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setSelectedSubIdsForBulk((prev) => {
                                          if (prev.length === 0) {
                                            // When moving from "all" to selective, select all except this one
                                            return filteredSubmissions.map((s) => s.id).filter((id) => id !== sub.id);
                                          }
                                          return prev.includes(sub.id)
                                            ? prev.filter((id) => id !== sub.id)
                                            : [...prev, sub.id];
                                        });
                                      }}
                                      className="rounded border-slate-300 text-emerald-600 focus:ring-0 w-3.5 h-3.5"
                                    />
                                  </td>
                                  <td className="p-2 font-mono text-[11px] text-slate-600">
                                    {sub.studentId.toUpperCase()}
                                  </td>
                                  <td className="p-2 font-semibold text-slate-900">{sub.studentName}</td>
                                  <td className="p-2 text-[11px] text-slate-600">{matchExam?.courseCode || 'EXAM'}</td>
                                  <td className="p-2 text-center font-medium text-slate-700">{sub.objectiveScore}m</td>
                                  <td className="p-2 text-center font-medium text-indigo-700">{sub.subjectiveScore}m</td>
                                  <td className="p-2 text-center font-bold text-slate-900">
                                    {sub.totalScore}/{sub.maxScore}
                                  </td>
                                  <td className="p-2 text-center">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        sub.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {sub.isPassed ? 'PASS' : 'FAIL'}
                                    </span>
                                  </td>
                                  <td className="p-2 text-center">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                        sub.facultyApproved ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {sub.facultyApproved ? 'Ratified' : 'Draft'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                All exported PDFs include academic audit metadata, rubrics, and digital faculty sign-off.
              </span>
              <button
                type="button"
                onClick={() => setShowBulkExportModal(false)}
                disabled={isExportingBulk}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
