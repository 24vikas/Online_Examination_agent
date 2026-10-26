import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Calendar,
  Clock,
  Shield,
  Save,
  CheckCircle,
  Eye,
  Sliders,
  Settings,
  Lock,
  Globe,
} from 'lucide-react';
import type { Exam, ExamDeliveryFormat, ExamStatus, ProctoringRules } from '../../types/exam.ts';
import { saveExam } from '../../firebase/services.ts';
import { showToast } from '../../utils/toast.ts';

interface ExamConfiguratorProps {
  exams: Exam[];
  onExamSaved: (exam: Exam) => void;
  facultyName: string;
}

export const ExamConfigurator: React.FC<ExamConfiguratorProps> = ({
  exams,
  onExamSaved,
  facultyName,
}) => {
  const [plannerMode, setPlannerMode] = useState<'agent_loop' | 'manual'>('agent_loop');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Agent Planner Loop State (Lab 1)
  const [agentCommand, setAgentCommand] = useState<string>(
    '/exam-agent setup-exam CS-402 Cloud Architecture & High Availability'
  );
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [clarifications, setClarifications] = useState<Array<{ id: string; question: string; suggestedAnswer: string }>>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [proposedPlan, setProposedPlan] = useState<any>(null);
  const [plannerMessage, setPlannerMessage] = useState<string | null>(null);

  // Form State
  const [examId, setExamId] = useState<string>('');
  const [courseCode, setCourseCode] = useState<string>('CS-402');
  const [title, setTitle] = useState<string>('Cloud Architecture & High Availability');
  const [description, setDescription] = useState<string>(
    'Final assessment testing microservices, fault domains, Kubernetes orchestration, and database sharding.',
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [totalMarks, setTotalMarks] = useState<number>(50);
  const [passingScore, setPassingScore] = useState<number>(25);
  const [deliveryFormat, setDeliveryFormat] = useState<ExamDeliveryFormat>('mixed');
  const [isMockOrPractice, setIsMockOrPractice] = useState<boolean>(false);
  const [status, setStatus] = useState<ExamStatus>('published');

  // Dates
  const now = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [regStart, setRegStart] = useState<string>(now.toISOString().slice(0, 16));
  const [regEnd, setRegEnd] = useState<string>(nextWeek.toISOString().slice(0, 16));
  const [examStart, setExamStart] = useState<string>(now.toISOString().slice(0, 16));
  const [examEnd, setExamEnd] = useState<string>(nextWeek.toISOString().slice(0, 16));

  // Proctoring rules
  const [proctoringRules, setProctoringRules] = useState<ProctoringRules>({
    requireWebcam: true,
    maxTabSwitches: 3,
    blockCopyPaste: true,
    fullscreenRequired: true,
    ambientAudioCheck: false,
  });

  const handleStartCreate = async () => {
    setIsPlanning(true);
    setSuccessMsg(null);
    try {
      // 1. Execute Lab 1 Agent Loop to generate an execution blueprint
      let generatedPlan: any = null;
      try {
        const res = await fetch('/api/agent/planner-loop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: agentCommand || '/exam-agent setup-exam CS-402 Cloud Architecture & High Availability',
            courseCode: 'CS-402',
            durationMinutes: 60,
          }),
        });
        const json = await res.json();
        if (json.data?.plan) {
          generatedPlan = json.data.plan;
        }
      } catch (agentErr) {
        console.warn('Planner loop call notice:', agentErr);
      }

      const generatedExamId = generatedPlan?.id || `exam_cs402_${Date.now()}`;
      const courseName = generatedPlan?.title || 'Cloud Architecture & High Availability Systems';
      const duration = generatedPlan?.durationMinutes || 60;
      const totalMarks = generatedPlan?.questionDistribution?.totalMarks || 100;
      const passingScore = Math.round(totalMarks * 0.4);
      const regWindow = generatedPlan?.registrationWindow || {
        start: new Date(Date.now() - 86400000).toISOString(),
        end: new Date(Date.now() + 86400000 * 7).toISOString(),
      };

      // 2. Generate new document in the exams Firestore collection containing:
      // examId, courseName, registrationWindow, duration, status: 'draft', and passingCriteria
      const newExamDoc: any = {
        id: generatedExamId,
        examId: generatedExamId,
        courseCode: generatedPlan?.courseCode || 'CS-402',
        courseName,
        title: courseName,
        registrationWindow: regWindow,
        registrationStart: typeof regWindow === 'string' ? regWindow : regWindow.start,
        registrationEnd: typeof regWindow === 'string' ? regWindow : regWindow.end,
        duration,
        durationMinutes: duration,
        status: 'draft',
        passingCriteria: `${passingScore} marks (40% minimum passing score)`,
        passingScore,
        totalMarks,
        type: generatedPlan?.examType || 'mixed',
        isMockOrPractice: false,
        facultyId: 'coe_marcus_sterling',
        facultyName: facultyName || 'Prof. Marcus Sterling (COE)',
        description: `Draft Blueprint synthesized via Lab 1 Agent Loop for ${courseName}.`,
        examStart: new Date(Date.now() + 86400000 * 2).toISOString(),
        examEnd: new Date(Date.now() + 86400000 * 9).toISOString(),
        proctoringRules: generatedPlan?.proctoringRules || {
          requireWebcam: true,
          maxTabSwitches: 3,
          blockCopyPaste: true,
          fullscreenRequired: true,
          ambientAudioCheck: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Write to Firestore exams collection
      await saveExam(newExamDoc as Exam);
      onExamSaved(newExamDoc as Exam);

      // Populate form state for editing & inspection
      setExamId(newExamDoc.id);
      setCourseCode(newExamDoc.courseCode);
      setTitle(newExamDoc.title);
      setDescription(newExamDoc.description);
      setDurationMinutes(newExamDoc.durationMinutes);
      setTotalMarks(newExamDoc.totalMarks);
      setPassingScore(newExamDoc.passingScore);
      setDeliveryFormat(newExamDoc.type);
      setIsMockOrPractice(newExamDoc.isMockOrPractice);
      setStatus('draft');
      setIsEditing(true);

      showToast(`Draft exam blueprint created for ${newExamDoc.courseCode}`, 'success');
      setSuccessMsg(`Lab 1 Agent Loop created draft exam document in Firestore (status: 'draft') for ${newExamDoc.courseCode}!`);
    } catch (err: any) {
      console.error('Error in handleStartCreate:', err);
      showToast('Error configuring new exam', 'error');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleEditExam = (e: Exam) => {
    setExamId(e.id);
    setCourseCode(e.courseCode);
    setTitle(e.title);
    setDescription(e.description);
    setDurationMinutes(e.durationMinutes);
    setTotalMarks(e.totalMarks);
    setPassingScore(e.passingScore);
    setDeliveryFormat(e.type);
    setIsMockOrPractice(e.isMockOrPractice);
    setStatus(e.status);
    setRegStart(e.registrationStart.slice(0, 16));
    setRegEnd(e.registrationEnd.slice(0, 16));
    setExamStart(e.examStart.slice(0, 16));
    setExamEnd(e.examEnd.slice(0, 16));
    setProctoringRules(e.proctoringRules || {
      requireWebcam: true,
      maxTabSwitches: 3,
      blockCopyPaste: true,
      fullscreenRequired: true,
      ambientAudioCheck: false,
    });
    setIsEditing(true);
    setSuccessMsg(null);
  };

  // Lab 1 Planner Loop Handlers
  const handleRunPlannerLoop = async (forceIncomplete: boolean = false) => {
    setIsPlanning(true);
    setPlannerMessage(null);
    try {
      const payload: any = {
        command: forceIncomplete ? '/exam-agent setup-exam CS-402' : agentCommand,
        courseCode: 'CS-402',
        clarificationAnswers: forceIncomplete ? {} : clarificationAnswers,
      };

      const res = await fetch('/api/agent/planner-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.data) {
        setPlannerMessage(data.data.message);
        if (data.data.status === 'needs_clarification') {
          setClarifications(data.data.clarifications);
          setProposedPlan(null);
        } else {
          setClarifications([]);
          setProposedPlan(data.data.plan);
        }
      }
    } catch (e) {
      console.error('Planner loop error:', e);
      setPlannerMessage('Failed to communicate with coordinator loop.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleLockPlan = async () => {
    if (!proposedPlan) return;
    setIsPlanning(true);
    try {
      const res = await fetch('/api/agent/planner-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: agentCommand,
          courseCode: proposedPlan.courseCode,
          durationMinutes: proposedPlan.durationMinutes,
          isLocked: true,
        }),
      });
      const data = await res.json();
      if (data.data?.plan) {
        const lockedPlan = data.data.plan;
        // Convert to Exam and save to registry
        const newExam: Exam = {
          id: lockedPlan.id,
          title: lockedPlan.title,
          courseCode: lockedPlan.courseCode,
          facultyId: 'fac_eleanor_vance',
          facultyName: facultyName || 'Dr. Eleanor Vance',
          description: `Locked Exam Plan: ${lockedPlan.proctoringLevel.toUpperCase()} proctoring. Quota: ${lockedPlan.questionDistribution.mcqCount} MCQs + ${lockedPlan.questionDistribution.subjectiveCount} Subjective Essays.`,
          durationMinutes: lockedPlan.durationMinutes,
          totalMarks: lockedPlan.questionDistribution.totalMarks,
          passingScore: Math.round(lockedPlan.questionDistribution.totalMarks * 0.5),
          type: lockedPlan.examType,
          isMockOrPractice: false,
          registrationStart: lockedPlan.registrationWindow.start,
          registrationEnd: lockedPlan.registrationWindow.end,
          examStart: lockedPlan.examWindow.start,
          examEnd: lockedPlan.examWindow.end,
          status: 'published',
          proctoringRules: lockedPlan.proctoringRules,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveExam(newExam);
        onExamSaved(newExam);
        setProposedPlan(lockedPlan);
        setSuccessMsg(`Plan officially locked and saved to Exam Registry for ${lockedPlan.courseCode}!`);
      }
    } catch (e) {
      console.error('Lock plan error:', e);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const newExam: Exam = {
      id: examId || `exam_${Date.now()}`,
      title,
      courseCode,
      facultyId: 'fac_eleanor_vance',
      facultyName: facultyName || 'Dr. Eleanor Vance',
      description,
      durationMinutes,
      totalMarks,
      passingScore,
      type: deliveryFormat,
      isMockOrPractice,
      registrationStart: new Date(regStart).toISOString(),
      registrationEnd: new Date(regEnd).toISOString(),
      examStart: new Date(examStart).toISOString(),
      examEnd: new Date(examEnd).toISOString(),
      status,
      proctoringRules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveExam(newExam);
    onExamSaved(newExam);
    setIsEditing(false);
    setSuccessMsg(`Exam "${title}" configured and saved to registry successfully!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div id="exam-configurator-view" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Quick Add */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
            Curricular Administration
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-1">Exam Configuration & Security Rules</h2>
          <p className="text-xs text-slate-500">
            Define registration windows, duration limits, passing criteria, delivery formats, and proctoring constraints.
          </p>
        </div>

        <button
          id="btn-new-exam-setup"
          onClick={handleStartCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Configure New Exam</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setPlannerMode('agent_loop')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            plannerMode === 'agent_loop'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Interactive Agent Planner Loop (Lab 1)</span>
        </button>

        <button
          onClick={() => setPlannerMode('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            plannerMode === 'manual'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Granular Exam Registry ({exams.length})</span>
        </button>
      </div>

      {/* LAB 1: INTERACTIVE AGENT PLANNER LOOP */}
      {plannerMode === 'agent_loop' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
              Lab 1: Coordinator-Plus-Workers Agent Loop
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Interactive Exam Planner & Clarification Loop
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Input a natural language faculty directive. The coordinator identifies ambiguities or missing parameters, pauses, asks clarifying questions, and proposes a locked execution plan.
            </p>
          </div>

          {/* Directive Input */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Faculty Command or Directive:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={agentCommand}
                onChange={(e) => setAgentCommand(e.target.value)}
                placeholder="/exam-agent setup-exam CS-402 Cloud Architecture & High Availability"
                className="flex-1 text-xs border border-slate-200 rounded px-3 py-2 bg-slate-50 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                id="btn-run-planner"
                onClick={() => handleRunPlannerLoop(false)}
                disabled={isPlanning}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                {isPlanning ? 'Planning...' : 'Run Planner Loop'}
              </button>
            </div>

            {/* Quick Test Incomplete Directive */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500">Quick Test:</span>
              <button
                type="button"
                onClick={() => {
                  setAgentCommand('/exam-agent setup-exam CS-402');
                  handleRunPlannerLoop(true);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
              >
                Trigger Incomplete Command (Test L1 Clarification Pause)
              </button>
            </div>
          </div>

          {/* Planner Status Message */}
          {plannerMessage && (
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-sans">
              <strong>Coordinator: </strong>
              <span>{plannerMessage}</span>
            </div>
          )}

          {/* Clarifications Required (Coordinator Paused) */}
          {clarifications.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-4">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Coordinator Paused: Clarifying Parameters Needed</span>
              </div>
              <p className="text-[11px] text-amber-800">
                The agent paused before generating the locked execution plan because critical parameters (duration, proctoring window) were not specified in the faculty command.
              </p>

              <div className="space-y-3">
                {clarifications.map((c) => (
                  <div key={c.id} className="bg-white p-3 rounded border border-amber-200 space-y-1.5">
                    <label className="font-semibold text-slate-800 block text-xs">
                      {c.question}
                    </label>
                    <input
                      type="text"
                      value={clarificationAnswers[c.id] || c.suggestedAnswer}
                      onChange={(e) =>
                        setClarificationAnswers({
                          ...clarificationAnswers,
                          [c.id]: e.target.value,
                        })
                      }
                      className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>

              <button
                id="btn-resolve-clarifications"
                onClick={() => handleRunPlannerLoop(false)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
              >
                Resolve Parameters & Propose Locked Plan
              </button>
            </div>
          )}

          {/* Proposed / Locked Plan Output */}
          {proposedPlan && (
            <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {proposedPlan.id}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{proposedPlan.title}</h4>
                </div>

                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    proposedPlan.status === 'locked'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  }`}
                >
                  {proposedPlan.status === 'locked' ? 'Plan Locked & Signed' : 'Plan Proposed'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Duration</span>
                  <strong className="text-slate-900">{proposedPlan.durationMinutes} Minutes</strong>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Total Marks</span>
                  <strong className="text-slate-900">{proposedPlan.questionDistribution.totalMarks} Marks</strong>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Proctoring Level</span>
                  <strong className="text-slate-900 uppercase">{proposedPlan.proctoringLevel}</strong>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Question Quota</span>
                  <strong className="text-slate-900">
                    {proposedPlan.questionDistribution.mcqCount} MCQ + {proposedPlan.questionDistribution.subjectiveCount} Subj
                  </strong>
                </div>
              </div>

              {proposedPlan.status !== 'locked' ? (
                <div className="flex justify-end pt-2">
                  <button
                    id="btn-lock-plan"
                    onClick={handleLockPlan}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Plan & Deploy to Registry</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Locked by {proposedPlan.lockedBy} at {new Date(proposedPlan.lockedAt).toLocaleTimeString()}. Ready for exam intake.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MANUAL MODE */}
      {plannerMode === 'manual' && (
        <>
          {isEditing && (
        <div className="bg-white rounded-lg border-2 border-indigo-500/40 p-6 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {examId ? `Edit Examination Specification: ${courseCode}` : 'Create Examination Specification'}
              </h3>
              <p className="text-xs text-slate-500">All parameters will enforce runtime constraints during test delivery.</p>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Course Code:</label>
                <input
                  type="text"
                  required
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CS-301"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Exam Title:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems & Consensus Algorithms"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Syllabus & Scope Description:</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Delivery Format & Scoring */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Delivery Format:</label>
                <select
                  value={deliveryFormat}
                  onChange={(e) => setDeliveryFormat(e.target.value as ExamDeliveryFormat)}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="mixed">Mixed (Objective MCQs + Subjective Essays)</option>
                  <option value="objective">Objective Only (Auto-graded)</option>
                  <option value="subjective">Subjective Only (AI Rubrics & Faculty Signoff)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Duration (Minutes):</label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Total Marks:</label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Passing Score:</label>
                <input
                  type="number"
                  min={1}
                  max={totalMarks}
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Registration Window & Exam Delivery Window */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Registration Window
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">Registration Opens:</label>
                    <input
                      type="datetime-local"
                      value={regStart}
                      onChange={(e) => setRegStart(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">Registration Closes:</label>
                    <input
                      type="datetime-local"
                      value={regEnd}
                      onChange={(e) => setRegEnd(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Exam Delivery Window
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">Test Window Opens:</label>
                    <input
                      type="datetime-local"
                      value={examStart}
                      onChange={(e) => setExamStart(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">Test Window Closes:</label>
                    <input
                      type="datetime-local"
                      value={examEnd}
                      onChange={(e) => setExamEnd(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Proctoring Constraints */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
              <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-rose-500" />
                Proctoring Rules & Integrity Constraints
              </span>
              <p className="text-[11px] text-slate-500">
                Integrity incidents are flagged for human faculty audit; penalties are never automated.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <label className="flex items-center gap-2 bg-white p-2.5 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proctoringRules.requireWebcam}
                    onChange={(e) =>
                      setProctoringRules({ ...proctoringRules, requireWebcam: e.target.checked })
                    }
                    className="rounded accent-indigo-600"
                  />
                  <span className="font-medium text-slate-700">Require Webcam Feed</span>
                </label>

                <label className="flex items-center gap-2 bg-white p-2.5 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proctoringRules.blockCopyPaste}
                    onChange={(e) =>
                      setProctoringRules({ ...proctoringRules, blockCopyPaste: e.target.checked })
                    }
                    className="rounded accent-indigo-600"
                  />
                  <span className="font-medium text-slate-700">Block Clipboard Copy/Paste</span>
                </label>

                <label className="flex items-center gap-2 bg-white p-2.5 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proctoringRules.fullscreenRequired}
                    onChange={(e) =>
                      setProctoringRules({ ...proctoringRules, fullscreenRequired: e.target.checked })
                    }
                    className="rounded accent-indigo-600"
                  />
                  <span className="font-medium text-slate-700">Fullscreen Enforcement</span>
                </label>

                <label className="flex items-center gap-2 bg-white p-2.5 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMockOrPractice}
                    onChange={(e) => setIsMockOrPractice(e.target.checked)}
                    className="rounded accent-indigo-600"
                  />
                  <span className="font-medium text-slate-700">Practice / Mock Exam</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-exam-config"
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save & Enforce Specification</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Configured Exams Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configured Assessments Catalog</h3>
            <p className="text-xs text-slate-500">Managed by Dr. Eleanor Vance & Examination Control Board</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">{exams.length} exams registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-3.5">Course Code & Title</th>
                <th className="p-3.5">Format</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Marks (Pass / Total)</th>
                <th className="p-3.5">Delivery Window</th>
                <th className="p-3.5">Proctoring Rules</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900">{exam.courseCode}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">{exam.title}</div>
                    {exam.isMockOrPractice && (
                      <span className="inline-block mt-0.5 text-[9px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 rounded">
                        Mock Exam
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 capitalize font-medium text-slate-700">{exam.type}</td>
                  <td className="p-3.5 text-slate-600">{exam.durationMinutes} mins</td>
                  <td className="p-3.5 text-slate-700">
                    <span className="font-bold text-slate-900">{exam.passingScore}</span> / {exam.totalMarks}
                  </td>
                  <td className="p-3.5 text-slate-500">
                    <div>Opens: {new Date(exam.examStart).toLocaleDateString()}</div>
                    <div>Closes: {new Date(exam.examEnd).toLocaleDateString()}</div>
                  </td>
                  <td className="p-3.5 text-slate-500">
                    <div className="flex flex-wrap gap-1">
                      {exam.proctoringRules?.requireWebcam && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1 rounded">Cam</span>
                      )}
                      {exam.proctoringRules?.blockCopyPaste && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1 rounded">No-Paste</span>
                      )}
                      {exam.proctoringRules?.fullscreenRequired && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1 rounded">Fullscreen</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        exam.status === 'ongoing'
                          ? 'bg-emerald-100 text-emerald-800'
                          : exam.status === 'published'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {exam.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleEditExam(exam)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded transition-colors text-xs font-medium"
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
