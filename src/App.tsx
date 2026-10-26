/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, type ActiveTab } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { StudentHeader } from './components/layout/StudentHeader.tsx';
import { FallbackDataBanner } from './components/layout/FallbackDataBanner.tsx';
import { OperationsSidePanel } from './components/layout/OperationsSidePanel.tsx';
import { CoeDashboard } from './components/coe/CoeDashboard.tsx';
import { FacultyDashboard } from './components/faculty/FacultyDashboard.tsx';
import { QuestionGenerator } from './components/faculty/QuestionGenerator.tsx';
import { ExamConfigurator } from './components/faculty/ExamConfigurator.tsx';
import { ReviewsAndGrading } from './components/faculty/ReviewsAndGrading.tsx';
import { NodeGraphMonitor } from './components/faculty/NodeGraphMonitor.tsx';
import { FacultyGrievanceQueue } from './components/faculty/FacultyGrievanceQueue.tsx';
import { StudentEligibilityAndExams } from './components/student/StudentEligibilityAndExams.tsx';
import { AcademicStudyPortal } from './components/student/AcademicStudyPortal.tsx';
import { ExamRunner } from './components/student/ExamRunner.tsx';
import { PracticeTests } from './components/student/PracticeTests.tsx';
import { StudentScorecard } from './components/student/StudentScorecard.tsx';
import { GrievanceTracker } from './components/student/GrievanceTracker.tsx';
import { PreDeploymentVerification } from './components/verification/PreDeploymentVerification.tsx';
import { AcademicAIChatModal } from './components/chat/AcademicAIChatModal.tsx';
import { SystemOperationsModal } from './components/layout/SystemOperationsModal.tsx';
import { AuthModal } from './components/layout/AuthModal.tsx';
import { CandidateOnboardingModal } from './components/student/CandidateOnboardingModal.tsx';
import { DesignSystemShowcase } from './components/ui/DesignSystemShowcase.tsx';
import { ToastContainer } from './components/ui/Toast.tsx';
import type {
  Exam,
  ExamSubmission,
  IntegrityLog,
  Grievance,
  UserProfile,
  Registration,
} from './types/exam.ts';
import {
  INITIAL_USERS,
  INITIAL_EXAMS,
  INITIAL_SUBMISSIONS,
  INITIAL_INTEGRITY_LOGS,
  INITIAL_GRIEVANCES,
} from './firebase/seedData.ts';
import {
  getExams,
  getSubmissions,
  getIntegrityLogs,
  getGrievances,
  getRegistrations,
  ensureFirebaseAuth,
} from './firebase/services.ts';
import type { ToastPayload } from './utils/toast.ts';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]); // Default to Dr. Vance (Faculty)
  const [currentTab, setCurrentTab] = useState<ActiveTab>('faculty_dashboard');

  // Application Data States
  const [exams, setExams] = useState<Exam[]>(INITIAL_EXAMS);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(INITIAL_SUBMISSIONS);
  const [integrityLogs, setIntegrityLogs] = useState<IntegrityLog[]>(INITIAL_INTEGRITY_LOGS);
  const [grievances, setGrievances] = useState<Grievance[]>(INITIAL_GRIEVANCES);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [toasts, setToasts] = useState<ToastPayload[]>([]);
  const [isSimulatedData, setIsSimulatedData] = useState<boolean>(true);

  // Search & Navigation in Header
  const [headerSearch, setHeaderSearch] = useState<string>('');

  // Modals & Active Flows
  const [activeExamToRun, setActiveExamToRun] = useState<Exam | null>(null);
  const [onboardingExam, setOnboardingExam] = useState<Exam | null>(null);
  const [activeExamSession, setActiveExamSession] = useState<{
    exam: Exam;
    initialStream: MediaStream | null;
    candidatePhotoUrl: string;
    verificationToken: string;
    isVirtualCamera?: boolean;
  } | null>(null);

  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);
  const [isSystemOpsOpen, setIsSystemOpsOpen] = useState<boolean>(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [chatRole, setChatRole] = useState<'student_advisor' | 'faculty_invigilator' | 'grievance_mediator'>('faculty_invigilator');
  const [grievanceTargetSub, setGrievanceTargetSub] = useState<ExamSubmission | null>(null);

  // Global Toast event listener
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const custom = e as CustomEvent<ToastPayload>;
      if (custom.detail) {
        const t = custom.detail;
        setToasts((prev) => [...prev, t]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== t.id));
        }, t.durationMs || 5000);
      }
    };
    window.addEventListener('academic-app-toast', handleToastEvent);
    return () => window.removeEventListener('academic-app-toast', handleToastEvent);
  }, []);

  // Initial data load from Firestore / LocalStorage
  useEffect(() => {
    async function loadData() {
      try {
        await ensureFirebaseAuth(currentUser);

        const [loadedExams, loadedSubs, loadedLogs, loadedGrievances, loadedRegs] = await Promise.all([
          getExams(),
          getSubmissions(),
          getIntegrityLogs(),
          getGrievances(),
          getRegistrations(),
        ]);

        if (loadedExams.length > 0) setExams(loadedExams);
        if (loadedSubs.length > 0) setSubmissions(loadedSubs);
        if (loadedLogs.length > 0) setIntegrityLogs(loadedLogs);
        if (loadedGrievances.length > 0) setGrievances(loadedGrievances);
        if (loadedRegs.length > 0) setRegistrations(loadedRegs);

        // Check if data is populated from mock or live database
        setIsSimulatedData(true);
      } catch (err) {
        console.warn('Initial data load warning:', err);
        setIsSimulatedData(true);
      }
    }
    loadData();
  }, []);

  // Sync role when user switches
  const handleSwitchUser = (user: UserProfile) => {
    setCurrentUser(user);
    ensureFirebaseAuth(user).catch(() => {});
    if (user.role === 'author') {
      setCurrentTab('coe_dashboard');
      setChatRole('faculty_invigilator');
    } else if (user.role === 'faculty') {
      setCurrentTab('faculty_dashboard');
      setChatRole('faculty_invigilator');
    } else {
      setCurrentTab('student_exams');
      setChatRole('student_advisor');
    }
  };

  const handleOpenAIChat = (role?: 'student_advisor' | 'faculty_invigilator' | 'grievance_mediator') => {
    if (role) setChatRole(role);
    setIsAIChatOpen(true);
  };

  const handleStartExamOnboarding = (exam: Exam) => {
    setOnboardingExam(exam);
  };

  const handleProceedFromOnboarding = (data: {
    candidatePhotoUrl: string;
    verificationToken: string;
    stream: MediaStream | null;
    isVirtualCamera?: boolean;
  }) => {
    if (onboardingExam) {
      setActiveExamSession({
        exam: onboardingExam,
        initialStream: data.stream,
        candidatePhotoUrl: data.candidatePhotoUrl,
        verificationToken: data.verificationToken,
        isVirtualCamera: data.isVirtualCamera,
      });
      setOnboardingExam(null);
    }
  };

  const handleFinishExam = (submission: ExamSubmission) => {
    setSubmissions((prev) => [submission, ...prev.filter((s) => s.id !== submission.id)]);
    setActiveExamSession(null);
    setActiveExamToRun(null);
    setCurrentTab('student_scorecard');
  };

  const handleOpenGrievanceWithSub = (sub: ExamSubmission) => {
    setGrievanceTargetSub(sub);
    setCurrentTab('student_grievances');
  };

  // Counts for badges
  const pendingSubjectiveCount = submissions.filter((s) => !s.facultyApproved).length;
  const unreviewedIntegrityCount = integrityLogs.filter((l) => !l.facultyReviewed).length;
  const pendingGrievancesCount = grievances.filter((g) => g.status === 'pending' || g.status === 'under_review').length;

  // Active distraction-free exam taking mode
  if (activeExamSession) {
    return (
      <ExamRunner
        exam={activeExamSession.exam}
        currentUser={currentUser}
        initialStream={activeExamSession.initialStream}
        candidatePhotoUrl={activeExamSession.candidatePhotoUrl}
        verificationToken={activeExamSession.verificationToken}
        isVirtualCamera={activeExamSession.isVirtualCamera}
        onFinishExam={handleFinishExam}
        onExit={() => setActiveExamSession(null)}
      />
    );
  }

  if (activeExamToRun) {
    return (
      <ExamRunner
        exam={activeExamToRun}
        currentUser={currentUser}
        onFinishExam={handleFinishExam}
        onExit={() => setActiveExamToRun(null)}
      />
    );
  }

  // DEDICATED STUDENT LAYOUT (COE/Faculty navigation completely excluded)
  if (currentUser.role === 'student') {
    return (
      <div id="student-portal-root" className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased select-none">
        {/* Persistent Simulated Data Banner */}
        <FallbackDataBanner isSimulated={isSimulatedData} />

        {/* Dedicated Student Header */}
        <StudentHeader
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          onOpenAIChat={() => handleOpenAIChat('student_advisor')}
          onOpenAuthModal={() => setIsAuthOpen(true)}
          grievancesCount={pendingGrievancesCount}
        />

        {/* Student Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          {currentTab === 'student_exams' && (
            <StudentEligibilityAndExams
              currentUser={currentUser}
              exams={exams.filter((e) => !e.isMockOrPractice)}
              registrations={registrations}
              submissions={submissions}
              onStartExam={(exam) => handleStartExamOnboarding(exam)}
              onOpenGrievance={handleOpenGrievanceWithSub}
              onRegistrationsUpdated={setRegistrations}
            />
          )}

          {(currentTab === 'student_testing_hall' || currentTab === 'student_practice') && (
            <PracticeTests
              practiceExams={exams.filter((e) => e.status === 'published' || e.isMockOrPractice)}
              currentUser={currentUser}
              onStartPracticeExam={(exam) => handleStartExamOnboarding(exam)}
              onSubmissionComplete={handleFinishExam}
            />
          )}

          {currentTab === 'student_scorecard' && (
            <StudentScorecard
              currentUser={currentUser}
              submissions={submissions}
              exams={exams}
              onOpenGrievance={handleOpenGrievanceWithSub}
            />
          )}

          {currentTab === 'student_grievances' && (
            <GrievanceTracker
              currentUser={currentUser}
              submissions={submissions}
              grievances={grievances}
              onGrievanceAdded={(newGrievance) =>
                setGrievances((prev) => [newGrievance, ...prev])
              }
              preselectedSubmission={grievanceTargetSub}
            />
          )}

          {currentTab === 'student_study_hub' && (
            <AcademicStudyPortal
              userRole={currentUser.role}
              initialCourseCode="CS-301"
              onNavigateToExam={(examId) => {
                const targetExam = exams.find((e) => e.id === examId);
                if (targetExam) handleStartExamOnboarding(targetExam);
              }}
            />
          )}
        </main>

        {/* Candidate Onboarding & Proctored Verification Gate Modal */}
        {onboardingExam && (
          <CandidateOnboardingModal
            isOpen={!!onboardingExam}
            onClose={() => setOnboardingExam(null)}
            exam={onboardingExam}
            currentUser={currentUser}
            onProceedToExam={handleProceedFromOnboarding}
          />
        )}

        {/* Gemini AI Multi-turn Academic Copilot Modal */}
        <AcademicAIChatModal
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          currentUser={currentUser}
          defaultRole={chatRole}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          currentUser={currentUser}
          onUserAuthenticated={handleSwitchUser}
        />

        {/* Global Institutional Toast Container */}
        <ToastContainer
          toasts={toasts}
          onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        />
      </div>
    );
  }

  // DEDICATED COE & FACULTY LAYOUT (Student Portal nav is never shown here)
  return (
    <div id="examination-system-root" className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden select-none">
      {/* Persistent Simulated Data Banner */}
      <FallbackDataBanner isSimulated={isSimulatedData} />

      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Institutional Left Sidebar for COE / Faculty */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          pendingReviewsCount={pendingSubjectiveCount}
          integrityFlagsCount={unreviewedIntegrityCount}
          grievancesCount={pendingGrievancesCount}
        />

        {/* Main Administrative Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header adhering to single line title, +New Exam, search, notifications, profile menu */}
          <Header
            currentTab={currentTab}
            currentUser={currentUser}
            onNewExam={() => setCurrentTab('faculty_planner')}
            searchQuery={headerSearch}
            onSearchChange={setHeaderSearch}
            onOpenSidePanel={() => setIsSidePanelOpen(true)}
            onOpenAuthModal={() => setIsAuthOpen(true)}
            onSwitchUser={handleSwitchUser}
            notificationCount={pendingSubjectiveCount + unreviewedIntegrityCount}
          />

          <main className="flex-1 overflow-y-auto">
            {/* COE (Exam Author) Tab */}
            {currentTab === 'coe_dashboard' && (
              <CoeDashboard
                exams={exams}
                currentUser={currentUser}
                onNavigateToTab={setCurrentTab}
                onRefreshExams={async () => {
                  const refreshed = await getExams();
                  if (refreshed.length > 0) setExams(refreshed);
                }}
              />
            )}

            {/* Faculty Dashboard */}
            {currentTab === 'faculty_dashboard' && (
              <FacultyDashboard
                exams={exams}
                submissions={submissions}
                integrityLogs={integrityLogs}
                grievances={grievances}
                onNavigate={setCurrentTab}
                onNewExam={() => setCurrentTab('faculty_planner')}
              />
            )}

            {(currentTab === 'faculty_planner' || currentTab === 'faculty_exams') && (
              <ExamConfigurator
                exams={exams}
                facultyName={currentUser.displayName}
                onExamSaved={(exam) => {
                  setExams((prev) => {
                    const idx = prev.findIndex((e) => e.id === exam.id);
                    if (idx >= 0) {
                      const copy = [...prev];
                      copy[idx] = exam;
                      return copy;
                    }
                    return [exam, ...prev];
                  });
                }}
              />
            )}

            {(currentTab === 'faculty_syllabus_rag' || currentTab === 'faculty_questions') && (
              <QuestionGenerator
                exams={exams}
                onQuestionsAdded={(examId, newQuestions) => {
                  setExams((prev) =>
                    prev.map((e) =>
                      e.id === examId
                        ? { ...e, questionsCount: (e.questionsCount || 0) + newQuestions.length }
                        : e,
                    ),
                  );
                }}
              />
            )}

            {currentTab === 'faculty_node_graph' && (
              <NodeGraphMonitor
                exams={exams}
                currentUser={currentUser}
              />
            )}

            {currentTab === 'faculty_reviews' && (
              <ReviewsAndGrading
                exams={exams}
                submissions={submissions}
                integrityLogs={integrityLogs}
                onSubmissionsUpdated={setSubmissions}
                onIntegrityLogsUpdated={setIntegrityLogs}
              />
            )}

            {currentTab === 'faculty_grievances' && (
              <FacultyGrievanceQueue
                grievances={grievances}
                submissions={submissions}
                currentUser={currentUser}
                onGrievancesUpdated={setGrievances}
              />
            )}

            {/* Verification Protocol Suite */}
            {currentTab === 'verification_protocol' && (
              <PreDeploymentVerification />
            )}

            {/* Design System & Shared Components Showcase (Prompt 0) */}
            {currentTab === 'design_system' && (
              <div className="p-6 overflow-y-auto h-full">
                <DesignSystemShowcase />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Overflow Operations & AI Side Panel */}
      <OperationsSidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        currentUser={currentUser}
        onOpenAIChat={handleOpenAIChat}
        onOpenSystemOps={() => setIsSystemOpsOpen(true)}
      />

      {/* Gemini AI Multi-turn Academic Copilot Modal */}
      <AcademicAIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        currentUser={currentUser}
        defaultRole={chatRole}
      />

      {/* Live System Operations & Telemetry Modal */}
      <SystemOperationsModal
        isOpen={isSystemOpsOpen}
        onClose={() => setIsSystemOpsOpen(false)}
        currentUser={currentUser}
      />

      {/* Firebase Authentication & Academic Role Switching Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserAuthenticated={handleSwitchUser}
      />

      {/* Global Institutional Toast Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
