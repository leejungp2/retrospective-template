"use client";

interface WizardStepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function WizardStepper({
  steps,
  currentStep,
  onStepClick,
}: WizardStepperProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onStepClick?.(i)}
            disabled={!onStepClick}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              i === currentStep
                ? "bg-blue-600 text-white"
                : i < currentStep
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {i < currentStep ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            {label}
          </button>
          {i < steps.length - 1 && (
            <div className="w-3 h-px bg-gray-300 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
