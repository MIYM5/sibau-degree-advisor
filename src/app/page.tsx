export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950 sm:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Project foundation ready
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            SIBAU Degree Advisor
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            A student guidance project for exploring undergraduate programs at
            Sukkur IBA University using eligibility, academic suitability,
            interests, and aptitude self-assessment.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-semibold">Current milestone</h2>
            <p className="mt-3 leading-7 text-slate-600">
              The Next.js application foundation is installed. Eligibility and
              recommendation features will be implemented in later milestones.
            </p>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-7">
            <h2 className="text-xl font-semibold">Important</h2>
            <p className="mt-3 leading-7 text-slate-700">
              This independent project is not an official Sukkur IBA admissions
              system. Future recommendations will provide guidance and will not
              guarantee admission.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
