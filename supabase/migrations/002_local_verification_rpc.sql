-- Narrow aggregate verification for synthetic/local integration checks.
-- Safe if deployed beyond local development: callers must already possess the
-- service-role credential, can query only one supplied submission UUID, and
-- receive no raw responses, marks, comments, contact values, or participant data.

create or replace function public.verify_research_submission_counts(
  p_submission_id uuid
)
returns table(
  submission_exists boolean,
  assessment_id uuid,
  participant_count integer,
  consent_count integer,
  assessment_count integer,
  subject_mark_count integer,
  interest_response_count integer,
  riasec_result_count integer,
  aptitude_response_count integer,
  aptitude_result_count integer,
  recommendation_result_count integer,
  feedback_count integer,
  contact_count integer
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with target as (
    select a.id as assessment_id, a.participant_id
      from public.assessments as a
     where a.submission_id = p_submission_id
  )
  select
    exists(select 1 from target) as submission_exists,
    (select t.assessment_id from target as t) as assessment_id,
    (
      select count(*)::integer
        from public.participants as p
        join target as t on t.participant_id = p.id
    ) as participant_count,
    (
      select count(*)::integer
        from public.consents as c
        join target as t on t.participant_id = c.participant_id
       where c.submission_id = p_submission_id
    ) as consent_count,
    (select count(*)::integer from target) as assessment_count,
    (
      select count(*)::integer
        from public.subject_marks as sm
        join target as t on t.assessment_id = sm.assessment_id
    ) as subject_mark_count,
    (
      select count(*)::integer
        from public.interest_responses as ir
        join target as t on t.assessment_id = ir.assessment_id
    ) as interest_response_count,
    (
      select count(*)::integer
        from public.riasec_scores as rs
        join target as t on t.assessment_id = rs.assessment_id
    ) as riasec_result_count,
    (
      select count(*)::integer
        from public.aptitude_responses as ar
        join target as t on t.assessment_id = ar.assessment_id
    ) as aptitude_response_count,
    (
      select count(*)::integer
        from public.aptitude_results as ar
        join target as t on t.assessment_id = ar.assessment_id
    ) as aptitude_result_count,
    (
      select count(*)::integer
        from public.recommendation_results as rr
        join target as t on t.assessment_id = rr.assessment_id
    ) as recommendation_result_count,
    (
      select count(*)::integer
        from public.assessment_feedback as af
        join target as t on t.assessment_id = af.assessment_id
    ) as feedback_count,
    (
      select count(*)::integer
        from public.participant_contacts as pc
        join target as t on t.participant_id = pc.participant_id
    ) as contact_count;
$$;

revoke all on function public.verify_research_submission_counts(uuid)
  from public;
revoke all on function public.verify_research_submission_counts(uuid)
  from anon, authenticated;
grant execute on function public.verify_research_submission_counts(uuid)
  to service_role;

comment on function public.verify_research_submission_counts(uuid) is
  'Service-role-only aggregate verification for one exact research submission UUID. Returns no raw research or contact data.';
