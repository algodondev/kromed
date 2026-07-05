# n8n Automation Contracts

This branch starts the Kromed n8n integration work from the Supabase schema
foundation. n8n is the orchestration layer; Kromed and Supabase remain the
source of truth.

## n8n Workflows

Created in the `cbuild` n8n Cloud workspace:

- `Kromed - Visit Completed Digest`
  - ID: `s3z8283M0UU5eoFY`
  - Trigger: webhook from Kromed when a visit moves to pending validation.
- `Kromed - Upcoming Visit Reminder`
  - ID: `LyF0lSy3xCdaqTtf`
  - Trigger: schedule every 15 minutes.
- `Kromed - Pending Validation Digest`
  - ID: `xmPXh8mi1kEwDzaS`
  - Trigger: manual n8n webhook, ready for a later schedule trigger.
  - Output: Karla WhatsApp digest plus `automation_runs` log call.
- `Kromed - Reschedule Request Notification`
  - ID: `X920NGGJKRpQoYzB`
  - Trigger: manual n8n webhook, ready for a later schedule trigger.
  - Output: Karla WhatsApp digest plus `automation_runs` log call.
- `Kromed - Payout Draft Digest`
  - ID: `c42tYeyiRsaCOsnS`
  - Trigger: manual n8n webhook, ready for a later schedule trigger.
  - Output: Karla WhatsApp payout summary plus `automation_runs` log call.
- `Kromed - Monthly Summary Digest`
  - ID: `4uZkZIE5b2uDLIJX`
  - Trigger: manual n8n webhook, ready for a later schedule trigger.
  - Output: Karla WhatsApp monthly operations summary plus `automation_runs`
    log call.
- `Kromed - UI Report Delivery`
  - ID: `YEMm9rgfyZDPpHnO`
  - Trigger: active manual n8n webhook called by Kromed server-side report
    generation.
  - Output: Karla WhatsApp report message plus `automation_runs` log call.
- `Kromed - Zavu WhatsApp Smoke Test`
  - ID: `ooULHOx2xvRKHUVH`
  - Trigger: webhook for verifying n8n can send WhatsApp through Zavu.
- `Kromed - Zavu Template Smoke Test`
  - ID: `8gF761PGw6dL8fQy`
  - Trigger: webhook for verifying approved template delivery through Zavu.
  - Status: inactive until the Meta template is approved.
- `Kromed - WhatsApp Voice Note Transcription Preview`
  - ID: `nuO6rBXYCgSule36`
  - Trigger: webhook for inbound WhatsApp audio or manual preview payloads.
  - Output: WhatsApp reply with the transcript plus an HTML preview with audio
    metadata, audio player, and transcript.
- `Kromed - Inbound Message Agent`
  - ID: `fBzlp8MNkVMkcNYr`
  - Trigger: webhook for inbound Zavu WhatsApp/SMS messages.
  - Output: safe operational response, conversation/message logs,
    reschedule request when applicable, and automation run.
- `Kromed - Inbound Message Agent Test Suite`
  - ID: `eokUlIOjZgmxpYwb`
  - Trigger: webhook for synthetic test-mode payloads.
  - Output: pass/fail summary for scripted agent cases.
- `Kromed - AI Supabase Tool Agent`
  - ID: `3wj8CUGh2fJFXX0a`
  - Trigger: webhook from the inbound message agent for safe operational
    questions.
  - Output: draft answer only; deterministic workflows still own side effects.
- `Kromed - Supabase Context Tool`
  - ID: `XQJx7vKSv3JwtJMZ`
  - Trigger: Execute Workflow Trigger from the AI agent workflow.
  - Output: narrow sender, conversation, and upcoming-visit context from
    Supabase.
- `Kromed - Business Operations Tool`
  - ID: `h1ISthaab26A0Xqq`
  - Trigger: Execute Workflow Trigger from the AI agent workflow and production
    webhook `kromed/business-operations-tool`.
  - Output: authorized Kromed business mutation result with operation status,
    related entity, reply text, and mutation metadata.

Reminder and digest product workflows remain inactive until Kromed endpoints
and app tokens are ready. The smoke test, transcription preview, inbound agent,
agent test suite, AI draft workflow, Supabase context workflow, and business
operations workflow are active for integration verification. The Business
Operations Tool now collapses each broad Supabase context read before the next
read, so downstream Supabase nodes no longer fan out once per returned item.
Recent smoke checks finished the shared business-operation reads in roughly
1-2 seconds instead of timing out around `Get operation visits`.

## Required Environment

n8n variables:

- `KROMED_APP_URL`
- `KARLA_PHONE`
- `ZAVU_CHANNEL`
- `ZAVU_REMINDER_TEMPLATE_ID`
- `ZAVU_REMINDER_TEMPLATE_NAME`
- `KROMED_AUTOMATION_API_TOKEN`

n8n credentials:

- `Zavu API Bearer`
- `ElevenLabs API Key`
- `Kromed Supabase Service Role`
- `Kromed OpenAI API`

Kromed server environment:

- `KROMED_AUTOMATION_API_TOKEN`

Every `/api/automation/*` route must reject requests without:

```text
Authorization: Bearer <KROMED_AUTOMATION_API_TOKEN>
```

## Visit Completed Digest

Kromed should call the n8n webhook after a collaborator completes a visit and
the visit status becomes `pending_validation`.

Webhook path:

```text
kromed/visit-completed-digest
```

Payload:

```json
{
  "visitId": "00000000-0000-0000-0000-000000000000",
  "patientName": "Paciente Demo",
  "collaboratorName": "Colaborador Demo",
  "completedAt": "2026-07-04T20:00:00.000Z",
  "hasSupplies": true,
  "suppliesTotal": 18.5,
  "clinicalEvolution": "Paciente tolero la terapia sin complicaciones."
}
```

Expected Kromed side effect:

- n8n notifies Karla through Zavu.
- Kromed records the workflow result in `public.automation_runs`.

## Inbound Message Agent

Zavu should eventually call the n8n webhook when the shared Kromed number
receives an inbound WhatsApp/SMS message.

Webhook path:

```text
kromed/inbound-message-agent
```

Manual test payload:

```json
{
  "testMode": true,
  "from": "+15555550101",
  "channel": "whatsapp",
  "messageType": "text",
  "messageId": "manual-agent-test",
  "text": "A que hora es mi proxima visita?"
}
```

Audio payload:

```json
{
  "testMode": true,
  "from": "+15555550101",
  "channel": "whatsapp",
  "messageType": "audio",
  "messageId": "manual-audio-test",
  "audioUrl": "https://example.com/audio.wav"
}
```

Expected behavior:

- Normalizes the sender phone, provider message id, channel, text/audio
  metadata, and modality.
- Transcribes audio through ElevenLabs when an audio URL is available.
- Resolves the sender against `patients.contact_phone`,
  `collaborators.contact_phone`, and `profiles.phone`.
- Staff routing is explicit for the MVP:
  - Leader/admin: `+50379164921`.
  - Collaborator: `+50376202883`.
  - Any other inbound phone number enters the patient path. If the phone does
    not match an existing patient, the workflow may collect intake context but
    must not disclose visit, schedule, clinical, or financial data until the
    patient is linked to a Kromed record.
- Uses native n8n Supabase nodes to read approved context and write
  `conversations`, `conversation_messages`, `reschedule_requests` when
  applicable, and `automation_runs`.
- Calls `Kromed - Business Operations Tool` for role-scoped business
  operations from verified leaders/admins and collaborators.
- Calls `Kromed - AI Supabase Tool Agent` for safe read-only operational
  questions.
- Never gives clinical advice, exposes another patient's data, finalizes
  reschedules, or changes payment state outside the approved leader/admin
  operation path.
- Skips real Zavu sends when `testMode` is true.

Example test-mode response:

```json
{
  "ok": true,
  "summary": {
    "workflow": "inbound_message_agent",
    "testMode": true,
    "senderType": "patient",
    "intent": "operational_question",
    "action": "ai_answer_draft",
    "modality": "text",
    "transcriptionStatus": "not_required",
    "requiresHuman": false,
    "replyText": "Tu proxima visita es ..."
  },
  "zavuSend": "skipped_test_mode"
}
```

## Business Operations Tool

Workflow:

```text
Kromed - Business Operations Tool
```

Webhook paths:

```text
kromed/business-operations-tool
kromed/business-operations-tool-test
```

The production path is called by `Kromed - Inbound Message Agent`; the test path
is reserved for direct workflow verification.

Allowed leader/admin operations:

- `schedule_visit`
- `approve_visit`
- `reject_visit`
- `record_payment`
- `update_inventory`

Allowed collaborator operations:

- `complete_visit` for an assigned visit.
- `request_reschedule` for an assigned visit, which remains pending leader/admin
  approval.

Denied operations:

- Unknown/unmatched phones cannot mutate business data.
- Collaborators cannot schedule visits, approve/reject visits for payment,
  record patient payments, update inventory, or mutate another collaborator's
  work.

Input shape:

```json
{
  "contact_phone": "+50379164921",
  "message": "Actualiza inventario de Mascarilla a 42 unidades.",
  "senderType": "admin",
  "profileId": "optional-profile-id",
  "collaboratorId": "optional-collaborator-id",
  "patientId": "optional-patient-id",
  "matchedVisitId": "optional-visit-id",
  "source": "inbound_message_agent"
}
```

Output shape:

```json
{
  "ok": true,
  "operation": "update_inventory",
  "status": "succeeded",
  "allowed": true,
  "actorRole": "admin",
  "entityTable": "inventory_items",
  "entityId": "91000000-0000-4000-8000-000000000001",
  "replyText": "Listo. Actualizare Mascarilla a 42 unidades.",
  "mutation": {
    "node": "Update inventory stock",
    "id": "91000000-0000-4000-8000-000000000001"
  }
}
```

Implementation notes:

- The workflow uses native n8n Supabase nodes for reads and writes.
- A deterministic planner normalizes the sender, resolves role, checks
  operation permission, identifies the target row, and only then routes to a
  write node.
- The AI agent has this workflow as a tool, but the inbound workflow also calls
  it directly for operation requests so authorization and side effects remain
  deterministic.
- Voice notes with a transcript use the same operation path as written
  messages.
- On 2026-07-05, the shared Business Operations context-read chain was patched
  with one-item collapse nodes after `profiles`, `collaborators`, `patients`,
  `visits`, and `inventory_items` reads. This fixed n8n item multiplication
  where 16 profile rows previously expanded into hundreds or thousands of
  downstream Supabase reads.
- A controlled role/path smoke matrix covered leader scheduling, validation,
  payment, inventory, Carla collaborator completion, Carla collaborator
  reschedule, Carla leader-only denial, known-patient booking, new-patient
  intake, no-disclosure, clinical escalation, operational question, and audio
  handling. Temporary test rows were cleaned after verification.

## Inbound Message Agent Test Suite

Webhook path:

```text
kromed/inbound-message-agent-test-suite
```

The suite sends synthetic test-mode payloads to the inbound agent and returns a
summary with total, passed, failed, failed case names, and per-case summaries.

The latest verification passed all scripted cases:

- patient confirmation.
- patient reschedule escalation.
- patient operational question answered through AI plus Supabase context.
- collaborator reschedule request creation.
- unmatched patient intake/no-disclosure response.
- clinical or emergency escalation response.
- voice-note transcription path.
- voice-note missing-audio-url clarification path.
- leader scheduling a visit.
- leader approving a pending visit for payment.
- leader recording a patient payment.
- leader updating inventory through a voice-note transcript.
- collaborator completing an assigned visit.
- collaborator denial for leader-only approval.
- unknown sender denial for a mutation request.

The 2026-07-05 verification passed 15/15 cases. Hosted Supabase smoke checks
confirmed the expected row effects for the suite:

- A scheduled visit was created for the test patient and live test
  collaborator.
- A pending validation visit moved to `approved_for_payment`.
- A patient payment was inserted with the expected amount.
- The tracked inventory item stock was updated.
- The collaborator's assigned visit moved to `pending_validation` and received
  a clinical note.

## Upcoming Visit Reminder

Endpoint:

```text
GET /api/automation/reminders/upcoming-visits
```

Response:

```json
{
  "visits": [
    {
      "reminderId": "visit-id-24h",
      "visitId": "00000000-0000-0000-0000-000000000000",
      "patientName": "Paciente Demo",
      "patientPhone": "+50375419727",
      "startsAt": "2026-07-05T20:00:00.000Z",
      "window": "24h",
      "text": "Recordatorio Kromed: tiene una visita programada..."
    }
  ]
}
```

After a provider send succeeds, n8n calls:

```text
POST /api/automation/reminders/:id/mark-sent
```

Payload:

```json
{
  "visitId": "00000000-0000-0000-0000-000000000000",
  "window": "24h",
  "sentAt": "2026-07-04T20:00:00.000Z",
  "provider": "zavu"
}
```

## Automation Run Logging

Endpoint:

```text
POST /api/automation/runs
```

The endpoint should insert into `public.automation_runs`.

Payload:

```json
{
  "workflow": "upcoming_visit_reminder",
  "status": "completed",
  "entityType": "visit",
  "entityId": "00000000-0000-0000-0000-000000000000",
  "metadata": {
    "provider": "zavu"
  }
}
```

Mapping to the current schema:

- `workflow` -> `workflow_name`
- `status: completed` -> `status: succeeded`
- `entityType` -> `related_entity_table`
- `entityId` -> `related_entity_id`
- `metadata` -> `output_snapshot`
- request body -> `input_snapshot`

## Current Blockers

- `KROMED_APP_URL` in n8n is still a placeholder.
- `KROMED_AUTOMATION_API_TOKEN` must be configured in both Kromed and n8n.
- Endpoint-backed admin digest workflows exist, but remain inactive until the
  URL and token are configured.
- Zavu WhatsApp has been verified from n8n. Smoke test message
  `jx75tyeq0ne64p5q29kaegf3yd89z2a8` was delivered to `+50375419727`.
- Zavu inbound webhooks are active for `message.inbound` and
  `message.unsupported` events and now point to:
  `https://cbuild.app.n8n.cloud/webhook/kromed/inbound-message-agent`.
- Provider-side verification on 2026-07-05 showed the default sender webhook is
  active for those events and points to that URL.
- The live inbound agent was verified with Zavu-shaped test-mode payloads,
  including a leader voice-note transcript that updated inventory through the
  business-operation path.
- Voice note transcription preview works with manual transcript payloads.
  ElevenLabs Speech-to-Text is configured in n8n through the `ElevenLabs API Key`
  credential and has been validated with a generated Spanish audio sample and a
  real WhatsApp voice note from Zavu.
- The Zavu sender reports `canSendTemplates: true`, but the Kromed reminder
  template is still pending approval. Production reminders outside the open
  WhatsApp window should wait for the approved template.

## WhatsApp Template Reminder

Template created in Zavu and submitted to Meta:

```text
id: ks70t73sdhehe1zt6fbnmt11dn89ze78
name: kromed_visit_reminder_es
status: pending
category: UTILITY
language: es
```

Template body:

```text
Hola {{1}}, le recordamos su visita de Kromed programada para {{2}}. Responda CONFIRMAR si todo esta bien o REPROGRAMAR si necesita otra hora.
```

Variables:

- `1`: patient name
- `2`: visit date/time

The `Kromed - Upcoming Visit Reminder` workflow is configured to send this
template through Zavu using `ZAVU_REMINDER_TEMPLATE_ID`. It should remain
inactive until the template status is `approved` and Kromed automation endpoints
exist.

## Admin Digest Workflows

These workflows are created in n8n but remain inactive until `KROMED_APP_URL`
points to the deployed Kromed app and `KROMED_AUTOMATION_API_TOKEN` is set in
both n8n and the app server.

## UI Report Delivery

Kromed report buttons call a server-side app route:

```text
POST /api/reports/generate
```

The route validates the signed-in profile and only allows active admins to
trigger report delivery. The browser does not receive the n8n webhook URL.

Server environment:

```text
N8N_UI_REPORT_DELIVERY_WEBHOOK_URL
```

n8n webhook path:

```text
kromed/ui-report-delivery
```

Supported report types:

- `patient`: selected patient visit count, latest visit, latest evolution note,
  supplies total, and assigned team.
- `financial`: current-month visits, charges, received payments, pending
  balance, and collaborator payout total.
- `collaborator`: selected collaborator visit count, completed/pending
  validation visits, patients served, payout generated, and latest visit.

Expected n8n behavior:

- Send the report summary to Karla through Zavu.
- Record the delivery through `POST /api/automation/runs` with workflow
  `ui_report_delivery`.

### Pending Validation Digest

Webhook path:

```text
kromed/pending-validation-digest
```

Reads:

```text
GET /api/automation/visits/pending-validation
```

Behavior:

- Builds a WhatsApp digest for Karla with pending validation count and the
  first pending visits.
- Sends the digest through Zavu.
- Logs the workflow through `POST /api/automation/runs`.

### Reschedule Request Notification

Webhook path:

```text
kromed/reschedule-request-notification
```

Reads:

```text
GET /api/automation/reschedule-requests/pending
```

Behavior:

- Builds a WhatsApp digest for Karla with pending reschedule requests.
- Sends the digest through Zavu.
- Logs the workflow through `POST /api/automation/runs`.

### Payout Draft Digest

Webhook path:

```text
kromed/payout-draft-digest
```

Reads:

```text
GET /api/automation/payouts/draft
```

Behavior:

- Summarizes visits approved for collaborator payout.
- Sends Karla the total payout amount and a collaborator preview.
- Logs the workflow through `POST /api/automation/runs`.

### Monthly Summary Digest

Webhook path:

```text
kromed/monthly-summary-digest
```

Reads:

```text
GET /api/automation/reports/monthly-summary
```

Behavior:

- Summarizes current-month visits, pending validations, approved payout visits,
  patient charges, received payments, collaborator payouts, and automation run
  success counts.
- Sends the summary to Karla through Zavu.
- Logs the workflow through `POST /api/automation/runs`.

## Voice Note Transcription Preview

Webhook path:

```text
kromed/voice-note-transcription-preview
```

Manual preview payload:

```json
{
  "from": "+50375419727",
  "channel": "whatsapp",
  "messageType": "audio",
  "messageId": "manual-preview",
  "audioUrl": "https://example.com/audio.wav",
  "transcript": "Paciente tolero la terapia sin complicaciones."
}
```

The workflow returns an HTML page showing the sender, channel, message id, audio
player, and transcript. It also replies to the WhatsApp sender with the
transcription using Zavu. ElevenLabs uses
`POST https://api.elevenlabs.io/v1/speech-to-text` with model `scribe_v2` and
`source_url` for automatic transcription.

Real Zavu inbound audio payload shape:

```json
{
  "timestamp": 1783219417599,
  "data": {
    "from": "+50375419727",
    "to": "+17626678164",
    "channel": "whatsapp",
    "messageType": "audio",
    "content": {
      "mediaId": "1522751965964281",
      "mediaUrl": "https://scintillating-platypus-663.convex.cloud/api/storage/05b45c8d-cd9c-4b9b-9d6d-40a665413737",
      "mimeType": "audio/ogg; codecs=opus"
    },
    "providerTimestamp": 1783219413000
  }
}
```

Verified transcription:

```text
Paciente toleró la terapia sin complicaciones. A continuar ejercicios respiratorios
```

Verified WhatsApp transcription reply:

```text
Transcripcion Kromed:

Paciente toleró la terapia sin complicaciones. A continuar ejercicios respiratorios

Revisa esta nota antes de guardarla en el expediente.
```

Zavu reply message:

```text
jx77mryma5hf7twat40trecbjx89yyf3
status: delivered
```
