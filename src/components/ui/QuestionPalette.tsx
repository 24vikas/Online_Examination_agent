import React from 'react';

export type QuestionState = 'answered' | 'not_answered' | 'not_visited' | 'marked' | 'current';

export interface QuestionStatusItem {
  id: string | number;
  number: number;
  state: QuestionState;
}

interface QuestionPaletteProps {
  questions: QuestionStatusItem[];
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  className?: string;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIndex,
  onSelectQuestion,
  className = '',
}) => {
  // Counts by state
  const counts = questions.reduce(
    (acc, q, idx) => {
      const state = idx === currentIndex ? 'current' : q.state;
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    },
    { answered: 0, not_answered: 0, not_visited: 0, marked: 0, current: 0 } as Record<
      QuestionState,
      number
    >
  );

  const getStateClasses = (state: QuestionState, isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-[#1F4D3F] text-white font-bold ring-2 ring-[#1F4D3F] ring-offset-2 border-transparent';
    }
    switch (state) {
      case 'answered':
        return 'bg-[#D6EBDD] text-[#1F4D3F] font-semibold border border-[#1F4D3F]/30 hover:bg-[#c2e4cc]';
      case 'marked':
        return 'bg-[#FEF3C7] text-[#B45309] font-bold border border-[#FDE68A] hover:bg-[#fde68a]';
      case 'not_answered':
        return 'bg-white text-[#10251F] border border-[#E3EAE6] hover:bg-[#F6F9F6]';
      case 'not_visited':
      default:
        return 'bg-[#F6F9F6] text-[#5B6B66] border border-[#E3EAE6] hover:bg-[#eef4f0]';
    }
  };

  return (
    <div className={`bg-white rounded-[16px] border border-[#E3EAE6] p-4 shadow-[0_1px_2px_rgba(16,37,31,0.06)] ${className}`}>
      <h4 className="text-xs font-semibold text-[#10251F] mb-3 uppercase tracking-wider">
        Question Palette
      </h4>

      {/* Grid of Questions */}
      <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto p-1">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const visualState = isCurrent ? 'current' : q.state;

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(idx)}
              className={`w-9 h-9 rounded-[8px] flex items-center justify-center text-xs font-mono tabular-nums transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3F] ${getStateClasses(
                visualState,
                isCurrent
              )}`}
              title={`Question ${q.number}: ${visualState.replace('_', ' ')}`}
              aria-label={`Question ${q.number}, status: ${visualState.replace('_', ' ')}`}
            >
              {q.number}
            </button>
          );
        })}
      </div>

      {/* Legend & Summary Counts */}
      <div className="mt-4 pt-3 border-t border-[#E3EAE6] space-y-2 text-xs text-[#5B6B66]">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-[#D6EBDD] border border-[#1F4D3F]/30 shrink-0" />
            <span>Answered ({counts.answered})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-[#FEF3C7] border border-[#FDE68A] shrink-0" />
            <span>Marked ({counts.marked})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-white border border-[#E3EAE6] shrink-0" />
            <span>Not answered ({counts.not_answered})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-[#F6F9F6] border border-[#E3EAE6] shrink-0" />
            <span>Not visited ({counts.not_visited})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
