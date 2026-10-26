import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Calendar,
  FileText,
  Award,
  ArrowRight,
  PlayCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Receipt,
  GraduationCap,
} from 'lucide-react';
import type {
  Exam,
  UserProfile,
  Registration,
  ExamSubmission,
} from '../../types/exam.ts';
import { saveRegistration } from '../../firebase/services.ts';

import { StatusChip } from '../ui/StatusChip.tsx';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';

interface StudentEligibilityAndExamsProps {
  currentUser: UserProfile;
  exams: Exam[];
  registrations: Registration[];
  submissions: ExamSubmission[];
  onStartExam: (exam: Exam) => void;
  onOpenGrievance: (submission: ExamSubmission) => void;
  onRegistrationsUpdated: (regs: Registration[]) => void;
}

export const StudentEligibilityAndExams: React.FC<StudentEligibilityAndExamsProps> = ({
  currentUser,
  exams,
  registrations,
  submissions,
  onStartExam,
  onOpenGrievance,
  onRegistrationsUpdated,
}) => {
  const isAttendanceEligible = currentUser.attendanceRate >= 75;
  const isFeeEligible = currentUser.feeCleared;
  const isFullyEligible = isAttendanceEligible && isFeeEligible;

  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Student specific registrations & submissions
  const myRegistrations = registrations.filter((r) => r.studentId === currentUser.id);
  const mySubmissions = submissions.filter((s) => s.studentId === currentUser.id);

  const handleRegister = async (exam: Exam) => {
    if (!isFullyEligible) {
      alert('Institutional Clearance Warning: You must satisfy both minimum 75% attendance and fee clearance to register.');
      return;
    }

    setRegisteringId(exam.id);
    const newReg: Registration = {
      id: `reg_${currentUser.id}_${exam.id}`,
      examId: exam.id,
      studentId: currentUser.id,
      studentName: currentUser.displayName,
      studentEmail: currentUser.email,
      registeredAt: new Date().toISOString(),
      eligibilityVerified: true,
      attendanceRate: currentUser.attendanceRate,
      feeCleared: currentUser.feeCleared,
      status: 'registered',
    };

    await saveRegistration(newReg);
    const nextList = [...registrations.filter((r) => r.id !== newReg.id), newReg];
    onRegistrationsUpdated(nextList);

    setSuccessNotice(`Successfully registered for ${exam.courseCode}: ${exam.title}!`);
    setTimeout(() => setSuccessNotice(null), 4000);
    setRegisteringId(null);
  };

  return (
    <div id="student-eligibility-exams-view" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Institutional Clearance & Eligibility Dashboard */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0F4C81]">
                Identity & Clearance Audit
              </span>
            </div>
            <h2 className="text-xl font-semibold text-[#0B2545] mt-1">
              Examination Eligibility Verification
            </h2>
            <p className="text-xs text-[#475569] mt-0.5">
              Institutional protocol mandates ≥75% lecture attendance and complete semester tuition fee settlement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusChip
              status={isFullyEligible ? 'success' : 'danger'}
              label={isFullyEligible ? 'Eligible for all assessments' : 'Clearance conditional'}
            />
          </div>
        </div>

        {/* Verification Check Cards - White surfaces only, status chips inside */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Attendance Requirement Card */}
          <div className="p-5 rounded-xl border border-[#E2E8F0] bg-white text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0B2545] flex items-center gap-2 text-sm">
                <GraduationCap className="w-4 h-4 text-[#0F4C81]" />
                Lecture attendance criterion
              </span>
              <StatusChip
                status={isAttendanceEligible ? 'success' : 'danger'}
                label={`${currentUser.attendanceRate}% / 75.0%`}
              />
            </div>

            <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isAttendanceEligible ? 'bg-[#15803D]' : 'bg-[#B91C1C]'
                }`}
                style={{ width: `${Math.min(100, currentUser.attendanceRate)}%` }}
              />
            </div>

            <p className="text-xs text-[#475569]">
              {isAttendanceEligible
                ? 'Attendance verified. Meets institutional statutory requirements for examination sitting.'
                : 'Warning: Attendance is below 75%. Submit formal condonation certificate to your department head.'}
            </p>
          </div>

          {/* Fee Settlement Card */}
          <div className="p-5 rounded-xl border border-[#E2E8F0] bg-white text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0B2545] flex items-center gap-2 text-sm">
                <Receipt className="w-4 h-4 text-[#0F4C81]" />
                Bursar & tuition account
              </span>
              <StatusChip
                status={isFeeEligible ? 'success' : 'warning'}
                label={isFeeEligible ? 'Fees cleared' : 'Payment outstanding'}
              />
            </div>

            <p className="text-xs text-[#475569] pt-1">
              {isFeeEligible
                ? 'Semester tuition and laboratory examination levies fully discharged.'
                : 'Bursary hold: Outstanding balance flagged. Settle via university bursar desk to release admit pass.'}
            </p>
          </div>
        </div>
      </Card>

      {successNotice && (
        <div className="p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl text-xs text-[#15803D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
            <span className="font-medium">{successNotice}</span>
          </div>
        </div>
      )}

      {/* 2. Published Results & Previous Submissions */}
      {mySubmissions.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-base font-semibold text-[#0B2545] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#0F4C81]" />
                Completed assessments & official grades
              </h3>
              <p className="text-xs text-[#475569]">
                View auto-graded objective results and faculty-ratified subjective marks.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {mySubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-[#0B2545]">{sub.examTitle}</span>
                    <div className="text-xs text-[#475569]">
                      Submitted on {new Date(sub.submittedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-[#475569]">Final grade: </span>
                      <strong className="text-sm font-mono text-[#0B2545]">
                        {sub.totalScore} / {sub.maxScore}
                      </strong>
                    </div>

                    <StatusChip
                      status={sub.facultyApproved ? 'success' : 'warning'}
                      label={sub.facultyApproved ? 'Published' : 'Pending review'}
                    />
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-lg border border-[#E2E8F0]">
                  <div>
                    <span className="text-[#475569]">Objective section</span>
                    <div className="font-semibold text-[#0B2545] font-mono mt-0.5">{sub.objectiveScore} marks</div>
                  </div>
                  <div>
                    <span className="text-[#475569]">Subjective section</span>
                    <div className="font-semibold text-[#0B2545] font-mono mt-0.5">
                      {sub.subjectiveScore} marks {sub.facultyApproved ? '(Approved)' : '(AI proposed)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#475569]">Integrity score</span>
                    <div className="font-semibold text-[#15803D] font-mono mt-0.5">{sub.integrityScore}/100</div>
                  </div>
                </div>

                {sub.facultyFeedback && (
                  <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] text-xs text-[#0B2545]">
                    <strong className="font-semibold">Faculty feedback:</strong> {sub.facultyFeedback}
                  </div>
                )}

                {/* Revaluation Petition Trigger */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] text-xs">
                  <span className="text-[#475569]">
                    Questions regarding subjective evaluation or mark rubric?
                  </span>
                  <button
                    onClick={() => onOpenGrievance(sub)}
                    className="text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Submit revaluation grievance</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. Available Exams Registration & Taking Schedule */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-base font-semibold text-[#0B2545] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0F4C81]" />
              Academic examination schedule & cohort registration
            </h3>
            <p className="text-xs text-[#475569]">
              Register during active windows. Enter proctored room when exam is active.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => {
            const registered = myRegistrations.some((r) => r.examId === exam.id);
            const submitted = mySubmissions.some((s) => s.examId === exam.id);

            return (
              <div
                key={exam.id}
                className="p-5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#CBD5E1] transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-semibold text-[#0F4C81] bg-[#E8F0F8] px-2 py-0.5 rounded border border-[#CBD5E1]">
                      {exam.courseCode}
                    </span>
                    <StatusChip
                      status={submitted ? 'neutral' : registered ? 'info' : 'warning'}
                      label={submitted ? 'Submitted' : registered ? 'Registered' : 'Open'}
                    />
                  </div>

                  <h4 className="text-sm font-semibold text-[#0B2545] mb-1">{exam.title}</h4>
                  <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed">
                    {exam.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#475569] mt-3 pt-3 border-t border-[#E2E8F0]">
                    <div>
                      <span>Duration:</span> <strong className="text-[#0B2545] font-mono ml-1">{exam.durationMinutes}m</strong>
                    </div>
                    <div>
                      <span>Pass score:</span> <strong className="text-[#0B2545] font-mono ml-1">{exam.passingScore}/{exam.totalMarks}</strong>
                    </div>
                    <div>
                      <span>Format:</span> <strong className="text-[#0B2545] capitalize ml-1">{exam.type}</strong>
                    </div>
                    <div>
                      <span>Proctoring:</span> <strong className="text-[#0B2545] ml-1">{exam.proctoringRules?.requireWebcam ? 'Webcam + Audio' : 'Standard'}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  <div className="text-xs text-[#64748B]">
                    {registered ? 'Admit pass verified' : 'Clearance checked'}
                  </div>

                  {submitted ? (
                    <span className="text-xs font-semibold text-[#15803D] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                      <span>Exam completed</span>
                    </span>
                  ) : registered ? (
                    <Button
                      id={`btn-start-exam-${exam.id}`}
                      variant="primary"
                      size="sm"
                      onClick={() => onStartExam(exam)}
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Enter proctored exam room</span>
                    </Button>
                  ) : (
                    <Button
                      id={`btn-register-exam-${exam.id}`}
                      variant="secondary"
                      size="sm"
                      disabled={!isFullyEligible || registeringId === exam.id}
                      onClick={() => handleRegister(exam)}
                    >
                      {registeringId === exam.id
                        ? 'Registering...'
                        : isFullyEligible
                        ? 'Register for exam'
                        : 'Clearance required'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
