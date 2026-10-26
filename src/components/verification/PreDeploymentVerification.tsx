import React, { useState } from 'react';
import {
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  Cpu,
  Layers,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import type { GateCheckResult } from '../../types/exam.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { StatusChip } from '../ui/StatusChip.tsx';

export const PreDeploymentVerification: React.FC = () => {
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);
  const [activeCheckLab, setActiveCheckLab] = useState<number | null>(1);
  const [runningLab, setRunningLab] = useState<number | null>(null);

  const [gateChecks, setGateChecks] = useState<GateCheckResult[]>([
    {
      labNumber: 1,
      labTitle: 'Lab 1: Agent Planner Loop',
      commandOrTrigger: 'Execute incomplete command: "/exam-agent setup-exam CS-402"',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Tests coordinator pause on missing duration/window and clarification prompts.',
    },
    {
      labNumber: 2,
      labTitle: 'Lab 2: Deterministic Tool Calling',
      commandOrTrigger: 'Invoke tool "check_eligibility" with attendance = 71.0%, feeCleared = false',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Tests deterministic eligibility verdict without prompt manipulation.',
    },
    {
      labNumber: 3,
      labTitle: 'Lab 3: Reusable Schema-Typed Skills',
      commandOrTrigger: 'Run "exam_planner_skill" on CS-201 Data Structures vs OS-301 Operating Systems',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Verifies universal skill contract execution with zero code modification.',
    },
    {
      labNumber: 4,
      labTitle: 'Lab 4: Two-Tier Memory Separation',
      commandOrTrigger: 'Verify state boundary between ephemeral student attempts and long-term vector question bank',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Tests that attempt telemetry never pollutes shared embedding vector indexes.',
    },
    {
      labNumber: 5,
      labTitle: 'Lab 5: MCP-Style Connector Security',
      commandOrTrigger: 'Attempt direct database write bypass vs governed connector call',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Verifies direct DB bypass is intercepted (DIRECT_DB_BYPASS_PROHIBITED).',
    },
    {
      labNumber: 6,
      labTitle: 'Lab 6: Governed Runtime & Checkpoint Resume',
      commandOrTrigger: 'Force-terminate running evaluation mid-step; trigger resume from Firestore snapshot',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Confirms mid-evaluation state recovery with 100% audit trail preservation.',
    },
    {
      labNumber: 7,
      labTitle: 'Lab 7: DAG Node Graph & Bounded Back-Edge',
      commandOrTrigger: 'Trigger score ceiling violation (16/15 marks); verify back-edge regeneration',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Tests validation agent bounded retry back-edge to regenerate only the failing unit.',
    },
    {
      labNumber: 8,
      labTitle: 'Lab 8: Parallel Swarm & Fan-Out/Fan-In',
      commandOrTrigger: 'Dispatch concurrent evaluation swarm across batch of 20 simulated submissions',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Verifies parallel map execution completes without cross-student leakage.',
    },
    {
      labNumber: 9,
      labTitle: 'Lab 9: Deep Research & Syllabus Evidence Grounding',
      commandOrTrigger: 'Synthesize context across syllabus RAG chunks and external academic benchmarks',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Verifies that 100% of generated questions and evaluation criteria are grounded in syllabus chunks and ACM/IEEE benchmarks with zero hallucination.',
    },
    {
      labNumber: 10,
      labTitle: 'Lab 10: Self-Healing Ops & Bounded Retry Fault Resilience',
      commandOrTrigger: 'Simulate downstream API 429 quota exhaustion and malformed payload retry',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Verifies automatic fallback to academic repository and bounded retries without pipeline disruption.',
    },
    {
      labNumber: 11,
      labTitle: 'Lab 11: SDLC Acceptance Factory (4-Invariant Validation Suite)',
      commandOrTrigger: 'Execute 4-check invariant test (Check 0: unique paper, Check 1: flag-only integrity, Check 2: score <= maxMarks, Check 3: held in DRAFT)',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Tests all 4 core invariants before presenting to human authority.',
    },
    {
      labNumber: 12,
      labTitle: 'Lab 12: Versioned Governance & Rollback Gate',
      commandOrTrigger: 'Attempt result publishing without human approval token, followed by approved publish and one-click rollback check',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Verifies that autonomous publish is strictly blocked without valid humanApprovalToken and that rollback checkpoints are ready.',
    },
    {
      labNumber: 13,
      labTitle: 'Lab 13: Item-Type Domain Specialists',
      commandOrTrigger: 'Evaluate MCQ distractor plausibility and 4-part weighted subjective rubric (40/30/20/10%)',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Tests deterministic MCQ scoring and 4-criterion subjective rubric evaluation capped at maxMarks.',
    },
    {
      labNumber: 14,
      labTitle: 'Lab 14: Capstone Telemetry & State-Machine Sync',
      commandOrTrigger: 'Sync Google AI Studio Function Calling with Antigravity IDE and live [AURA_TELEMETRY_SYNC] heartbeat',
      status: 'pending',
      durationMs: 0,
      evidence: 'Awaiting execution. Verifies end-to-end telemetry sync between Google AI Studio function declarations and Antigravity IDE state machine.',
    },
  ]);

  // Run all gate checks
  const handleRunAll = async () => {
    setIsRunningAll(true);
    setGateChecks((prev) => prev.map((c) => ({ ...c, status: 'running' })));

    try {
      const res = await fetch('/api/agent/verify-gate-checks', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.data?.results) {
        setGateChecks(data.data.results);
      }
    } catch (e) {
      console.error('Error running gate checks:', e);
    } finally {
      setIsRunningAll(false);
    }
  };

  // Run a single gate check
  const handleRunSingle = async (labNum: number) => {
    setRunningLab(labNum);
    setGateChecks((prev) =>
      prev.map((c) => (c.labNumber === labNum ? { ...c, status: 'running' } : c))
    );

    try {
      const res = await fetch('/api/agent/verify-gate-checks', { method: 'POST' });
      const data = await res.json();
      if (data.data?.results) {
        const item = data.data.results.find((r: any) => r.labNumber === labNum);
        if (item) {
          setGateChecks((prev) =>
            prev.map((c) => (c.labNumber === labNum ? item : c))
          );
        }
      }
    } catch (e) {
      console.error('Error running single check:', e);
    } finally {
      setRunningLab(null);
    }
  };

  const totalChecksCount = gateChecks.length;
  const passedCount = gateChecks.filter((c) => c.status === 'passed').length;
  const isAllPassed = passedCount === totalChecksCount && totalChecksCount > 0;

  return (
    <div className="space-y-6">
      {/* Top Protocol Header */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#E8F0F8] text-[#0F4C81] border border-[#CBD5E1]">
              Verification Protocol
            </span>
            <span className="text-xs text-[#475569] font-mono">Academic Labs 1 through 14</span>
          </div>
          <h2 className="text-xl font-semibold text-[#0B2545] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0F4C81]" />
            Pre-Deployment Verification Protocol Suite
          </h2>
          <p className="text-xs text-[#475569] max-w-2xl mt-1 leading-relaxed">
            Mandatory operational gate check console executing end-to-end evidence collection for Labs 1 through 14: Agent Loop, Tool Calling, Skills Contract, Memory Separation, MCP Connector, Governed Runtime, DAG Node Graph, Parallel Swarms, Evidence Grounding, Self-Healing, SDLC Factory, Versioned Governance, Item-Type Specialists, and Capstone Telemetry.
          </p>
        </div>

        {/* Master Run Button */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-xs text-[#475569] block font-mono">Verification Status</span>
            <div className="mt-0.5">
              <StatusChip
                status={isAllPassed ? 'success' : passedCount > 0 ? 'warning' : 'neutral'}
                label={`${passedCount} of ${totalChecksCount} passed`}
              />
            </div>
          </div>

          <Button
            id="btn-run-all-gates"
            variant="primary"
            onClick={handleRunAll}
            disabled={isRunningAll}
          >
            {isRunningAll ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>Run All {totalChecksCount} Gate Checks</span>
          </Button>
        </div>
      </Card>

      {/* Progress & Acceptance Criteria Summary */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#0B2545]">Lab Gate Checks Acceptance Suite</h3>
            <p className="text-xs text-[#475569]">
              Deterministic verification proving architectural guardrails and invariant compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#0F4C81] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(passedCount / totalChecksCount) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-[#0B2545] font-mono">
              {Math.round((passedCount / totalChecksCount) * 100)}%
            </span>
          </div>
        </div>

        {/* Gate Checks Accordion */}
        <div className="space-y-2.5">
          {gateChecks.map((check) => {
            const isExpanded = activeCheckLab === check.labNumber;
            const isSingleRunning = runningLab === check.labNumber;

            const chipStatus =
              check.status === 'passed'
                ? 'success'
                : check.status === 'running'
                ? 'info'
                : check.status === 'failed'
                ? 'danger'
                : 'neutral';

            return (
              <div
                key={check.labNumber}
                className="rounded-lg border border-[#E2E8F0] bg-white transition-all overflow-hidden hover:border-[#CBD5E1]"
              >
                {/* Header */}
                <div
                  onClick={() => setActiveCheckLab(isExpanded ? null : check.labNumber)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-[#F8FAFC]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-medium text-xs shrink-0 ${
                        check.status === 'passed'
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : check.status === 'running'
                          ? 'bg-[#E8F0F8] text-[#0F4C81]'
                          : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]'
                      }`}
                    >
                      {check.status === 'passed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : check.status === 'running' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span className="font-mono text-[11px]">L{check.labNumber}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-[#0B2545] truncate">
                          {check.labTitle}
                        </h4>
                        {check.durationMs > 0 && (
                          <span className="text-xs text-[#475569] font-mono">
                            ({check.durationMs}ms)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#475569] font-mono truncate mt-0.5">
                        {check.commandOrTrigger}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunSingle(check.labNumber);
                      }}
                      disabled={isSingleRunning || isRunningAll}
                      className="min-h-[44px] px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#F8FAFC] text-[#0B2545] border border-[#0B2545] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSingleRunning ? 'Running...' : 'Run check'}
                    </button>

                    <StatusChip status={chipStatus} label={check.status} />

                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#475569]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#475569]" />
                    )}
                  </div>
                </div>

                {/* Expanded Details & Evidence */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#E2E8F0] text-xs space-y-3 bg-[#F8FAFC]">
                    <div>
                      <span className="text-xs font-semibold text-[#475569] block mb-1">
                        Operational evidence and verification proof
                      </span>
                      <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] text-[#0B2545] leading-relaxed font-mono text-xs">
                        {check.evidence}
                      </div>
                    </div>

                    {check.details && (
                      <div>
                        <span className="text-xs font-semibold text-[#475569] block mb-1">
                          Structured verification output
                        </span>
                        <pre className="p-3 rounded-lg bg-[#0B2545] text-[#E8F0F8] font-mono text-xs overflow-x-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
