import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Brain,
  Trash2,
  User,
  GraduationCap,
  Shield,
  LifeBuoy,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import type { UserProfile } from '../../types/exam.ts';

interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  thinkingMode?: boolean;
}

interface AcademicAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  defaultRole?: 'student_advisor' | 'faculty_invigilator' | 'grievance_mediator';
}

export const AcademicAIChatModal: React.FC<AcademicAIChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  defaultRole,
}) => {
  const [role, setRole] = useState<'student_advisor' | 'faculty_invigilator' | 'grievance_mediator'>(
    defaultRole || (currentUser.role === 'faculty' ? 'faculty_invigilator' : 'student_advisor'),
  );
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-pro-preview');
  const [useThinkingMode, setUseThinkingMode] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'model',
      text:
        currentUser.role === 'faculty'
          ? "Welcome Dr. Eleanor Vance. I am your Gemini Academic Invigilator and Assessment Consultant. I can help synthesize syllabus questions, calibrate subjective rubrics, or analyze complex proctoring integrity telemetry."
          : `Hello ${currentUser.displayName}! I am your Academic Examination Advisor. I can explain eligibility requirements (attendance & fees), guide practice test strategies, and assist with formal revaluation petitions. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.1-pro-preview',
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (defaultRole) setRole(defaultRole);
  }, [defaultRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_usr_${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history for multi-turn
      const historyPayload = messages.map((m) => ({
        role: m.sender,
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/gemini/academic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          message: userMsg.text,
          history: historyPayload,
          model: selectedModel,
          thinkingLevel: useThinkingMode && selectedModel === 'gemini-3.1-pro-preview' ? 'HIGH' : undefined,
          contextData: {
            userName: currentUser.displayName,
            userRole: currentUser.role,
            department: currentUser.department,
            attendanceRate: currentUser.attendanceRate,
            feeCleared: currentUser.feeCleared,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to receive AI response');
      }

      const botMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: 'model',
        text: json.data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: json.data.modelUsed || selectedModel,
        thinkingMode: useThinkingMode,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'model',
        text: `Consultation Service Note: ${err.message || 'Unable to complete request. Please retry.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg_reset_${Date.now()}`,
        sender: 'model',
        text: 'Consultation session refreshed. Ready for your academic queries.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      },
    ]);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in select-none">
      <div className="bg-white rounded-xl max-w-2xl w-full h-[650px] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-[#0B2545] text-white p-4 flex items-center justify-between shrink-0 border-b border-[#0B2545]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F4C81] flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Gemini Academic AI Copilot</h3>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-[#E8F0F8] text-[#0F4C81]">
                  Thinking: {useThinkingMode && selectedModel === 'gemini-3.1-pro-preview' ? 'HIGH' : 'OFF'}
                </span>
              </div>
              <p className="text-xs text-white/70">Multi-turn Academic Advisor & Invigilation Consultant</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetChat}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Toolbar: Persona & Model Selection */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Persona selector */}
          <div className="flex items-center gap-2">
            <span className="text-[#475569] font-medium">Persona:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#0B2545] focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-medium min-h-[44px]"
            >
              <option value="student_advisor">Student Academic Advisor</option>
              <option value="faculty_invigilator">Faculty Invigilation Consultant</option>
              <option value="grievance_mediator">Grievance Revaluation Mediator</option>
            </select>
          </div>

          {/* Model selection & Thinking toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[#475569] font-medium">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-white border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[#0B2545] focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-mono text-xs min-h-[44px]"
            >
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Thinking)</option>
              <option value="gemini-3.5-flash">gemini-3.5-flash (Standard)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
            </select>

            {selectedModel === 'gemini-3.1-pro-preview' && (
              <label className="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#0F4C81] min-h-[44px]">
                <Brain className="w-4 h-4 text-[#0F4C81]" />
                <input
                  type="checkbox"
                  checked={useThinkingMode}
                  onChange={(e) => setUseThinkingMode(e.target.checked)}
                  className="rounded accent-[#0F4C81]"
                />
                <span>High thinking</span>
              </label>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
          {messages.map((msg) => {
            const isMe = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-lg bg-[#0F4C81] text-white flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-[#0B2545] text-white'
                      : 'bg-white text-[#0B2545] border border-[#E2E8F0]'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div
                    className={`mt-1.5 flex items-center gap-2 text-xs ${
                      isMe ? 'text-white/70 justify-end' : 'text-[#475569]'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="font-mono bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] px-1 rounded">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>
                </div>

                {isMe && (
                  <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white flex items-center justify-center shrink-0 text-xs font-semibold">
                    {currentUser.displayName.charAt(0)}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-[#475569]">
              <div className="w-8 h-8 rounded-lg bg-[#0F4C81] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-xs flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#0F4C81] animate-pulse" />
                <span>
                  {selectedModel === 'gemini-3.1-pro-preview' && useThinkingMode
                    ? 'Gemini 3.1 Pro Thinking Mode engaged... formulating academic reasoning...'
                    : 'Gemini generating response...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-[#E2E8F0] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            id="academic-chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              role === 'student_advisor'
                ? 'Ask about attendance criteria, registration, or revaluation procedures...'
                : role === 'faculty_invigilator'
                ? 'Ask for rubric calibration, integrity incident evaluation, or question synthesis...'
                : 'Ask for guidance on resolving subjective grading grievances...'
            }
            className="flex-1 bg-white border border-[#E2E8F0] rounded-lg px-3.5 py-2.5 text-xs text-[#0B2545] focus:outline-none focus:ring-2 focus:ring-[#0F4C81] min-h-[44px]"
          />
          <button
            type="submit"
            id="academic-chat-send-btn"
            disabled={!inputText.trim() || isLoading}
            className="min-h-[44px] min-w-[44px] px-4 flex items-center justify-center bg-[#F97316] hover:bg-[#EA580C] disabled:bg-[#F97316]/50 text-[#0B2545] font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
