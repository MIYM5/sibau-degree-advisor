"use client";

import { useState } from "react";

import {
  getSuggestedSubjectRows,
  intermediateGroups,
  toSubjectMarks,
  validateBasicInformation,
  validateSubjectMarkRows,
  type BasicInformationErrors,
  type SubjectMarkDraft,
  type SubjectMarksValidationResult,
} from "@/lib/assessment-form";
import type { IntermediateGroup } from "@/types/program";
import type { StudentProfile } from "@/types/student";

import { ProgressSteps } from "./progress-steps";
import { ReviewStep } from "./review-step";
import { SubjectMarksStep } from "./subject-marks-step";

const emptySubjectValidation: SubjectMarksValidationResult = {
  rowErrors: {},
  isValid: false,
};

export function AssessmentFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [intermediateGroup, setIntermediateGroup] = useState<
    IntermediateGroup | ""
  >(
    "",
  );
  const [initializedGroup, setInitializedGroup] = useState<
    IntermediateGroup | ""
  >(
    "",
  );
  const [subjectRows, setSubjectRows] = useState<SubjectMarkDraft[]>([]);
  const [basicErrors, setBasicErrors] = useState<BasicInformationErrors>({});
  const [subjectValidation, setSubjectValidation] =
    useState<SubjectMarksValidationResult>(emptySubjectValidation);

  const studentProfile: StudentProfile | null = intermediateGroup
    ? {
        name: name.trim(),
        intermediateGroup,
        subjectMarks: toSubjectMarks(subjectRows),
        interestScores: {},
        aptitudeScores: {},
      }
    : null;

  function continueFromBasicInformation() {
    const errors = validateBasicInformation(name, intermediateGroup);
    setBasicErrors(errors);
    if (Object.keys(errors).length > 0 || !intermediateGroup) return;

    if (initializedGroup !== intermediateGroup) {
      setSubjectRows(getSuggestedSubjectRows(intermediateGroup));
      setInitializedGroup(intermediateGroup);
      setSubjectValidation(emptySubjectValidation);
    }
    setCurrentStep(2);
  }

  function updateSubjectRow(
    index: number,
    patch: Partial<SubjectMarkDraft>,
  ) {
    setSubjectRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
    setSubjectValidation(emptySubjectValidation);
  }

  function addOptionalSubject() {
    setSubjectRows((rows) => [...rows, { isOptional: true }]);
    setSubjectValidation(emptySubjectValidation);
  }

  function removeOptionalSubject(index: number) {
    setSubjectRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
    setSubjectValidation(emptySubjectValidation);
  }

  function continueToReview() {
    const validation = validateSubjectMarkRows(subjectRows);
    setSubjectValidation(validation);
    if (!validation.isValid) return;
    setCurrentStep(3);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.3)] sm:p-8 lg:p-10">
        <ProgressSteps currentStep={currentStep} />

        <div className="mt-10 border-t border-slate-200 pt-8 sm:mt-12 sm:pt-10">
          {currentStep === 1 && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                continueFromBasicInformation();
              }}
              noValidate
            >
              <section aria-labelledby="basic-information-heading">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
                  Step 1 of 3
                </p>
                <h1
                  id="basic-information-heading"
                  className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                >
                  Tell us about your studies
                </h1>
                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                  Start with basic academic information. Nothing is saved, and
                  you can review every entry before moving on.
                </p>

                <div className="mt-8 max-w-xl">
                  <label
                    htmlFor="student-name"
                    className="mb-2 block text-sm font-bold text-slate-900"
                  >
                    Student name
                  </label>
                  <input
                    id="student-name"
                    name="student-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setBasicErrors((errors) => ({ ...errors, name: undefined }));
                    }}
                    aria-invalid={Boolean(basicErrors.name)}
                    aria-describedby={basicErrors.name ? "student-name-error" : "student-name-help"}
                    className="field-control"
                    placeholder="Enter your name"
                  />
                  <p id="student-name-help" className="mt-2 text-sm text-slate-500">
                    Used only to personalize this assessment review.
                  </p>
                  {basicErrors.name && (
                    <p
                      id="student-name-error"
                      className="mt-2 text-sm font-medium text-red-700"
                      role="alert"
                    >
                      {basicErrors.name}
                    </p>
                  )}
                </div>

                <fieldset className="mt-9">
                  <legend className="text-base font-bold text-slate-950">
                    Intermediate group
                  </legend>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose the group shown on your Intermediate or equivalent
                    qualification.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {intermediateGroups.map((group) => (
                      <label
                        key={group}
                        className={`group relative flex min-h-16 cursor-pointer items-center rounded-xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 ${
                          intermediateGroup === group
                            ? "border-teal-600 bg-teal-50 text-teal-950 shadow-sm"
                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="intermediate-group"
                          value={group}
                          checked={intermediateGroup === group}
                          onChange={() => {
                            setIntermediateGroup(group);
                            setBasicErrors((errors) => ({
                              ...errors,
                              intermediateGroup: undefined,
                            }));
                          }}
                          className="size-4 accent-teal-700"
                        />
                        <span className="ml-3 text-sm font-bold">{group}</span>
                      </label>
                    ))}
                  </div>
                  {basicErrors.intermediateGroup && (
                    <p className="mt-3 text-sm font-medium text-red-700" role="alert">
                      {basicErrors.intermediateGroup}
                    </p>
                  )}
                </fieldset>
              </section>

              <div className="mt-10 flex justify-end border-t border-slate-200 pt-6">
                <button type="submit" className="primary-button">
                  Continue to subject marks
                  <span aria-hidden="true" className="ml-2">
                    →
                  </span>
                </button>
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                continueToReview();
              }}
              noValidate
            >
              <SubjectMarksStep
                rows={subjectRows}
                validation={subjectValidation}
                onChange={updateSubjectRow}
                onAddOptional={addOptionalSubject}
                onRemoveOptional={removeOptionalSubject}
              />
              <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="secondary-button"
                >
                  <span aria-hidden="true" className="mr-2">
                    ←
                  </span>
                  Back
                </button>
                <button type="submit" className="primary-button">
                  Review information
                  <span aria-hidden="true" className="ml-2">
                    →
                  </span>
                </button>
              </div>
            </form>
          )}

          {currentStep === 3 && studentProfile && (
            <div>
              <ReviewStep studentProfile={studentProfile} />
              <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="secondary-button"
                >
                  <span aria-hidden="true" className="mr-2">
                    ←
                  </span>
                  Edit subject marks
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-5 py-3 text-sm font-bold text-slate-500"
                >
                  Interest assessment coming next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
