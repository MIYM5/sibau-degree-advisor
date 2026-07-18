-- SIBAU Degree Advisor research schema, Version 1.
--
-- This migration prepares infrastructure only. It does not enable collection,
-- connect the assessment UI, or replace the server governance/consent gate.
-- The service-role key bypasses RLS and must remain server-only.

create extension if not exists pgcrypto;

create table public.participants (
  id uuid primary key,
  public_research_code text not null unique,
  age_group text not null check (age_group in ('under_16', 'age_16_17', 'age_18_or_above')),
  created_at timestamptz not null default now(),
  withdrawn_at timestamptz null check (withdrawn_at is null or withdrawn_at >= created_at)
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  participant_id uuid not null references public.participants(id) on delete restrict,
  assessment_mode text not null check (assessment_mode in ('quick', 'detailed')),
  operational_consent boolean not null check (operational_consent = true),
  research_consent boolean not null check (research_consent = true),
  follow_up_consent boolean not null,
  analytics_consent boolean not null,
  guardian_consent_status text not null check (
    guardian_consent_status in (
      'not_applicable',
      'required_not_collected',
      'future_approved_process_required'
    )
  ),
  research_storage_eligibility text not null check (
    research_storage_eligibility in (
      'eligible_adult_with_consent',
      'guidance_only',
      'ineligible_no_research_consent',
      'ineligible_minor_process_not_approved',
      'ineligible_invalid_governance_configuration'
    )
  ),
  privacy_policy_version text not null check (length(btrim(privacy_policy_version)) > 0),
  consent_text_version text not null check (length(btrim(consent_text_version)) > 0),
  consented_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  participant_id uuid not null references public.participants(id) on delete restrict,
  assessment_mode text not null check (assessment_mode in ('quick', 'detailed')),
  intermediate_group text not null check (
    intermediate_group in (
      'Pre-Medical',
      'Pre-Engineering',
      'ICS',
      'Commerce',
      'Arts/Humanities',
      'General Science',
      'Other'
    )
  ),
  overall_percentage numeric not null check (overall_percentage between 0 and 100),
  assessment_version text not null check (length(btrim(assessment_version)) > 0),
  questionnaire_version text not null check (length(btrim(questionnaire_version)) > 0),
  scoring_model_version text not null check (length(btrim(scoring_model_version)) > 0),
  program_data_version text not null check (length(btrim(program_data_version)) > 0),
  started_at timestamptz null,
  completed_at timestamptz not null,
  completion_seconds integer null check (completion_seconds is null or completion_seconds >= 0),
  created_at timestamptz not null default now(),
  check (started_at is null or started_at <= completed_at)
);

create table public.subject_marks (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  subject text not null,
  obtained_marks numeric not null check (obtained_marks >= 0),
  total_marks numeric not null check (total_marks > 0),
  percentage numeric not null check (percentage between 0 and 100),
  unique (assessment_id, subject),
  check (obtained_marks <= total_marks),
  check (abs(percentage - ((obtained_marks / total_marks) * 100)) <= 0.000001)
);

create table public.interest_responses (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_or_scenario_id text not null,
  response_payload jsonb not null check (jsonb_typeof(response_payload) = 'object'),
  dimension text null check (
    dimension is null or dimension in (
      'realistic',
      'investigative',
      'artistic',
      'social',
      'enterprising',
      'conventional'
    )
  ),
  display_order integer not null check (display_order > 0),
  created_at timestamptz not null default now(),
  unique (assessment_id, question_or_scenario_id)
);

create table public.riasec_scores (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  realistic numeric not null check (realistic between 0 and 100),
  investigative numeric not null check (investigative between 0 and 100),
  artistic numeric not null check (artistic between 0 and 100),
  social numeric not null check (social between 0 and 100),
  enterprising numeric not null check (enterprising between 0 and 100),
  conventional numeric not null check (conventional between 0 and 100),
  top_three_code text not null check (top_three_code ~ '^[RIASEC]{3}$'),
  evidence_label text not null check (evidence_label in ('Preliminary', 'Stronger interest evidence'))
);

create table public.aptitude_responses (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  task_id text not null,
  dimension text not null check (
    dimension in ('numerical', 'logical', 'verbal', 'spatial-technical', 'data-interpretation')
  ),
  selected_choice_id text not null,
  correct boolean not null,
  display_order integer not null check (display_order > 0),
  unique (assessment_id, task_id)
);

create table public.aptitude_results (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  correct_count integer not null check (correct_count >= 0),
  total_tasks integer not null check (total_tasks > 0),
  overall_percentage numeric not null check (overall_percentage between 0 and 100),
  evidence_label text not null check (evidence_label = 'Limited'),
  check (correct_count <= total_tasks),
  check (abs(overall_percentage - ((correct_count::numeric / total_tasks) * 100)) <= 0.000001)
);

create table public.recommendation_results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  program_id text not null,
  eligibility_status text not null check (
    eligibility_status in ('Eligible', 'Not eligible', 'Verification required')
  ),
  academic_score numeric null check (academic_score is null or academic_score between 0 and 100),
  interest_score numeric null check (interest_score is null or interest_score between 0 and 100),
  aptitude_score numeric null check (aptitude_score is null or aptitude_score between 0 and 100),
  final_score numeric null check (final_score is null or final_score between 0 and 100),
  rank integer null check (rank is null or rank > 0),
  recommendation_band text null check (
    recommendation_band is null or recommendation_band in (
      'Excellent Match',
      'Strong Match',
      'Good Match',
      'Moderate Match',
      'Weak Match'
    )
  ),
  confidence text null check (confidence is null or confidence in ('High', 'Medium', 'Low')),
  institutional_fit_warning boolean not null default false,
  created_at timestamptz not null default now(),
  unique (assessment_id, program_id),
  check (
    (eligibility_status = 'Eligible' and rank is not null)
    or (eligibility_status <> 'Eligible' and rank is null)
  )
);

create table public.assessment_feedback (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.assessments(id) on delete cascade,
  assessment_mode text not null check (assessment_mode in ('quick', 'detailed')),
  interest_alignment_rating integer not null check (interest_alignment_rating between 1 and 5),
  personal_relevance_rating integer not null check (personal_relevance_rating between 1 and 5),
  explanation_usefulness_rating integer not null check (explanation_usefulness_rating between 1 and 5),
  expected_program_id text null,
  outside_sibau_field boolean not null,
  no_previous_choice boolean not null,
  expected_choice_placement text not null check (
    expected_choice_placement in (
      'top_three',
      'alternative_options',
      'verification_required',
      'not_eligible',
      'not_recommended',
      'no_previous_choice',
      'prefer_not_to_answer'
    )
  ),
  optional_comment text null check (optional_comment is null or char_length(optional_comment) <= 300),
  submitted_at timestamptz not null,
  check (
    (case when expected_program_id is not null then 1 else 0 end)
    + (case when outside_sibau_field then 1 else 0 end)
    + (case when no_previous_choice then 1 else 0 end) <= 1
  )
);

create table public.participant_contacts (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  contact_type text not null,
  contact_value_encrypted text not null,
  follow_up_consent boolean not null check (follow_up_consent = true),
  created_at timestamptz not null default now(),
  unique (participant_id, contact_type, contact_value_encrypted)
);

create index consents_participant_id_idx on public.consents(participant_id);
create index consents_created_at_idx on public.consents(created_at);
create index consents_assessment_mode_idx on public.consents(assessment_mode);
create index assessments_participant_id_idx on public.assessments(participant_id);
create index assessments_created_at_idx on public.assessments(created_at);
create index assessments_assessment_mode_idx on public.assessments(assessment_mode);
create index assessments_scoring_model_version_idx on public.assessments(scoring_model_version);
create index subject_marks_assessment_id_idx on public.subject_marks(assessment_id);
create index interest_responses_assessment_id_idx on public.interest_responses(assessment_id);
create index interest_responses_created_at_idx on public.interest_responses(created_at);
create index aptitude_responses_assessment_id_idx on public.aptitude_responses(assessment_id);
create index recommendation_results_assessment_id_idx on public.recommendation_results(assessment_id);
create index recommendation_results_program_id_idx on public.recommendation_results(program_id);
create index recommendation_results_created_at_idx on public.recommendation_results(created_at);
create index assessment_feedback_assessment_id_idx on public.assessment_feedback(assessment_id);
create index participant_contacts_participant_id_idx on public.participant_contacts(participant_id);
create index participant_contacts_created_at_idx on public.participant_contacts(created_at);

alter table public.participants enable row level security;
alter table public.consents enable row level security;
alter table public.assessments enable row level security;
alter table public.subject_marks enable row level security;
alter table public.interest_responses enable row level security;
alter table public.riasec_scores enable row level security;
alter table public.aptitude_responses enable row level security;
alter table public.aptitude_results enable row level security;
alter table public.recommendation_results enable row level security;
alter table public.assessment_feedback enable row level security;
alter table public.participant_contacts enable row level security;

-- Intentionally create no public, anon, or authenticated policies.
revoke all on table public.participants from anon, authenticated;
revoke all on table public.consents from anon, authenticated;
revoke all on table public.assessments from anon, authenticated;
revoke all on table public.subject_marks from anon, authenticated;
revoke all on table public.interest_responses from anon, authenticated;
revoke all on table public.riasec_scores from anon, authenticated;
revoke all on table public.aptitude_responses from anon, authenticated;
revoke all on table public.aptitude_results from anon, authenticated;
revoke all on table public.recommendation_results from anon, authenticated;
revoke all on table public.assessment_feedback from anon, authenticated;
revoke all on table public.participant_contacts from anon, authenticated;

create or replace function public.submit_research_assessment(p_submission jsonb)
returns table(public_research_code text, assessment_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_submission jsonb := p_submission -> 'submission';
  v_consent jsonb := v_submission -> 'consent';
  v_feedback jsonb := v_submission -> 'optionalFeedback';
  v_participant_id uuid;
  v_submission_id uuid;
  v_assessment_id uuid := gen_random_uuid();
  v_public_code text;
  v_item jsonb;
begin
  if p_submission ->> 'participantEligibility' <> 'eligible_adult_with_consent' then
    raise exception using errcode = '23514', message = 'Participant is not storage eligible.';
  end if;
  if v_submission is null or jsonb_typeof(v_submission) <> 'object' then
    raise exception using errcode = '22023', message = 'Invalid submission.';
  end if;

  v_participant_id := (v_submission ->> 'participantAnonymousId')::uuid;
  v_submission_id := (v_submission ->> 'submissionId')::uuid;
  if v_participant_id <> (v_consent ->> 'participantSessionId')::uuid
     or (v_consent ->> 'operationalConsent')::boolean is not true
     or v_consent ->> 'researchConsent' <> 'granted'
     or v_submission ->> 'ageGroup' <> 'age_18_or_above'
     or v_submission ->> 'assessmentMode' not in ('quick', 'detailed') then
    raise exception using errcode = '23514', message = 'Consent or submission is inconsistent.';
  end if;
  if jsonb_array_length(v_submission -> 'recommendationResults') <> 14 then
    raise exception using errcode = '23514', message = 'Recommendation coverage is incomplete.';
  end if;

  insert into public.participants (id, public_research_code, age_group)
  values (
    v_participant_id,
    'SDA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    v_submission ->> 'ageGroup'
  )
  on conflict (id) do nothing;

  select p.public_research_code
    into v_public_code
    from public.participants p
   where p.id = v_participant_id
     and p.withdrawn_at is null;
  if v_public_code is null then
    raise exception using errcode = '23514', message = 'Participant is unavailable.';
  end if;

  insert into public.consents (
    submission_id,
    participant_id,
    assessment_mode,
    operational_consent,
    research_consent,
    follow_up_consent,
    analytics_consent,
    guardian_consent_status,
    research_storage_eligibility,
    privacy_policy_version,
    consent_text_version,
    consented_at
  ) values (
    v_submission_id,
    v_participant_id,
    v_submission ->> 'assessmentMode',
    true,
    true,
    (v_consent ->> 'followUpContactConsent') = 'granted',
    (v_consent ->> 'analyticsConsent') = 'granted',
    v_consent ->> 'guardianConsentStatus',
    p_submission ->> 'participantEligibility',
    v_consent ->> 'privacyPolicyVersion',
    v_consent ->> 'consentTextVersion',
    (v_consent ->> 'consentTimestamp')::timestamptz
  );

  insert into public.assessments (
    id,
    submission_id,
    participant_id,
    assessment_mode,
    intermediate_group,
    overall_percentage,
    assessment_version,
    questionnaire_version,
    scoring_model_version,
    program_data_version,
    started_at,
    completed_at,
    completion_seconds
  ) values (
    v_assessment_id,
    v_submission_id,
    v_participant_id,
    v_submission ->> 'assessmentMode',
    v_submission ->> 'intermediateGroup',
    (v_submission ->> 'overallPercentage')::numeric,
    v_submission ->> 'assessmentVersion',
    v_submission ->> 'questionnaireVersion',
    v_submission ->> 'scoringModelVersion',
    v_submission ->> 'programDataVersion',
    nullif(v_submission ->> 'startedAt', '')::timestamptz,
    (v_submission ->> 'completedAt')::timestamptz,
    nullif(v_submission ->> 'completionSeconds', '')::integer
  );

  for v_item in select value from jsonb_array_elements(v_submission -> 'subjectMarks') loop
    insert into public.subject_marks (
      assessment_id, subject, obtained_marks, total_marks, percentage
    ) values (
      v_assessment_id,
      v_item ->> 'subject',
      (v_item ->> 'obtainedMarks')::numeric,
      (v_item ->> 'totalMarks')::numeric,
      (v_item ->> 'calculatedPercentage')::numeric
    );
  end loop;

  for v_item in select value from jsonb_array_elements(p_submission -> 'interestRows') loop
    insert into public.interest_responses (
      assessment_id,
      question_or_scenario_id,
      response_payload,
      dimension,
      display_order
    ) values (
      v_assessment_id,
      v_item ->> 'questionOrScenarioId',
      v_item -> 'responsePayload',
      nullif(v_item ->> 'dimension', ''),
      (v_item ->> 'displayOrder')::integer
    );
  end loop;

  insert into public.riasec_scores (
    assessment_id,
    realistic,
    investigative,
    artistic,
    social,
    enterprising,
    conventional,
    top_three_code,
    evidence_label
  ) values (
    v_assessment_id,
    (v_submission #>> '{riasecResult,scores,realistic}')::numeric,
    (v_submission #>> '{riasecResult,scores,investigative}')::numeric,
    (v_submission #>> '{riasecResult,scores,artistic}')::numeric,
    (v_submission #>> '{riasecResult,scores,social}')::numeric,
    (v_submission #>> '{riasecResult,scores,enterprising}')::numeric,
    (v_submission #>> '{riasecResult,scores,conventional}')::numeric,
    v_submission #>> '{riasecResult,topThreeCode}',
    v_submission #>> '{riasecResult,evidenceLabel}'
  );

  for v_item in select value from jsonb_array_elements(p_submission -> 'aptitudeRows') loop
    insert into public.aptitude_responses (
      assessment_id, task_id, dimension, selected_choice_id, correct, display_order
    ) values (
      v_assessment_id,
      v_item ->> 'taskId',
      v_item ->> 'dimension',
      v_item ->> 'selectedChoiceId',
      (v_item ->> 'correct')::boolean,
      (v_item ->> 'displayOrder')::integer
    );
  end loop;

  insert into public.aptitude_results (
    assessment_id, correct_count, total_tasks, overall_percentage, evidence_label
  ) values (
    v_assessment_id,
    (v_submission #>> '{aptitudeResult,correctCount}')::integer,
    (v_submission #>> '{aptitudeResult,totalTasks}')::integer,
    (v_submission #>> '{aptitudeResult,overallPercentage}')::numeric,
    v_submission #>> '{aptitudeResult,evidenceLabel}'
  );

  for v_item in select value from jsonb_array_elements(v_submission -> 'recommendationResults') loop
    insert into public.recommendation_results (
      assessment_id,
      program_id,
      eligibility_status,
      academic_score,
      interest_score,
      aptitude_score,
      final_score,
      rank,
      recommendation_band,
      confidence,
      institutional_fit_warning
    ) values (
      v_assessment_id,
      v_item ->> 'programId',
      v_item ->> 'eligibilityStatus',
      nullif(v_item ->> 'academicScore', '')::numeric,
      nullif(v_item ->> 'interestScore', '')::numeric,
      nullif(v_item ->> 'aptitudeScore', '')::numeric,
      nullif(v_item ->> 'finalScore', '')::numeric,
      nullif(v_item ->> 'rank', '')::integer,
      nullif(v_item ->> 'recommendationBand', ''),
      nullif(v_item ->> 'confidence', ''),
      (v_item ->> 'institutionalFitWarning')::boolean
    );
  end loop;

  if v_feedback is not null and jsonb_typeof(v_feedback) = 'object' then
    insert into public.assessment_feedback (
      assessment_id,
      assessment_mode,
      interest_alignment_rating,
      personal_relevance_rating,
      explanation_usefulness_rating,
      expected_program_id,
      outside_sibau_field,
      no_previous_choice,
      expected_choice_placement,
      optional_comment,
      submitted_at
    ) values (
      v_assessment_id,
      v_feedback ->> 'assessmentMode',
      (v_feedback ->> 'interestAlignmentRating')::integer,
      (v_feedback ->> 'personalRelevanceRating')::integer,
      (v_feedback ->> 'explanationUsefulnessRating')::integer,
      nullif(v_feedback ->> 'previouslyConsideredProgramId', ''),
      (v_feedback ->> 'outsideSibauField')::boolean,
      (v_feedback ->> 'noPreviousChoice')::boolean,
      v_feedback ->> 'expectedChoicePlacement',
      nullif(v_feedback ->> 'optionalComment', ''),
      (v_feedback ->> 'submittedAt')::timestamptz
    );
  end if;

  return query select v_public_code, v_assessment_id;
end;
$$;

revoke all on function public.submit_research_assessment(jsonb) from public;
revoke all on function public.submit_research_assessment(jsonb) from anon, authenticated;
grant execute on function public.submit_research_assessment(jsonb) to service_role;

comment on table public.participant_contacts is
  'Reserved for separately approved encrypted follow-up contacts. This application does not write to this table yet.';
comment on function public.submit_research_assessment(jsonb) is
  'Server-service-role-only atomic research submission. Application governance and participant validation must run before this function.';
