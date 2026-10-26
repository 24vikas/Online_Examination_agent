import React, { useState } from 'react';
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Send,
  MessageSquare,
  Award,
} from 'lucide-react';
import type {
  Grievance,
  ExamSubmission,
  UserProfile,
  GrievanceStatus,
} from '../../types/exam.ts';
import { saveGrievance } from '../../firebase/services.ts';

import { StatusChip } from '../ui/StatusChip.tsx';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';

interface GrievanceTrackerProps {
  currentUser: UserProfile;
  submissions: ExamSubmission[];
  grievances: Grievance[];
  onGrievanceAdded: (newGrievance: Grievance) => void;
  preselectedSubmission?: ExamSubmission | null;
}

export const GrievanceTracker: React.FC<GrievanceTrackerProps> = ({
  currentUser,
  submissions,
  grievances,
  onGrievanceAdded,
  preselectedSubmission,
}) => {
  const [isFiling, setIsFiling] = useState<boolean>(Boolean(preselectedSubmission));
  const [selectedSubId, setSelectedSubId] = useState<string>(
    preselectedSubmission?.id || submissions[0]?.id || '',
  );
  const [questionId, setQuestionId] = useState<string>('q_cs301_4');
  const [subject, setSubject] = useState<string>('Discrepancy in Question 4 Rubric Evaluation');
  const [reason, setReason] = useState<string>(
    'The subjective rubric deducted 2 marks for missing Paxos Synod details, whereas the question prompt explicitly asked for comparison of state machine replication and real-world adoption.',
  );
  const [currentMarks, setCurrentMarks] = useState<number>(13);
  const [requestedMarks, setRequestedMarks] = useState<number>(15);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter grievances for this student if student role, or show all if faculty
  const myGrievances =
    currentUser.role === 'student'
      ? grievances.filter((g) => g.studentId === currentUser.id)
      : grievances;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedSub = submissions.find((s) => s.id === selectedSubId);
    const newGrievance: Grievance = {
      id: `grievance_${Date.now()}`,
      examId: selectedSub?.examId || 'exam_cs301_distributed',
      examTitle: selectedSub?.examTitle || 'CS 301: Distributed Systems',
      submissionId: selectedSubId,
      studentId: currentUser.id,
      studentName: currentUser.displayName,
      studentEmail: currentUser.email,
      questionId,
      subject,
      reason,
      currentMarks,
      requestedMarks,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveGrievance(newGrievance);
    onGrievanceAdded(newGrievance);
    setIsFiling(false);
    setSuccessMsg('Revaluation petition registered successfully in academic audit queue.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const getStatusBadge = (status: GrievanceStatus) => {
    switch (status) {
      case 'pending':
        return <StatusChip status="warning" label="Pending intake" />;
      case 'under_review':
        return <StatusChip status="info" label="Under review" />;
      case 'resolved':
        return <StatusChip status="success" label="Marks revised" />;
      case 'rejected':
        return <StatusChip status="neutral" label="Marks upheld" />;
    }
  };

  return (
    <div id="grievance-tracker-view" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0F4C81]">
            Academic Due Process
          </span>
          <h2 className="text-xl font-semibold text-[#0B2545] mt-1">Post-Exam Grievance & Revaluation Tracker</h2>
          <p className="text-xs text-[#475569] mt-0.5">
            Submit formal petitions for subjective reassessment. All requests are logged with full timestamps,
            rubric justifications, and faculty audit responses.
          </p>
        </div>

        <Button
          id="btn-file-revaluation-request"
          variant="primary"
          size="sm"
          onClick={() => setIsFiling(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Submit revaluation request</span>
        </Button>
      </Card>

      {successMsg && (
        <div className="p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl text-xs text-[#15803D] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}
      {/* Submission Form Modal / Box */}
      {isFiling && (
        <Card className="p-6 border-2 border-[#0F4C81] space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-base font-semibold text-[#0B2545]">File formal examination grievance</h3>
              <p className="text-xs text-[#475569]">
                Ground your petition in specific syllabus outcomes, grading rubrics, or model answers.
              </p>
            </div>
            <button
              onClick={() => setIsFiling(false)}
              className="text-xs text-[#475569] hover:text-[#0B2545] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#0B2545] block mb-1">Target examination:</label>
                <select
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  className="w-full text-xs bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#0B2545] focus:outline-none focus:border-[#0F4C81] min-h-[44px]"
                >
                  {submissions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.examTitle} (Submitted: {new Date(s.submittedAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0B2545] block mb-1">Question reference:</label>
                <input
                  type="text"
                  required
                  value={questionId}
                  onChange={(e) => setQuestionId(e.target.value)}
                  placeholder="e.g. Question 4 or q_cs301_4"
                  className="w-full text-xs bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#0B2545] focus:outline-none focus:border-[#0F4C81] font-mono min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0B2545] block mb-1">Petition subject:</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Discrepancy in Question 4 Rubric Evaluation"
                className="w-full text-xs bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#0B2545] focus:outline-none focus:border-[#0F4C81] min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#0B2545] block mb-1">Awarded marks:</label>
                <input
                  type="number"
                  required
                  value={currentMarks}
                  onChange={(e) => setCurrentMarks(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#0B2545] font-bold font-mono min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0B2545] block mb-1">Claimed / requested marks:</label>
                <input
                  type="number"
                  required
                  value={requestedMarks}
                  onChange={(e) => setRequestedMarks(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#0B2545] font-bold font-mono min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0B2545] block mb-1">
                Detailed academic justification & context:
              </label>
              <textarea
                rows={4}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Cite specific textbook passages, lecture notes, or syllabus criteria justifying revaluation..."
                className="w-full text-xs bg-white border border-[#E2E8F0] rounded-lg p-3 text-[#0B2545] focus:outline-none focus:border-[#0F4C81]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFiling(false)}
              >
                Cancel
              </Button>
              <Button
                id="btn-submit-grievance-petition"
                variant="primary"
                size="sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit formal grievance</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Grievance Timeline & Records */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-semibold text-[#0B2545] flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-[#0F4C81]" />
          Active revaluation petitions & decisions
        </h3>

        {myGrievances.length === 0 ? (
          <div className="p-10 text-center text-[#64748B] bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0]">
            <FileText className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#0B2545]">No grievance petitions on record</p>
            <p className="text-xs text-[#475569] mt-1">
              If you believe a subjective grade or rubric evaluation was unfair, submit a revaluation request above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myGrievances.map((g) => (
              <div
                key={g.id}
                className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#0B2545]">{g.subject}</span>
                      <span className="text-xs font-mono text-[#0F4C81]">({g.questionId})</span>
                    </div>
                    <div className="text-xs text-[#475569] mt-0.5">
                      Exam: <strong className="text-[#0B2545]">{g.examTitle}</strong> | Candidate: <strong className="text-[#0B2545]">{g.studentName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-[#475569]">Marks revision:</span>
                      <div className="text-xs font-semibold text-[#0B2545] font-mono">
                        {g.currentMarks} → <strong className="text-[#0B2545]">{g.requestedMarks}</strong>
                        {g.newAwardedMarks !== undefined && (
                          <span className="text-[#15803D] ml-1">(Awarded: {g.newAwardedMarks})</span>
                        )}
                      </div>
                    </div>

                    {getStatusBadge(g.status)}
                  </div>
                </div>

                {/* Justification Text */}
                <div className="p-3.5 bg-white rounded-lg border border-[#E2E8F0] text-xs text-[#0B2545] leading-relaxed font-sans">
                  <strong className="text-xs font-semibold text-[#475569] block mb-1">
                    Student argumentation:
                  </strong>
                  {g.reason}
                </div>

                {/* Faculty response if present */}
                {g.facultyResponse ? (
                  <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0B2545] space-y-1">
                    <strong className="text-xs text-[#0F4C81] flex items-center gap-1 font-semibold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Faculty invigilation board response:
                    </strong>
                    <p>{g.facultyResponse}</p>
                  </div>
                ) : (
                  <div className="text-xs text-[#64748B] italic">
                    Assigned to Exam Controller Dr. Vance for statutory re-check.
                  </div>
                )}

                <div className="text-xs text-[#64748B] flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
                  <span>Filed: {new Date(g.createdAt).toLocaleString()}</span>
                  <span className="font-mono">Ticket #{g.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
