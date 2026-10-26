import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  LifeBuoy,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  ArrowRight,
  Printer,
  CheckCircle,
  X,
} from 'lucide-react';
import type { ExamSubmission, Exam, Question, Grievance, UserProfile } from '../../types/exam.ts';
import { saveGrievance } from '../../firebase/services.ts';
import { generateStudentScorecardPDF } from '../../utils/pdfGenerator.ts';

import { StatusChip } from '../ui/StatusChip.tsx';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';

interface StudentScorecardProps {
  currentUser: UserProfile;
  submissions: ExamSubmission[];
  exams: Exam[];
  onOpenGrievance: (submission: ExamSubmission, questionId?: string) => void;
}

export const StudentScorecard: React.FC<StudentScorecardProps> = ({
  currentUser,
  submissions,
  exams,
  onOpenGrievance,
}) => {
  const mySubmissions = submissions.filter((s) => s.studentId === currentUser.id);
  const [selectedSubId, setSelectedSubId] = useState<string>(
    mySubmissions[0]?.id || ''
  );
  const [showOfficialTranscript, setShowOfficialTranscript] = useState<boolean>(false);
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const [isFormatting, setIsFormatting] = useState<boolean>(false);
  const [pdfDownloadedNotice, setPdfDownloadedNotice] = useState<string | null>(null);

  const activeSub = mySubmissions.find((s) => s.id === selectedSubId) || mySubmissions[0];
  const activeExam = activeSub ? exams.find((e) => e.id === activeSub.examId) : null;

  const handleDownloadPdf = () => {
    if (!activeSub) return;
    generateStudentScorecardPDF({
      submission: activeSub,
      exam: activeExam,
      student: currentUser,
    });
    setPdfDownloadedNotice(`Official Scorecard PDF generated for ${activeSub.examTitle}`);
    setTimeout(() => setPdfDownloadedNotice(null), 4500);
  };

  // Run Lab 3 Skill: format_administered_result_skill
  const handleGenerateOfficialTranscript = async () => {
    if (!activeSub) return;
    setIsFormatting(true);
    try {
      const res = await fetch('/api/agent/run-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: 'format_administered_result_skill',
          inputs: {
            student: { name: activeSub.studentName, id: currentUser.studentId || currentUser.id },
            exam: { title: activeSub.examTitle, code: activeExam?.courseCode || 'CS-301' },
            score: {
              objective: activeSub.objectiveScore,
              subjective: activeSub.subjectiveScore,
              total: activeSub.totalScore,
              max: activeSub.maxScore,
            },
          },
        }),
      });
      const data = await res.json();
      if (data.data?.formattedDocument) {
        setTranscriptData(data.data.formattedDocument);
        setShowOfficialTranscript(true);
      }
    } catch (e) {
      console.error('Skill error:', e);
    } finally {
      setIsFormatting(false);
    }
  };

  if (mySubmissions.length === 0) {
    return (
      <Card className="p-12 text-center space-y-3">
        <Award className="w-12 h-12 text-[#64748B] mx-auto" />
        <h3 className="text-base font-semibold text-[#0B2545]">No assessment records found</h3>
        <p className="text-xs text-[#475569] max-w-md mx-auto">
          You have not completed any examination sessions yet. Register and complete exams in the Testing Hall to view published scorecards and grading breakdowns.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0F4C81]">
              Academic Transcripts
            </span>
          </div>
          <h2 className="text-xl font-semibold text-[#0B2545] tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0F4C81]" />
            Official Scorecard & Performance Review
          </h2>
          <p className="text-xs text-[#475569] max-w-2xl mt-1">
            Review detailed question-level evaluations, objective auto-grading, faculty-approved subjective rubrics, and launch grievance petitions if marks require revaluation.
          </p>
        </div>

        {activeSub && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              id="btn-download-scorecard-pdf"
              variant="secondary"
              size="sm"
              onClick={handleDownloadPdf}
            >
              <Download className="w-4 h-4" />
              <span>Download summary PDF</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateOfficialTranscript}
              disabled={isFormatting}
            >
              <Printer className="w-4 h-4" />
              <span>{isFormatting ? 'Generating...' : 'Official transcript'}</span>
            </Button>
          </div>
        )}
      </Card>

      {/* Download Notification Toast */}
      {pdfDownloadedNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{pdfDownloadedNotice}</span>
          </div>
          <button
            onClick={() => setPdfDownloadedNotice(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Select Exam Dropdown if multiple */}
      {mySubmissions.length > 1 && (
        <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-600 font-semibold">Select Examination:</span>
          <select
            value={selectedSubId}
            onChange={(e) => setSelectedSubId(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 font-medium text-slate-800 focus:outline-none"
          >
            {mySubmissions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.examTitle} - {s.totalScore}/{s.maxScore} marks ({s.facultyApproved ? 'Published' : 'Draft'})
              </option>
            ))}
          </select>
        </div>
      )}

      {activeSub && (
        <div className="space-y-6">
          {/* Main Scorecard Header Card */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <span className="text-xs font-mono text-[#64748B]">Course assessment</span>
                <h3 className="text-lg font-semibold text-[#0B2545]">{activeSub.examTitle}</h3>
                <div className="text-xs text-[#475569] mt-0.5">
                  Submitted on {new Date(activeSub.submittedAt).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-[#475569] block">Total awarded score</span>
                  <div className="text-2xl font-bold font-mono text-[#0B2545]">
                    {activeSub.totalScore}{' '}
                    <span className="text-sm font-normal text-[#64748B]">/ {activeSub.maxScore}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusChip
                    status={activeSub.facultyApproved ? 'success' : 'warning'}
                    label={activeSub.facultyApproved ? 'Published' : 'Pending review'}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadPdf}
                    title="Download Scorecard PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Score Split Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <span className="text-xs font-medium text-[#475569] block mb-1">
                  Objective section (MCQ)
                </span>
                <div className="text-xl font-bold font-mono text-[#0B2545]">{activeSub.objectiveScore} marks</div>
                <div className="text-xs text-[#64748B] mt-0.5">Deterministic auto-grading</div>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <span className="text-xs font-medium text-[#475569] block mb-1">
                  Subjective section
                </span>
                <div className="text-xl font-bold font-mono text-[#0B2545]">{activeSub.subjectiveScore} marks</div>
                <div className="text-xs text-[#64748B] mt-0.5">
                  {activeSub.facultyApproved ? 'Faculty approved score' : 'AI assist draft proposal'}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <span className="text-xs font-medium text-[#475569] block mb-1">
                  Integrity validation
                </span>
                <div className="text-xl font-bold font-mono text-[#15803D]">
                  {activeSub.integrityScore}% score
                </div>
                <div className="text-xs text-[#64748B] mt-0.5">
                  {activeSub.integrityFlagCount === 0
                    ? 'Clean session, no anomalies'
                    : `${activeSub.integrityFlagCount} flags reviewed without penalty`}
                </div>
              </div>
            </div>

            {/* Faculty General Remarks */}
            {activeSub.facultyFeedback && (
              <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0B2545]">
                <strong className="font-semibold text-[#0B2545]">Faculty remarks: </strong>
                <span>{activeSub.facultyFeedback}</span>
              </div>
            )}
          </Card>

          {/* Subjective Evaluations Breakdown */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h4 className="text-base font-semibold text-[#0B2545]">Subjective questions & rubric breakdown</h4>
                <p className="text-xs text-[#475569]">
                  Detailed rubric evaluations, awarded criteria points, and feedback.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenGrievance(activeSub)}
              >
                <LifeBuoy className="w-4 h-4" />
                <span>Raise revaluation grievance</span>
              </Button>
            </div>

            {Object.keys(activeSub.subjectiveEvaluations || {}).length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No subjective questions were evaluated in this exam.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(activeSub.subjectiveEvaluations).map(([qId, ev]: [string, any]) => (
                  <div
                    key={qId}
                    className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-[#0B2545]">
                        Question ID: {qId}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-[#0B2545]">
                          Awarded: {ev.facultyApprovedScore ?? ev.suggestedScore} / {ev.maxMarks} marks
                        </span>
                        <button
                          onClick={() => onOpenGrievance(activeSub, qId)}
                          className="text-xs text-[#0F4C81] hover:underline font-semibold ml-2 cursor-pointer"
                        >
                          Dispute score
                        </button>
                      </div>
                    </div>

                    {/* Student Answer */}
                    <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#0B2545] font-sans">
                      <span className="text-xs font-semibold text-[#64748B] block mb-1">
                        Your submitted response
                      </span>
                      {ev.studentAnswer || '(No text answer recorded)'}
                    </div>

                    {/* Rubric Breakdown */}
                    {ev.rubricBreakdown && ev.rubricBreakdown.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-[#0B2545] block">
                          Rubric criteria assessment:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {ev.rubricBreakdown.map((r: any, i: number) => (
                            <div
                              key={i}
                              className="p-3 rounded-lg bg-white border border-[#E2E8F0] flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between font-semibold text-[#0B2545] mb-1">
                                <span>{r.criterion}</span>
                                <span className="text-[#0F4C81] font-mono">
                                  {r.awarded}/{r.max}
                                </span>
                              </div>
                              <span className="text-xs text-[#475569]">{r.comment}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reasoning */}
                    <div className="text-xs text-[#475569] pt-1">
                      <strong className="font-semibold text-[#0B2545]">Pedagogical rationale: </strong>
                      <span>{ev.reasoning}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Official Transcript Modal (Skill Document) */}
      {showOfficialTranscript && transcriptData && (
        <div className="fixed inset-0 z-50 bg-[#0B2545]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-0 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-[#0B2545] text-white p-6 border-b border-[#0F4C81] font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">{transcriptData.institution}</h3>
                  <div className="text-xs text-white/80">{transcriptData.office}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-white/20 text-white font-mono">
                  {transcriptData.documentType}
                </span>
              </div>
            </div>

            {/* Transcript Body */}
            <div className="p-6 space-y-6 text-xs text-[#0B2545]">
              <div className="grid grid-cols-2 gap-4 border-b border-[#E2E8F0] pb-4">
                <div>
                  <span className="text-[#64748B] block text-xs">Candidate full name</span>
                  <div className="font-semibold text-sm text-[#0B2545]">{transcriptData.candidate?.fullName}</div>
                  <div className="text-[#475569] font-mono">{transcriptData.candidate?.studentIdentifier}</div>
                </div>
                <div>
                  <span className="text-[#64748B] block text-xs">Course & examination</span>
                  <div className="font-semibold text-sm text-[#0B2545]">{transcriptData.course?.title}</div>
                  <div className="text-[#0F4C81] font-mono">{transcriptData.course?.code}</div>
                </div>
              </div>

              {/* Scores Table */}
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] text-xs">
                    <tr>
                      <th className="p-3 font-semibold">Component</th>
                      <th className="p-3 font-semibold">Marks awarded</th>
                      <th className="p-3 font-semibold">Performance grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    <tr>
                      <td className="p-3">Objective examination section</td>
                      <td className="p-3 font-semibold font-mono">{transcriptData.scores?.objectiveComponent}</td>
                      <td className="p-3 text-[#475569]">Auto-evaluated</td>
                    </tr>
                    <tr>
                      <td className="p-3">Subjective analytical component</td>
                      <td className="p-3 font-semibold font-mono">{transcriptData.scores?.subjectiveComponent}</td>
                      <td className="p-3 text-[#475569]">Faculty ratified</td>
                    </tr>
                    <tr className="bg-[#F8FAFC] font-semibold">
                      <td className="p-3">Total composite score</td>
                      <td className="p-3 text-[#0B2545] font-mono">{transcriptData.scores?.totalAwarded}</td>
                      <td className="p-3 text-[#15803D]">{transcriptData.scores?.grade} ({transcriptData.scores?.percentage})</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sign-off */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-[#64748B] block">Proctoring telemetry status</span>
                  <div className="text-[#15803D] font-semibold">{transcriptData.governance?.proctoringStatus}</div>
                  <div className="font-mono text-[#64748B] text-[10px] truncate">{transcriptData.governance?.transcriptHash}</div>
                </div>
                <div className="text-right">
                  <span className="text-[#64748B] block">Faculty examiner signature</span>
                  <div className="font-semibold text-[#0B2545] text-sm">{transcriptData.governance?.facultySignOff}</div>
                  <div className="text-[#15803D] font-medium text-xs">Verified & signed on-chain</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#F8FAFC] p-4 border-t border-[#E2E8F0] flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadPdf}
              >
                <Download className="w-4 h-4" />
                <span>Download as PDF</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowOfficialTranscript(false)}
              >
                Close transcript
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
