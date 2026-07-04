insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'karla.admin@example.test',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'jenny.lou@example.test',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'mario.rivera@example.test',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

insert into public.profiles (id, email, phone, display_name, role)
values
  ('00000000-0000-4000-8000-000000000001', 'karla.admin@example.test', '+15550101001', 'Karla Admin', 'admin'),
  ('00000000-0000-4000-8000-000000000002', 'jenny.lou@example.test', '+15550101002', 'Jenny Lou', 'collaborator'),
  ('00000000-0000-4000-8000-000000000003', 'mario.rivera@example.test', '+15550101003', 'Mario Rivera', 'collaborator')
on conflict (id) do update set
  email = excluded.email,
  phone = excluded.phone,
  display_name = excluded.display_name,
  role = excluded.role,
  active = true;

insert into public.collaborators (id, profile_id, name, contact_phone, profession, default_payout_cents, notes)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'Jenny Lou', '+15550101002', 'Respiratory therapist', 2500, 'Primary daytime collaborator.'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', 'Mario Rivera', '+15550101003', 'Nurse', 3000, 'Covers afternoon visits.')
on conflict (id) do update set
  name = excluded.name,
  contact_phone = excluded.contact_phone,
  profession = excluded.profession,
  default_payout_cents = excluded.default_payout_cents,
  active = true;

insert into public.patients (
  id,
  full_name,
  age,
  diagnosis,
  address,
  contact_name,
  contact_phone,
  preferred_schedule,
  visit_frequency,
  status,
  clinical_summary,
  created_by
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'Carlos Hernandez',
    68,
    'Demo respiratory therapy case',
    'Demo address 101',
    'Laura Hernandez',
    '+15550202001',
    'Morning',
    'Three visits per week',
    'active',
    'Fake demo patient. Requires therapy visits and oxygen equipment rental.',
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Ana Lopez',
    54,
    'Demo post-operative care case',
    'Demo address 202',
    'Pedro Lopez',
    '+15550202002',
    'Afternoon',
    'Two visits per week',
    'in_treatment',
    'Fake demo patient. Needs follow-up evolution notes.',
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'Roberto Lopez',
    72,
    'Demo new intake case',
    'Demo address 303',
    'Marta Lopez',
    '+15550202003',
    'Flexible',
    'One evaluation requested',
    'new',
    'Fake demo patient for scheduling request.',
    '00000000-0000-4000-8000-000000000001'
  )
on conflict (id) do update set
  full_name = excluded.full_name,
  age = excluded.age,
  diagnosis = excluded.diagnosis,
  address = excluded.address,
  contact_name = excluded.contact_name,
  contact_phone = excluded.contact_phone,
  preferred_schedule = excluded.preferred_schedule,
  visit_frequency = excluded.visit_frequency,
  status = excluded.status,
  clinical_summary = excluded.clinical_summary;

insert into public.patient_assignments (id, patient_id, collaborator_id, active, assigned_by)
values
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', true, '00000000-0000-4000-8000-000000000001'),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', true, '00000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.clinical_parameters (id, patient_id, label, field_type, required, sort_order)
values
  ('22000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Oxygen saturation', 'number', true, 1),
  ('22000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Respiratory tolerance', 'text', false, 2),
  ('22000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'Pain level', 'number', true, 1)
on conflict (id) do nothing;

insert into public.availability_windows (id, collaborator_id, day_of_week, start_time, end_time, effective_from)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 1, '08:00', '17:00', current_date),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 3, '08:00', '17:00', current_date),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 2, '12:00', '19:00', current_date),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 4, '12:00', '19:00', current_date)
on conflict (id) do nothing;

insert into public.blocked_times (id, collaborator_id, starts_at, ends_at, reason, created_by)
values
  (
    '31000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    date_trunc('day', now()) + interval '15 hours',
    date_trunc('day', now()) + interval '16 hours',
    'Demo personal block',
    '00000000-0000-4000-8000-000000000001'
  )
on conflict (id) do nothing;

insert into public.shift_codes (id, code, name, start_time, end_time, hours, shift_type, availability_behavior, applies_globally, created_by)
values
  ('32000000-0000-4000-8000-000000000001', '0146', 'Day hospital shift', '08:00', '18:00', 10.00, 'day', 'unavailable', false, '00000000-0000-4000-8000-000000000001'),
  ('32000000-0000-4000-8000-000000000002', '0538', 'Night hospital shift', '18:00', '08:00', 14.00, 'night', 'unavailable', false, '00000000-0000-4000-8000-000000000001')
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  hours = excluded.hours,
  shift_type = excluded.shift_type,
  availability_behavior = excluded.availability_behavior,
  applies_globally = excluded.applies_globally,
  active = true;

insert into public.shift_code_collaborators (id, shift_code_id, collaborator_id)
values
  ('33000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
  ('33000000-0000-4000-8000-000000000002', '32000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002')
on conflict (id) do nothing;

insert into public.hospital_shifts (id, collaborator_id, shift_code_id, starts_at, ends_at, source, source_label, notes)
values
  (
    '34000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '32000000-0000-4000-8000-000000000001',
    date_trunc('day', now()) + interval '8 hours',
    date_trunc('day', now()) + interval '15 hours',
    'manual',
    'Demo hospital schedule',
    'Used to demonstrate unavailable conflict.'
  )
on conflict (id) do nothing;

insert into public.inventory_items (id, name, patient_charge_price_cents, stock_quantity, track_stock, status)
values
  ('40000000-0000-4000-8000-000000000001', 'Mascarilla', 500, 50, true, 'active'),
  ('40000000-0000-4000-8000-000000000002', 'Filtro', 300, 35, true, 'active'),
  ('40000000-0000-4000-8000-000000000003', 'Nebulizador descartable', 800, 20, true, 'active')
on conflict (id) do update set
  name = excluded.name,
  patient_charge_price_cents = excluded.patient_charge_price_cents,
  stock_quantity = excluded.stock_quantity,
  track_stock = excluded.track_stock,
  status = excluded.status;

insert into public.visits (
  id,
  patient_id,
  collaborator_id,
  scheduled_start,
  scheduled_end,
  status,
  patient_charge_cents,
  collaborator_payout_cents,
  payout_rate_source,
  notes,
  created_by,
  completed_by,
  completed_at,
  validated_by,
  validated_at,
  validation_notes
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    date_trunc('day', now()) - interval '1 day' + interval '10 hours',
    date_trunc('day', now()) - interval '1 day' + interval '11 hours',
    'approved_for_payment',
    7000,
    2500,
    'collaborator_default',
    'Completed demo visit.',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    date_trunc('day', now()) - interval '1 day' + interval '11 hours 5 minutes',
    '00000000-0000-4000-8000-000000000001',
    date_trunc('day', now()) - interval '1 day' + interval '12 hours',
    'Approved for demo payout.'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    date_trunc('day', now()) + interval '13 hours',
    date_trunc('day', now()) + interval '14 hours',
    'pending_validation',
    6500,
    3000,
    'collaborator_default',
    'Awaiting admin validation.',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000003',
    date_trunc('day', now()) + interval '14 hours 5 minutes',
    null,
    null,
    null
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    date_trunc('day', now()) + interval '16 hours',
    date_trunc('day', now()) + interval '17 hours',
    'scheduled',
    7000,
    2500,
    'collaborator_default',
    'Valid demo schedule option.',
    '00000000-0000-4000-8000-000000000001',
    null,
    null,
    null,
    null,
    null
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000002',
    date_trunc('day', now()) + interval '17 hours',
    date_trunc('day', now()) + interval '18 hours',
    'scheduled',
    6500,
    3000,
    'collaborator_default',
    'New intake visit request.',
    '00000000-0000-4000-8000-000000000001',
    null,
    null,
    null,
    null,
    null
  )
on conflict (id) do nothing;

insert into public.visit_clinical_notes (id, visit_id, author_id, evolution_text, dictation_source)
values
  ('51000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'Demo evolution: patient tolerated therapy and remained stable.', null),
  ('51000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', 'Demo evolution: follow-up completed, awaiting admin validation.', null)
on conflict (id) do nothing;

insert into public.visit_supplies (id, visit_id, inventory_item_id, quantity, unit_price_snapshot_cents, total_price_cents)
values
  ('52000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 1, 500, 500),
  ('52000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 2, 300, 600)
on conflict (id) do nothing;

insert into public.equipment_rentals (id, patient_id, equipment_name, monthly_charge_cents, period_start, status, created_by)
values
  ('60000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Concentrador oxygen', 8000, date_trunc('month', current_date)::date, 'active', '00000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.patient_payments (id, patient_id, amount_cents, received_at, payment_method, status, notes, recorded_by)
values
  ('61000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 15000, now() - interval '2 days', 'cash', 'partially_paid', 'Demo partial payment.', '00000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.patient_payout_rates (id, patient_id, collaborator_id, payout_cents, active, created_by)
values
  ('62000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 2500, true, '00000000-0000-4000-8000-000000000001'),
  ('62000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 3000, true, '00000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.payout_periods (id, collaborator_id, period_start, period_end, status, total_amount_cents)
values
  ('63000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', current_date - interval '7 days', current_date, 'ready', 2500)
on conflict (id) do nothing;

insert into public.payout_lines (id, payout_period_id, visit_id, collaborator_id, patient_id, amount_cents, status)
values
  ('64000000-0000-4000-8000-000000000001', '63000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 2500, 'ready')
on conflict (id) do nothing;

insert into public.financial_adjustments (id, patient_id, visit_id, amount_cents, reason, created_by)
values
  ('65000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', -500, 'Demo goodwill adjustment.', '00000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.audit_events (id, actor_id, entity_table, entity_id, action, after_snapshot)
values
  ('70000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'visits', '50000000-0000-4000-8000-000000000001', 'visit.validated', '{"status":"approved_for_payment"}'::jsonb),
  ('70000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'visits', '50000000-0000-4000-8000-000000000001', 'visit.completed', '{"status":"pending_validation"}'::jsonb)
on conflict (id) do nothing;

insert into public.automation_runs (id, workflow_name, trigger_source, status, related_entity_table, related_entity_id, input_snapshot, output_snapshot, completed_at)
values
  (
    '71000000-0000-4000-8000-000000000001',
    'upcoming_visit_reminder_demo',
    'seed',
    'succeeded',
    'visits',
    '50000000-0000-4000-8000-000000000003',
    '{"channel":"whatsapp","mode":"demo"}'::jsonb,
    '{"message":"Reminder queued for demo visit"}'::jsonb,
    now()
  )
on conflict (id) do nothing;

insert into public.conversations (id, patient_id, contact_phone, channel, status, last_message_at)
values
  ('72000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', '+15550202003', 'whatsapp', 'waiting_for_admin', now())
on conflict (id) do nothing;

insert into public.conversation_messages (id, conversation_id, direction, sender_type, body, metadata)
values
  (
    '73000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001',
    'inbound',
    'patient',
    'Demo message: can we move the visit to tomorrow?',
    '{"classification":"reschedule_request"}'::jsonb
  ),
  (
    '73000000-0000-4000-8000-000000000002',
    '72000000-0000-4000-8000-000000000001',
    'internal',
    'assistant',
    'Demo assistant created an admin approval task.',
    '{"requires_admin_approval":true}'::jsonb
  )
on conflict (id) do nothing;
