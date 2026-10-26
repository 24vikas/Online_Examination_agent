import React from 'react';
import { Check, Shield } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  count: number;
  isHumanGate?: boolean;
}

interface StepperProps {
  steps: StepItem[];
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStepIndex,
  onSelectStep,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-x-auto py-2 ${className}`}>
      <ol className="flex items-center min-w-[720px] justify-between relative" aria-label="Examination lifecycle">
        {steps.map((step, index) => {
          const isCompleted = index < activeStepIndex;
          const isCurrent = index === activeStepIndex;
          const isHumanGate = Boolean(step.isHumanGate);

          return (
            <li
              key={step.id}
              className="flex-1 relative flex flex-col items-center group cursor-pointer"
              onClick={() => onSelectStep(index)}
            >
              {/* Connecting line to previous step */}
              {index > 0 && (
                <div
                  aria-hidden="true"
                  className={`absolute top-4 right-1/2 left-[-50%] h-[2px] -translate-y-1/2 z-0 ${
                    index <= activeStepIndex ? 'bg-[#1F4D3F]' : 'bg-[#E3EAE6]'
                  }`}
                />
              )}

              {/* Step circle indicator */}
              <button
                type="button"
                aria-current={isCurrent ? 'step' : undefined}
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3F] focus-visible:ring-offset-2 ${
                  isCompleted
                    ? 'bg-[#1F4D3F] text-white shadow-xs'
                    : isCurrent
                    ? 'border-2 border-[#1F4D3F] bg-white text-[#1F4D3F] ring-4 ring-[#D6EBDD]'
                    : 'border border-[#E3EAE6] bg-[#F6F9F6] text-[#5B6B66]'
                } ${
                  isHumanGate && !isCompleted
                    ? 'border-2 border-[#B45309] bg-[#FEF3C7] text-[#B45309] ring-2 ring-[#B45309]/30'
                    : ''
                }`}
                title={`${step.label} (${step.count})`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : isHumanGate ? (
                  <Shield className="w-3.5 h-3.5 text-[#B45309]" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>

              {/* Step Label & Count */}
              <div className="mt-2 text-center select-none px-1">
                <p
                  className={`text-xs leading-tight transition-colors ${
                    isCurrent
                      ? 'font-semibold text-[#1F4D3F]'
                      : isHumanGate
                      ? 'font-semibold text-[#B45309]'
                      : 'font-medium text-[#5B6B66]'
                  }`}
                >
                  {step.label}
                  {isHumanGate && (
                    <span className="block text-[10px] text-[#B45309] font-semibold">
                      (Human gate)
                    </span>
                  )}
                </p>
                <span className="text-[11px] font-mono tabular-nums text-[#5B6B66] mt-0.5 block">
                  {step.count}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
