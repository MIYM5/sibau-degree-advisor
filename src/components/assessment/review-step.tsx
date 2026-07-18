import { calculateOverallPercentage } from "@/lib/assessment-form";
import type { StudentProfile } from "@/types/student";

interface ReviewStepProps {
  studentProfile: StudentProfile;
}

export function ReviewStep({ studentProfile }: ReviewStepProps) {
  const overallPercentage = calculateOverallPercentage(
    studentProfile.subjectMarks,
  );

  return (
    <section aria-labelledby="review-heading">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
        Step 3 of 3
      </p>
      <h1
        id="review-heading"
        className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
      >
        Review academic information
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Check these details before continuing to the interest and aptitude
        sections in a future step.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Student name
          </p>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {studentProfile.name}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Intermediate group
          </p>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {studentProfile.intermediateGroup}
          </p>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Overall percentage
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-teal-950">
            {overallPercentage === null
              ? "Not available"
              : `${overallPercentage.toFixed(2)}%`}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-950">Subject summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Overall percentage uses total obtained marks divided by total possible
            marks.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {studentProfile.subjectMarks.map((mark) => (
            <div
              key={mark.subject}
              className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-8 sm:px-6"
            >
              <p className="font-semibold text-slate-900">{mark.subject}</p>
              <p className="text-sm tabular-nums text-slate-600">
                {mark.obtainedMarks} / {mark.totalMarks}
              </p>
              <p className="font-bold tabular-nums text-slate-950 sm:min-w-20 sm:text-right">
                {mark.calculatedPercentage.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-bold text-amber-950">Your information stays on this page</p>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          This MVP keeps assessment details only in temporary React state. It
          does not save them to a database or browser storage.
        </p>
      </div>
    </section>
  );
}
