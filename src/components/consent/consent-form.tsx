"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ANALYTICS_CONSENT_TEXT,
  CONSENT_TEXT_VERSION,
  FOLLOW_UP_CONSENT_TEXT,
  OPERATIONAL_CONSENT_TEXT,
  PRIVACY_POLICY_VERSION,
  RESEARCH_CONSENT_TEXT,
} from "@/data/privacy-policy";
import {
  CONSENT_SESSION_KEY,
  INITIAL_CONSENT_CHOICES,
  createConsentRecord,
  parseConsentSessionPayload,
  serializeConsentSession,
} from "@/lib/consent-session";
import {
  ASSESSMENT_MODE_SESSION_KEY,
  parseAssessmentModeSession,
} from "@/lib/assessment-mode-session";
import { assessmentModeMetadata, type AssessmentMode } from "@/types/assessment-mode";
import type {
  AgeGroup,
  ConsentRecord,
  ConsentValidationError,
} from "@/types/consent";

const ageOptions: readonly { value: AgeGroup; label: string }[] = [
  { value: "under_16", label: "Under 16" },
  { value: "age_16_17", label: "Age 16-17" },
  { value: "age_18_or_above", label: "Age 18 or above" },
];

export function ConsentForm() {
  const router = useRouter();
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode | null>(null);
  const [existingConsent, setExistingConsent] = useState<ConsentRecord | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(
    INITIAL_CONSENT_CHOICES.ageGroup,
  );
  const [operationalConsent, setOperationalConsent] = useState<boolean>(
    INITIAL_CONSENT_CHOICES.operationalConsent,
  );
  const [researchConsent, setResearchConsent] = useState<boolean>(
    INITIAL_CONSENT_CHOICES.researchConsent,
  );
  const [followUpConsent, setFollowUpConsent] = useState<boolean>(
    INITIAL_CONSENT_CHOICES.followUpContactConsent,
  );
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(
    INITIAL_CONSENT_CHOICES.analyticsConsent,
  );
  const [errors, setErrors] = useState<ConsentValidationError[]>([]);
  const [storageError, setStorageError] = useState<string>();

  useEffect(() => {
    const modePayload = parseAssessmentModeSession(
      window.sessionStorage.getItem(ASSESSMENT_MODE_SESSION_KEY),
    );
    if (!modePayload) {
      router.replace("/assessment/mode");
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setAssessmentMode(modePayload.selectedMode);
      const consentPayload = parseConsentSessionPayload(
        window.sessionStorage.getItem(CONSENT_SESSION_KEY),
      );
      setExistingConsent(
        consentPayload?.consent.assessmentMode === modePayload.selectedMode
          ? consentPayload.consent
          : null,
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [router]);

  function messagesFor(field: ConsentValidationError["field"]): string[] {
    return errors.filter((item) => item.field === field).map((item) => item.message);
  }

  function resetChoices() {
    window.sessionStorage.removeItem(CONSENT_SESSION_KEY);
    setExistingConsent(null);
    setAgeGroup(null);
    setOperationalConsent(false);
    setResearchConsent(false);
    setFollowUpConsent(false);
    setAnalyticsConsent(false);
    setErrors([]);
    setStorageError(undefined);
  }

  function submitConsent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStorageError(undefined);
    const nextErrors: ConsentValidationError[] = [];
    if (!ageGroup) {
      nextErrors.push({
        field: "ageGroup",
        code: "age_group_required",
        message: "Select your age group before continuing.",
      });
    }
    if (!operationalConsent) {
      nextErrors.push({
        field: "operationalConsent",
        code: "operational_consent_required",
        message:
          "Required operational consent must be granted to start the assessment.",
      });
    }
    if (!assessmentMode || !ageGroup || nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    const created = createConsentRecord({
      assessmentMode,
      ageGroup,
      operationalConsent,
      researchConsent,
      followUpContactConsent: followUpConsent,
      analyticsConsent,
    });
    if (!created.isValid || !created.consent) {
      setErrors(created.errors);
      return;
    }

    try {
      window.sessionStorage.setItem(
        CONSENT_SESSION_KEY,
        serializeConsentSession(created.consent),
      );
      setExistingConsent(created.consent);
      setErrors([]);
      router.push("/assessment");
    } catch {
      setStorageError(
        "Your consent choices could not be saved in this browser session. Please check browser storage settings and try again.",
      );
    }
  }

  if (!assessmentMode) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold text-teal-700">Preparing the privacy notice...</p>
      </div>
    );
  }

  const modeTitle = assessmentModeMetadata[assessmentMode].title;

  if (existingConsent) {
    return (
      <section className="rounded-[1.75rem] border border-teal-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="consent-recorded-heading">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
          Consent recorded for this tab
        </p>
        <h1 id="consent-recorded-heading" className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          Continue to {modeTitle}
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Required operational consent is active for this browser-tab session.
          Your optional research choice is <strong>{existingConsent.researchConsent}</strong>.
          This choice does not change your recommendations.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => router.push("/assessment")} className="primary-button">
            Continue to Assessment
          </button>
          <button type="button" onClick={resetChoices} className="secondary-button">
            Reset Privacy Choices
          </button>
        </div>
      </section>
    );
  }

  const isMinor = ageGroup === "under_16" || ageGroup === "age_16_17";

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.3)] sm:p-8 lg:p-10" aria-labelledby="consent-heading">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
        Privacy and consent
      </p>
      <h1 id="consent-heading" className="mt-2 font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
        Review your choices before starting
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
        {modeTitle} processes your answers temporarily in this browser tab to
        generate educational guidance. Operational consent is required. Research,
        follow-up, and future analytics choices are voluntary and independent.
      </p>
      <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
        Read the full{" "}
        <Link href="/privacy" className="font-bold underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
          Privacy and Research Data Notice
        </Link>
        . Current policy: {PRIVACY_POLICY_VERSION}; consent text: {CONSENT_TEXT_VERSION}.
      </p>

      <form onSubmit={submitConsent} noValidate className="mt-8 space-y-8">
        <fieldset>
          <legend className="text-lg font-bold text-slate-950">Select your age group</legend>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Age group is required so the project can apply safer minor-participant rules.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {ageOptions.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 font-bold transition hover:border-teal-400 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600 has-[:focus-visible]:ring-offset-2">
                <input type="radio" name="age-group" value={option.value} checked={ageGroup === option.value} onChange={() => { setAgeGroup(option.value); setErrors([]); }} className="size-4 accent-teal-700" />
                {option.label}
              </label>
            ))}
          </div>
          {messagesFor("ageGroup").map((message) => (
            <p key={message} role="alert" className="mt-3 text-sm font-bold text-red-700">{message}</p>
          ))}
        </fieldset>

        {ageGroup === "age_16_17" && (
          <aside className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            You may use the educational guidance. Guardian consent and institutional
            approval may be required for research use. Until an approved minor-participant
            process exists, your assessment is not eligible for research storage even if
            you select optional research consent.
          </aside>
        )}
        {ageGroup === "under_16" && (
          <aside className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            You may use educational guidance only. A parent or guardian should help you
            understand this notice. Your checkbox alone is not sufficient research consent,
            no guardian details are collected, and your assessment is not eligible for
            research storage.
          </aside>
        )}

        <fieldset>
          <legend className="text-lg font-bold text-slate-950">Your consent choices</legend>
          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-teal-300 bg-teal-50 p-4 focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 sm:p-5">
              <input type="checkbox" checked={operationalConsent} onChange={(event) => { setOperationalConsent(event.target.checked); setErrors([]); }} className="mt-1 size-5 accent-teal-700" />
              <span>
                <span className="block text-xs font-black uppercase tracking-wide text-teal-800">Required operational consent</span>
                <span className="mt-1 block leading-7 text-slate-950">{OPERATIONAL_CONSENT_TEXT}</span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">This covers only the processing needed to run educational guidance in the current tab. It does not imply research consent.</span>
              </span>
            </label>
            {messagesFor("operationalConsent").map((message) => (
              <p key={message} role="alert" className="text-sm font-bold text-red-700">{message}</p>
            ))}

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 sm:p-5">
              <input type="checkbox" checked={researchConsent} onChange={(event) => setResearchConsent(event.target.checked)} className="mt-1 size-5 accent-teal-700" />
              <span>
                <span className="block text-xs font-black uppercase tracking-wide text-slate-600">Optional research consent</span>
                <span className="mt-1 block leading-7 text-slate-950">{RESEARCH_CONSENT_TEXT}</span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">Research participation is voluntary. Refusing does not block guidance. No permanent research storage or ethics approval is claimed in this version.</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 sm:p-5">
              <input type="checkbox" checked={followUpConsent} onChange={(event) => setFollowUpConsent(event.target.checked)} className="mt-1 size-5 accent-teal-700" />
              <span>
                <span className="block text-xs font-black uppercase tracking-wide text-slate-600">Optional follow-up contact consent</span>
                <span className="mt-1 block leading-7 text-slate-950">{FOLLOW_UP_CONSENT_TEXT}</span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">Only this choice is recorded. No email address, phone number, or other contact information is collected yet.</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 sm:p-5">
              <input type="checkbox" checked={analyticsConsent} onChange={(event) => setAnalyticsConsent(event.target.checked)} className="mt-1 size-5 accent-teal-700" />
              <span>
                <span className="block text-xs font-black uppercase tracking-wide text-slate-600">Optional future analytics consent</span>
                <span className="mt-1 block leading-7 text-slate-950">{ANALYTICS_CONSENT_TEXT}</span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">This records future-ready metadata only. It does not activate analytics.</span>
              </span>
            </label>
          </div>
        </fieldset>

        {isMinor && researchConsent && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-950">
            Your voluntary research preference is recorded, but research-storage eligibility remains false until a real approved minor-participant and guardian-consent process exists.
          </p>
        )}
        {storageError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{storageError}</p>}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/assessment/mode" className="secondary-button text-center">Back to Mode Selection</Link>
          <button type="submit" className="primary-button">Agree and Start Assessment</button>
        </div>
      </form>
    </section>
  );
}
