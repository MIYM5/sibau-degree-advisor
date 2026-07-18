import {
  availableSubjects,
  calculateSubjectPercentage,
  type SubjectMarkDraft,
  type SubjectMarksValidationResult,
} from "@/lib/assessment-form";

interface SubjectMarksStepProps {
  rows: readonly SubjectMarkDraft[];
  validation: SubjectMarksValidationResult;
  onChange: (index: number, patch: Partial<SubjectMarkDraft>) => void;
  onAddOptional: () => void;
  onRemoveOptional: (index: number) => void;
}

function parseOptionalNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

export function SubjectMarksStep({
  rows,
  validation,
  onChange,
  onAddOptional,
  onRemoveOptional,
}: SubjectMarksStepProps) {
  return (
    <section aria-labelledby="subject-marks-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Step 2 of 3
          </p>
          <h1
            id="subject-marks-heading"
            className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Enter subject marks
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            We suggested common subjects for your group. Enter the marks exactly
            as they appear on your result, and add another subject if needed.
          </p>
        </div>
        <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          Percentages calculate automatically
        </div>
      </div>

      {validation.formError && (
        <div
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          role="alert"
        >
          {validation.formError}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {rows.map((row, index) => {
          const errors = validation.rowErrors[index] ?? {};
          const percentage = calculateSubjectPercentage(
            row.obtainedMarks,
            row.totalMarks,
          );
          const subjectErrorId = `subject-${index}-error`;
          const obtainedErrorId = `obtained-${index}-error`;
          const totalErrorId = `total-${index}-error`;

          return (
            <fieldset
              key={`${row.isOptional ? "optional" : "suggested"}-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <legend className="sr-only">Subject entry {index + 1}</legend>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    row.isOptional
                      ? "bg-amber-100 text-amber-800"
                      : "bg-teal-50 text-teal-800"
                  }`}
                >
                  {row.isOptional ? "Optional subject" : "Suggested subject"}
                </span>
                {row.isOptional && (
                  <button
                    type="button"
                    onClick={() => onRemoveOptional(index)}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                    aria-label={`Remove optional subject ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(7rem,0.75fr)]">
                <div>
                  <label
                    htmlFor={`subject-${index}`}
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Subject name
                  </label>
                  <select
                    id={`subject-${index}`}
                    value={row.subject ?? ""}
                    onChange={(event) =>
                      onChange(index, {
                        subject: event.target.value
                          ? (event.target.value as SubjectMarkDraft["subject"])
                          : undefined,
                      })
                    }
                    aria-invalid={Boolean(errors.subject)}
                    aria-describedby={errors.subject ? subjectErrorId : undefined}
                    className="field-control"
                  >
                    <option value="">Select subject</option>
                    {availableSubjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p id={subjectErrorId} className="mt-2 text-sm font-medium text-red-700">
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`obtained-${index}`}
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Obtained marks
                  </label>
                  <input
                    id={`obtained-${index}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={row.obtainedMarks ?? ""}
                    onChange={(event) =>
                      onChange(index, {
                        obtainedMarks: parseOptionalNumber(event.target.value),
                      })
                    }
                    aria-invalid={Boolean(errors.obtainedMarks)}
                    aria-describedby={
                      errors.obtainedMarks ? obtainedErrorId : undefined
                    }
                    className="field-control"
                    placeholder="e.g. 82"
                  />
                  {errors.obtainedMarks && (
                    <p id={obtainedErrorId} className="mt-2 text-sm font-medium text-red-700">
                      {errors.obtainedMarks}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`total-${index}`}
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Total marks
                  </label>
                  <input
                    id={`total-${index}`}
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    value={row.totalMarks ?? ""}
                    onChange={(event) =>
                      onChange(index, {
                        totalMarks: parseOptionalNumber(event.target.value),
                      })
                    }
                    aria-invalid={Boolean(errors.totalMarks)}
                    aria-describedby={errors.totalMarks ? totalErrorId : undefined}
                    className="field-control"
                    placeholder="e.g. 100"
                  />
                  {errors.totalMarks && (
                    <p id={totalErrorId} className="mt-2 text-sm font-medium text-red-700">
                      {errors.totalMarks}
                    </p>
                  )}
                </div>

                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Percentage
                  </span>
                  <output className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold tabular-nums text-slate-900">
                    {percentage === null ? "—" : `${percentage.toFixed(2)}%`}
                  </output>
                </div>
              </div>
            </fieldset>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddOptional}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-teal-600 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
      >
        <span aria-hidden="true" className="mr-2 text-lg leading-none">
          +
        </span>
        Add optional subject
      </button>
    </section>
  );
}
