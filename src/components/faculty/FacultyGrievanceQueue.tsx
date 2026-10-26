import React, { useState } from 'react';
import {
  LifeBuoy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Save,
  MessageSquare,
  Lock,
} from 'lucide-react';
import type { Grievance, ExamSubmission, Exam } from '../../types/exam.ts';
import { saveGrievance, saveSubmission } from '../../firebase/services.ts';

interface FacultyGrievanceQueueProps {
  grievances: Grievance[];
  submissions: ExamSubmission[];
  exams: Exam[];
  onGrievancesUpdated: (updatedList: Grievance[]) => void;
  onSubmissionsUpdated: (updatedSubs: ExamSubmission[]) => void;
}

export const FacultyGrievanceQueue: React.FC<FacultyGrievanceQueueProps> = ({
  grievances,
  submissions,
  exams,
  onGrievancesUpdated,
  onSubmissionsUpdated,
}) => {
  const [selectedGrievanceId, setSelectedGrievanceId] = useState<string | null>(
    grievances[0]?.id || null
  );
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'rejected'>('all');
  const [facultyResponse, setFacultyResponse] = useState<string>('');
  const [revisedMarks, setRevisedMarks] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [aiMediating, setAiMediating] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary?: string;
    recommendation?: string;
    suggestedMarks?: number;
  } | null>(null);

  const filteredGrievances = grievances.filter((g) => {
    if (filter === 'all') return true;
    return g.status === filter;
  });

  const selectedGrievance = grievances.find((g) => g.id === selectedGrievanceId);
  const relatedSubmission = selectedGrievance
    ? submissions.find((s) => s.id === selectedGrievance.submissionId)
    : null;
  const relatedExam = selectedGrievance
    ? exams.find((e) => e.id === selectedGrievance.examId)
    : null;

  // AI Mediation Helper
  const handleAiMediation = async () => {
    if (!selectedGrievance) return;
    setAiMediating(true);
    try {
      const res = await fetch('/api/gemini/academic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleType: 'grievance_mediator',
          messages: [
            {
              role: 'user',
              content: `Please analyze this student examination grievance ticket:
Course: ${selectedGrievance.examTitle}
Student: ${selectedGrievance.studentName}
Current Awarded Marks: ${selectedGrievance.currentMarks}
Student Requested Marks: ${selectedGrievance.requestedMarks}
Student Grounds for Appeal: "${selectedGrievance.reason}"

Please evaluate:
1. Is the student appeal grounded in technical merit or rubric criteria?
2. What is your neutral pedagogical recommendation for the faculty member?
3. What is an equitable marks adjustment if any? Note: Faculty makes final determination.`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.data?.text) {
        setAiAnalysis({
          summary: data.data.text,
          recommendation: 'Pedagogical Review Complete. Faculty determination required.',
        });
        setFacultyResponse(
          `Revaluation reviewed: ${data.data.text.slice(0, 200)}... Adjusted based on rubric criteria.`
        );
      }
    } catch (e) {
      console.error('AI Mediation error:', e);
    } finally {
      setAiMediating(false);
    }
  };

  // Human Faculty Determination (strictly enforced guardrail!)
  const handleResolveGrievance = async (decision: 'resolved' | 'rejected') => {
    if (!selectedGrievance) return;
    setIsProcessing(true);

    try {
      const updatedGrievance: Grievance = {
        ...selectedGrievance,
        status: decision,
        facultyResponse: facultyResponse || (decision === 'resolved' ? 'Marks revised upon verification of rubric standard.' : 'Original evaluation upheld after syllabus review.'),
        newAwardedMarks: decision === 'resolved' ? revisedMarks : selectedGrievance.currentMarks,
        updatedAt: new Date().toISOString(),
      };

      await saveGrievance(updatedGrievance);

      const nextGrievances = grievances.map((g) =>
        g.id === updatedGrievance.id ? updatedGrievance : g
      );
      onGrievancesUpdated(nextGrievances);

      // If marks revised, update student submission
      if (decision === 'resolved' && relatedSubmission && revisedMarks !== selectedGrievance.currentMarks) {
        const delta = revisedMarks - selectedGrievance.currentMarks;
        const newTotal = relatedSubmission.totalScore + delta;
        const updatedSubmission: ExamSubmission = {
          ...relatedSubmission,
          subjectiveScore: relatedSubmission.subjectiveScore + delta,
          totalScore: newTotal,
          facultyFeedback: `${relatedSubmission.facultyFeedback || ''} [Grievance Revaluation: +${delta} marks awarded for question ${selectedGrievance.questionId}]`.trim(),
          updatedAt: new Date().toISOString(),
        };
        await saveSubmission(updatedSubmission);
        onSubmissionsUpdated(
          submissions.map((s) => (s.id === updatedSubmission.id ? updatedSubmission : s))
        );
      }

      setAiAnalysis(null);
      setFacultyResponse('');
    } catch (e) {
      console.error('Error resolving grievance:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Faculty Workspace View 5
            </span>
            <span className="text-xs text-slate-400 font-mono">Academic Petitions Desk</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-emerald-400" />
            Grievance & Post-Exam Revaluation Management
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            Systematic queue for student revaluation requests. Enables side-by-side verification of student grounds, answer transcripts, and rubric standards.
          </p>
        </div>

        {/* Strict Guardrail Badge */}
        <div className="px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="font-semibold text-white">Negative Guardrail Active</div>
            <div className="text-[11px] text-slate-400">Never resolve grievances automatically</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Ticket Queue & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              Petition Tickets ({filteredGrievances.length})
            </h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
            {filteredGrievances.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No grievances found matching filter.</div>
            ) : (
              filteredGrievances.map((g) => {
                const isSelected = g.id === selectedGrievanceId;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGrievanceId(g.id);
                      setRevisedMarks(g.requestedMarks);
                      setFacultyResponse(g.facultyResponse || '');
                      setAiAnalysis(null);
                    }}
                    className={`w-full text-left p-3.5 transition-colors ${
                      isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {g.studentName}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          g.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : g.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {g.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium truncate mb-1">{g.subject}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{g.examTitle}</span>
                      <span className="font-semibold text-slate-700">
                        {g.currentMarks} → {g.requestedMarks} marks
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Inspector & Faculty Determination (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-6">
          {selectedGrievance ? (
            <>
              {/* Header */}
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400 font-semibold">
                      {selectedGrievance.id}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        selectedGrievance.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : selectedGrievance.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedGrievance.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{selectedGrievance.subject}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                    <span>Student: <strong>{selectedGrievance.studentName}</strong></span>
                    <span>Exam: <strong>{selectedGrievance.examTitle}</strong></span>
                  </div>
                </div>

                <button
                  onClick={handleAiMediation}
                  disabled={aiMediating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{aiMediating ? 'Analyzing...' : 'Gemini Mediation Advice'}</span>
                </button>
              </div>

              {/* AI Mediation Callout */}
              {aiAnalysis?.summary && (
                <div className="p-4 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Gemini Mediation Analysis (Assistive Advice for Faculty)</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed text-indigo-900 font-sans">
                    {aiAnalysis.summary}
                  </p>
                  <p className="text-[11px] text-indigo-700 italic border-t border-indigo-200 pt-1.5">
                    Notice: Final grade adjustment is strictly reserved for the human course faculty.
                  </p>
                </div>
              )}

              {/* Student Stated Grounds */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Student Grounds for Appeal & Justification
                </h4>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
                  {selectedGrievance.reason}
                </div>
              </div>

              {/* Side-by-side Marks Comparison */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Current Awarded Marks</span>
                  <div className="text-lg font-bold text-slate-900">{selectedGrievance.currentMarks} marks</div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Student Requested Marks</span>
                  <div className="text-lg font-bold text-indigo-600">{selectedGrievance.requestedMarks} marks</div>
                </div>
              </div>

              {/* Faculty Determination Form */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Faculty Revaluation Determination
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Final Awarded Marks
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={revisedMarks}
                      onChange={(e) => setRevisedMarks(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded px-3 py-2 bg-white text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Subject to maximum question rubric ceiling.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Action Type
                    </label>
                    <div className="text-xs text-slate-600 pt-2 font-medium">
                      {revisedMarks > selectedGrievance.currentMarks
                        ? `Adjustment: +${revisedMarks - selectedGrievance.currentMarks} marks awarded`
                        : revisedMarks === selectedGrievance.currentMarks
                        ? 'Maintain current score'
                        : `Reduction: ${revisedMarks - selectedGrievance.currentMarks} marks`}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Formal Academic Justification & Comments for Student
                  </label>
                  <textarea
                    rows={3}
                    value={facultyResponse}
                    onChange={(e) => setFacultyResponse(e.target.value)}
                    placeholder="State the academic reasons for accepting, adjusting, or rejecting this petition..."
                    className="w-full text-xs border border-slate-200 rounded p-2.5 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleResolveGrievance('rejected')}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Uphold Original Score (Reject Petition)</span>
                  </button>

                  <button
                    onClick={() => handleResolveGrievance('resolved')}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ratify Revaluation & Update Grade</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select a grievance petition from the left panel to inspect details and provide faculty determination.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
