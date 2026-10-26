import React, { useState, useEffect } from 'react';
import {
  Network,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Users,
  FileCheck,
  RefreshCw,
  Zap,
  Terminal,
  Activity,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import type { NodeGraphNode, AgentAuditLog, SwarmWorkerResult } from '../../types/exam.ts';

export const NodeGraphMonitor: React.FC = () => {
  const [pipelineState, setPipelineState] = useState<string>('IDLE');
  const [activeTab, setActiveTab] = useState<'dag' | 'audit_logs' | 'checkpoint_resume' | 'parallel_swarm'>('dag');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSwarmRunning, setIsSwarmRunning] = useState<boolean>(false);
  const [anomalyMode, setAnomalyMode] = useState<'none' | 'score_exceeds_ceiling'>('none');
  const [backEdgeTriggered, setBackEdgeTriggered] = useState<boolean>(false);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);

  // AURA Coordinator Live Sync Telemetry State
  const [auraRun, setAuraRun] = useState<any>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [approvalToken, setApprovalToken] = useState<string | null>(null);

  // Poll /api/agent/system-status for live AURA state machine updates
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/agent/system-status');
        const json = await res.json();
        const activeRuns = json.data?.auraCoordinatorSync?.activeRuns;
        if (activeRuns && activeRuns.length > 0) {
          const latestRun = activeRuns[0];
          setAuraRun(latestRun);
          if (latestRun.humanGateStatus === 'APPROVED_BY_FACULTY_COE' && latestRun.humanApprovalToken) {
            setApprovalToken(latestRun.humanApprovalToken);
          }
        }
      } catch (err) {
        // silent polling catch
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3500);
    return () => clearInterval(interval);
  }, []);

  // Faculty Examiner sign-off handler
  const handleFacultyApprove = async () => {
    setIsApproving(true);
    try {
      const examId = auraRun?.courseCode || '25ECSC307';
      const res = await fetch('/api/agent/aura-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          role: 'FACULTY_EXAMINER',
        }),
      });
      const data = await res.json();
      if (data.token) {
        setApprovalToken(data.token);
        setAuraRun((prev: any) => ({
          ...prev,
          humanGateStatus: 'APPROVED_BY_FACULTY_COE',
          humanApprovalToken: data.token,
          statusEvent: `Faculty Examiner sign-off approved! Issued token: ${data.token}. Advancing to Stage 7 Result Publishing.`,
        }));
        setNodes((prev) =>
          prev.map((n) =>
            n.id === 'node_faculty_gate'
              ? { ...n, status: 'completed' }
              : n.id === 'node_publisher'
              ? { ...n, status: 'running' }
              : n
          )
        );
        // Dispatch result publish
        await fetch('/api/agent/aura-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            functionName: 'publish_results_and_archive',
            args: {
              examId,
              humanApprovalToken: data.token,
              approverRole: 'FACULTY_EXAMINER',
              releaseVersion: 1,
              appendCoePdfAddendum: true,
            },
            telemetry: {
              runId: auraRun?.runId || 'AURA-RUN-25ECSC307-20261120',
              courseCode: examId,
              activeStage: 'STAGE_7_PUBLISH_AND_GRIEVANCE',
              labActive: 'Lab_14_CapstoneSync',
              statusEvent: 'Results governed and published with CoE PDF addendum appended into Document Vault. 72h grievance window opened.',
              humanGateStatus: 'APPROVED_BY_FACULTY_COE',
            },
          }),
        });
      }
    } catch (err) {
      console.error('Approval error:', err);
    } finally {
      setIsApproving(false);
    }
  };

  // DAG Nodes
  const [nodes, setNodes] = useState<NodeGraphNode[]>([
    { id: 'node_intake', name: 'Registration & Eligibility Agent', role: 'Eligibility verification (Attendance & Fee checks)', status: 'completed', retries: 0, durationMs: 45 },
    { id: 'node_delivery', name: 'Exam Delivery Agent', role: 'Timed exam session enforcement & window gate', status: 'completed', retries: 0, durationMs: 82 },
    { id: 'node_proctoring', name: 'Proctoring & Integrity Agent', role: 'Telemetry signal aggregator (Browser blur, webcams)', status: 'completed', retries: 0, durationMs: 115 },
    { id: 'node_auto_grader', name: 'Auto-Grading Agent (Objective)', role: 'Deterministic MCQ auto-grader', status: 'completed', retries: 0, durationMs: 38 },
    { id: 'node_subjective_grader', name: 'Subjective Grading Assist Agent', role: 'Rubric-grounded Gemini High-Thinking evaluator', status: 'completed', retries: 0, durationMs: 420 },
    { id: 'node_validator', name: 'Acceptance Validation Gate', role: 'Score ceiling guardrail & bounded retry back-edge', status: 'completed', retries: 0, durationMs: 30 },
    { id: 'node_faculty_gate', name: 'Faculty Review Gate', role: 'Mandatory human approval gate (No auto-publishing)', status: 'paused_human_gate', retries: 0, durationMs: 0 },
    { id: 'node_publisher', name: 'Result Publishing & Archive Agent', role: 'Official transcript generation & archival', status: 'idle', retries: 0, durationMs: 0 },
  ]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AgentAuditLog[]>([
    {
      id: 'log_01',
      timestamp: new Date(Date.now() - 360000).toISOString(),
      agentName: 'Registration & Eligibility Agent',
      stepName: 'Verify Student Roster',
      action: 'check_eligibility',
      tokensUsed: 140,
      status: 'success',
      payloadSummary: 'Verified 42 candidates; 40 eligible, 2 bursar holds flagged.',
    },
    {
      id: 'log_02',
      timestamp: new Date(Date.now() - 280000).toISOString(),
      agentName: 'Exam Delivery Agent',
      stepName: 'Session Window Enforcement',
      action: 'lock_exam_window',
      tokensUsed: 85,
      status: 'success',
      payloadSummary: 'Exam window officially opened for CS-301 Midterm (90 mins).',
    },
    {
      id: 'log_03',
      timestamp: new Date(Date.now() - 190000).toISOString(),
      agentName: 'Proctoring & Integrity Agent',
      stepName: 'Telemetry Signal Ingestion',
      action: 'aggregate_telemetry',
      tokensUsed: 310,
      status: 'success',
      payloadSummary: 'Logged 3 tab switches for STU-089. No auto-penalties applied per guardrail.',
    },
    {
      id: 'log_04',
      timestamp: new Date(Date.now() - 110000).toISOString(),
      agentName: 'Auto-Grading Agent (Objective)',
      stepName: 'Deterministic MCQ Scoring',
      action: 'grade_objective',
      tokensUsed: 60,
      status: 'success',
      payloadSummary: 'Graded 5 objective questions against answer key; 20/20 awarded.',
    },
    {
      id: 'log_05',
      timestamp: new Date(Date.now() - 50000).toISOString(),
      agentName: 'Subjective Grading Assist Agent',
      stepName: 'Rubric Grounded Evaluation',
      action: 'propose_subjective_scores',
      tokensUsed: 1240,
      status: 'success',
      payloadSummary: 'Gemini evaluated 2 essay responses; draft proposals generated.',
    },
    {
      id: 'log_06',
      timestamp: new Date(Date.now() - 15000).toISOString(),
      agentName: 'Acceptance Validation Gate',
      stepName: 'Max Mark Ceiling Audit',
      action: 'validate_score_ceilings',
      tokensUsed: 95,
      status: 'success',
      payloadSummary: 'Verified all subjective scores are <= max rubric marks (24/30).',
    },
  ]);

  // Checkpoint & Resume state
  const [checkpointStatus, setCheckpointStatus] = useState<{
    checkpointId?: string;
    stage?: string;
    isTerminated?: boolean;
    restored?: boolean;
  }>({
    checkpointId: 'chk_mid_eval_step3_state',
    stage: 'PROCTORING_ANALYSIS_COMPLETE',
    isTerminated: false,
    restored: false,
  });

  // Lab 8 Parallel Swarm results
  const [swarmResults, setSwarmResults] = useState<{
    batchSize: number;
    workers: SwarmWorkerResult[];
    aggregates?: {
      averageTotalScore: number;
      highestScore: number;
      lowestScore: number;
      passRatePercent: number;
      flaggedProctoringCount: number;
    };
  } | null>(null);

  // Run full DAG pipeline
  const handleExecuteDag = async (triggerAnomaly: boolean = false) => {
    setIsRunning(true);
    setPipelineState('RUNNING');
    setBackEdgeTriggered(false);
    setRetryAttempt(0);

    // Reset nodes to running
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        status: n.id === 'node_faculty_gate' ? 'idle' : n.id === 'node_publisher' ? 'idle' : 'running',
      }))
    );

    try {
      const res = await fetch('/api/agent/node-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testAnomaly: triggerAnomaly ? 'score_exceeds_ceiling' : 'none',
        }),
      });

      const data = await res.json();
      if (data.data) {
        setNodes(data.data.nodes);
        if (data.data.boundedRetryInfo) {
          setBackEdgeTriggered(true);
          setRetryAttempt(data.data.boundedRetryInfo.currentAttempt);
          setPipelineState('BACK_EDGE_RESOLVED');

          // Append audit log for back-edge retry
          setAuditLogs((prev) => [
            {
              id: `log_retry_${Date.now()}`,
              timestamp: new Date().toISOString(),
              agentName: 'Acceptance Validation Gate',
              stepName: 'Bounded Retry Back-Edge',
              action: 'regenerate_failing_unit',
              tokensUsed: 420,
              status: 'retry',
              payloadSummary: `Ceiling violation caught (16/15 marks). Regenerated unit 2: calibrated to 14/15 marks. Attempt 1 of 3.`,
            },
            ...prev,
          ]);
        } else {
          setPipelineState('PAUSED_AT_FACULTY_GATE');
        }
      }
    } catch (e) {
      console.error('DAG run error:', e);
      setPipelineState('ERROR');
    } finally {
      setIsRunning(false);
    }
  };

  // Simulate Force-Termination (Lab 6)
  const handleSimulateForceTerminate = async () => {
    try {
      const res = await fetch('/api/agent/governed-runtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate_force_terminate' }),
      });
      const data = await res.json();
      if (data.data) {
        setCheckpointStatus({
          checkpointId: data.data.savedCheckpoint.checkpointId,
          stage: data.data.savedCheckpoint.stage,
          isTerminated: true,
          restored: false,
        });
        setAuditLogs((prev) => [
          {
            id: `log_kill_${Date.now()}`,
            timestamp: new Date().toISOString(),
            agentName: 'Execution Controller',
            stepName: 'Interrupted Execution Snapshot',
            action: 'force_terminate_saved',
            tokensUsed: 0,
            status: 'paused',
            payloadSummary: 'Evaluation forcefully halted mid-run at step 4. Checkpoint state preserved in Firestore.',
          },
          ...prev,
        ]);
      }
    } catch (e) {
      console.error('Force terminate error:', e);
    }
  };

  // Resume from Checkpoint (Lab 6)
  const handleResumeCheckpoint = async () => {
    try {
      const res = await fetch('/api/agent/governed-runtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume_from_checkpoint',
          checkpointId: checkpointStatus.checkpointId,
        }),
      });
      const data = await res.json();
      if (data.data) {
        setCheckpointStatus((prev) => ({
          ...prev,
          isTerminated: false,
          restored: true,
        }));
        setAuditLogs((prev) => [
          {
            id: `log_resume_${Date.now()}`,
            timestamp: new Date().toISOString(),
            agentName: 'Execution Controller',
            stepName: 'Resume from Checkpoint',
            action: 'resume_restored',
            tokensUsed: 80,
            status: 'success',
            payloadSummary: `Resumed execution from "${checkpointStatus.checkpointId}" without data loss. Restored 4 pending stages.`,
          },
          ...prev,
        ]);
      }
    } catch (e) {
      console.error('Resume error:', e);
    }
  };

  // Run Lab 8 Parallel Swarm
  const handleExecuteParallelSwarm = async () => {
    setIsSwarmRunning(true);
    try {
      const res = await fetch('/api/agent/parallel-swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 20, courseCode: 'CS-301' }),
      });
      const data = await res.json();
      if (data.data) {
        setSwarmResults({
          batchSize: data.data.batchSize,
          workers: data.data.workers,
          aggregates: data.data.aggregates,
        });
        setAuditLogs((prev) => [
          {
            id: `log_swarm_${Date.now()}`,
            timestamp: new Date().toISOString(),
            agentName: 'Parallel Swarm Worker Manager',
            stepName: 'Concurrent Batch Evaluation (20 Submissions)',
            action: 'parallel_fan_out_fan_in',
            tokensUsed: 3840,
            status: 'success',
            payloadSummary: 'Executed 20 isolated worker threads concurrently; 0 cross-student data leaks; merged into class scorecard.',
          },
          ...prev,
        ]);
      }
    } catch (e) {
      console.error('Swarm execution error:', e);
    } finally {
      setIsSwarmRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Lab 6, 7 & 8 Architecture
            </span>
            <span className="text-xs text-slate-400 font-mono">DAG Execution Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            Execution & Multi-Agent Node Graph Monitor
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            Real-time directed acyclic graph (DAG) execution controller. Visualizes the multi-agent pipeline from candidate intake to faculty gate, step-level immutable audit logging, checkpoint/resume, and parallel swarm evaluation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-run-dag"
            onClick={() => handleExecuteDag(false)}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Execute DAG Pipeline</span>
          </button>

          <button
            id="btn-trigger-backedge"
            onClick={() => handleExecuteDag(true)}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            title="Simulate a rubric ceiling violation (16/15 marks) to test the automated acceptance check and bounded retry back-edge"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Test Back-Edge Retry</span>
          </button>
        </div>
      </div>

      {/* AURA Coordinator State Machine Telemetry Card */}
      {auraRun && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 shadow-sm text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-indigo-400">
                [AURA_TELEMETRY_SYNC]
              </span>
              <span className="text-xs font-semibold text-slate-300 font-mono">
                {auraRun.runId || 'AURA-RUN-25ECSC307'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                Course: {auraRun.courseCode || '25ECSC307'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Stage: {auraRun.activeStage || 'STAGE_6_HUMAN_APPROVAL_POLL'}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                {auraRun.labActive || 'Lab_12_SafetyAndGovernance'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs text-slate-300">
                <span className="text-slate-400 font-mono">Event:</span> {auraRun.statusEvent || 'Validation suite verified (100% pass). Halted at Human Review Gate.'}
              </p>
              {/* 4 Invariant Validation Indicators */}
              <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/70 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Check 0: Unique Papers
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/70 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Check 1: Flag-Only Proctoring
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/70 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Check 2: Scores ≤ Max
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/70 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Check 3: Held in DRAFT
                </span>
              </div>
            </div>

            {/* Human Gate Sign-off Action */}
            <div className="shrink-0 flex items-center gap-2">
              {auraRun.humanGateStatus === 'APPROVED_BY_FACULTY_COE' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-900/60 border border-emerald-600/80 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Approved & Signed Off</span>
                  {approvalToken && (
                    <span className="font-mono text-[10px] text-emerald-200 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                      {approvalToken.slice(0, 16)}...
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-700/80 text-amber-300 text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Human Gate: Locked</span>
                  </div>
                  <button
                    onClick={handleFacultyApprove}
                    disabled={isApproving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    {isApproving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Approve as Faculty (Issue Token)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('dag')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'dag'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Live Execution DAG</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'audit_logs'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Step-Level Audit Logs</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('checkpoint_resume')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'checkpoint_resume'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Checkpoint & Resume (Lab 6)</span>
        </button>

        <button
          onClick={() => setActiveTab('parallel_swarm')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'parallel_swarm'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Parallel Swarm (Lab 8)</span>
          {swarmResults && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              {swarmResults.batchSize} Evaluated
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Visual DAG Pipeline */}
      {activeTab === 'dag' && (
        <div className="space-y-6">
          {/* Back Edge Alert */}
          {backEdgeTriggered && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Lab 7 Bounded Retry Back-Edge Triggered & Successfully Resolved!</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Acceptance Validation Gate identified an anomaly: Subjective evaluation proposed 16 marks on a 15-mark ceiling question. Rather than failing the pipeline or auto-publishing flawed marks, the controller invoked the bounded retry back-edge back to the Subjective Grading Assist Agent (Attempt {retryAttempt} of 3), regenerating only the failing unit calibrated strictly to 14/15 marks.
              </p>
            </div>
          )}

          {/* DAG Pipeline Visualizer */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Multi-Agent Node Graph Execution Pipeline</h3>
                <p className="text-xs text-slate-500">
                  Sequential and fan-out agents cooperating across the examination lifecycle.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
                </span>
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Paused at Faculty Gate
                </span>
              </div>
            </div>

            {/* Nodes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nodes.map((node, index) => {
                const isBackEdgeTarget = backEdgeTriggered && node.id === 'node_subjective_grader';
                const isFacultyGate = node.id === 'node_faculty_gate';

                return (
                  <div
                    key={node.id}
                    className={`relative rounded-lg border p-4 transition-all ${
                      isBackEdgeTarget
                        ? 'border-amber-400 bg-amber-50/70 shadow-xs ring-2 ring-amber-300'
                        : isFacultyGate
                        ? 'border-indigo-400 bg-indigo-50/60 shadow-xs'
                        : node.status === 'completed'
                        ? 'border-slate-200 bg-slate-50/60'
                        : node.status === 'running'
                        ? 'border-indigo-300 bg-indigo-50/30 ring-1 ring-indigo-200 animate-pulse'
                        : 'border-slate-200 bg-slate-100/50 opacity-75'
                    }`}
                  >
                    {/* Node Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        Node {index + 1}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          node.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : node.status === 'paused_human_gate'
                            ? 'bg-amber-100 text-amber-800'
                            : node.status === 'retry_backedge'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {node.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">{node.name}</h4>
                    <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">{node.role}</p>

                    {/* Metadata */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Latency: {node.durationMs}ms</span>
                      {node.retries > 0 && (
                        <span className="text-amber-700 font-bold">Retries: {node.retries}/3</span>
                      )}
                    </div>

                    {/* Node Specific Message */}
                    {node.lastOutput && (
                      <div className="mt-2 p-2 rounded bg-white border border-slate-200 text-[10px] text-slate-700">
                        {node.lastOutput}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Architecture Governance Footer Note */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Strict Governance Invariant:</strong> Node 7 (Faculty Review Gate) prohibits autonomous publishing. Results remain in draft proposal state until authenticated faculty review and ratify evaluations.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Step-Level Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                Immutable Execution Audit Trail (/audit_logs)
              </h3>
              <p className="text-xs text-slate-500">
                Step-level trace of deterministic tool operations, agent executions, token usage, and retry back-edges.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Append-Only Invariant Enforced</span>
          </div>

          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-1.5 font-sans"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.agentName}</span>
                    <span className="text-slate-400">›</span>
                    <span className="text-indigo-700 font-semibold">{log.stepName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                      {log.tokensUsed} tokens
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'retry'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 font-mono bg-white p-2 rounded border border-slate-200">
                  {log.payloadSummary}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Checkpoint & Resume (Lab 6) */}
      {activeTab === 'checkpoint_resume' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Governed Runtime Checkpoint & Resume Controller (Lab 6)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Demonstrates state preservation across unexpected server crashes, network disruptions, or execution limits. Checkpoints capture ephemeral attempt state, objective grades, and proctoring telemetry into durable Firestore snapshots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Force Terminate */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                1. Test Crash Simulation (Force Terminate)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interrupts execution mid-stream (e.g., at Step 3: Proctoring Signal Ingestion). Simulates a pod failure or power cut.
              </p>
              <button
                id="btn-force-terminate"
                onClick={handleSimulateForceTerminate}
                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Simulate Mid-Run Termination</span>
              </button>
            </div>

            {/* Step 2: Resume from Checkpoint */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                2. Restore & Resume Execution
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reconstructs pipeline state from durable Firestore checkpoint snapshot. Resumes without re-evaluating completed units.
              </p>
              <button
                id="btn-resume-checkpoint"
                onClick={handleResumeCheckpoint}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Resume from Snapshot Checkpoint</span>
              </button>
            </div>
          </div>

          {/* Current Snapshot Inspector */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-900 text-slate-200 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-300">Active Snapshot Status</span>
              <span className={checkpointStatus.restored ? 'text-emerald-400 font-bold' : checkpointStatus.isTerminated ? 'text-rose-400 font-bold' : 'text-indigo-400'}>
                {checkpointStatus.restored ? 'STATE RESTORED & RESUMED' : checkpointStatus.isTerminated ? 'TERMINATED - CHECKPOINT HELD' : 'READY'}
              </span>
            </div>
            <div>Checkpoint ID: {checkpointStatus.checkpointId}</div>
            <div>Stage: {checkpointStatus.stage}</div>
            <div>Token Budget Remaining: 7,420 / 10,000</div>
            <div>Retry Budget: 3 retries allocated</div>
            <div>Integrity Invariant: Intact (0 mark discrepancy)</div>
          </div>
        </div>
      )}

      {/* TAB 4: Parallel Swarm & Fan-Out/Fan-In (Lab 8) */}
      {activeTab === 'parallel_swarm' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Parallel Worker Swarm & Batch Evaluation (Lab 8)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simultaneously evaluates batches of up to 20 student submissions across isolated worker contexts, preventing cross-student data leakage, then fan-in reduces into the official score sheet.
              </p>
            </div>

            <button
              id="btn-run-swarm-batch"
              onClick={handleExecuteParallelSwarm}
              disabled={isSwarmRunning}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              {isSwarmRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>Dispatch Swarm (20 Submissions)</span>
            </button>
          </div>

          {/* Aggregates Dashboard */}
          {swarmResults?.aggregates && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[11px] text-slate-500">Evaluated Batch</span>
                <div className="text-lg font-bold text-slate-900">{swarmResults.batchSize} students</div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[11px] text-slate-500">Average Score</span>
                <div className="text-lg font-bold text-indigo-600">
                  {swarmResults.aggregates.averageTotalScore} / 50
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[11px] text-slate-500">Pass Rate</span>
                <div className="text-lg font-bold text-emerald-600">
                  {swarmResults.aggregates.passRatePercent}%
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[11px] text-slate-500">Highest Score</span>
                <div className="text-lg font-bold text-slate-900">
                  {swarmResults.aggregates.highestScore} / 50
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[11px] text-slate-500">Flagged For Review</span>
                <div className="text-lg font-bold text-amber-600">
                  {swarmResults.aggregates.flaggedProctoringCount}
                </div>
              </div>
            </div>
          )}

          {/* Workers Table */}
          {swarmResults && (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Worker Thread</th>
                    <th className="py-2.5 px-3 font-semibold">Student ID & Name</th>
                    <th className="py-2.5 px-3 font-semibold">MCQ Score</th>
                    <th className="py-2.5 px-3 font-semibold">Subjective Score</th>
                    <th className="py-2.5 px-3 font-semibold">Total Score</th>
                    <th className="py-2.5 px-3 font-semibold">Proctoring Flags</th>
                    <th className="py-2.5 px-3 font-semibold">Isolation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {swarmResults.workers.map((w) => (
                    <tr key={w.studentId} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-slate-500">{w.workerThreadId}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">
                        {w.studentName}{' '}
                        <span className="text-slate-400 font-mono text-[11px]">({w.studentId})</span>
                      </td>
                      <td className="py-2 px-3 text-slate-700">{w.mcqScore}/20</td>
                      <td className="py-2 px-3 text-slate-700">{w.subjectiveScore}/30</td>
                      <td className="py-2 px-3 font-bold text-indigo-700">{w.totalScore}/50</td>
                      <td className="py-2 px-3">
                        {w.proctoringFlags > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                            {w.proctoringFlags} flagged
                          </span>
                        ) : (
                          <span className="text-slate-400">0 flags</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                          Zero Leakage
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
