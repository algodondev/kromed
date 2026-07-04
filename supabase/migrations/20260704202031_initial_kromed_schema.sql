create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;

create type public.app_role as enum ('admin', 'collaborator');
create type public.patient_status as enum ('new', 'active', 'in_treatment', 'paused', 'medical_discharge', 'finalized');
create type public.visit_status as enum ('scheduled', 'confirmed', 'reschedule_requested', 'completed', 'pending_validation', 'approved_for_payment', 'rejected', 'canceled', 'rescheduled');
create type public.payout_status as enum ('pending', 'ready', 'paid', 'adjusted');
create type public.patient_payment_status as enum ('unpaid', 'partially_paid', 'paid', 'overdue');
create type public.reschedule_request_status as enum ('pending', 'approved', 'rejected');
create type public.supply_status as enum ('active', 'inactive');
create type public.conversation_status as enum ('open', 'waiting_for_admin', 'resolved', 'archived');
create type public.shift_availability_behavior as enum ('unavailable', 'available', 'neutral');
create type public.shift_type as enum ('day', 'night', 'mixed', 'custom');
create type public.payout_rate_source as enum ('collaborator_default', 'patient_specific', 'manual_override');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  phone text,
  display_name text not null,
  role public.app_role not null default 'collaborator',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collaborators (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete restrict,
  name text not null,
  contact_phone text,
  profession text,
  default_payout_cents integer not null default 0 check (default_payout_cents >= 0),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  age integer check (age is null or (age >= 0 and age <= 130)),
  diagnosis text,
  address text,
  contact_name text,
  contact_phone text,
  preferred_schedule text,
  visit_frequency text,
  status public.patient_status not null default 'new',
  clinical_summary text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  collaborator_id uuid not null references public.collaborators(id) on delete restrict,
  active boolean not null default true,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index patient_assignments_active_unique
  on public.patient_assignments(patient_id, collaborator_id)
  where active;

create table public.clinical_parameters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  label text not null,
  field_type text not null check (field_type in ('text', 'number', 'boolean', 'select', 'date')),
  required boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.availability_windows (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid not null references public.collaborators(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_windows_time_order check (start_time < end_time),
  constraint availability_windows_effective_order check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid not null references public.collaborators(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blocked_times_positive_duration check (ends_at > starts_at)
);

create table public.shift_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  start_time time not null,
  end_time time not null,
  hours numeric(5,2) not null check (hours > 0),
  shift_type public.shift_type not null default 'custom',
  availability_behavior public.shift_availability_behavior not null default 'neutral',
  applies_globally boolean not null default false,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shift_code_collaborators (
  id uuid primary key default gen_random_uuid(),
  shift_code_id uuid not null references public.shift_codes(id) on delete cascade,
  collaborator_id uuid not null references public.collaborators(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shift_code_id, collaborator_id)
);

create table public.hospital_shifts (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid not null references public.collaborators(id) on delete restrict,
  shift_code_id uuid references public.shift_codes(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  source text not null default 'manual',
  source_label text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_shifts_positive_duration check (ends_at > starts_at)
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  collaborator_id uuid not null references public.collaborators(id) on delete restrict,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status public.visit_status not null default 'scheduled',
  patient_charge_cents integer not null default 0 check (patient_charge_cents >= 0),
  collaborator_payout_cents integer not null default 0 check (collaborator_payout_cents >= 0),
  payout_rate_source public.payout_rate_source not null default 'collaborator_default',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  validated_by uuid references public.profiles(id) on delete set null,
  validated_at timestamptz,
  validation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visits_positive_duration check (scheduled_end > scheduled_start)
);

create table public.visit_substitutions (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  previous_collaborator_id uuid not null references public.collaborators(id) on delete restrict,
  new_collaborator_id uuid not null references public.collaborators(id) on delete restrict,
  reason text,
  substituted_by uuid references public.profiles(id) on delete set null,
  substituted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint visit_substitutions_different_collaborator check (previous_collaborator_id <> new_collaborator_id)
);

create table public.reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  requested_start timestamptz,
  requested_end timestamptz,
  reason text,
  status public.reschedule_request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reschedule_requests_positive_duration check (requested_start is null or requested_end is null or requested_end > requested_start)
);

create table public.visit_clinical_notes (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  evolution_text text not null check (length(trim(evolution_text)) > 0),
  dictation_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  patient_charge_price_cents integer not null default 0 check (patient_charge_price_cents >= 0),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  track_stock boolean not null default false,
  status public.supply_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.visit_supplies (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_snapshot_cents integer not null check (unit_price_snapshot_cents >= 0),
  total_price_cents integer not null check (total_price_cents = quantity * unit_price_snapshot_cents),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipment_rentals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  equipment_name text not null,
  monthly_charge_cents integer not null check (monthly_charge_cents >= 0),
  period_start date not null,
  period_end date,
  status text not null default 'active' check (status in ('active', 'ended', 'canceled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipment_rentals_period_order check (period_end is null or period_end >= period_start)
);

create table public.patient_payments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  received_at timestamptz not null default now(),
  payment_method text not null default 'manual',
  status public.patient_payment_status not null default 'partially_paid',
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_payout_rates (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  collaborator_id uuid not null references public.collaborators(id) on delete restrict,
  payout_cents integer not null check (payout_cents >= 0),
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index patient_payout_rates_active_unique
  on public.patient_payout_rates(patient_id, collaborator_id)
  where active;

create table public.payout_periods (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid not null references public.collaborators(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  status public.payout_status not null default 'pending',
  total_amount_cents integer not null default 0 check (total_amount_cents >= 0),
  paid_at timestamptz,
  paid_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payout_periods_period_order check (period_end >= period_start)
);

create table public.payout_lines (
  id uuid primary key default gen_random_uuid(),
  payout_period_id uuid references public.payout_periods(id) on delete set null,
  visit_id uuid not null unique references public.visits(id) on delete restrict,
  collaborator_id uuid not null references public.collaborators(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  amount_cents integer not null check (amount_cents >= 0),
  status public.payout_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_adjustments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete restrict,
  collaborator_id uuid references public.collaborators(id) on delete restrict,
  visit_id uuid references public.visits(id) on delete restrict,
  amount_cents integer not null check (amount_cents <> 0),
  reason text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_table text not null,
  entity_id uuid,
  action text not null,
  before_snapshot jsonb,
  after_snapshot jsonb,
  created_at timestamptz not null default now()
);

create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_name text not null,
  trigger_source text not null,
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed')),
  related_entity_table text,
  related_entity_id uuid,
  input_snapshot jsonb,
  output_snapshot jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete set null,
  contact_phone text not null,
  channel text not null default 'whatsapp',
  status public.conversation_status not null default 'open',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound', 'internal')),
  sender_type text not null check (sender_type in ('patient', 'admin', 'collaborator', 'assistant', 'system')),
  body text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role) where active;
create index collaborators_profile_idx on public.collaborators(profile_id);
create index patient_assignments_patient_idx on public.patient_assignments(patient_id);
create index patient_assignments_collaborator_idx on public.patient_assignments(collaborator_id) where active;
create index clinical_parameters_patient_idx on public.clinical_parameters(patient_id) where active;
create index availability_windows_collaborator_day_idx on public.availability_windows(collaborator_id, day_of_week);
create index blocked_times_collaborator_range_idx on public.blocked_times(collaborator_id, starts_at, ends_at);
create index shift_code_collaborators_collaborator_idx on public.shift_code_collaborators(collaborator_id) where active;
create index hospital_shifts_collaborator_range_idx on public.hospital_shifts(collaborator_id, starts_at, ends_at);
create index visits_collaborator_schedule_idx on public.visits(collaborator_id, scheduled_start, scheduled_end);
create index visits_patient_schedule_idx on public.visits(patient_id, scheduled_start);
create index visits_status_idx on public.visits(status);
create index visit_clinical_notes_visit_idx on public.visit_clinical_notes(visit_id);
create index visit_supplies_visit_idx on public.visit_supplies(visit_id);
create index equipment_rentals_patient_idx on public.equipment_rentals(patient_id);
create index patient_payments_patient_received_idx on public.patient_payments(patient_id, received_at);
create index payout_periods_collaborator_period_idx on public.payout_periods(collaborator_id, period_start, period_end);
create index payout_lines_collaborator_idx on public.payout_lines(collaborator_id);
create index audit_events_entity_idx on public.audit_events(entity_table, entity_id, created_at);
create index automation_runs_status_idx on public.automation_runs(status, started_at);
create index conversations_patient_idx on public.conversations(patient_id);
create index conversation_messages_conversation_idx on public.conversation_messages(conversation_id, created_at);

create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = public, app
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app.current_user_id()
returns uuid
language sql
stable
set search_path = auth
as $$
  select auth.uid();
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, app
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.active
  );
$$;

create or replace function app.current_collaborator_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, app
as $$
  select c.id
  from public.collaborators c
  where c.profile_id = auth.uid()
    and c.active
  limit 1;
$$;

revoke all on function app.set_updated_at() from public;
revoke all on function app.current_user_id() from public;
revoke all on function app.is_admin() from public;
revoke all on function app.current_collaborator_id() from public;
grant execute on function app.current_user_id() to authenticated, service_role;
grant execute on function app.is_admin() to authenticated, service_role;
grant execute on function app.current_collaborator_id() to authenticated, service_role;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function app.set_updated_at();
create trigger set_collaborators_updated_at before update on public.collaborators for each row execute function app.set_updated_at();
create trigger set_patients_updated_at before update on public.patients for each row execute function app.set_updated_at();
create trigger set_patient_assignments_updated_at before update on public.patient_assignments for each row execute function app.set_updated_at();
create trigger set_clinical_parameters_updated_at before update on public.clinical_parameters for each row execute function app.set_updated_at();
create trigger set_availability_windows_updated_at before update on public.availability_windows for each row execute function app.set_updated_at();
create trigger set_blocked_times_updated_at before update on public.blocked_times for each row execute function app.set_updated_at();
create trigger set_shift_codes_updated_at before update on public.shift_codes for each row execute function app.set_updated_at();
create trigger set_shift_code_collaborators_updated_at before update on public.shift_code_collaborators for each row execute function app.set_updated_at();
create trigger set_hospital_shifts_updated_at before update on public.hospital_shifts for each row execute function app.set_updated_at();
create trigger set_visits_updated_at before update on public.visits for each row execute function app.set_updated_at();
create trigger set_reschedule_requests_updated_at before update on public.reschedule_requests for each row execute function app.set_updated_at();
create trigger set_visit_clinical_notes_updated_at before update on public.visit_clinical_notes for each row execute function app.set_updated_at();
create trigger set_inventory_items_updated_at before update on public.inventory_items for each row execute function app.set_updated_at();
create trigger set_visit_supplies_updated_at before update on public.visit_supplies for each row execute function app.set_updated_at();
create trigger set_equipment_rentals_updated_at before update on public.equipment_rentals for each row execute function app.set_updated_at();
create trigger set_patient_payments_updated_at before update on public.patient_payments for each row execute function app.set_updated_at();
create trigger set_patient_payout_rates_updated_at before update on public.patient_payout_rates for each row execute function app.set_updated_at();
create trigger set_payout_periods_updated_at before update on public.payout_periods for each row execute function app.set_updated_at();
create trigger set_payout_lines_updated_at before update on public.payout_lines for each row execute function app.set_updated_at();
create trigger set_conversations_updated_at before update on public.conversations for each row execute function app.set_updated_at();

grant select, insert, update, delete on table
  public.profiles,
  public.collaborators,
  public.patients,
  public.patient_assignments,
  public.clinical_parameters,
  public.availability_windows,
  public.blocked_times,
  public.shift_codes,
  public.shift_code_collaborators,
  public.hospital_shifts,
  public.visits,
  public.visit_substitutions,
  public.reschedule_requests,
  public.visit_clinical_notes,
  public.inventory_items,
  public.visit_supplies,
  public.equipment_rentals,
  public.patient_payments,
  public.patient_payout_rates,
  public.payout_periods,
  public.payout_lines,
  public.financial_adjustments,
  public.audit_events,
  public.automation_runs,
  public.conversations,
  public.conversation_messages
to authenticated, service_role;

revoke all on table
  public.profiles,
  public.collaborators,
  public.patients,
  public.patient_assignments,
  public.clinical_parameters,
  public.availability_windows,
  public.blocked_times,
  public.shift_codes,
  public.shift_code_collaborators,
  public.hospital_shifts,
  public.visits,
  public.visit_substitutions,
  public.reschedule_requests,
  public.visit_clinical_notes,
  public.inventory_items,
  public.visit_supplies,
  public.equipment_rentals,
  public.patient_payments,
  public.patient_payout_rates,
  public.payout_periods,
  public.payout_lines,
  public.financial_adjustments,
  public.audit_events,
  public.automation_runs,
  public.conversations,
  public.conversation_messages
from anon;

alter table public.profiles enable row level security;
alter table public.collaborators enable row level security;
alter table public.patients enable row level security;
alter table public.patient_assignments enable row level security;
alter table public.clinical_parameters enable row level security;
alter table public.availability_windows enable row level security;
alter table public.blocked_times enable row level security;
alter table public.shift_codes enable row level security;
alter table public.shift_code_collaborators enable row level security;
alter table public.hospital_shifts enable row level security;
alter table public.visits enable row level security;
alter table public.visit_substitutions enable row level security;
alter table public.reschedule_requests enable row level security;
alter table public.visit_clinical_notes enable row level security;
alter table public.inventory_items enable row level security;
alter table public.visit_supplies enable row level security;
alter table public.equipment_rentals enable row level security;
alter table public.patient_payments enable row level security;
alter table public.patient_payout_rates enable row level security;
alter table public.payout_periods enable row level security;
alter table public.payout_lines enable row level security;
alter table public.financial_adjustments enable row level security;
alter table public.audit_events enable row level security;
alter table public.automation_runs enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

create policy "profiles admin all" on public.profiles for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "profiles own select" on public.profiles for select to authenticated using (id = (select auth.uid()));

create policy "collaborators admin all" on public.collaborators for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "collaborators own select" on public.collaborators for select to authenticated using (profile_id = (select auth.uid()));

create policy "patients admin all" on public.patients for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "patients collaborator assigned select" on public.patients for select to authenticated using (
  exists (
    select 1
    from public.patient_assignments pa
    where pa.patient_id = patients.id
      and pa.collaborator_id = app.current_collaborator_id()
      and pa.active
  )
  or exists (
    select 1
    from public.visits v
    where v.patient_id = patients.id
      and v.collaborator_id = app.current_collaborator_id()
  )
);

create policy "patient assignments admin all" on public.patient_assignments for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "patient assignments collaborator own select" on public.patient_assignments for select to authenticated using (collaborator_id = app.current_collaborator_id());

create policy "clinical parameters admin all" on public.clinical_parameters for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "clinical parameters collaborator assigned select" on public.clinical_parameters for select to authenticated using (
  exists (
    select 1
    from public.patient_assignments pa
    where pa.patient_id = clinical_parameters.patient_id
      and pa.collaborator_id = app.current_collaborator_id()
      and pa.active
  )
);

create policy "availability windows admin all" on public.availability_windows for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "availability windows collaborator own select" on public.availability_windows for select to authenticated using (collaborator_id = app.current_collaborator_id());

create policy "blocked times admin all" on public.blocked_times for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "blocked times collaborator own select" on public.blocked_times for select to authenticated using (collaborator_id = app.current_collaborator_id());

create policy "shift codes admin all" on public.shift_codes for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "shift codes collaborator active select" on public.shift_codes for select to authenticated using (active);

create policy "shift code collaborators admin all" on public.shift_code_collaborators for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "shift code collaborators collaborator own select" on public.shift_code_collaborators for select to authenticated using (collaborator_id = app.current_collaborator_id());

create policy "hospital shifts admin all" on public.hospital_shifts for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "hospital shifts collaborator own select" on public.hospital_shifts for select to authenticated using (collaborator_id = app.current_collaborator_id());

create policy "visits admin all" on public.visits for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "visits collaborator own select" on public.visits for select to authenticated using (collaborator_id = app.current_collaborator_id());

create policy "visit substitutions admin all" on public.visit_substitutions for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "visit substitutions collaborator involved select" on public.visit_substitutions for select to authenticated using (
  previous_collaborator_id = app.current_collaborator_id()
  or new_collaborator_id = app.current_collaborator_id()
);

create policy "reschedule requests admin all" on public.reschedule_requests for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "reschedule requests collaborator own select" on public.reschedule_requests for select to authenticated using (
  requested_by = (select auth.uid())
  or exists (
    select 1
    from public.visits v
    where v.id = reschedule_requests.visit_id
      and v.collaborator_id = app.current_collaborator_id()
  )
);
create policy "reschedule requests collaborator own insert" on public.reschedule_requests for insert to authenticated with check (
  requested_by = (select auth.uid())
  and exists (
    select 1
    from public.visits v
    where v.id = reschedule_requests.visit_id
      and v.collaborator_id = app.current_collaborator_id()
  )
);

create policy "visit clinical notes admin all" on public.visit_clinical_notes for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "visit clinical notes collaborator own select" on public.visit_clinical_notes for select to authenticated using (
  exists (
    select 1
    from public.visits v
    where v.id = visit_clinical_notes.visit_id
      and v.collaborator_id = app.current_collaborator_id()
  )
);
create policy "visit clinical notes collaborator own insert" on public.visit_clinical_notes for insert to authenticated with check (
  author_id = (select auth.uid())
  and exists (
    select 1
    from public.visits v
    where v.id = visit_clinical_notes.visit_id
      and v.collaborator_id = app.current_collaborator_id()
  )
);

create policy "inventory items admin all" on public.inventory_items for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "inventory items collaborator active select" on public.inventory_items for select to authenticated using (status = 'active');

create policy "visit supplies admin all" on public.visit_supplies for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "visit supplies collaborator own select" on public.visit_supplies for select to authenticated using (
  exists (
    select 1
    from public.visits v
    where v.id = visit_supplies.visit_id
      and v.collaborator_id = app.current_collaborator_id()
  )
);
create policy "visit supplies collaborator own insert" on public.visit_supplies for insert to authenticated with check (
  exists (
    select 1
    from public.visits v
    where v.id = visit_supplies.visit_id
      and v.collaborator_id = app.current_collaborator_id()
  )
);

create policy "equipment rentals admin all" on public.equipment_rentals for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy "patient payments admin all" on public.patient_payments for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy "patient payout rates admin all" on public.patient_payout_rates for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "patient payout rates collaborator own select" on public.patient_payout_rates for select to authenticated using (collaborator_id = app.current_collaborator_id());

create policy "payout periods admin all" on public.payout_periods for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "payout periods collaborator own select" on public.payout_periods for select to authenticated using (collaborator_id = app.current_collaborator_id());

create policy "payout lines admin all" on public.payout_lines for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "payout lines collaborator own select" on public.payout_lines for select to authenticated using (collaborator_id = app.current_collaborator_id());

create policy "financial adjustments admin all" on public.financial_adjustments for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy "audit events admin all" on public.audit_events for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy "automation runs admin all" on public.automation_runs for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy "conversations admin all" on public.conversations for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy "conversation messages admin all" on public.conversation_messages for all to authenticated using (app.is_admin()) with check (app.is_admin());
