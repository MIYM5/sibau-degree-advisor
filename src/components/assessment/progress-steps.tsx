interface ProgressStepsProps {
  currentStep: number;
}

const steps = [
  "Basic information",
  "Subject marks",
  "Interest assessment",
  "Aptitude self-assessment",
  "Review",
] as const;

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <nav aria-label="Assessment progress">
      <ol className="grid grid-cols-5 gap-2 sm:gap-4">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCurrent = currentStep === stepNumber;
          const isComplete = currentStep > stepNumber;

          return (
            <li key={label} aria-current={isCurrent ? "step" : undefined}>
              <div className="flex items-center gap-2 sm:gap-3">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition sm:size-9 ${
                    isCurrent
                      ? "bg-teal-700 text-white ring-4 ring-teal-100"
                      : isComplete
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isComplete ? "✓" : stepNumber}
                </span>
                <span
                  className={`hidden text-sm font-semibold sm:block ${
                    isCurrent || isComplete ? "text-slate-900" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </div>
              <div
                className={`mt-3 h-1 rounded-full ${
                  isCurrent || isComplete ? "bg-teal-600" : "bg-slate-200"
                }`}
              />
              <span className="mt-2 block text-[11px] font-semibold text-slate-600 sm:hidden">
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
