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

Both workflows are inactive until Kromed endpoints and provider credentials are
ready.

## Required Environment

n8n variables:

- `KROMED_APP_URL`
- `KARLA_PHONE`
- `ZAVU_CHANNEL`
- `KROMED_AUTOMATION_API_TOKEN`

n8n credentials:

- `Zavu API Bearer`

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
- Zavu currently has an SMS-capable sender; WhatsApp must be connected through
  Zavu/Meta before WhatsApp delivery is active.
- Free-form WhatsApp messages require an open 24-hour conversation window.
