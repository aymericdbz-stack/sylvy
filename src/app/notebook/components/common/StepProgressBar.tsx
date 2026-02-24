"use client";

const STEP_LABELS = [
  "Protocol",
  "Upload",
  "Editor",
  "Notes",
  "Report",
  "Export",
  "Results",
];

interface StepProgressBarProps {
  currentStep: number; // 1-7
  onStepClick?: (step: number) => void;
  maxReachedStep: number;
}

export function StepProgressBar({
  currentStep,
  onStepClick,
  maxReachedStep,
}: StepProgressBarProps) {
  return (
    <div className="w-full px-4 py-4">
      <div className="mx-auto flex max-w-3xl items-center">
        {STEP_LABELS.map((label, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          const isClickable = step <= maxReachedStep && onStepClick;

          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(step)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                  style={{
                    background: isActive
                      ? "#00ac73"
                      : isCompleted
                        ? "#d1fae5"
                        : "#f3f4f6",
                    color: isActive
                      ? "#fff"
                      : isCompleted
                        ? "#00ac73"
                        : "#9ca3af",
                    cursor: isClickable ? "pointer" : "default",
                    border: isActive ? "2px solid #00ac73" : "2px solid transparent",
                  }}
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step
                  )}
                </button>
                <span
                  className="hidden text-[10px] font-medium sm:block"
                  style={{
                    color: isActive ? "#00ac73" : isCompleted ? "#00ac73" : "#9ca3af",
                  }}
                >
                  {label}
                </span>
              </div>
              {step < 7 && (
                <div
                  className="mx-1 h-0.5 flex-1"
                  style={{
                    background: step < currentStep ? "#00ac73" : "#e5e7eb",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
