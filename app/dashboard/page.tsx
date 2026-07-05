import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData, type DashboardData } from "@/lib/dashboard-data";
import { formatDateTime, formatMoney, statusLabel } from "@/lib/format";

type VisitRow = DashboardData["visits"][number] & {
  patients: {
    full_name: string;
    contact_name: string | null;
    contact_phone: string | null;
  } | null;
  collaborators: {
    name: string;
    profession: string | null;
  } | null;
};

type PayoutRow = DashboardData["payoutLines"][number] & {
  patients: { full_name: string } | null;
  collaborators: { name: string } | null;
  visits: { scheduled_start: string } | null;
};

type PaymentRow = DashboardData["payments"][number] & {
  patients: { full_name: string } | null;
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const visits = data.visits as VisitRow[];
  const payoutLines = data.payoutLines as PayoutRow[];
  const payments = data.payments as PaymentRow[];
  const pendingValidation = visits.filter(
    (visit) => visit.status === "pending_validation",
  );
  const upcomingVisits = visits.filter((visit) =>
    ["scheduled", "confirmed", "reschedule_requested"].includes(visit.status),
  );
  const totalPatientCharges = visits.reduce(
    (sum, visit) => sum + visit.patient_charge_cents,
    0,
  );
  const totalPayouts = payoutLines.reduce(
    (sum, line) => sum + line.amount_cents,
    0,
  );

  return (
    <DashboardShell
      displayName={data.profile.display_name}
      role={data.role}
    >
      <header className="mainheader">
        <div className="mh-title">
          <h1>
            {data.role === "admin"
              ? "Dashboard de lider"
              : "Dashboard de colaborador"}
          </h1>
          <p>
            Datos cargados desde Supabase con permisos RLS del usuario actual.
          </p>
        </div>
        <div className="mh-tools">
          <span className="chip blue">{data.profile.email}</span>
        </div>
      </header>

      <section className="page">
        {data.errors.length ? (
          <div className="empty-note amber">
            Algunas consultas fueron limitadas por permisos o configuracion. La
            pantalla muestra la informacion disponible para este rol.
          </div>
        ) : null}

        <div className="stat-grid">
          <div className="stat accent">
            <div className="v">{data.patients.length}</div>
            <div className="l">Pacientes visibles</div>
          </div>
          <div className="stat">
            <div className="v">{visits.length}</div>
            <div className="l">Visitas</div>
          </div>
          <div className="stat">
            <div className="v">{pendingValidation.length}</div>
            <div className="l">Pendientes de validar</div>
          </div>
          <div className="stat">
            <div className="v">
              {data.role === "admin"
                ? formatMoney(totalPatientCharges)
                : formatMoney(totalPayouts)}
            </div>
            <div className="l">
              {data.role === "admin" ? "Cargos demo" : "Pagos visibles"}
            </div>
          </div>
        </div>

        <div className="panelgrid">
          <div>
            <section className="panel">
              <h3>
                Agenda proxima <span>{upcomingVisits.length} visitas</span>
              </h3>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Colaborador</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th className="text-right">Cobro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.slice(0, 8).map((visit) => (
                      <tr key={visit.id}>
                        <td>
                          <div className="tname">
                            {visit.patients?.full_name ?? "Paciente"}
                          </div>
                          <div className="tmeta">{visit.notes}</div>
                        </td>
                        <td>
                          <div className="tname">
                            {visit.collaborators?.name ?? "Colaborador"}
                          </div>
                          <div className="tmeta">
                            {visit.collaborators?.profession ?? ""}
                          </div>
                        </td>
                        <td>{formatDateTime(visit.scheduled_start)}</td>
                        <td>
                          <span className="chip blue">
                            {statusLabel(visit.status)}
                          </span>
                        </td>
                        <td className="num">
                          {formatMoney(visit.patient_charge_cents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <h3>
                Pacientes <span>segun permisos del rol</span>
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {data.patients.map((patient) => (
                  <article
                    className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4"
                    key={patient.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-[var(--ink)]">
                          {patient.full_name}
                        </h4>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {patient.diagnosis}
                        </p>
                      </div>
                      <span className="chip green">
                        {statusLabel(patient.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                      {patient.clinical_summary}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside>
            <section className="panel">
              <h3>Automatizacion n8n</h3>
              {data.automationRuns.length ? (
                <div className="timeline">
                  {data.automationRuns.map((run) => (
                    <div className="tl-item" key={run.id}>
                      <span className="tl-dot green" />
                      <div className="tl-time">{formatDateTime(run.started_at)}</div>
                      <strong>{run.workflow_name}</strong>
                      <div className="tmeta">{statusLabel(run.status)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="tmeta">
                  No hay ejecuciones visibles para este usuario.
                </p>
              )}
            </section>

            <section className="panel">
              <h3>{data.role === "admin" ? "Finanzas" : "Mis pagos"}</h3>
              <div className="space-y-3">
                {(data.role === "admin" ? payments : payoutLines)
                  .slice(0, 5)
                  .map((row) => {
                    if ("amount_cents" in row && "received_at" in row) {
                      return (
                        <div className="teamrow" key={row.id}>
                          <div>
                            <div className="tname">
                              {(row as PaymentRow).patients?.full_name ??
                                "Paciente"}
                            </div>
                            <div className="tmeta">
                              {formatDateTime((row as PaymentRow).received_at)}
                            </div>
                          </div>
                          <strong>{formatMoney(row.amount_cents)}</strong>
                        </div>
                      );
                    }

                    const payout = row as PayoutRow;
                    return (
                      <div className="teamrow" key={payout.id}>
                        <div>
                          <div className="tname">
                            {payout.patients?.full_name ?? "Paciente"}
                          </div>
                          <div className="tmeta">{statusLabel(payout.status)}</div>
                        </div>
                        <strong>{formatMoney(payout.amount_cents)}</strong>
                      </div>
                    );
                  })}
              </div>
            </section>

            <section className="panel">
              <h3>Inventario</h3>
              <div className="space-y-3">
                {data.inventory.slice(0, 5).map((item) => (
                  <div className="teamrow" key={item.id}>
                    <div>
                      <div className="tname">{item.name}</div>
                      <div className="tmeta">{statusLabel(item.status)}</div>
                    </div>
                    <strong>{item.stock_quantity ?? "N/A"}</strong>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </DashboardShell>
  );
}
