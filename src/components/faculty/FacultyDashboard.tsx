import React, { useState } from 'react';
import {
  Search,
  Printer,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  X,
  FileDown,
  Download,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import type { Exam, ExamSubmission, IntegrityLog, Grievance, UserProfile } from '../../types/exam.ts';
import type { ActiveTab } from '../layout/Sidebar.tsx';
import {
  generateFacultyExamSummaryPDF,
  generateFacultyAllExamsReportPDF,
} from '../../utils/pdfGenerator.ts';
import { INITIAL_USERS } from '../../firebase/seedData.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { StatusChip } from '../ui/StatusChip.tsx';
import { Stepper, type StepItem } from '../ui/Stepper.tsx';
import { Tabs, type TabItem } from '../ui/Tabs.tsx';
import { Dialog } from '../ui/Dialog.tsx';

interface FacultyDashboardProps {
  exams: Exam[];
  submissions: ExamSubmission[];
  integrityLogs: IntegrityLog[];
  grievances: Grievance[];
  onNavigate: (tab: ActiveTab) => void;
  onNewExam?: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  exams,
  submissions,
  integrityLogs,
  grievances,
  onNavigate,
  onNewExam,
}) => {
  const [activeTabId, setActiveTabId] = useState<string>('exams_master');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(4); // Default to Faculty Review gate
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [localIntegrityLogs, setLocalIntegrityLogs] = useState<IntegrityLog[]>(integrityLogs);
  const [localSubmissions, setLocalSubmissions] = useState<ExamSubmission[]>(submissions);
  const [examSearch, setExamSearch] = useState<string>('');
  const [activeMenuExamId, setActiveMenuExamId] = useState<string | null>(null);

  // Student cohort records for eligibility
  const [studentCohort, setStudentCohort] = useState<UserProfile[]>(
    INITIAL_USERS.filter((u) => u.role === 'student'),
  );

  // Derived counts for Needs Your Action
  const ambiguousEligibility = studentCohort.filter(
    (s) => s.attendanceRate < 75 || !s.feeCleared,
  );
  const unreviewedIntegrityLogs = localIntegrityLogs.filter((l) => !l.facultyReviewed);
  const pendingSubjectiveSubmissions = localSubmissions.filter(
    (s) => s.status === 'submitted' && !s.facultyApproved,
  );
  const pendingGrievances = grievances.filter(
    (g) => g.status === 'pending' || g.status === 'under_review',
  );

  // Stepper steps
  const stepperSteps: StepItem[] = [
    { id: 'eligibility', label: 'Eligibility', count: 42 },
    {
      id: 'delivery',
      label: 'Delivery',
      count: exams.filter((e) => e.status === 'ongoing' || e.status === 'published').length,
    },
    { id: 'integrity', label: 'Integrity and Auto-grade', count: localSubmissions.length },
    {
      id: 'subjective',
      label: 'Subjective Grading',
      count: localSubmissions.filter((s) => s.subjectiveScore !== undefined).length,
    },
    {
      id: 'review',
      label: 'Faculty Review',
      count: pendingSubjectiveSubmissions.length,
      isHumanGate: true,
    },
    {
      id: 'publish',
      label: 'Publish',
      count: localSubmissions.filter((s) => s.facultyApproved).length,
    },
    { id: 'grievances', label: 'Grievances', count: grievances.length },
  ];

  const handleStepClick = (index: number) => {
    setActiveStepIndex(index);
    if (index === 0) setActiveTabId('eligibility');
    else if (index === 1) setActiveTabId('exams_master');
    else if (index === 2) setActiveTabId('integrity');
    else if (index === 3 || index === 4) setActiveTabId('grading_queue');
    else setActiveTabId('results_grievances');
  };

  const dashboardTabs: TabItem[] = [
    { id: 'exams_master', label: 'Curriculum Exams', count: exams.length },
    {
      id: 'eligibility',
      label: 'Registration & Eligibility',
      count: ambiguousEligibility.length,
      actionNeeded: true,
    },
    {
      id: 'integrity',
      label: 'Integrity Report',
      count: unreviewedIntegrityLogs.length,
      actionNeeded: true,
    },
    {
      id: 'grading_queue',
      label: 'Grading Queue',
      count: pendingSubjectiveSubmissions.length,
      actionNeeded: true,
    },
    {
      id: 'results_grievances',
      label: 'Results & Grievances',
      count: pendingGrievances.length,
      actionNeeded: true,
    },
  ];

  const handleVerifyIntegrityLog = (logId: string) => {
    setLocalIntegrityLogs((prev) =>
      prev.map((l) =>
        l.id === logId
          ? {
              ...l,
              facultyReviewed: true,
              facultyDecision: 'verified_cleared',
              facultyNotes: 'Session review completed by faculty invigilator. Cleared without penalty.',
            }
          : l,
      ),
    );
  };

  const handleApproveSubmission = (subId: string) => {
    setLocalSubmissions((prev) =>
      prev.map((s) =>
        s.id === subId
          ? {
              ...s,
              facultyApproved: true,
              status: 'graded',
              totalScore: s.objectiveScore + (s.subjectiveScore || 0),
            }
          : s,
      ),
    );
  };

  const handleToggleClearance = (studentId: string) => {
    setStudentCohort((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              feeCleared: true,
              attendanceRate: Math.max(s.attendanceRate, 75),
            }
          : s,
      ),
    );
  };

  const triggerExamPdf = (exam: Exam) => {
    generateFacultyExamSummaryPDF({
      exam,
      submissions: localSubmissions,
      facultyName: 'Dr. Eleanor Vance',
    });
    setDownloadNotice(`Generated results summary PDF for ${exam.courseCode}: ${exam.title}`);
    setTimeout(() => setDownloadNotice(null), 5000);
  };

  const triggerMasterPdf = () => {
    generateFacultyAllExamsReportPDF({
      exams,
      submissions: localSubmissions,
      facultyName: 'Dr. Eleanor Vance',
    });
    setDownloadNotice('Generated comprehensive semester examination master audit PDF');
    setTimeout(() => setDownloadNotice(null), 5000);
  };

  const filteredExams = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(examSearch.toLowerCase()) ||
      e.courseCode.toLowerCase().includes(examSearch.toLowerCase()),
  );

  return (
    <div id="faculty-dashboard-view" className="p-6 max-w-[1280px] mx-auto space-y-6 font-sans select-none">
      {/* 3. "Needs your action": ONE white card split into 4 columns with hairline dividers */}
      <section aria-labelledby="action-cards-heading">
        <h2 id="action-cards-heading" className="sr-only">
          Needs your action overview
        </h2>

        <Card className="p-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] grid grid-cols-1 md:grid-cols-4">
          {/* Column 1: Ambiguous eligibility cases */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[#475569]">
                Ambiguous eligibility cases
              </p>
              <div
                className={`text-28 font-bold font-mono tabular-nums mt-2 ${
                  ambiguousEligibility.length > 0 ? 'text-[#F97316]' : 'text-[#0B2545]'
                }`}
              >
                {ambiguousEligibility.length}
              </div>
              <p className="text-xs text-[#475569] mt-1">
                Attendance or fee disputes
              </p>
            </div>
            <button
              onClick={() => setActiveTabId('eligibility')}
              className="mt-4 text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1 cursor-pointer w-fit"
            >
              <span>Review clearances</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Column 2: Integrity flags to review */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[#475569]">
                Integrity flags to review
              </p>
              <div
                className={`text-28 font-bold font-mono tabular-nums mt-2 ${
                  unreviewedIntegrityLogs.length > 0 ? 'text-[#F97316]' : 'text-[#0B2545]'
                }`}
              >
                {unreviewedIntegrityLogs.length}
              </div>
              <p className="text-xs text-[#475569] mt-1">
                Non-punitive session variances
              </p>
            </div>
            <button
              onClick={() => setActiveTabId('integrity')}
              className="mt-4 text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1 cursor-pointer w-fit"
            >
              <span>Audit observation logs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Column 3: Grading drafts to approve */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[#475569]">
                Grading drafts to approve
              </p>
              <div
                className={`text-28 font-bold font-mono tabular-nums mt-2 ${
                  pendingSubjectiveSubmissions.length > 0
                    ? 'text-[#F97316]'
                    : 'text-[#0B2545]'
                }`}
              >
                {pendingSubjectiveSubmissions.length}
              </div>
              <p className="text-xs text-[#475569] mt-1">
                AI rubrics awaiting human sign-off
              </p>
            </div>
            <button
              onClick={() => setActiveTabId('grading_queue')}
              className="mt-4 text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1 cursor-pointer w-fit"
            >
              <span>Open evaluation queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Column 4: Open grievances */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[#475569]">
                Open grievances
              </p>
              <div
                className={`text-28 font-bold font-mono tabular-nums mt-2 ${
                  pendingGrievances.length > 0 ? 'text-[#F97316]' : 'text-[#0B2545]'
                }`}
              >
                {pendingGrievances.length}
              </div>
              <p className="text-xs text-[#475569] mt-1">
                Formal revaluation petitions
              </p>
            </div>
            <button
              onClick={() => setActiveTabId('results_grievances')}
              className="mt-4 text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1 cursor-pointer w-fit"
            >
              <span>Adjudicate petitions</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </section>

      {/* 4. Lifecycle: Horizontal Stepper with circles joined by a line */}
      <section aria-labelledby="lifecycle-heading">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 id="lifecycle-heading" className="text-sm font-semibold text-[#0B2545]">
              Examination Lifecycle & Human Governance
            </h2>
            <span className="text-xs text-[#64748B]">
              Stage 5 represents the mandatory faculty human review gate
            </span>
          </div>

          <Stepper
            steps={stepperSteps}
            activeStepIndex={activeStepIndex}
            onSelectStep={handleStepClick}
          />
        </Card>
      </section>

      {/* Download Notice Notification */}
      {downloadNotice && (
        <div
          role="status"
          className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] text-[#0B2545] rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
            <span className="font-medium">{downloadNotice}</span>
          </div>
          <button
            onClick={() => setDownloadNotice(null)}
            className="text-[#475569] hover:text-[#0B2545] p-1 rounded"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. Tabs: Underline tabs with count pill */}
      <div className="flex items-center justify-between gap-4">
        <Tabs
          tabs={dashboardTabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          className="flex-1"
        />

        <div className="shrink-0 hidden sm:block">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPdfModal(true)}
          >
            <Printer className="w-4 h-4" />
            <span>Official PDFs</span>
          </Button>
        </div>
      </div>

      {/* 6. Tab Contents & Master Table */}
      <div className="space-y-4">
        {/* TAB 1: CURRICULUM EXAMS TABLE */}
        {activeTabId === 'exams_master' && (
          <Card className="p-0 overflow-hidden">
            {/* Table Search & Filter Bar */}
            <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-semibold text-[#0B2545]">
                  Curriculum Assessment Catalog
                </h3>
                <p className="text-xs text-[#475569]">
                  Showing all ratified cohort examinations and passing criteria
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  placeholder="Filter by code or title..."
                  aria-label="Filter exams"
                  className="w-full bg-white text-xs pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#0F4C81] text-[#0B2545] placeholder:text-[#64748B] focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Table: 56px rows, header #F8FAFC with 12px semibold, row hover #F8FAFC, no zebra */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#0B2545] text-xs font-semibold h-[48px]">
                    <th scope="col" className="py-3 px-4 w-28">Code</th>
                    <th scope="col" className="py-3 px-4 min-w-[280px]">Title</th>
                    <th scope="col" className="py-3 px-4 w-32">Format</th>
                    <th scope="col" className="py-3 px-4 w-24">Duration</th>
                    <th scope="col" className="py-3 px-4 w-36">Marks (Total / Pass)</th>
                    <th scope="col" className="py-3 px-4 w-52">Exam Window</th>
                    <th scope="col" className="py-3 px-4 w-32">Status</th>
                    <th scope="col" className="py-3 px-4 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0B2545]">
                  {filteredExams.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#64748B]">
                        No examinations match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredExams.map((exam) => {
                      const statusMap: Record<string, { type: 'success' | 'info' | 'neutral'; label: string }> = {
                        ongoing: { type: 'success', label: 'Ongoing' },
                        published: { type: 'info', label: 'Published' },
                        scheduled: { type: 'neutral', label: 'Scheduled' },
                        draft: { type: 'neutral', label: 'Draft' },
                      };
                      const currentStatus = statusMap[exam.status] || { type: 'neutral', label: exam.status };

                      return (
                        <tr
                          key={exam.id}
                          className="h-[56px] hover:bg-[#F8FAFC] transition-colors"
                        >
                          {/* 1. Code (JetBrains Mono) */}
                          <td className="py-3 px-4 font-mono font-semibold text-[#0B2545] whitespace-nowrap">
                            {exam.courseCode}
                          </td>

                          {/* 2. Full Title with tooltip (Never cut, wraps cleanly) */}
                          <td className="py-3 px-4 font-medium text-[#0B2545]">
                            <span title={exam.title} className="block leading-snug break-words">
                              {exam.title}
                            </span>
                          </td>

                          {/* 3. Format */}
                          <td className="py-3 px-4 text-[#475569] capitalize whitespace-nowrap">
                            {exam.type}
                          </td>

                          {/* 4. Duration */}
                          <td className="py-3 px-4 font-mono tabular-nums text-[#475569] whitespace-nowrap">
                            {exam.durationMinutes} mins
                          </td>

                          {/* 5. Marks: Total / Pass on the same line */}
                          <td className="py-3 px-4 font-mono tabular-nums text-[#0B2545] whitespace-nowrap">
                            <span>{exam.totalMarks}</span>
                            <span className="text-[#94A3B8] mx-1">/</span>
                            <span className="font-semibold text-[#0B2545]">{exam.passingScore}</span>
                          </td>

                          {/* 6. Exam Window: real date and time */}
                          <td className="py-3 px-4 text-[#475569] whitespace-nowrap text-xs">
                            {exam.scheduledDate
                              ? `${exam.scheduledDate}, 09:00 AM – 11:30 AM`
                              : 'Oct 28, 2026, 09:00 AM – 11:30 AM'}
                          </td>

                          {/* 7. Status chip */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusChip status={currentStatus.type} label={currentStatus.label} />
                          </td>

                          {/* 8. Row Action Menu */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1 relative">
                              <button
                                onClick={() => triggerExamPdf(exam)}
                                title="Download Summary PDF"
                                className="p-2 rounded-lg text-[#0B2545] hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81]"
                              >
                                <Printer className="w-4 h-4 text-[#0B2545]" />
                              </button>
                              <button
                                onClick={() => setActiveTabId('grading_queue')}
                                className="px-3 py-1.5 rounded-lg border border-[#0B2545] text-[#0B2545] hover:bg-[#F8FAFC] text-xs font-medium transition-colors cursor-pointer min-h-[44px] flex items-center"
                              >
                                Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 2: REGISTRATION & ELIGIBILITY */}
        {activeTabId === 'eligibility' && (
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-semibold text-[#0B2545]">
                  Candidate Eligibility & Clearance Roster
                </h3>
                <p className="text-xs text-[#475569]">
                  Candidates require minimum 75% attendance and fee clearance to launch examinations
                </p>
              </div>
              <div className="text-xs font-mono text-[#475569]">
                Cleared: {studentCohort.filter((s) => s.attendanceRate >= 75 && s.feeCleared).length} / {studentCohort.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#0B2545] text-xs font-semibold h-[48px]">
                    <th scope="col" className="py-3 px-4">Candidate Name</th>
                    <th scope="col" className="py-3 px-4">USN / Email</th>
                    <th scope="col" className="py-3 px-4">Attendance Rate</th>
                    <th scope="col" className="py-3 px-4">Fee Clearance</th>
                    <th scope="col" className="py-3 px-4">Institutional Status</th>
                    <th scope="col" className="py-3 px-4 text-right">Faculty Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0B2545]">
                  {studentCohort.map((student) => {
                    const isAttOk = student.attendanceRate >= 75;
                    const isFeeOk = student.feeCleared;
                    const isEligible = isAttOk && isFeeOk;

                    return (
                      <tr key={student.id} className="h-[56px] hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#0B2545]">
                          {student.displayName}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#475569]">
                          {student.email}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums">
                          <span
                            className={`font-semibold ${
                              isAttOk ? 'text-[#15803D]' : 'text-[#B91C1C]'
                            }`}
                          >
                            {student.attendanceRate}%
                          </span>
                          <span className="text-[#64748B] ml-1">
                            ({isAttOk ? 'Satisfied' : 'Deficit'})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-medium ${
                              isFeeOk ? 'text-[#15803D]' : 'text-[#B45309]'
                            }`}
                          >
                            {isFeeOk ? 'Cleared' : 'Pending Verification'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusChip
                            status={isEligible ? 'success' : 'warning'}
                            label={isEligible ? 'Cleared to test' : 'Action needed'}
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isEligible ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleToggleClearance(student.id)}
                            >
                              Grant Waiver
                            </Button>
                          ) : (
                            <span className="text-xs text-[#64748B]">Cleared</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: INTEGRITY REPORT (NON-PUNITIVE) */}
        {activeTabId === 'integrity' && (
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-semibold text-[#0B2545]">
                  Proctoring Variance Observation Logs
                </h3>
                <p className="text-xs text-[#475569]">
                  Non-punitive review: observations are logged for human invigilator evaluation without automated penalties.
                </p>
              </div>
              <span className="text-xs font-mono text-[#475569]">
                {unreviewedIntegrityLogs.length} logs awaiting review
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#0B2545] text-xs font-semibold h-[48px]">
                    <th scope="col" className="py-3 px-4">Candidate</th>
                    <th scope="col" className="py-3 px-4">Timestamp</th>
                    <th scope="col" className="py-3 px-4">Variance Category</th>
                    <th scope="col" className="py-3 px-4">Telemetry Context</th>
                    <th scope="col" className="py-3 px-4">Review State</th>
                    <th scope="col" className="py-3 px-4 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0B2545]">
                  {localIntegrityLogs.map((log) => (
                    <tr key={log.id} className="h-[56px] hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#0B2545] whitespace-nowrap">
                        {log.studentName}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#475569] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-[#0B2545]">
                        {log.flagType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-[#475569] max-w-sm truncate">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusChip
                          status={log.facultyReviewed ? 'success' : 'warning'}
                          label={log.facultyReviewed ? 'Verified & cleared' : 'Needs review'}
                        />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {!log.facultyReviewed ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleVerifyIntegrityLog(log.id)}
                          >
                            Verify & Clear
                          </Button>
                        ) : (
                          <span className="text-xs text-[#15803D] font-mono">
                            Cleared by Vance
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 4: GRADING QUEUE (FACULTY HUMAN GATE) */}
        {activeTabId === 'grading_queue' && (
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-semibold text-[#0B2545]">
                  Faculty Evaluation Gate
                </h3>
                <p className="text-xs text-[#475569]">
                  Assistive AI proposes rubric grades; official scorecards require human faculty ratification.
                </p>
              </div>
              <span className="text-xs font-mono text-[#475569]">
                {pendingSubjectiveSubmissions.length} drafts awaiting ratification
              </span>
            </div>

            <div className="divide-y divide-[#E2E8F0]">
              {localSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 hover:bg-[#F8FAFC] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#0B2545] text-sm">
                        {sub.studentName}
                      </span>
                      <span className="text-[#64748B] font-mono text-xs">
                        ({sub.studentEmail})
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#0B2545] font-medium">
                        {sub.examTitle}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#475569] pt-1 font-mono tabular-nums">
                      <span>Objective: <strong className="text-[#0B2545] font-semibold">{sub.objectiveScore} marks</strong></span>
                      <span>AI Subjective: <strong className="text-[#B45309] font-semibold">{sub.subjectiveScore} marks</strong></span>
                      <span>Integrity Score: <strong className="text-[#15803D] font-semibold">{sub.integrityScore}/100</strong></span>
                    </div>

                    <p className="text-xs text-[#475569] pt-1">
                      Rubric rationale: Technical architecture citations validated against syllabus benchmarks.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!sub.facultyApproved ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleApproveSubmission(sub.id)}
                      >
                        Ratify & Approve
                      </Button>
                    ) : (
                      <StatusChip status="success" label="Faculty ratified" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* TAB 5: RESULTS & GRIEVANCES */}
        {activeTabId === 'results_grievances' && (
          <div className="space-y-4">
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div>
                  <h3 className="text-sm font-semibold text-[#0B2545]">
                    Candidate Revaluation Petitions
                  </h3>
                  <p className="text-xs text-[#475569]">
                    Formal post-exam petitions submitted for faculty adjudication
                  </p>
                </div>
                <span className="text-xs font-mono text-[#475569]">
                  {pendingGrievances.length} open petition{pendingGrievances.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="divide-y divide-[#E2E8F0]">
                {grievances.map((g) => (
                  <div
                    key={g.id}
                    className="p-5 hover:bg-[#F8FAFC] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0B2545] text-xs">
                          {g.studentName}
                        </span>
                        <StatusChip
                          status={g.status === 'resolved' ? 'success' : 'warning'}
                          label={g.status.replace(/_/g, ' ')}
                        />
                      </div>
                      <p className="text-xs font-medium text-[#0B2545]">{g.subject}</p>
                      <p className="text-xs text-[#475569]">{g.description}</p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate('faculty_grievances')}
                    >
                      Adjudicate Petition
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-[#0B2545]">
                  Official Semester Results Master Dossier
                </h4>
                <p className="text-xs text-[#475569]">
                  Download institutional grade statistics, cohort scorecards and verification logs.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={triggerMasterPdf}
              >
                <Download className="w-4 h-4" />
                <span>Download Master Audit PDF</span>
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* PDF Generation Modal */}
      <Dialog
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        title="Institutional Examination Reports"
        description="Select official PDF dossier to generate and export"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setShowPdfModal(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#0B2545]">Semester Master Audit Report</p>
              <p className="text-xs text-[#475569] mt-0.5">
                Aggregated statistics, distribution curves and proctor integrity metrics.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                triggerMasterPdf();
                setShowPdfModal(false);
              }}
            >
              Export Master PDF
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#475569]">Individual Course Summaries</p>
            <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl overflow-hidden">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-3 hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-semibold text-[#0B2545] mr-2">
                      {exam.courseCode}
                    </span>
                    <span className="text-[#475569] truncate">{exam.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      triggerExamPdf(exam);
                      setShowPdfModal(false);
                    }}
                  >
                    Generate PDF
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
