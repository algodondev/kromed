export const formatMoney = (cents: number | null | undefined) =>
  new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format((cents ?? 0) / 100);

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const statusLabel = (status: string | null | undefined) => {
  const labels: Record<string, string> = {
    active: "Activo",
    approved_for_payment: "Aprobado para pago",
    canceled: "Cancelado",
    completed: "Completado",
    confirmed: "Confirmado",
    finalized: "Finalizado",
    in_treatment: "En tratamiento",
    medical_discharge: "Alta medica",
    new: "Nuevo",
    overdue: "Vencido",
    paid: "Pagado",
    partially_paid: "Parcial",
    paused: "Pausado",
    pending: "Pendiente",
    pending_validation: "Validacion pendiente",
    ready: "Listo",
    rejected: "Rechazado",
    reschedule_requested: "Reagenda solicitada",
    rescheduled: "Reagendado",
    scheduled: "Programado",
    succeeded: "Correcto",
    unpaid: "Sin pago",
  };

  return labels[status ?? ""] ?? status ?? "Sin estado";
};
