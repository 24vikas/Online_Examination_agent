import React, { useState, useEffect } from 'react';
import type { Flashcard, StudyNote, Question } from '../../types/exam.ts';

interface AcademicStudyPortalProps {
  userRole?: 'student' | 'faculty' | 'author';
  initialCourseCode?: string;
  onNavigateToExam?: (examId: string) => void;
}

export const AcademicStudyPortal: React.FC<AcademicStudyPortalProps> = ({
  userRole = 'student',
  initialCourseCode = 'CS-301',
  onNavigateToExam,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<string>(initialCourseCode);
  const [activeTab, setActiveTab] = useState<'flashcards' | 'mcq_bank' | 'notes' | 'essays'>('flashcards');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Data states
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [essays, setEssays] = useState<any[]>([]);
  const [studyNote, setStudyNote] = useState<StudyNote | null>(null);
  const [isQuotaFallback, setIsQuotaFallback] = useState<boolean>(false);

  // Flashcard interaction states
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [flashcardFilter, setFlashcardFilter] = useState<'all' | 'unread' | 'review' | 'mastered'>('all');
  const [bloomsFilter, setBloomsFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  // MCQ interaction states
  const [mcqSearch, setMcqSearch] = useState<string>('');
  const [mcqDifficulty, setMcqDifficulty] = useState<string>('all');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedExplanations, setRevealedExplanations] = useState<Record<number, boolean>>({});

  // Essay interaction states
  const [expandedEssayId, setExpandedEssayId] = useState<number | null>(0);
  const [userEssayAnswers, setUserEssayAnswers] = useState<Record<number, string>>({});
  const [showModelAnswer, setShowModelAnswer] = useState<Record<number, boolean>>({});

  // Fetch subject bank from server
  useEffect(() => {
    fetchSubjectBank(selectedCourse);
  }, [selectedCourse]);

  const fetchSubjectBank = async (courseCode: string) => {
    setIsLoading(true);
    setIsFlipped(false);
    setActiveFlashcardIndex(0);
    try {
      const res = await fetch('/api/gemini/subject-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseCode }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const bank = data.data;
        setFlashcards(bank.flashcards || []);
        setMcqs(bank.mcqs || []);
        setEssays(bank.essays || []);
        setStudyNote(bank.notes || null);
        setIsQuotaFallback(Boolean(bank.quotaFallbackActive));
      }
    } catch (err) {
      console.error('Error fetching subject bank:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered flashcards
  const filteredFlashcards = flashcards.filter((fc) => {
    if (flashcardFilter !== 'all' && (fc.status || 'unread') !== flashcardFilter) {
      return false;
    }
    if (bloomsFilter !== 'all' && fc.bloomsTaxonomy !== bloomsFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchConcept = fc.conceptTitle.toLowerCase().includes(q);
      const matchText = fc.questionOrScenario.toLowerCase().includes(q);
      const matchTopic = fc.topic.toLowerCase().includes(q);
      if (!matchConcept && !matchText && !matchTopic) return false;
    }
    return true;
  });

  const currentFlashcard = filteredFlashcards[activeFlashcardIndex] || filteredFlashcards[0];

  // Update card mastery status
  const updateCardStatus = (cardId: string, status: 'unread' | 'review' | 'mastered') => {
    setFlashcards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status } : c))
    );
  };

  // Flashcard stats
  const masteredCount = flashcards.filter((c) => c.status === 'mastered').length;
  const reviewCount = flashcards.filter((c) => c.status === 'review').length;
  const unreadCount = flashcards.length - masteredCount - reviewCount;
  const masteryPercentage = flashcards.length > 0 ? Math.round((masteredCount / flashcards.length) * 100) : 0;

  // Filtered MCQs
  const filteredMcqs = mcqs.filter((m) => {
    if (mcqDifficulty !== 'all' && m.difficulty !== mcqDifficulty) return false;
    if (mcqSearch.trim()) {
      const q = mcqSearch.toLowerCase();
      const matchPrompt = m.prompt.toLowerCase().includes(q);
      const matchTopic = (m.topic || '').toLowerCase().includes(q);
      if (!matchPrompt && !matchTopic) return false;
    }
    return true;
  });

  // Calculate score for practiced MCQs
  const answeredMcqCount = Object.keys(selectedAnswers).length;
  const correctMcqCount = Object.entries(selectedAnswers).filter(([idx, ans]) => {
    const q = mcqs[Number(idx)];
    return q && q.correctAnswer === ans;
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Academic Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Academic Curriculum Repository
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                100 Flashcards & 50 MCQs
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                College Level Rigor
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">
              Study Hub & Academic Knowledge Base
            </h1>
            <p className="text-slate-550 text-sm mt-1">
              Multi-agent synthesized college notes, 100 concept flashcards, and 50 scenario MCQs grounded in IEEE/ACM computer science curricula.
            </p>
          </div>

          {/* Course Switcher */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Subject:
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white shadow-xs"
            >
              <option value="CS-301">CS 301: Distributed Systems & Consensus</option>
              <option value="AI-204">AI 204: Deep Learning & Transformers</option>
              <option value="CS-305">CS 305: Advanced Database Systems</option>
              <option value="CS-402">CS 402: Networks & Cloud Systems</option>
            </select>
          </div>
        </div>

        {/* Fail-Safe Quota Notice Banner */}
        <div className="mt-4 p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>
              <strong>Academic Knowledge Engine Active:</strong> Full college-level syllabus bank pre-loaded with verified mathematical invariants, algorithm phases, and Bloom's taxonomy criteria. Fully operable even during Gemini API quota limits.
            </span>
          </div>
          <span className="font-mono text-emerald-700 bg-white/70 px-2 py-0.5 rounded border border-emerald-300">
            {flashcards.length} Cards • {mcqs.length} MCQs • {essays.length} Essays
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mt-6 gap-6">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'flashcards'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>📇 100 Concept Flashcards</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800">
              {flashcards.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mcq_bank')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'mcq_bank'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>📝 50 College-Level MCQs</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
              {mcqs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>📖 High-Yield Study Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('essays')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'essays'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>⚖️ Synthesis Essays & Rubrics</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
              {essays.length}
            </span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-700 font-semibold">Loading academic repository for {selectedCourse}...</p>
          <p className="text-xs text-slate-400 mt-1">Ingesting 100 concept cards and 50 scenario-based questions</p>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* TAB 1: 100 CONCEPT-WISE FLASHCARDS */}
      {/* ========================================================================= */}
      {!isLoading && activeTab === 'flashcards' && (
        <div className="space-y-6">
          {/* Flashcard Stats & Mastery Progress Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Concept Mastery Progress
                </span>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {masteredCount} of {flashcards.length} Concepts Mastered ({masteryPercentage}%)
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {masteredCount} Mastered
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {reviewCount} Review
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  {unreadCount} Unread
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(masteredCount / flashcards.length) * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
              />
              <div
                style={{ width: `${(reviewCount / flashcards.length) * 100}%` }}
                className="bg-amber-400 h-full transition-all duration-300"
              />
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search 100 concepts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveFlashcardIndex(0);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Status filter */}
              <select
                value={flashcardFilter}
                onChange={(e) => {
                  setFlashcardFilter(e.target.value as any);
                  setActiveFlashcardIndex(0);
                }}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses ({flashcards.length})</option>
                <option value="unread">Unread Only ({unreadCount})</option>
                <option value="review">Needs Review ({reviewCount})</option>
                <option value="mastered">Mastered ({masteredCount})</option>
              </select>

              {/* Bloom's level filter */}
              <select
                value={bloomsFilter}
                onChange={(e) => {
                  setBloomsFilter(e.target.value);
                  setActiveFlashcardIndex(0);
                }}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Bloom Levels</option>
                <option value="Understanding">Understanding</option>
                <option value="Applying">Applying</option>
                <option value="Analyzing">Analyzing</option>
                <option value="Evaluating">Evaluating</option>
              </select>
            </div>

            {/* View Mode Toggle & Shuffle */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={() => {
                  const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
                  setFlashcards(shuffled);
                  setActiveFlashcardIndex(0);
                  setIsFlipped(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
                title="Randomize card order"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Shuffle
              </button>

              <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('single')}
                  className={`px-3 py-1.5 text-xs font-semibold ${
                    viewMode === 'single'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Single Card
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-xs font-semibold ${
                    viewMode === 'grid'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Grid View
                </button>
              </div>
            </div>
          </div>

          {/* SINGLE CARD INTERACTIVE 3D FLIP VIEW */}
          {viewMode === 'single' && currentFlashcard && (
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Card Index & Badge Header */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Card {activeFlashcardIndex + 1} of {filteredFlashcards.length} (Filtered)
                </span>
                <span className="font-mono text-slate-400">
                  ID: {currentFlashcard.id}
                </span>
              </div>

              {/* The 3D Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer min-h-[380px] perspective-1000 group select-none"
              >
                <div
                  className={`relative w-full min-h-[380px] transition-transform duration-500 transform-style-3d shadow-md hover:shadow-lg rounded-2xl ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT OF CARD */}
                  <div
                    className={`absolute inset-0 w-full h-full bg-white border-2 border-indigo-200/80 rounded-2xl p-8 flex flex-col justify-between backface-hidden ${
                      isFlipped ? 'pointer-events-none' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {currentFlashcard.topic}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">
                            {currentFlashcard.subtopic || 'Core Principle'}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Bloom: {currentFlashcard.bloomsTaxonomy}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mt-2">
                        {currentFlashcard.conceptTitle}
                      </h3>

                      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-base leading-relaxed font-medium">
                        {currentFlashcard.questionOrScenario}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Click card or press Space to reveal answer & tradeoffs
                      </span>
                      <span className="font-semibold text-slate-500">
                        Status: <span className="capitalize">{currentFlashcard.status || 'unread'}</span>
                      </span>
                    </div>
                  </div>

                  {/* BACK OF CARD */}
                  <div
                    className={`absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-8 flex flex-col justify-between rotate-y-180 backface-hidden overflow-y-auto ${
                      !isFlipped ? 'pointer-events-none' : ''
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-widest text-indigo-300">
                          Explanation & Academic Invariant
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded bg-indigo-800/60 text-indigo-200 border border-indigo-600/50">
                          {currentFlashcard.conceptTitle}
                        </span>
                      </div>

                      {/* Main explanation */}
                      <div className="text-sm text-slate-100 leading-relaxed font-normal">
                        {currentFlashcard.answerExplanation}
                      </div>

                      {/* Formula or Key Rule Box */}
                      {currentFlashcard.keyRuleOrFormula && (
                        <div className="p-3 bg-black/40 border border-indigo-400/30 rounded-lg text-xs font-mono text-emerald-300">
                          <span className="text-slate-400 block text-[10px] uppercase font-sans mb-1">
                            Formal Invariant / Algorithm Rule:
                          </span>
                          {currentFlashcard.keyRuleOrFormula}
                        </div>
                      )}

                      {/* Architectural Tradeoffs */}
                      {currentFlashcard.architecturalTradeoffs && (
                        <div className="p-3 bg-indigo-900/40 border border-indigo-500/30 rounded-lg text-xs text-indigo-100">
                          <span className="text-indigo-300 font-bold block mb-1">
                            ⚖️ Architectural Trade-off:
                          </span>
                          {currentFlashcard.architecturalTradeoffs}
                        </div>
                      )}

                      {/* Common Pitfalls */}
                      {currentFlashcard.commonPitfalls && (
                        <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-200">
                          <span className="text-rose-400 font-bold block mb-1">
                            ⚠️ Common Examination Pitfall:
                          </span>
                          {currentFlashcard.commonPitfalls}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-indigo-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Click to flip back</span>
                      <span className="text-indigo-300 font-mono">IEEE/ACM Grounded</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Mastery & Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                {/* Navigation controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setActiveFlashcardIndex((prev) => Math.max(0, prev - 1));
                    }}
                    disabled={activeFlashcardIndex === 0}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setActiveFlashcardIndex((prev) => Math.min(filteredFlashcards.length - 1, prev + 1));
                    }}
                    disabled={activeFlashcardIndex >= filteredFlashcards.length - 1}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Next →
                  </button>
                </div>

                {/* Self-evaluation mastery tags */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 mr-1">Self-Assessment:</span>
                  <button
                    onClick={() => updateCardStatus(currentFlashcard.id, 'review')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      currentFlashcard.status === 'review'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    Needs Review
                  </button>
                  <button
                    onClick={() => updateCardStatus(currentFlashcard.id, 'mastered')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      currentFlashcard.status === 'mastered'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    ✓ Mastered
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GRID VIEW (Shows all cards in responsive layout) */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFlashcards.map((fc, idx) => (
                <div
                  key={fc.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-bold text-indigo-600">{fc.topic}</span>
                      <span className="px-2 py-0.5 text-[10px] rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {fc.bloomsTaxonomy}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{fc.conceptTitle}</h4>
                    <p className="text-slate-600 text-xs mt-2 line-clamp-3">
                      {fc.questionOrScenario}
                    </p>

                    <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      <span className="font-semibold text-slate-800 block text-[11px] mb-0.5">Answer:</span>
                      <p className="line-clamp-2">{fc.answerExplanation}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        fc.status === 'mastered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : fc.status === 'review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {fc.status || 'unread'}
                    </span>

                    <button
                      onClick={() => {
                        const originalIdx = filteredFlashcards.findIndex((c) => c.id === fc.id);
                        if (originalIdx !== -1) {
                          setActiveFlashcardIndex(originalIdx);
                          setViewMode('single');
                          setIsFlipped(false);
                        }
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs"
                    >
                      Study Card →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 50 COLLEGE-LEVEL MCQS BANK */}
      {/* ========================================================================= */}
      {!isLoading && activeTab === 'mcq_bank' && (
        <div className="space-y-6">
          {/* MCQ Practice Summary Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Self-Assessment MCQ Bank
              </span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                50 Scenario-Based Questions Grounded in Formal Invariants
              </div>
              <p className="text-xs text-slate-550 mt-1">
                Click any option to test your understanding. Immediate distractor analysis and academic rationales are provided.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-xs font-semibold text-slate-500">Practiced</div>
                <div className="text-base font-bold text-slate-800">{answeredMcqCount} / {mcqs.length}</div>
              </div>
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <div className="text-xs font-semibold text-emerald-600">Correct</div>
                <div className="text-base font-bold text-emerald-700">{correctMcqCount}</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search prompt or topic (e.g., Paxos, Raft, BFT)..."
                value={mcqSearch}
                onChange={(e) => setMcqSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={mcqDifficulty}
                onChange={(e) => setMcqDifficulty(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Difficulties ({mcqs.length})</option>
                <option value="hard">Hard Only</option>
                <option value="medium">Medium Only</option>
                <option value="adaptive">Adaptive Only</option>
              </select>

              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setRevealedExplanations({});
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
              >
                Reset Practice
              </button>
            </div>
          </div>

          {/* MCQ Question List */}
          <div className="space-y-4">
            {filteredMcqs.map((q, idx) => {
              const selected = selectedAnswers[idx];
              const isAnswered = selected !== undefined;
              const isCorrect = selected === q.correctAnswer;
              const isExpanded = revealedExplanations[idx] || isAnswered;

              return (
                <div
                  key={idx}
                  className={`bg-white border rounded-xl p-6 transition-all shadow-xs ${
                    isAnswered
                      ? isCorrect
                        ? 'border-emerald-300 bg-emerald-50/10'
                        : 'border-rose-300 bg-rose-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top Question Meta */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        Q{idx + 1}
                      </span>
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {q.topic || 'Core Curriculum'}
                      </span>
                      {q.bloomsTaxonomy && (
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {q.bloomsTaxonomy}
                        </span>
                      )}
                    </div>
                    <span className="capitalize font-medium text-slate-400">
                      Difficulty: <strong className="text-slate-700">{q.difficulty}</strong>
                    </span>
                  </div>

                  {/* Prompt */}
                  <h3 className="text-base font-bold text-slate-900 leading-relaxed">
                    {q.prompt}
                  </h3>

                  {/* Options */}
                  <div className="mt-4 grid grid-cols-1 gap-2.5">
                    {q.options?.map((opt: string, optIdx: number) => {
                      const optLabel = String.fromCharCode(65 + optIdx);
                      const isOptionSelected = selected === opt;
                      const isOptionCorrect = q.correctAnswer === opt;

                      let btnStyle = 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-800';
                      if (isAnswered) {
                        if (isOptionCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                        } else if (isOptionSelected) {
                          btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold';
                        } else {
                          btnStyle = 'border-slate-200 bg-slate-50/40 text-slate-400';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => {
                            setSelectedAnswers((prev) => ({ ...prev, [idx]: opt }));
                            setRevealedExplanations((prev) => ({ ...prev, [idx]: true }));
                          }}
                          className={`w-full text-left p-3.5 border rounded-lg transition-all flex items-start gap-3 text-xs leading-relaxed ${btnStyle}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 text-xs ${
                              isOptionSelected
                                ? isOptionCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-600'
                            }`}
                          >
                            {optLabel}
                          </span>
                          <span className="mt-0.5">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Immediate Explanation Banner */}
                  {isExpanded && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          {isCorrect ? (
                            <span className="text-emerald-600">✓ Correct Answer</span>
                          ) : (
                            <span className="text-rose-600">✕ Incorrect Selection</span>
                          )}
                          <span className="text-slate-500">— Evidence-Backed Rationale:</span>
                        </span>
                        {q.deepSearchCitation && (
                          <span className="text-indigo-600 text-[11px] font-medium truncate max-w-xs">
                            📚 {q.deepSearchCitation}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 leading-relaxed font-medium">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HIGH-YIELD STUDY NOTES */}
      {/* ========================================================================= */}
      {!isLoading && activeTab === 'notes' && studyNote && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Note Prepare Agent Output
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {studyNote.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Course: {studyNote.courseCode} • Generated: {new Date(studyNote.generatedAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print / Export Guide
              </button>
            </div>

            {/* Executive Summary */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed mb-6 font-medium">
              <strong>Executive Syllabus Digest:</strong> {studyNote.summary}
            </div>

            {/* Core Concepts Glossary */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                1. Core Concepts & Theoretical Invariants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {studyNote.coreConcepts?.map((c, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <h4 className="font-bold text-slate-900 text-sm">{c.term}</h4>
                    <p className="text-slate-700 leading-relaxed font-medium">{c.definition}</p>
                    <p className="text-indigo-700 text-[11px] pt-1 border-t border-slate-200">
                      <strong>Academic Rigor Context:</strong> {c.academicContext}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Architectural Trade-offs Matrix */}
            <div className="space-y-3 mt-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                2. Architectural Trade-offs & Production Benchmarks
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Scenario / Dilemma</th>
                      <th className="p-3 text-emerald-700">Advantages / Theoretical Pros</th>
                      <th className="p-3 text-rose-700">Trade-offs / Operational Cons</th>
                      <th className="p-3 text-indigo-700">Industry Grounded Benchmark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {studyNote.architecturalTradeoffs?.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{t.scenario}</td>
                        <td className="p-3 text-slate-700 font-medium">{t.pros}</td>
                        <td className="p-3 text-slate-700 font-medium">{t.cons}</td>
                        <td className="p-3 font-semibold text-indigo-800 bg-indigo-50/40">{t.industryBenchmark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Common Examination Pitfalls */}
            <div className="space-y-3 mt-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-800">
                3. High-Risk Examination Pitfalls to Avoid
              </h3>
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                {studyNote.commonPitfalls?.map((pf, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-rose-900 font-medium">
                    <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      !
                    </span>
                    <span>{pf}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grounding Sources */}
            {studyNote.groundingSources && studyNote.groundingSources.length > 0 && (
              <div className="space-y-2 mt-8 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-550">
                  Authoritative Grounding Literature:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {studyNote.groundingSources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs text-indigo-700 font-medium transition-colors"
                    >
                      🔗 {src.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SYNTHESIS ESSAYS & APPLIED INTERVIEW SIMULATOR */}
      {/* ========================================================================= */}
      {!isLoading && activeTab === 'essays' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Essay & Interview Agent
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Multi-Resource Synthesis Essays & Technical Interview Scenarios
            </h2>
            <p className="text-xs text-slate-550 mt-1">
              Test your applied engineering and theoretical judgment. These questions blend textbook syllabus with modern distributed cloud benchmarks.
            </p>
          </div>

          <div className="space-y-6">
            {essays.map((essay, idx) => {
              const isExpanded = expandedEssayId === idx;
              const userAns = userEssayAnswers[idx] || '';
              const isModelShown = showModelAnswer[idx];

              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                        Synthesis Question {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-700">
                        Suggested Marks: {essay.suggestedMarks}
                      </span>
                    </div>
                    <span className="font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                      Bloom: {essay.bloomsTaxonomy || 'Evaluating'}
                    </span>
                  </div>

                  {/* Prompt */}
                  <div className="whitespace-pre-line text-sm font-semibold text-slate-900 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                    {essay.prompt}
                  </div>

                  {/* Student Answer Box */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Draft Your Academic Response (Practice Sandbox):
                    </label>
                    <textarea
                      rows={5}
                      value={userAns}
                      onChange={(e) => setUserEssayAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                      placeholder="Write your comprehensive technical analysis here (mention protocol invariants, message bounds, and trade-offs)..."
                      className="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Word count: {userAns.trim() ? userAns.trim().split(/\s+/).length : 0} words</span>
                      <button
                        onClick={() => setShowModelAnswer((prev) => ({ ...prev, [idx]: !isModelShown }))}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        {isModelShown ? 'Hide Model Answer & Rubric' : 'View Model Answer & Evaluation Rubric →'}
                      </button>
                    </div>
                  </div>

                  {/* Model Answer & Rubric Box */}
                  {isModelShown && (
                    <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                          Standardized Grading Rubric Criteria:
                        </h4>
                        <div className="mt-1 whitespace-pre-line text-slate-700 font-mono text-[11px] bg-white p-3 rounded border border-slate-200">
                          {essay.rubric}
                        </div>
                      </div>

                      <div className="pt-2">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                          Pedagogical Benchmark:
                        </h4>
                        <p className="mt-1 text-slate-700 leading-relaxed font-medium">
                          {essay.explanation}
                        </p>
                      </div>

                      {essay.deepSearchCitation && (
                        <div className="text-slate-500 text-[11px]">
                          <strong>Literature Citation:</strong> {essay.deepSearchCitation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
