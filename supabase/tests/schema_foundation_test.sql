begin;

select no_plan();

with required_tables(table_name) as (
  values
    ('profiles'),
    ('collaborators'),
    ('patients'),
    ('patient_assignments'),
    ('clinical_parameters'),
    ('availability_windows'),
    ('blocked_times'),
    ('shift_codes'),
    ('shift_code_collaborators'),
    ('hospital_shifts'),
    ('visits'),
    ('visit_substitutions'),
    ('reschedule_requests'),
    ('visit_clinical_notes'),
    ('inventory_items'),
    ('visit_supplies'),
    ('equipment_rentals'),
    ('patient_payments'),
    ('patient_payout_rates'),
    ('payout_periods'),
    ('payout_lines'),
    ('financial_adjustments'),
    ('audit_events'),
    ('automation_runs'),
    ('conversations'),
    ('conversation_messages')
),
missing_tables as (
  select table_name
  from required_tables
  where to_regclass(format('public.%I', table_name)) is null
)
select ok(
  not exists(select 1 from missing_tables),
  'all MVP application tables exist'
);

with required_tables(table_name) as (
  values
    ('profiles'),
    ('collaborators'),
    ('patients'),
    ('patient_assignments'),
    ('clinical_parameters'),
    ('availability_windows'),
    ('blocked_times'),
    ('shift_codes'),
    ('shift_code_collaborators'),
    ('hospital_shifts'),
    ('visits'),
    ('visit_substitutions'),
    ('reschedule_requests'),
    ('visit_clinical_notes'),
    ('inventory_items'),
    ('visit_supplies'),
    ('equipment_rentals'),
    ('patient_payments'),
    ('patient_payout_rates'),
    ('payout_periods'),
    ('payout_lines'),
    ('financial_adjustments'),
    ('audit_events'),
    ('automation_runs'),
    ('conversations'),
    ('conversation_messages')
),
missing_rls as (
  select table_name
  from required_tables
  where not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = table_name
      and c.relrowsecurity
  )
)
select ok(
  not exists(select 1 from missing_rls),
  'RLS is enabled for every application table'
);

with required_types(type_name, labels) as (
  values
    ('app_role', array['admin', 'collaborator']),
    ('patient_status', array['new', 'active', 'in_treatment', 'paused', 'medical_discharge', 'finalized']),
    ('visit_status', array['scheduled', 'confirmed', 'reschedule_requested', 'completed', 'pending_validation', 'approved_for_payment', 'rejected', 'canceled', 'rescheduled']),
    ('payout_status', array['pending', 'ready', 'paid', 'adjusted']),
    ('patient_payment_status', array['unpaid', 'partially_paid', 'paid', 'overdue']),
    ('reschedule_request_status', array['pending', 'approved', 'rejected']),
    ('supply_status', array['active', 'inactive']),
    ('conversation_status', array['open', 'waiting_for_admin', 'resolved', 'archived'])
),
missing_or_wrong as (
  select type_name
  from required_types
  where labels <> coalesce((
    select array_agg(e.enumlabel order by e.enumsortorder)
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = type_name
  ), array[]::text[])
)
select ok(
  not exists(select 1 from missing_or_wrong),
  'documented enum states are present and ordered'
);

select ok(to_regprocedure('app.current_user_id()') is not null, 'app.current_user_id helper exists');
select ok(to_regprocedure('app.is_admin()') is not null, 'app.is_admin helper exists');
select ok(to_regprocedure('app.current_collaborator_id()') is not null, 'app.current_collaborator_id helper exists');

with app_tables(table_name) as (
  values
    ('profiles'),
    ('collaborators'),
    ('patients'),
    ('patient_assignments'),
    ('clinical_parameters'),
    ('availability_windows'),
    ('blocked_times'),
    ('shift_codes'),
    ('shift_code_collaborators'),
    ('hospital_shifts'),
    ('visits'),
    ('visit_substitutions'),
    ('reschedule_requests'),
    ('visit_clinical_notes'),
    ('inventory_items'),
    ('visit_supplies'),
    ('equipment_rentals'),
    ('patient_payments'),
    ('patient_payout_rates'),
    ('payout_periods'),
    ('payout_lines'),
    ('financial_adjustments'),
    ('audit_events'),
    ('automation_runs'),
    ('conversations'),
    ('conversation_messages')
)
select ok(
  not exists (
    select 1
    from information_schema.table_privileges p
    join app_tables t on t.table_name = p.table_name
    where p.table_schema = 'public'
      and p.grantee = 'anon'
  ),
  'anon has no application table privileges'
);

with app_tables(table_name) as (
  values
    ('profiles'),
    ('collaborators'),
    ('patients'),
    ('patient_assignments'),
    ('clinical_parameters'),
    ('availability_windows'),
    ('blocked_times'),
    ('shift_codes'),
    ('shift_code_collaborators'),
    ('hospital_shifts'),
    ('visits'),
    ('visit_substitutions'),
    ('reschedule_requests'),
    ('visit_clinical_notes'),
    ('inventory_items'),
    ('visit_supplies'),
    ('equipment_rentals'),
    ('patient_payments'),
    ('patient_payout_rates'),
    ('payout_periods'),
    ('payout_lines'),
    ('financial_adjustments'),
    ('audit_events'),
    ('automation_runs'),
    ('conversations'),
    ('conversation_messages')
),
missing_select as (
  select table_name
  from app_tables t
  where not exists (
    select 1
    from information_schema.table_privileges p
    where p.table_schema = 'public'
      and p.table_name = t.table_name
      and p.grantee = 'authenticated'
      and p.privilege_type = 'SELECT'
  )
)
select ok(
  not exists(select 1 from missing_select),
  'authenticated role has explicit SELECT grants for application tables'
);

select ok(
  (select count(*) from pg_policies where schemaname = 'public') >= 40,
  'RLS policies exist for admin and collaborator access paths'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'patients'
      and policyname = 'patients collaborator assigned select'
  ),
  'patients collaborator assignment policy exists'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'visits'
      and policyname = 'visits collaborator own select'
  ),
  'visits collaborator-own policy exists'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payout_lines'
      and policyname = 'payout lines collaborator own select'
  ),
  'payout line collaborator policy exists'
);

select ok((select count(*) from public.profiles where role = 'admin') = 1, 'seed data has one admin profile');
select ok((select count(*) from public.profiles where role = 'collaborator') >= 2, 'seed data has collaborator profiles');
select ok((select count(*) from public.patients) >= 3, 'seed data has demo patients');
select ok((select count(*) from public.shift_codes) >= 2, 'seed data has demo shift codes');
select ok((select count(*) from public.visits) >= 3, 'seed data has demo visits');
select ok((select count(*) from public.inventory_items) >= 3, 'seed data has demo supplies');
select ok((select count(*) from public.patient_payments) >= 1, 'seed data has a patient payment');
select ok((select count(*) from public.payout_lines) >= 1, 'seed data has payout lines');
select ok((select count(*) from public.automation_runs) >= 1, 'seed data has automation evidence');

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.visits'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%scheduled_end > scheduled_start%'
  ),
  'visits enforce positive duration'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.visit_supplies'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%total_price_cents%'
  ),
  'visit supplies preserve price snapshots'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_visits_updated_at'
      and tgrelid = 'public.visits'::regclass
      and not tgisinternal
  ),
  'visits updated_at trigger exists'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'visits'
      and indexname = 'visits_collaborator_schedule_idx'
  ),
  'visits collaborator schedule index exists'
);

select * from finish();

rollback;
