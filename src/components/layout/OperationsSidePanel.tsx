import React from 'react';
import { X, Bot, Activity, Cpu, Sparkles, ShieldCheck, Layers } from 'lucide-react';
import type { UserProfile } from '../../types/exam.ts';
import { Button } from '../ui/Button.tsx';

interface OperationsSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onOpenAIChat: (role?: 'student_advisor' | 'faculty_invigilator' | 'grievance_mediator') => void;
  onOpenSystemOps?: () => void;
}

export const OperationsSidePanel: React.FC<OperationsSidePanelProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAIChat,
  onOpenSystemOps,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="System Operations & AI Panel"
      className="fixed inset-0 z-50 overflow-hidden font-sans select-none"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#10251F]/40 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E3EAE6] shadow-xl flex flex-col animate-in slide-in-from-right duration-150">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E3EAE6] flex items-center justify-between bg-[#1F4D3F] text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#173B30] flex items-center justify-center text-white">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-white">
                  Operations &amp; AI Center
                </h3>
                <p className="text-[11px] text-white/70">Institutional assistant and diagnostics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close operations panel"
              className="p-1.5 rounded-[8px] text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Gemini Academic AI Copilot */}
            <div className="bg-[#F6F9F6] border border-[#E3EAE6] rounded-[16px] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[10px] bg-[#D6EBDD] text-[#1F4D3F] flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#10251F]">Academic AI Assistant</h4>
                    <p className="text-[11px] text-[#5B6B66]">Curriculum &amp; syllabus reasoning model</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D6EBDD] text-[#1F4D3F] border border-[#1F4D3F]/20 font-medium">
                  Active
                </span>
              </div>
              <p className="text-xs text-[#5B6B66] leading-relaxed">
                Invoke Gemini for syllabus alignment audits, question rubric refinement, student advisory guidance, or mediation analysis for revaluation petitions.
              </p>
              <div className="pt-2">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    onClose();
                    onOpenAIChat(
                      currentUser.role === 'student' ? 'student_advisor' : 'faculty_invigilator',
                    );
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1F4D3F]" />
                  <span>Launch AI Assistant</span>
                </Button>
              </div>
            </div>

            {/* System Operations & Diagnostics */}
            {onOpenSystemOps && (
              <div className="bg-white border border-[#E3EAE6] rounded-[16px] p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[10px] bg-[#D6EBDD] text-[#1F4D3F] flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#10251F]">
                        System Invariants &amp; Telemetry
                      </h4>
                      <p className="text-[11px] text-[#5B6B66]">RAG vectors, DAG pipeline, proctor engine</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-[#15803D] font-mono tabular-nums">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                    Nominal
                  </span>
                </div>
                <p className="text-xs text-[#5B6B66] leading-relaxed">
                  Inspect active autonomous agents, telemetry bridges, vector store embeddings, and proctoring media streams.
                </p>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    onClose();
                    onOpenSystemOps();
                  }}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open Diagnostics Console</span>
                </Button>
              </div>
            )}

            {/* Platform Metadata */}
            <div className="border border-[#E3EAE6] rounded-[16px] p-4 space-y-2 bg-[#F6F9F6] text-xs">
              <h5 className="font-semibold text-[#10251F] text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1F4D3F]" />
                Institutional Platform Metadata
              </h5>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5B6B66] pt-1">
                <div>
                  <span className="text-[#5B6B66] block">Institution:</span>
                  <span className="font-medium text-[#10251F]">KLE Technological Univ.</span>
                </div>
                <div>
                  <span className="text-[#5B6B66] block">Current User:</span>
                  <span className="font-medium text-[#10251F]">{currentUser.displayName}</span>
                </div>
                <div>
                  <span className="text-[#5B6B66] block">Active Role:</span>
                  <span className="font-mono uppercase font-semibold text-[#10251F]">{currentUser.role}</span>
                </div>
                <div>
                  <span className="text-[#5B6B66] block">Proctor Model:</span>
                  <span className="text-[#10251F]">Non-punitive Human Gate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#E3EAE6] bg-[#F6F9F6] flex items-center justify-between text-xs text-[#5B6B66]">
            <span>Online Course Examination Agent</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
