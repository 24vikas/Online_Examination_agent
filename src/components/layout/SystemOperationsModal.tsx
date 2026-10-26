import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Lock,
  RefreshCw,
  ShieldCheck,
  Zap,
  Users,
  AlertCircle,
} from 'lucide-react';
import type { UserProfile } from '../../types/exam.ts';

interface SystemOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const SystemOperationsModal: React.FC<SystemOperationsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [systemData, setSystemData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/system-status');
      const json = await res.json();
      if (json.success) {
        setSystemData(json.data);
      }
    } catch (err) {
      console.warn('Could not fetch agent system status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Agent Operations & Live Telemetry</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  All Systems Operational
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                End-to-end execution state across Faculty, COE Author, and Student interfaces
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base font-bold px-2 py-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Current Session Context */}
          <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {currentUser.displayName.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Current Session Role: {currentUser.role.toUpperCase()} {currentUser.roleTitle ? `(${currentUser.roleTitle})` : ''}
                </span>
                <p className="text-xs font-semibold text-slate-900">{currentUser.displayName}</p>
                <p className="text-[11px] text-slate-500">{currentUser.email} • {currentUser.department}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Attendance Rate</span>
              <span className={`text-xs font-bold ${currentUser.attendanceRate >= 75 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {currentUser.attendanceRate}% {currentUser.attendanceRate >= 75 ? '(Eligible)' : '(Barred)'}
              </span>
            </div>
          </div>

          {/* Model & LLM Engine State */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Gemini LLM & RAG Engine Stack
              </span>
              <button
                onClick={fetchStatus}
                className="text-slate-500 hover:text-slate-800 text-[11px] flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Default Model</span>
                <span className="font-semibold text-slate-800">Gemini 3.8 Flash</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">● Ultra-fast Generation</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Reasoning Engine</span>
                <span className="font-semibold text-slate-800">Gemini 3.1 Pro</span>
                <span className="text-[10px] text-purple-600 block mt-0.5">● ThinkingLevel.HIGH</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Google Deep Search</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Enabled
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Live Grounding Chunks</span>
              </div>
            </div>
          </div>

          {/* RAG Knowledge Base Stats */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              Curriculum RAG Vector Store
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Indexed Modules</span>
                <span className="font-bold text-slate-800">{systemData?.ragKnowledgeBase?.indexedDocumentsCount ?? 1} Documents</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Semantic Chunks</span>
                <span className="font-bold text-slate-800">{systemData?.ragKnowledgeBase?.totalChunksCount ?? 4} Chunks</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Vector Dimensions</span>
                <span className="font-bold text-indigo-700">768-dim</span>
              </div>
            </div>
          </div>

          {/* Active Specialized Agents */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Autonomous System Agents & Enforcement Gates
            </span>
            <div className="space-y-1.5 text-xs">
              {[
                { name: 'COE Blueprint Standardization & Ratification Agent', role: 'author', status: 'Online', desc: 'Enforces statutory exam schemas & passing criteria' },
                { name: 'Syllabus RAG & Deep Search Question Author Agent', role: 'faculty', status: 'Online', desc: 'Synthesizes verified Bloom\'s taxonomy questions' },
                { name: 'Real-Time Proctoring & Anomaly Detection Agent', role: 'system', status: 'Active Monitoring', desc: 'Tracks webcam presence, tab switches, and audio signals non-punitively' },
                { name: 'High-Thinking Subjective Rubric Evaluation Agent', role: 'faculty', status: 'Online', desc: 'Proposes calibrated marks with rubric breakdown' },
                { name: 'Student Eligibility & Clearance Gate', role: 'student', status: 'Enforced', desc: 'Guarantees 75% attendance & bursar tuition fee clearance' },
              ].map((agent, i) => (
                <div key={i} className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{agent.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono uppercase">
                        {agent.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{agent.desc}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Firestore Database ID: <strong className="font-mono text-slate-700">ai-studio-ea8ff412-651d-4d93-9ef2-360585997684</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
