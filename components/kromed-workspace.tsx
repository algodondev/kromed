"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  BellIcon,
  BoxesIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  CircleDollarSignIcon,
  Clock3Icon,
  Code2Icon,
  FileTextIcon,
  HomeIcon,
  LockIcon,
  LogOutIcon,
  PlusIcon,
  SearchIcon,
  UserPlusIcon,
  UsersRoundIcon,
  WalletCardsIcon,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatMoney, statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  CreateCollaboratorState,
  CreateInventoryOrEquipmentState,
  CreateShiftCodeState,
  CreateVisitState,
} from "@/app/dashboard/actions";
import type { DashboardData } from "@/lib/dashboard-data";

type WorkspaceRole = "karla" | "colaborador";

type View =
  | "dashboard"
  | "calendar"
  | "patients"
  | "patientDetail"
  | "scheduleVisit"
  | "collaborators"
  | "validation"
  | "supplies"
  | "shiftCodes"
  | "finance"
  | "reports"
  | "myAgenda"
  | "myPatients"
  | "myPayments";

type PatientTab = "info" | "team" | "evolution" | "visits" | "finance";
type FinanceTab = "income" | "payouts";
type AgendaFormat = "list" | "calendar";
type ReportType = "patient" | "financial" | "collaborator";
type ReportStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

type Patient = DashboardData["patients"][number];
type Visit = DashboardData["visits"][number] & {
  patients?: {
    full_name: string;
    contact_name: string | null;
    contact_phone: string | null;
  } | null;
  collaborators?: {
    name: string;
    profession: string | null;
  } | null;
};
type Payment = DashboardData["payments"][number] & {
  patients?: { full_name: string } | null;
};
type PayoutLine = DashboardData["payoutLines"][number] & {
  patients?: { full_name: string } | null;
  collaborators?: { name: string } | null;
  visits?: { scheduled_start: string } | null;
};
type PatientAssignment = DashboardData["patientAssignments"][number] & {
  patients?: { full_name: string } | null;
  collaborators?: { name: string; profession: string | null } | null;
};
type ClinicalNote = DashboardData["clinicalNotes"][number] & {
  visits?: { patient_id: string } | null;
  profiles?: { display_name: string } | null;
};
type VisitSupply = DashboardData["visitSupplies"][number] & {
  inventory_items?: { name: string } | null;
  visits?: { patient_id: string } | null;
};
type EquipmentRental = DashboardData["equipmentRentals"][number] & {
  patients?: { full_name: string } | null;
};
type HospitalShift = DashboardData["hospitalShifts"][number] & {
  collaborators?: { name: string; profession: string | null } | null;
  shift_codes?: { code: string; name: string } | null;
};
type PayoutPeriod = DashboardData["payoutPeriods"][number] & {
  collaborators?: { name: string } | null;
};

type NavItem = {
  view: View;
  label: string;
  icon: LucideIcon;
};

const leaderNav: Array<NavItem | { label: string }> = [
  { view: "dashboard", label: "Inicio", icon: HomeIcon },
  { view: "calendar", label: "Calendario", icon: CalendarDaysIcon },
  { view: "patients", label: "Pacientes", icon: UsersRoundIcon },
  { view: "scheduleVisit", label: "Agendar visita", icon: PlusIcon },
  { view: "collaborators", label: "Colaboradores", icon: UserPlusIcon },
  { view: "validation", label: "Validación de visitas", icon: CheckCircle2Icon },
  { label: "Configuración" },
  { view: "supplies", label: "Insumos e inventario", icon: BoxesIcon },
  { view: "shiftCodes", label: "Códigos de visita", icon: Code2Icon },
  { label: "Finanzas" },
  { view: "finance", label: "Pagos y cobros", icon: WalletCardsIcon },
  { view: "reports", label: "Reportes", icon: FileTextIcon },
];

const collaboratorNav: NavItem[] = [
  { view: "myAgenda", label: "Mi agenda", icon: CalendarDaysIcon },
  { view: "myPatients", label: "Mis pacientes", icon: UsersRoundIcon },
  { view: "myPayments", label: "Mis pagos", icon: CircleDollarSignIcon },
];

const pageMeta: Record<View, [string, string]> = {
  dashboard: ["Panel del día", "Operación clínica conectada a Supabase"],
  calendar: ["Calendario inteligente", "Cruce de horario hospitalario y visitas externas"],
  patients: ["Pacientes", "Cada paciente es atendido por un equipo"],
  patientDetail: ["Ficha del paciente", "Información clínica, visitas y finanzas"],
  scheduleVisit: ["Agendar visita", "Precio al paciente y pago al colaborador se registran por separado"],
  collaborators: ["Colaboradores", "Equipo de profesionales externos"],
  validation: ["Validación de visitas", "Confirma quién realizó la visita antes de aprobarla para pago"],
  supplies: ["Insumos e inventario", "Catálogo operativo conectado al inventario"],
  shiftCodes: ["Códigos de visita", "Editables según hospital o institución"],
  finance: ["Pagos y cobros", "Desglose de ingresos por paciente y pagos por colaborador"],
  reports: ["Reportes", "Reportes por paciente, finanzas y colaborador"],
  myAgenda: ["Mi agenda", "Portal de colaborador"],
  myPatients: ["Pacientes asignados", "Portal de colaborador"],
  myPayments: ["Mis pagos", "Portal de colaborador"],
};

const patientFilters = [
  "Todos",
  "Nuevo",
  "Activo",
  "En tratamiento",
  "Pausado",
  "Finalizado",
];

function initials(value: string | null | undefined) {
  const parts = (value ?? "Kromed")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Sin hora";

  return new Intl.DateTimeFormat("es-SV", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function timeSlotKey(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function compareTimeSlots(left: string, right: string) {
  return left.localeCompare(right);
}

function formatTimeSlot(slot: string) {
  const [hours = "00", minutes = "00"] = slot.split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  return formatTime(date.toISOString());
}

function startOfDay(value: Date) {
  const date = new Date(value);

  date.setHours(0, 0, 0, 0);

  return date;
}

function isSameCalendarDay(value: string | null | undefined, anchor: Date) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  return startOfDay(date).getTime() === startOfDay(anchor).getTime();
}

function formatTimeRange(start: string | null | undefined, end: string | null | undefined) {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function toneForStatus(status: string | null | undefined) {
  const normalized = status ?? "";

  if (
    [
      "active",
      "confirmed",
      "completed",
      "approved_for_payment",
      "ready",
      "paid",
      "succeeded",
    ].includes(normalized)
  ) {
    return "green";
  }

  if (
    [
      "pending",
      "pending_validation",
      "partially_paid",
      "overdue",
      "reschedule_requested",
    ].includes(normalized)
  ) {
    return "amber";
  }

  if (["rejected", "canceled", "inactive"].includes(normalized)) {
    return "red";
  }

  return "blue";
}

function StatusBadge({
  status,
  label,
}: {
  status: string | null | undefined;
  label?: string;
}) {
  const tone = toneForStatus(status);

  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border font-semibold",
        tone === "green" &&
          "border-[var(--secondary-line)] bg-[var(--secondary-light)] text-[var(--secondary-dark)]",
        tone === "amber" &&
          "border-transparent bg-[var(--amber-light)] text-[var(--amber)]",
        tone === "red" &&
          "border-transparent bg-[var(--red-light)] text-[var(--red)]",
        tone === "blue" &&
          "border-[var(--primary-line)] bg-[var(--primary-light)] text-[var(--primary-darker)]",
      )}
    >
      {label ?? statusLabel(status)}
    </Badge>
  );
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative size-8 shrink-0 rounded-[10px] bg-[var(--primary)] after:absolute after:left-2 after:top-2 after:size-3 after:rounded-[50%_50%_50%_4px] after:bg-[var(--secondary)]" />
      <div className={cn("min-w-0", compact && "hidden sm:block")}>
        <strong className="block truncate font-[var(--font-heading)] text-[15px] font-extrabold text-[var(--ink)]">
          Kromed
        </strong>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  accent = false,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "rounded-[14px] py-4 shadow-none",
        accent
          ? "border-[var(--primary-dark)] bg-[var(--primary-dark)] text-white"
          : "border-[var(--line)] bg-white",
      )}
    >
      <CardContent className="px-4">
        <div
          className={cn(
            "font-[var(--font-heading)] text-2xl font-extrabold",
            accent ? "text-white" : "text-[var(--ink)]",
          )}
        >
          {value}
        </div>
        <div
          className={cn(
            "mt-1 text-xs font-semibold",
            accent ? "text-white" : "text-[var(--ink-soft)]",
          )}
        >
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyNote({
  children,
  tone = "blue",
  icon: Icon = AlertTriangleIcon,
}: {
  children: React.ReactNode;
  tone?: "blue" | "amber" | "plain";
  icon?: LucideIcon;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl px-3 py-3 text-[12.5px] leading-5",
        tone === "blue" && "bg-[var(--primary-light)] text-[var(--primary-darker)]",
        tone === "amber" && "bg-[var(--amber-light)] text-[var(--amber)]",
        tone === "plain" && "border border-[var(--line)] bg-white text-[var(--ink-soft)]",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-[14px] border-[var(--line)] bg-white shadow-none", className)}>
      {title ? (
        <CardHeader className="gap-1">
          <CardTitle className="font-[var(--font-heading)] text-[14.5px] font-bold">
            {title}
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn(title ? undefined : "pt-0")}>{children}</CardContent>
    </Card>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "h-9 w-full justify-start rounded-[10px] px-2.5 text-[13.5px] font-semibold text-[var(--ink-soft)] hover:bg-[var(--surface)]",
        active &&
          "bg-[var(--primary-light)] text-[var(--primary-darker)] hover:bg-[var(--primary-light)]",
      )}
      onClick={onClick}
    >
      <Icon data-icon="inline-start" />
      {item.label}
    </Button>
  );
}

export function KromedWorkspace({
  createCollaboratorAction,
  createInventoryOrEquipmentAction,
  createShiftCodeAction,
  createVisitAction,
  data,
  signOutAction,
}: {
  createCollaboratorAction: (
    state: CreateCollaboratorState,
    formData: FormData,
  ) => Promise<CreateCollaboratorState>;
  createInventoryOrEquipmentAction: (
    state: CreateInventoryOrEquipmentState,
    formData: FormData,
  ) => Promise<CreateInventoryOrEquipmentState>;
  createShiftCodeAction: (
    state: CreateShiftCodeState,
    formData: FormData,
  ) => Promise<CreateShiftCodeState>;
  createVisitAction: (
    state: CreateVisitState,
    formData: FormData,
  ) => Promise<CreateVisitState>;
  data: DashboardData;
  signOutAction: (formData: FormData) => void | Promise<void>;
}) {
  const visits = data.visits as Visit[];
  const payments = data.payments as Payment[];
  const payoutLines = data.payoutLines as PayoutLine[];
  const payoutPeriods = data.payoutPeriods as PayoutPeriod[];
  const assignments = data.patientAssignments as PatientAssignment[];
  const clinicalNotes = data.clinicalNotes as ClinicalNote[];
  const visitSupplies = data.visitSupplies as VisitSupply[];
  const equipmentRentals = data.equipmentRentals as EquipmentRental[];
  const hospitalShifts = data.hospitalShifts as HospitalShift[];
  const ownCollaborator =
    data.collaborators.find((collaborator) => collaborator.profile_id === data.profile.id) ??
    data.collaborators[0] ??
    null;
  const role: WorkspaceRole =
    data.role === "collaborator" ? "colaborador" : "karla";

  const [view, setView] = React.useState<View>(
    data.role === "collaborator" ? "myAgenda" : "dashboard",
  );
  const activeCollaboratorId = ownCollaborator?.id ?? "";
  const [selectedPatientId, setSelectedPatientId] = React.useState<string | null>(
    data.patients[0]?.id ?? null,
  );
  const [patientTab, setPatientTab] = React.useState<PatientTab>("info");
  const [patientFilter, setPatientFilter] = React.useState("Todos");
  const [calendarCollaboratorFilter, setCalendarCollaboratorFilter] = React.useState("all");
  const [financeTab, setFinanceTab] = React.useState<FinanceTab>("income");
  const [agendaFormat, setAgendaFormat] = React.useState<AgendaFormat>("list");
  const [showCreateCollaborator, setShowCreateCollaborator] = React.useState(false);
  const [showCreateInventory, setShowCreateInventory] = React.useState(false);
  const [showCreateShiftCode, setShowCreateShiftCode] = React.useState(false);
  const [inventoryFormType, setInventoryFormType] = React.useState<"supply" | "equipment">(
    "supply",
  );
  const [createUserRole, setCreateUserRole] = React.useState<"collaborator" | "admin">(
    "collaborator",
  );
  const createUserClientAction = React.useCallback(
    async (state: CreateCollaboratorState, formData: FormData) => {
      const result = await createCollaboratorAction(state, formData);

      if (result.status === "success") {
        setShowCreateCollaborator(false);
        setCreateUserRole("collaborator");
      }

      return result;
    },
    [createCollaboratorAction],
  );
  const [createCollaboratorState, createCollaboratorFormAction, creatingCollaborator] =
    React.useActionState<CreateCollaboratorState, FormData>(createUserClientAction, {
      status: "idle",
      message: "",
    });
  const createVisitClientAction = React.useCallback(
    async (state: CreateVisitState, formData: FormData) => {
      const result = await createVisitAction(state, formData);

      if (result.status === "success") {
        setView("validation");
      }

      return result;
    },
    [createVisitAction],
  );
  const [createVisitState, createVisitFormAction, creatingVisit] =
    React.useActionState<CreateVisitState, FormData>(createVisitClientAction, {
      status: "idle",
      message: "",
    });
  const createShiftCodeClientAction = React.useCallback(
    async (state: CreateShiftCodeState, formData: FormData) => {
      const result = await createShiftCodeAction(state, formData);

      if (result.status === "success") {
        setShowCreateShiftCode(false);
      }

      return result;
    },
    [createShiftCodeAction],
  );
  const [createShiftCodeState, createShiftCodeFormAction, creatingShiftCode] =
    React.useActionState<CreateShiftCodeState, FormData>(createShiftCodeClientAction, {
      status: "idle",
      message: "",
    });
  const createInventoryClientAction = React.useCallback(
    async (state: CreateInventoryOrEquipmentState, formData: FormData) => {
      const result = await createInventoryOrEquipmentAction(state, formData);

      if (result.status === "success") {
        setShowCreateInventory(false);
        setInventoryFormType("supply");
      }

      return result;
    },
    [createInventoryOrEquipmentAction],
  );
  const [
    createInventoryState,
    createInventoryFormAction,
    creatingInventoryItem,
  ] = React.useActionState<CreateInventoryOrEquipmentState, FormData>(
    createInventoryClientAction,
    {
      status: "idle",
      message: "",
    },
  );
  const [reportPatientId, setReportPatientId] = React.useState(
    data.patients[0]?.id ?? "",
  );
  const [reportCollaboratorId, setReportCollaboratorId] = React.useState(
    data.collaborators[0]?.id ?? "",
  );
  const [reportStatus, setReportStatus] = React.useState<
    Record<ReportType, ReportStatus>
  >({
    patient: { state: "idle" },
    financial: { state: "idle" },
    collaborator: { state: "idle" },
  });

  const collaboratorMap = React.useMemo(
    () => new Map(data.collaborators.map((collaborator) => [collaborator.id, collaborator])),
    [data.collaborators],
  );
  const patientMap = React.useMemo(
    () => new Map(data.patients.map((patient) => [patient.id, patient])),
    [data.patients],
  );

  const activeCollaborator =
    collaboratorMap.get(activeCollaboratorId) ?? data.collaborators[0] ?? null;
  const selectedPatient =
    (selectedPatientId ? patientMap.get(selectedPatientId) : null) ?? data.patients[0] ?? null;

  const generateReport = async (reportType: ReportType) => {
    const payload: {
      reportType: ReportType;
      patientId?: string;
      collaboratorId?: string;
    } = { reportType };

    if (reportType === "patient") {
      payload.patientId = reportPatientId;
    }

    if (reportType === "collaborator") {
      payload.collaboratorId = reportCollaboratorId;
    }

    setReportStatus((current) => ({
      ...current,
      [reportType]: { state: "loading" },
    }));

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        error?: string;
        report?: { title?: string };
      };

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo generar el reporte.");
      }

      setReportStatus((current) => ({
        ...current,
        [reportType]: {
          state: "success",
          message: `${result.report?.title ?? "Reporte"} enviado por n8n.`,
        },
      }));
    } catch (error) {
      setReportStatus((current) => ({
        ...current,
        [reportType]: {
          state: "error",
          message:
            error instanceof Error
              ? error.message
              : "No se pudo generar el reporte.",
        },
      }));
    }
  };

  const goToView = (nextView: View, patientId?: string) => {
    setView(nextView);
    if (patientId) {
      setSelectedPatientId(patientId);
      setPatientTab("info");
    } else if (nextView !== "patientDetail") {
      setSelectedPatientId((current) => current ?? data.patients[0]?.id ?? null);
    }
    if (nextView === "finance") {
      setFinanceTab("income");
    }
  };

  const visitsForPatient = (patientId: string) =>
    visits.filter((visit) => visit.patient_id === patientId);

  const assignmentsForPatient = (patientId: string) =>
    assignments.filter((assignment) => assignment.patient_id === patientId);

  const visitsForCollaborator = (collaboratorId: string) =>
    visits.filter((visit) => visit.collaborator_id === collaboratorId);

  const visiblePatientsForCollaborator = (collaboratorId: string) => {
    const ids = new Set(
      assignments
        .filter((assignment) => assignment.collaborator_id === collaboratorId)
        .map((assignment) => assignment.patient_id),
    );
    visitsForCollaborator(collaboratorId).forEach((visit) => ids.add(visit.patient_id));
    return data.patients.filter((patient) => ids.has(patient.id));
  };

  const patientFinancials = (patientId: string) => {
    const patientVisits = visitsForPatient(patientId);
    const visitTotal = patientVisits.reduce(
      (sum, visit) => sum + visit.patient_charge_cents,
      0,
    );
    const supplyTotal = visitSupplies
      .filter((supply) => supply.visits?.patient_id === patientId)
      .reduce((sum, supply) => sum + supply.total_price_cents, 0);
    const rentalTotal = equipmentRentals
      .filter((rental) => rental.patient_id === patientId)
      .reduce((sum, rental) => sum + rental.monthly_charge_cents, 0);
    const paidTotal = payments
      .filter((payment) => payment.patient_id === patientId)
      .reduce((sum, payment) => sum + payment.amount_cents, 0);
    const total = visitTotal + supplyTotal + rentalTotal;

    return {
      visitTotal,
      supplyTotal,
      rentalTotal,
      paidTotal,
      total,
      balance: Math.max(total - paidTotal, 0),
    };
  };

  const totalPatientCharges = visits.reduce(
    (sum, visit) => sum + visit.patient_charge_cents,
    0,
  );
  const totalPayouts = payoutLines.reduce((sum, line) => sum + line.amount_cents, 0);
  const pendingValidation = visits.filter((visit) =>
    ["completed", "pending_validation"].includes(visit.status),
  );
  const upcomingVisits = visits.filter((visit) =>
    ["scheduled", "confirmed", "reschedule_requested"].includes(visit.status),
  );

  const title =
    view === "patientDetail" && selectedPatient
      ? selectedPatient.full_name
      : pageMeta[view][0];
  const subtitle =
    view === "patientDetail" && selectedPatient
      ? `${selectedPatient.age ?? "Sin edad"} años · ${selectedPatient.diagnosis ?? "Sin diagnóstico"}`
      : pageMeta[view][1];

  const renderView = () => {
    if (role === "karla") {
      switch (view) {
        case "dashboard":
          return renderDashboard();
        case "calendar":
          return renderCalendar();
        case "patients":
          return renderPatients();
        case "patientDetail":
          return renderPatientDetail(false);
        case "scheduleVisit":
          return renderScheduleVisit();
        case "collaborators":
          return renderCollaborators();
        case "validation":
          return renderValidation();
        case "supplies":
          return renderSupplies();
        case "shiftCodes":
          return renderShiftCodes();
        case "finance":
          return renderFinance();
        case "reports":
          return renderReports();
        default:
          return renderDashboard();
      }
    }

    switch (view) {
      case "myAgenda":
        return renderMyAgenda();
      case "myPatients":
        return renderMyPatients();
      case "patientDetail":
        return renderPatientDetail(true);
      case "myPayments":
        return renderMyPayments();
      default:
        return renderMyAgenda();
    }
  };

  function renderDashboard() {
    return (
      <div className="flex flex-col gap-4">
        {data.errorMessages.length ? (
          <EmptyNote tone="amber" icon={AlertTriangleIcon}>
            Algunas consultas fueron limitadas por permisos o configuración. La
            pantalla muestra la información disponible para este rol.
          </EmptyNote>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard value={upcomingVisits.length} label="Visitas pendientes" accent />
          <StatCard
            value={visits.filter((visit) => visit.status === "completed").length}
            label="Completadas"
          />
          <StatCard value={pendingValidation.length} label="Sin validar" />
          <StatCard value={formatMoney(totalPayouts)} label="Pago pendiente" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-4">
            <Panel title="Visitas próximas">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingVisits.slice(0, 6).map((visit) => (
                    <TableRow
                      className="cursor-pointer"
                      key={visit.id}
                      onClick={() => goToView("patientDetail", visit.patient_id)}
                    >
                      <TableCell>
                        <div className="font-semibold text-[var(--ink)]">
                          {visit.patients?.full_name ??
                            patientMap.get(visit.patient_id)?.full_name ??
                            "Paciente"}
                        </div>
                        <div className="text-xs text-[var(--ink-soft)]">
                          {patientMap.get(visit.patient_id)?.diagnosis ?? visit.notes}
                        </div>
                      </TableCell>
                      <TableCell>{visit.collaborators?.name ?? "Colaborador"}</TableCell>
                      <TableCell>{formatTimeRange(visit.scheduled_start, visit.scheduled_end)}</TableCell>
                      <TableCell>
                        <StatusBadge status={visit.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!upcomingVisits.length ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyNote tone="plain">No hay visitas próximas visibles.</EmptyNote>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </Panel>

            <Panel title="Ingresos del mes" description="Basado en visitas, insumos y equipos visibles">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-[var(--font-heading)] text-3xl font-extrabold text-[var(--ink)]">
                  {formatMoney(totalPatientCharges)}
                </span>
                <StatusBadge status="active" label="Estimado" />
              </div>
              <p className="mt-2 max-w-full whitespace-normal break-words text-sm leading-6 text-[var(--ink-soft)]">
                Cobros registrados: {formatMoney(payments.reduce((sum, payment) => sum + payment.amount_cents, 0))}
                {" · "}Pagos a colaboradores: {formatMoney(totalPayouts)}
              </p>
            </Panel>
          </div>

          <div className="flex flex-col gap-4">
            <Panel title="Recordatorios">
              <div className="flex flex-col gap-3">
                <EmptyNote icon={CalendarDaysIcon}>
                  {upcomingVisits.length} visitas próximas aparecen en la agenda.
                </EmptyNote>
                <EmptyNote tone="amber" icon={AlertTriangleIcon}>
                  {pendingValidation.length} visitas necesitan validación de líder.
                </EmptyNote>
              </div>
            </Panel>

            <Panel title="Pacientes sin seguimiento">
              {data.patients.length ? (
                <div className="flex flex-col gap-3">
                  {data.patients.slice(0, 3).map((patient) => {
                    const latestNote = clinicalNotes.find(
                      (note) => note.visits?.patient_id === patient.id,
                    );
                    return (
                      <button
                        className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-left"
                        key={patient.id}
                        onClick={() => goToView("patientDetail", patient.id)}
                        type="button"
                      >
                        <div className="font-semibold text-[var(--ink)]">
                          {patient.full_name}
                        </div>
                        <div className="text-xs text-[var(--ink-soft)]">
                          {latestNote
                            ? `Última evolución: ${formatDate(latestNote.created_at)}`
                            : "Sin evolución clínica visible"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyNote tone="plain">No hay pacientes visibles.</EmptyNote>
              )}
            </Panel>
          </div>
        </div>
      </div>
    );
  }

  function renderCalendar() {
    const selectedCalendarCollaborator =
      calendarCollaboratorFilter === "all"
        ? null
        : data.collaborators.find(
            (collaborator) => collaborator.id === calendarCollaboratorFilter,
          ) ?? null;
    const collaboratorHasCalendarItem = (collaboratorId: string) =>
      visits.some((visit) => visit.collaborator_id === collaboratorId) ||
      hospitalShifts.some((shift) => shift.collaborator_id === collaboratorId);
    const columns = selectedCalendarCollaborator
      ? [selectedCalendarCollaborator]
      : [...data.collaborators]
          .sort((left, right) => {
            const rightHasItem = collaboratorHasCalendarItem(right.id) ? 1 : 0;
            const leftHasItem = collaboratorHasCalendarItem(left.id) ? 1 : 0;

            return rightHasItem - leftHasItem || left.name.localeCompare(right.name);
          })
          .slice(0, 4);
    const visibleCollaboratorIds = new Set(columns.map((collaborator) => collaborator.id));
    const collaboratorVisits = visits.filter((visit) =>
      visibleCollaboratorIds.has(visit.collaborator_id),
    );
    const collaboratorHospitalShifts = hospitalShifts.filter((shift) =>
      visibleCollaboratorIds.has(shift.collaborator_id),
    );
    const calendarDates = [
      ...collaboratorVisits.map((visit) => ({
        createdAt: new Date(visit.created_at).getTime(),
        scheduledAt: new Date(visit.scheduled_start),
      })),
      ...collaboratorHospitalShifts.map((shift) => ({
        createdAt: new Date(shift.created_at).getTime(),
        scheduledAt: new Date(shift.starts_at),
      })),
    ]
      .filter((item) => !Number.isNaN(item.scheduledAt.getTime()))
      .sort((left, right) => {
        const rightCreatedAt = Number.isNaN(right.createdAt) ? 0 : right.createdAt;
        const leftCreatedAt = Number.isNaN(left.createdAt) ? 0 : left.createdAt;

        return rightCreatedAt - leftCreatedAt || right.scheduledAt.getTime() - left.scheduledAt.getTime();
      });
    const today = startOfDay(new Date());
    const calendarAnchorDate =
      calendarDates[0]?.scheduledAt ??
      calendarDates.find((item) => item.scheduledAt >= today)?.scheduledAt ??
      new Date();
    const visibleVisits = collaboratorVisits.filter((visit) =>
      isSameCalendarDay(visit.scheduled_start, calendarAnchorDate),
    );
    const visibleHospitalShifts = collaboratorHospitalShifts.filter((shift) =>
      isSameCalendarDay(shift.starts_at, calendarAnchorDate),
    );
    const slots = Array.from(
      new Set(
        [
          ...visibleVisits.map((visit) => timeSlotKey(visit.scheduled_start)),
          ...visibleHospitalShifts.map((shift) => timeSlotKey(shift.starts_at)),
          "08:00",
          "12:00",
        ].filter((slot): slot is string => Boolean(slot)),
      ),
    ).sort(compareTimeSlots);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid w-full max-w-xs gap-1.5">
            <Label htmlFor="calendar-collaborator-filter">Colaborador</Label>
            <select
              className="h-9 rounded-lg border border-input bg-white px-2.5 text-sm font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
              data-testid="calendar-collaborator-filter"
              id="calendar-collaborator-filter"
              value={calendarCollaboratorFilter}
              onChange={(event) => setCalendarCollaboratorFilter(event.currentTarget.value)}
            >
              <option value="all">Todos</option>
              {data.collaborators.map((collaborator) => (
                <option key={collaborator.id} value={collaborator.id}>
                  {collaborator.name}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink-soft)]">
            Día: {formatDate(calendarAnchorDate.toISOString())}
          </div>
        </div>

        <div className="overflow-x-auto rounded-[14px] border border-[var(--line)] bg-white">
          <div
            className="grid min-w-[760px] border-b border-[var(--line)] bg-[var(--surface)]"
            style={{
              gridTemplateColumns: `80px repeat(${Math.max(columns.length, 1)}, minmax(160px, 1fr))`,
            }}
          >
            <div className="p-3" />
            {columns.map((collaborator) => (
              <div
                className="p-3 text-sm font-bold text-[var(--ink)]"
                data-testid={`calendar-column-${collaborator.id}`}
                key={collaborator.id}
              >
                {collaborator.name}
              </div>
            ))}
          </div>
          <div
            className="grid min-w-[760px]"
            style={{
              gridTemplateColumns: `80px repeat(${Math.max(columns.length, 1)}, minmax(160px, 1fr))`,
            }}
          >
            {slots.map((slot) => (
              <React.Fragment key={slot}>
                <div className="border-b border-r border-[var(--line)] p-3 text-xs font-bold text-[var(--ink-soft)]">
                  {formatTimeSlot(slot)}
                </div>
                {columns.map((collaborator) => {
                  const cellVisits = visibleVisits.filter(
                    (item) =>
                      item.collaborator_id === collaborator.id &&
                      timeSlotKey(item.scheduled_start) === slot,
                  );
                  const shift = visibleHospitalShifts.find(
                    (item) =>
                      item.collaborator_id === collaborator.id &&
                      timeSlotKey(item.starts_at) === slot,
                  );

                  return (
                    <div
                      className="min-h-24 border-b border-r border-[var(--line)] p-2"
                      key={`${slot}-${collaborator.id}`}
                    >
                      <div className="grid gap-2">
                        {cellVisits.map((visit) => (
                          <button
                            className={cn(
                              "w-full rounded-[10px] border p-3 text-left text-xs font-semibold",
                              visit.status === "completed"
                                ? "border-[var(--secondary-line)] bg-[var(--secondary-light)] text-[var(--secondary-dark)]"
                                : "border-[var(--primary-line)] bg-[var(--primary-light)] text-[var(--primary-darker)]",
                            )}
                            key={visit.id}
                            type="button"
                            onClick={() => goToView("patientDetail", visit.patient_id)}
                          >
                            {visit.patients?.full_name ??
                              patientMap.get(visit.patient_id)?.full_name ??
                              "Paciente"}
                            <span className="mt-1 block font-normal">
                              {formatDate(visit.scheduled_start)} ·{" "}
                              {statusLabel(visit.status)}
                            </span>
                            {visit.notes ? (
                              <span className="mt-1 block font-normal text-[var(--primary-darker)]">
                                {visit.notes}
                              </span>
                            ) : null}
                          </button>
                        ))}
                        {shift ? (
                          <div className="rounded-[10px] border border-[var(--amber)] bg-[var(--amber-light)] p-3 text-xs font-semibold text-[var(--amber)]">
                            {shift.shift_codes?.code ?? shift.source_label ?? "Turno hospital"}
                            <span className="mt-1 block font-normal">
                              {formatTimeRange(shift.starts_at, shift.ends_at)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderPatients() {
    const filteredPatients =
      patientFilter === "Todos"
        ? data.patients
        : data.patients.filter((patient) => statusLabel(patient.status) === patientFilter);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {patientFilters.map((filter) => (
            <Button
              className={cn(
                "rounded-full",
                patientFilter === filter &&
                  "bg-[var(--primary-dark)] text-white hover:bg-[var(--primary-darker)]",
              )}
              key={filter}
              onClick={() => setPatientFilter(filter)}
              size="sm"
              type="button"
              variant={patientFilter === filter ? "default" : "outline"}
            >
              {filter}
            </Button>
          ))}
        </div>

        <Panel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Diagnóstico</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Equipo asignado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow
                  className="cursor-pointer"
                  key={patient.id}
                  onClick={() => goToView("patientDetail", patient.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="rounded-[9px]" size="default">
                        <AvatarFallback className="rounded-[9px] bg-[var(--primary-light)] font-bold text-[var(--primary-darker)]">
                          {initials(patient.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-[var(--ink)]">{patient.full_name}</div>
                        <div className="text-xs text-[var(--ink-soft)]">
                          {patient.age ? `${patient.age} años` : "Sin edad"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{patient.diagnosis ?? "Sin diagnóstico"}</TableCell>
                  <TableCell>{patient.visit_frequency ?? patient.preferred_schedule ?? "Sin frecuencia"}</TableCell>
                  <TableCell>{renderTeamStack(patient.id)}</TableCell>
                  <TableCell>
                    <StatusBadge status={patient.status} />
                  </TableCell>
                </TableRow>
              ))}
              {!filteredPatients.length ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyNote tone="plain">No hay pacientes con este estado.</EmptyNote>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Panel>
      </div>
    );
  }

  function renderTeamStack(patientId: string) {
    const team = assignmentsForPatient(patientId);

    if (!team.length) {
      return <span className="text-xs text-[var(--ink-soft)]">Sin equipo asignado visible</span>;
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {team.slice(0, 3).map((assignment) => (
            <Avatar className="rounded-[9px] ring-2 ring-white" key={assignment.id} size="sm">
              <AvatarFallback className="rounded-[9px] bg-[var(--secondary-light)] text-[var(--secondary-dark)]">
                {initials(assignment.collaborators?.name)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="max-w-44 truncate text-xs text-[var(--ink-soft)]">
          {team.map((assignment) => assignment.collaborators?.name ?? "Colaborador").join(", ")}
        </span>
      </div>
    );
  }

  function renderPatientDetail(readOnly: boolean) {
    const patient = selectedPatient;

    if (!patient) {
      return <EmptyNote tone="plain">Selecciona un paciente para ver su detalle.</EmptyNote>;
    }

    const tabs: { id: PatientTab; label: string }[] = [
      { id: "info", label: "Información general" },
      { id: "team", label: "Equipo asignado" },
      { id: "evolution", label: "Evolución clínica" },
      { id: "visits", label: "Historial de visitas" },
    ];

    if (!readOnly) {
      tabs.push({ id: "finance", label: "Finanzas del paciente" });
    }

    return (
      <div className="flex flex-col gap-4">
        <Button
          className="w-fit"
          onClick={() => goToView(readOnly ? "myPatients" : "patients")}
          size="sm"
          type="button"
          variant="outline"
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Volver
        </Button>
        <div className="flex flex-wrap gap-2 rounded-xl bg-white p-1 ring-1 ring-[var(--line)]">
          {tabs.map((tab) => (
            <Button
              className={cn(
                "rounded-lg",
                patientTab === tab.id &&
                  "bg-[var(--primary-light)] text-[var(--primary-darker)]",
              )}
              key={tab.id}
              onClick={() => setPatientTab(tab.id)}
              size="sm"
              type="button"
              variant="ghost"
            >
              {tab.label}
            </Button>
          ))}
        </div>
        {patientTab === "info" ? renderPatientInfo(patient) : null}
        {patientTab === "team" ? renderPatientTeam(patient, readOnly) : null}
        {patientTab === "evolution" ? renderPatientEvolution(patient) : null}
        {patientTab === "visits" ? renderPatientVisits(patient, readOnly) : null}
        {patientTab === "finance" && !readOnly ? renderPatientFinance(patient) : null}
      </div>
    );
  }

  function renderPatientInfo(patient: Patient) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Información general">
          <dl className="grid gap-3 text-sm">
            {[
              ["Estado", <StatusBadge key="status" status={patient.status} />],
              ["Diagnóstico", patient.diagnosis ?? "Sin diagnóstico"],
              ["Dirección", patient.address ?? "Sin dirección"],
              ["Frecuencia de visitas", patient.visit_frequency ?? patient.preferred_schedule ?? "Sin frecuencia"],
            ].map(([label, value]) => (
              <div className="flex items-center justify-between gap-4" key={String(label)}>
                <dt className="text-[var(--ink-soft)]">{label}</dt>
                <dd className="text-right font-semibold text-[var(--ink)]">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Contacto">
          <dl className="grid gap-3 text-sm">
            {[
              ["Teléfono", patient.contact_phone ?? "Sin teléfono"],
              ["Contacto", patient.contact_name ?? "Sin contacto"],
              ["Horario preferido", patient.preferred_schedule ?? "Sin preferencia"],
            ].map(([label, value]) => (
              <div className="flex items-center justify-between gap-4" key={String(label)}>
                <dt className="text-[var(--ink-soft)]">{label}</dt>
                <dd className="text-right font-semibold text-[var(--ink)]">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    );
  }

  function renderPatientTeam(patient: Patient, readOnly: boolean) {
    const team = assignmentsForPatient(patient.id);

    return (
      <Panel
        action={
          !readOnly ? (
            <Button size="sm" type="button" variant="outline">
              <PlusIcon data-icon="inline-start" />
              Agregar colaborador
            </Button>
          ) : null
        }
        title="Equipo asignado a este paciente"
      >
        <div className="flex flex-col divide-y divide-[var(--line)]">
          {team.map((assignment, index) => (
            <div className="flex items-center justify-between gap-3 py-3" key={assignment.id}>
              <div className="flex items-center gap-3">
                <Avatar className="rounded-[9px]">
                  <AvatarFallback className="rounded-[9px] bg-[var(--secondary-light)] font-bold text-[var(--secondary-dark)]">
                    {initials(assignment.collaborators?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-[var(--ink)]">
                    {assignment.collaborators?.name ?? "Colaborador"}
                  </div>
                  <div className="text-xs text-[var(--ink-soft)]">
                    {assignment.collaborators?.profession ?? "Colaborador"}
                  </div>
                </div>
              </div>
              <StatusBadge status={index === 0 ? "active" : "pending"} label={index === 0 ? "Titular" : "Suplente"} />
            </div>
          ))}
          {!team.length ? (
            <EmptyNote tone="plain">No hay equipo asignado visible para este paciente.</EmptyNote>
          ) : null}
        </div>
      </Panel>
    );
  }

  function renderPatientEvolution(patient: Patient) {
    const notes = clinicalNotes.filter((note) => note.visits?.patient_id === patient.id);

    return (
      <Panel title="Evolución clínica">
        <div className="mb-4 rounded-xl bg-[var(--primary-light)] px-3 py-2 text-xs font-semibold text-[var(--primary-darker)]">
          <LockIcon className="mr-2 inline size-4" />
          Vista de solo consulta - la evolución se registra al completar una visita.
        </div>
        {notes.length ? (
          <div className="relative flex flex-col gap-4 pl-5 before:absolute before:left-1.5 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-[var(--line)]">
            {notes.map((note) => (
              <div className="relative" key={note.id}>
                <span className="absolute -left-5 top-1 size-3 rounded-full border-2 border-[var(--secondary)] bg-white" />
                <div className="text-xs font-bold text-[var(--ink-soft)]">
                  {formatDateTime(note.created_at)} · {note.profiles?.display_name ?? "Kromed"}
                </div>
                <p className="mt-1 text-sm leading-6 text-[var(--ink)]">
                  {note.evolution_text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote tone="plain">Aún no hay entradas de evolución para este paciente.</EmptyNote>
        )}
      </Panel>
    );
  }

  function renderPatientVisits(patient: Patient, readOnly: boolean) {
    const rows = visitsForPatient(patient.id);

    return (
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead>Estado</TableHead>
              {!readOnly ? <TableHead className="text-right">Precio / Pago</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell>{formatDate(visit.scheduled_start)}</TableCell>
                <TableCell>{formatTimeRange(visit.scheduled_start, visit.scheduled_end)}</TableCell>
                <TableCell>{visit.collaborators?.name ?? collaboratorMap.get(visit.collaborator_id)?.name ?? "Colaborador"}</TableCell>
                <TableCell>
                  <StatusBadge status={visit.status} />
                </TableCell>
                {!readOnly ? (
                  <TableCell className="text-right font-semibold">
                    {formatMoney(visit.patient_charge_cents)} / {formatMoney(visit.collaborator_payout_cents)}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 4 : 5}>
                  <EmptyNote tone="plain">Sin visitas registradas todavía.</EmptyNote>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Panel>
    );
  }

  function renderPatientFinance(patient: Patient) {
    const financials = patientFinancials(patient.id);

    return (
      <Panel title="Ingresos por paciente">
        <dl className="grid gap-3 text-sm">
          {[
            ["Subtotal visitas", formatMoney(financials.visitTotal)],
            ["Insumos utilizados", formatMoney(financials.supplyTotal)],
            ["Equipo alquilado", formatMoney(financials.rentalTotal)],
            ["Total", formatMoney(financials.total)],
            ["Pagos recibidos", formatMoney(financials.paidTotal)],
            ["Saldo pendiente", formatMoney(financials.balance)],
          ].map(([label, value]) => (
            <div
              className={cn(
                "flex items-center justify-between gap-4",
                label === "Total" && "border-t border-[var(--line)] pt-3 font-bold",
              )}
              key={label}
            >
              <dt className="text-[var(--ink-soft)]">{label}</dt>
              <dd className="font-semibold text-[var(--ink)]">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          <StatusBadge
            label={financials.balance > 0 ? "Saldo pendiente" : "Al día"}
            status={financials.balance > 0 ? "pending" : "paid"}
          />
        </div>
      </Panel>
    );
  }

  function renderScheduleVisit() {
    return (
      <div className="flex justify-center" data-testid="schedule-visit-panel">
        <div className="w-full max-w-2xl" data-testid="schedule-visit-card">
        <Panel className="w-full" title="Nueva visita">
          <form action={createVisitFormAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="patient">Paciente</Label>
              <select
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                defaultValue={data.patients[0]?.id ?? ""}
                disabled={!data.patients.length || creatingVisit}
                id="patient"
                name="patientId"
                required
              >
                {data.patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="collaborator">Colaborador del equipo</Label>
              <select
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                defaultValue={data.collaborators[0]?.id ?? ""}
                disabled={!data.collaborators.length || creatingVisit}
                id="collaborator"
                name="collaboratorId"
                required
              >
                {data.collaborators.map((collaborator) => (
                  <option key={collaborator.id} value={collaborator.id}>
                    {collaborator.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--ink-soft)]">
                La asignación definitiva debe validar equipo y disponibilidad en Supabase.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha</Label>
                <Input disabled={creatingVisit} id="date" name="date" required type="date" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Hora</Label>
                <Input disabled={creatingVisit} id="time" name="time" required type="time" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="patient-price">Precio al paciente</Label>
                <Input
                  disabled={creatingVisit}
                  id="patient-price"
                  min="0"
                  name="patientCharge"
                  placeholder="$ 0.00"
                  step="0.01"
                  type="number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="collaborator-pay">Pago al colaborador</Label>
                <Input
                  disabled={creatingVisit}
                  id="collaborator-pay"
                  min="0"
                  name="collaboratorPayout"
                  placeholder="$ 0.00"
                  step="0.01"
                  type="number"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="visit-notes">Notas internas</Label>
              <Textarea
                disabled={creatingVisit}
                id="visit-notes"
                name="notes"
                placeholder="Indicaciones para el colaborador o contexto operativo"
              />
            </div>

            {createVisitState.message ? (
              <p
                aria-live="polite"
                className={cn(
                  "rounded-[10px] border px-3 py-2 text-sm font-semibold",
                  createVisitState.status === "error"
                    ? "border-[var(--red)] bg-[var(--red-light)] text-[var(--red)]"
                    : "border-[var(--green)] bg-[var(--green-light)] text-[var(--green)]",
                )}
              >
                {createVisitState.message}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={creatingVisit}
                onClick={() => goToView("patients")}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                disabled={
                  creatingVisit || !data.patients.length || !data.collaborators.length
                }
                type="submit"
              >
                <CalendarDaysIcon data-icon="inline-start" />
                {creatingVisit ? "Agendando..." : "Agendar visita"}
              </Button>
            </div>
          </form>
        </Panel>
        </div>
      </div>
    );
  }

  function renderCollaborators() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => setShowCreateCollaborator(true)}
          >
            <PlusIcon data-icon="inline-start" />
            Agregar colaborador
          </Button>
        </div>
        {showCreateCollaborator ? (
          <div
            aria-labelledby="new-user-title"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(15,23,42,.42)] px-4 py-8 backdrop-blur-sm"
            role="dialog"
          >
            <div className="w-full max-w-3xl rounded-[18px] border border-[var(--line)] bg-white shadow-[0_24px_80px_rgba(38,49,63,.22)]">
              <div className="border-b border-[var(--line)] px-5 py-4">
                <h2
                  className="font-[var(--font-heading)] text-xl font-extrabold text-[var(--ink)]"
                  id="new-user-title"
                >
                  Nuevo usuario
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  El lider puede crear usuarios lider o colaborador. Los
                  lideres quedan con rol admin; los colaboradores tambien
                  aparecen en esta lista.
                </p>
              </div>
              <form
                action={createCollaboratorFormAction}
                className="grid gap-4 p-5"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="user-role">Tipo de usuario</Label>
                    <select
                      className="h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                      id="user-role"
                      name="userRole"
                      value={createUserRole}
                      onChange={(event) =>
                        setCreateUserRole(
                          event.currentTarget.value === "admin" ? "admin" : "collaborator",
                        )
                      }
                    >
                      <option value="collaborator">Colaborador</option>
                      <option value="admin">Líder</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="collaborator-name">Nombre completo</Label>
                    <Input
                      autoComplete="name"
                      id="collaborator-name"
                      name="name"
                      placeholder="Nombre del colaborador"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="collaborator-email">Correo electronico</Label>
                    <Input
                      autoComplete="email"
                      id="collaborator-email"
                      name="email"
                      placeholder="colaborador@kromed.com"
                      required
                      type="email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="collaborator-password">Contrasena temporal</Label>
                    <Input
                      autoComplete="new-password"
                      id="collaborator-password"
                      minLength={6}
                      name="password"
                      placeholder="Minimo 6 caracteres"
                      required
                      type="password"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="collaborator-phone">Telefono</Label>
                    <Input
                      autoComplete="tel"
                      id="collaborator-phone"
                      name="phone"
                      placeholder="+503 0000 0000"
                      type="tel"
                    />
                  </div>
                  {createUserRole === "collaborator" ? (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="collaborator-profession">Especialidad</Label>
                        <Input
                          id="collaborator-profession"
                          name="profession"
                          placeholder="Terapia respiratoria, enfermeria..."
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="collaborator-default-payout">
                          Tarifa base por visita (USD)
                        </Label>
                        <Input
                          id="collaborator-default-payout"
                          min="0"
                          name="defaultPayout"
                          placeholder="25.00"
                          step="0.01"
                          type="number"
                        />
                      </div>
                    </>
                  ) : null}
                </div>
                {createUserRole === "collaborator" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="collaborator-notes">Notas internas</Label>
                    <Textarea
                      id="collaborator-notes"
                      name="notes"
                      placeholder="Disponibilidad, zona de cobertura o indicaciones administrativas"
                    />
                  </div>
                ) : null}

                {createCollaboratorState.status === "error" &&
                createCollaboratorState.message ? (
                  <p
                    aria-live="polite"
                    className="rounded-[10px] border border-[var(--red)] bg-[var(--red-light)] px-3 py-2 text-sm font-semibold text-[var(--red)]"
                  >
                    {createCollaboratorState.message}
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
                  <Button
                    disabled={creatingCollaborator}
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateCollaborator(false)}
                  >
                    Cancelar
                  </Button>
                  <Button disabled={creatingCollaborator} type="submit">
                    <UserPlusIcon data-icon="inline-start" />
                    {creatingCollaborator
                      ? "Creando..."
                      : createUserRole === "admin"
                        ? "Crear lider"
                        : "Crear colaborador"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
        <Panel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Pacientes</TableHead>
                <TableHead>Tarifa base</TableHead>
                <TableHead>Visitas</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.collaborators.map((collaborator) => {
                const patientCount = visiblePatientsForCollaborator(collaborator.id).length;
                const visitCount = visitsForCollaborator(collaborator.id).length;

                return (
                  <TableRow key={collaborator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="rounded-[9px]">
                          <AvatarFallback className="rounded-[9px] bg-[var(--secondary-light)] font-bold text-[var(--secondary-dark)]">
                            {initials(collaborator.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-semibold text-[var(--ink)]">{collaborator.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{collaborator.profession ?? "Sin especialidad"}</TableCell>
                    <TableCell>{patientCount}</TableCell>
                    <TableCell>{formatMoney(collaborator.default_payout_cents)}</TableCell>
                    <TableCell>{visitCount}</TableCell>
                    <TableCell>
                      <StatusBadge status={collaborator.active ? "active" : "inactive"} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Panel>
      </div>
    );
  }

  function renderValidation() {
    if (!pendingValidation.length) {
      return <EmptyNote tone="plain">No hay visitas pendientes de validar.</EmptyNote>;
    }

    return (
      <div className="grid gap-4">
        {pendingValidation.map((visit) => (
          <Panel key={visit.id} title={visit.patients?.full_name ?? "Paciente"}>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Realizada por"
                value={visit.collaborators?.name ?? "Colaborador"}
              />
              <StatCard
                label="Fecha / hora"
                value={`${formatDate(visit.scheduled_start)} ${formatTime(visit.scheduled_start)}`}
              />
              <StatCard
                label="Precio / Pago"
                value={`${formatMoney(visit.patient_charge_cents)} / ${formatMoney(visit.collaborator_payout_cents)}`}
              />
            </div>
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)]">
              <LockIcon className="mr-2 inline size-4 text-[var(--primary)]" />
              Evolución registrada:{" "}
              {clinicalNotes.find((note) => note.visit_id === visit.id)?.evolution_text ??
                "Sin evolución visible."}
            </div>
            {visit.notes ? (
              <div className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-[var(--ink)]">
                <span className="font-semibold">Notas internas: </span>
                {visit.notes}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline">Reasignar</Button>
              <Button type="button" variant="outline">Rechazar / pedir corrección</Button>
              <Button type="button" variant="secondary">Aprobar para pago</Button>
            </div>
          </Panel>
        ))}
      </div>
    );
  }

  function renderSupplies() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button
            aria-controls="new-inventory-dialog"
            aria-expanded={showCreateInventory}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium whitespace-nowrap text-primary-foreground transition-all outline-none hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            data-testid="open-inventory-form"
            type="button"
            onClick={() => setShowCreateInventory(true)}
            onPointerDown={() => setShowCreateInventory(true)}
          >
            <PlusIcon data-icon="inline-start" />
            Agregar insumo o equipo
          </button>
        </div>
        {showCreateInventory ? (
          <div
            aria-labelledby="new-inventory-title"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(15,23,42,.42)] px-4 py-8 backdrop-blur-sm"
            id="new-inventory-dialog"
            role="dialog"
          >
            <div className="w-full max-w-3xl rounded-[18px] border border-[var(--line)] bg-white shadow-[0_24px_80px_rgba(38,49,63,.22)]">
              <div className="border-b border-[var(--line)] px-5 py-4">
                <h2
                  className="font-[var(--font-heading)] text-xl font-extrabold text-[var(--ink)]"
                  id="new-inventory-title"
                >
                  Nuevo insumo o equipo
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  Completa los datos y guarda para verlo en la tabla
                  correspondiente.
                </p>
              </div>
              <form action={createInventoryFormAction} className="grid gap-4 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="inventory-item-type">Tipo</Label>
                    <select
                      className="h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                      id="inventory-item-type"
                      name="itemType"
                      value={inventoryFormType}
                      onChange={(event) =>
                        setInventoryFormType(
                          event.currentTarget.value === "equipment"
                            ? "equipment"
                            : "supply",
                        )
                      }
                    >
                      <option value="supply">Insumo</option>
                      <option value="equipment">Equipo en alquiler</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="inventory-name">
                      {inventoryFormType === "equipment" ? "Equipo" : "Insumo"}
                    </Label>
                    <Input
                      id="inventory-name"
                      name="name"
                      placeholder={
                        inventoryFormType === "equipment"
                          ? "Concentrador de oxígeno"
                          : "Mascarilla"
                      }
                      required
                    />
                  </div>

                  {inventoryFormType === "supply" ? (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="inventory-patient-charge">
                          Precio al paciente (USD)
                        </Label>
                        <Input
                          id="inventory-patient-charge"
                          min="0"
                          name="patientCharge"
                          placeholder="5.00"
                          step="0.01"
                          type="number"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="inventory-stock">Inventario</Label>
                        <Input
                          id="inventory-stock"
                          min="0"
                          name="stockQuantity"
                          placeholder="50"
                          step="1"
                          type="number"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="inventory-status">Estado</Label>
                        <select
                          className="h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                          defaultValue="active"
                          id="inventory-status"
                          name="supplyStatus"
                        >
                          <option value="active">Activo</option>
                          <option value="inactive">Inactivo</option>
                        </select>
                      </div>
                      <div className="flex items-center rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                          <input
                            className="size-4 accent-[var(--primary)]"
                            defaultChecked
                            name="trackStock"
                            type="checkbox"
                          />
                          Rastrear inventario
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="equipment-patient">Paciente</Label>
                        <select
                          className="h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                          id="equipment-patient"
                          name="patientId"
                          required
                        >
                          <option value="">Seleccionar paciente</option>
                          {data.patients.map((patient) => (
                            <option key={patient.id} value={patient.id}>
                              {patient.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="equipment-monthly-charge">
                          Cobro mensual (USD)
                        </Label>
                        <Input
                          id="equipment-monthly-charge"
                          min="0"
                          name="monthlyCharge"
                          placeholder="35.00"
                          required
                          step="0.01"
                          type="number"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="equipment-period-start">
                          Inicio del alquiler
                        </Label>
                        <Input
                          id="equipment-period-start"
                          name="periodStart"
                          required
                          type="date"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="equipment-period-end">
                          Fin del alquiler
                        </Label>
                        <Input id="equipment-period-end" name="periodEnd" type="date" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="equipment-status">Estado</Label>
                        <select
                          className="h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                          defaultValue="active"
                          id="equipment-status"
                          name="equipmentStatus"
                        >
                          <option value="active">Activo</option>
                          <option value="ended">Finalizado</option>
                          <option value="canceled">Cancelado</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {createInventoryState.status === "error" &&
                createInventoryState.message ? (
                  <p
                    aria-live="polite"
                    className="rounded-[10px] border border-[var(--red)] bg-[var(--red-light)] px-3 py-2 text-sm font-semibold text-[var(--red)]"
                  >
                    {createInventoryState.message}
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
                  <Button
                    disabled={creatingInventoryItem}
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateInventory(false)}
                  >
                    Cancelar
                  </Button>
                  <Button disabled={creatingInventoryItem} type="submit">
                    <BoxesIcon data-icon="inline-start" />
                    {creatingInventoryItem ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
        <Panel title="Insumos">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Precio al paciente</TableHead>
                <TableHead>Inventario</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold">{item.name}</TableCell>
                  <TableCell>{formatMoney(item.patient_charge_price_cents)}</TableCell>
                  <TableCell>{item.track_stock ? item.stock_quantity ?? 0 : "No rastreado"}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                </TableRow>
              ))}
              {!data.inventory.length ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyNote tone="plain">No hay inventario visible.</EmptyNote>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Panel>
        <Panel title="Equipo en alquiler">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Cobro mensual</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipmentRentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell className="font-semibold">{rental.equipment_name}</TableCell>
                  <TableCell>{rental.patients?.full_name ?? patientMap.get(rental.patient_id)?.full_name ?? "Paciente"}</TableCell>
                  <TableCell>{formatMoney(rental.monthly_charge_cents)}</TableCell>
                  <TableCell>
                    <StatusBadge status={rental.status} />
                  </TableCell>
                </TableRow>
              ))}
              {!equipmentRentals.length ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyNote tone="plain">No hay equipos en alquiler visibles.</EmptyNote>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Panel>
      </div>
    );
  }

  function renderShiftCodes() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button
            aria-controls="new-visit-code-dialog"
            aria-expanded={showCreateShiftCode}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium whitespace-nowrap text-primary-foreground transition-all outline-none hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            data-testid="open-visit-code-form"
            type="button"
            onPointerDown={() => setShowCreateShiftCode(true)}
            onClick={() => setShowCreateShiftCode(true)}
          >
            <PlusIcon data-icon="inline-start" />
            Agregar código
          </button>
        </div>
        {showCreateShiftCode ? (
          <div
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(15,23,42,.42)] px-4 py-8 backdrop-blur-sm"
            id="new-visit-code-dialog"
            role="dialog"
            aria-labelledby="new-visit-code-title"
          >
            <div className="w-full max-w-3xl rounded-[18px] border border-[var(--line)] bg-white shadow-[0_24px_80px_rgba(38,49,63,.22)]">
              <div className="border-b border-[var(--line)] px-5 py-4">
                <h2
                  className="font-[var(--font-heading)] text-xl font-extrabold text-[var(--ink)]"
                  id="new-visit-code-title"
                >
                  Nuevo código de visita
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  Completa los datos del código para guardarlo en Supabase y
                  mostrarlo en la tabla de esta pestaña.
                </p>
              </div>
              <form action={createShiftCodeFormAction} className="grid gap-4 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="shift-code-code">Código</Label>
                    <Input
                      id="shift-code-code"
                      name="code"
                      placeholder="0146"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shift-code-name">Nombre / significado</Label>
                    <Input
                      id="shift-code-name"
                      name="name"
                      placeholder="Turno hospital diurno"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shift-code-start">Hora inicio</Label>
                    <Input id="shift-code-start" name="startTime" required type="time" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shift-code-end">Hora fin</Label>
                    <Input id="shift-code-end" name="endTime" required type="time" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shift-code-hours">Horas</Label>
                    <Input
                      id="shift-code-hours"
                      min="0.25"
                      name="hours"
                      placeholder="8"
                      required
                      step="0.25"
                      type="number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shift-code-type">Tipo</Label>
                    <select
                      className="h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                      defaultValue="custom"
                      id="shift-code-type"
                      name="shiftType"
                    >
                      <option value="day">Día</option>
                      <option value="night">Noche</option>
                      <option value="mixed">Mixto</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shift-code-availability">Disponibilidad</Label>
                    <select
                      className="h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                      defaultValue="neutral"
                      id="shift-code-availability"
                      name="availabilityBehavior"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="unavailable">No disponible</option>
                      <option value="available">Disponible</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                      <input
                        className="size-4 accent-[var(--primary)]"
                        name="appliesGlobally"
                        type="checkbox"
                      />
                      Aplica globalmente
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                      <input name="active" type="hidden" value="off" />
                      <input
                        className="size-4 accent-[var(--primary)]"
                        defaultChecked
                        name="active"
                        type="checkbox"
                        value="on"
                      />
                      Activo
                    </label>
                  </div>
                </div>

                {createShiftCodeState.status === "error" &&
                createShiftCodeState.message ? (
                  <p
                    aria-live="polite"
                    className="rounded-[10px] border border-[var(--red)] bg-[var(--red-light)] px-3 py-2 text-sm font-semibold text-[var(--red)]"
                  >
                    {createShiftCodeState.message}
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
                  <Button
                    disabled={creatingShiftCode}
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateShiftCode(false)}
                  >
                    Cancelar
                  </Button>
                  <Button disabled={creatingShiftCode} type="submit">
                    <Code2Icon data-icon="inline-start" />
                    {creatingShiftCode ? "Creando..." : "Guardar código"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
        <Panel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre / significado</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.shiftCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-semibold">{code.code}</TableCell>
                  <TableCell>{code.name}</TableCell>
                  <TableCell>
                    {code.start_time} - {code.end_time}
                  </TableCell>
                  <TableCell>{code.hours}h</TableCell>
                  <TableCell>{statusLabel(code.shift_type)}</TableCell>
                  <TableCell>
                    <StatusBadge status={code.active ? "active" : "inactive"} />
                  </TableCell>
                </TableRow>
              ))}
              {!data.shiftCodes.length ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyNote tone="plain">No hay códigos de visita visibles.</EmptyNote>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Panel>
      </div>
    );
  }

  function renderFinance() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 rounded-xl bg-white p-1 ring-1 ring-[var(--line)]">
          <Button
            className={cn(
              financeTab === "income" &&
                "bg-[var(--primary-light)] text-[var(--primary-darker)]",
            )}
            onClick={() => setFinanceTab("income")}
            size="sm"
            type="button"
            variant="ghost"
          >
            Ingresos por paciente
          </Button>
          <Button
            className={cn(
              financeTab === "payouts" &&
                "bg-[var(--primary-light)] text-[var(--primary-darker)]",
            )}
            onClick={() => setFinanceTab("payouts")}
            size="sm"
            type="button"
            variant="ghost"
          >
            Pagos a colaboradores
          </Button>
        </div>

        {financeTab === "income" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard value={formatMoney(totalPatientCharges)} label="Ingresos del mes" accent />
              <StatCard
                value={formatMoney(
                  data.patients.reduce(
                    (sum, patient) => sum + patientFinancials(patient.id).balance,
                    0,
                  ),
                )}
                label="Saldo por cobrar"
              />
              <StatCard
                value={formatMoney(payments.reduce((sum, payment) => sum + payment.amount_cents, 0))}
                label="Cobrado"
              />
            </div>
            <Panel>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Visitas</TableHead>
                    <TableHead>Insumos</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.patients.map((patient) => {
                    const financials = patientFinancials(patient.id);
                    return (
                      <TableRow
                        className="cursor-pointer"
                        key={patient.id}
                        onClick={() => goToView("patientDetail", patient.id)}
                      >
                        <TableCell className="font-semibold">{patient.full_name}</TableCell>
                        <TableCell>{formatMoney(financials.visitTotal)}</TableCell>
                        <TableCell>{formatMoney(financials.supplyTotal)}</TableCell>
                        <TableCell>{formatMoney(financials.rentalTotal)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatMoney(financials.total)}</TableCell>
                        <TableCell>
                          <StatusBadge
                            label={financials.balance > 0 ? "Saldo pendiente" : "Al día"}
                            status={financials.balance > 0 ? "pending" : "paid"}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Panel>
          </>
        ) : (
          <Panel>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead className="text-right">Total a pagar</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-semibold">
                      {period.collaborators?.name ??
                        collaboratorMap.get(period.collaborator_id)?.name ??
                        "Colaborador"}
                    </TableCell>
                    <TableCell>
                      {formatDate(period.period_start)} - {formatDate(period.period_end)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatMoney(period.total_amount_cents)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={period.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {!payoutPeriods.length ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyNote tone="plain">No hay periodos de pago visibles.</EmptyNote>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Panel>
        )}
      </div>
    );
  }

  function renderReports() {
    const cards: Array<{
      type: ReportType;
      title: string;
      icon: LucideIcon;
      sub: string;
      items: string[];
    }> = [
      {
        type: "patient",
        title: "Reporte por paciente",
        icon: UsersRoundIcon,
        sub: "Selecciona un paciente para generarlo",
        items: ["Visitas realizadas", "Evolución", "Insumos utilizados", "Profesionales asignados"],
      },
      {
        type: "financial",
        title: "Reporte financiero",
        icon: WalletCardsIcon,
        sub: "Periodo actual",
        items: ["Ingresos del mes", "Pagos realizados", "Pagos pendientes"],
      },
      {
        type: "collaborator",
        title: "Reporte colaborador",
        icon: UserPlusIcon,
        sub: "Selecciona un colaborador para generarlo",
        items: ["Cantidad de visitas", "Pacientes atendidos", "Pago generado"],
      },
    ];

    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const status = reportStatus[card.type];
          const isLoading = status.state === "loading";

          return (
            <Panel key={card.title}>
              <Icon className="mb-3 size-5 text-[var(--primary)]" />
              <h3 className="font-[var(--font-heading)] text-[14.5px] font-bold text-[var(--ink)]">
                {card.title}
              </h3>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{card.sub}</p>
              <ul className="my-4 list-disc pl-5 text-[12.5px] leading-7 text-[var(--ink-soft)]">
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {card.type === "patient" ? (
                <div className="mb-3 grid gap-2">
                  <Label htmlFor="report-patient">Paciente</Label>
                  <select
                    className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                    disabled={isLoading}
                    id="report-patient"
                    onChange={(event) => setReportPatientId(event.target.value)}
                    value={reportPatientId}
                  >
                    {data.patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {card.type === "collaborator" ? (
                <div className="mb-3 grid gap-2">
                  <Label htmlFor="report-collaborator">Colaborador</Label>
                  <select
                    className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                    disabled={isLoading}
                    id="report-collaborator"
                    onChange={(event) => setReportCollaboratorId(event.target.value)}
                    value={reportCollaboratorId}
                  >
                    {data.collaborators.map((collaborator) => (
                      <option key={collaborator.id} value={collaborator.id}>
                        {collaborator.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <Button
                disabled={
                  isLoading ||
                  (card.type === "patient" && !reportPatientId) ||
                  (card.type === "collaborator" && !reportCollaboratorId)
                }
                onClick={() => void generateReport(card.type)}
                size="sm"
                type="button"
                variant="outline"
              >
                {isLoading ? "Generando..." : "Generar reporte"}
              </Button>
              {status.state === "success" || status.state === "error" ? (
                <p
                  className={cn(
                    "mt-3 text-xs leading-5",
                    status.state === "success"
                      ? "text-[var(--secondary-dark)]"
                      : "text-[var(--red)]",
                  )}
                >
                  {status.message}
                </p>
              ) : null}
            </Panel>
          );
        })}
      </div>
    );
  }

  function renderMyAgenda() {
    const mine = activeCollaborator ? visitsForCollaborator(activeCollaborator.id) : [];
    const shift = activeCollaborator
      ? hospitalShifts.find((item) => item.collaborator_id === activeCollaborator.id)
      : null;

    return (
      <div className="flex flex-col gap-4">
        <EmptyNote icon={Clock3Icon}>
          {shift
            ? `Turno hospital: ${shift.shift_codes?.code ?? shift.source_label ?? "registrado"}, ${formatTimeRange(shift.starts_at, shift.ends_at)}.`
            : "No hay turnos hospitalarios visibles para este colaborador."}
        </EmptyNote>
        <div className="flex flex-wrap gap-2 rounded-xl bg-white p-1 ring-1 ring-[var(--line)]">
          <Button
            className={cn(
              agendaFormat === "list" &&
                "bg-[var(--primary-light)] text-[var(--primary-darker)]",
            )}
            onClick={() => setAgendaFormat("list")}
            size="sm"
            type="button"
            variant="ghost"
          >
            Lista
          </Button>
          <Button
            className={cn(
              agendaFormat === "calendar" &&
                "bg-[var(--primary-light)] text-[var(--primary-darker)]",
            )}
            onClick={() => setAgendaFormat("calendar")}
            size="sm"
            type="button"
            variant="ghost"
          >
            Calendario
          </Button>
        </div>
        {agendaFormat === "list" ? renderMyAgendaList(mine) : renderMyAgendaCalendar(mine)}
      </div>
    );
  }

  function renderMyAgendaList(mine: Visit[]) {
    return (
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {mine.map((visit) => (
              <TableRow
                className="cursor-pointer"
                key={visit.id}
                onClick={() => goToView("patientDetail", visit.patient_id)}
              >
                <TableCell className="font-semibold">
                  {visit.patients?.full_name ?? patientMap.get(visit.patient_id)?.full_name ?? "Paciente"}
                </TableCell>
                <TableCell>{formatDate(visit.scheduled_start)}</TableCell>
                <TableCell>{formatTimeRange(visit.scheduled_start, visit.scheduled_end)}</TableCell>
                <TableCell>
                  <StatusBadge status={visit.status} />
                </TableCell>
                <TableCell className="text-right">
                  {visit.status !== "completed" ? (
                    <Button size="sm" type="button" variant="secondary">
                      Completar visita
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!mine.length ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyNote tone="plain">No tienes visitas asignadas.</EmptyNote>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Panel>
    );
  }

  function renderMyAgendaCalendar(mine: Visit[]) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {mine.map((visit) => (
          <button
            className="rounded-[14px] border border-[var(--line)] bg-white p-4 text-left"
            key={visit.id}
            onClick={() => goToView("patientDetail", visit.patient_id)}
            type="button"
          >
            <div className="font-semibold text-[var(--ink)]">
              {visit.patients?.full_name ?? patientMap.get(visit.patient_id)?.full_name ?? "Paciente"}
            </div>
            <div className="mt-1 text-sm text-[var(--ink-soft)]">
              {formatDate(visit.scheduled_start)} · {formatTimeRange(visit.scheduled_start, visit.scheduled_end)}
            </div>
            <div className="mt-3">
              <StatusBadge status={visit.status} />
            </div>
          </button>
        ))}
        {!mine.length ? <EmptyNote tone="plain">No hay visitas para mostrar.</EmptyNote> : null}
      </div>
    );
  }

  function renderMyPatients() {
    const mine = activeCollaborator
      ? visiblePatientsForCollaborator(activeCollaborator.id)
      : [];

    return (
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Diagnóstico</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mine.map((patient) => (
              <TableRow
                className="cursor-pointer"
                key={patient.id}
                onClick={() => goToView("patientDetail", patient.id)}
              >
                <TableCell className="font-semibold">{patient.full_name}</TableCell>
                <TableCell>{patient.diagnosis ?? "Sin diagnóstico"}</TableCell>
                <TableCell>
                  <StatusBadge status={patient.status} />
                </TableCell>
              </TableRow>
            ))}
            {!mine.length ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <EmptyNote tone="plain">No hay pacientes asignados visibles.</EmptyNote>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Panel>
    );
  }

  function renderMyPayments() {
    const collaboratorId = activeCollaborator?.id ?? "";
    const mine = payoutLines.filter((line) => line.collaborator_id === collaboratorId);
    const total = mine.reduce((sum, line) => sum + line.amount_cents, 0);

    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard value={formatMoney(total)} label="Pago acumulado" accent />
          <StatCard value={visitsForCollaborator(collaboratorId).length} label="Visitas asignadas" />
        </div>
        <Panel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Pago por visita</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-semibold">
                    {line.patients?.full_name ?? patientMap.get(line.patient_id)?.full_name ?? "Paciente"}
                  </TableCell>
                  <TableCell>{formatDate(line.visits?.scheduled_start)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(line.amount_cents)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={line.status} />
                  </TableCell>
                </TableRow>
              ))}
              {!mine.length ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyNote tone="plain">No hay pagos visibles para este colaborador.</EmptyNote>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Panel>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--surface)] text-[var(--ink)]">
      <div className="min-h-screen bg-white">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <aside className="flex w-full min-w-0 max-w-full shrink-0 flex-col overflow-hidden border-b border-[var(--line)] bg-white p-3 lg:w-60 lg:border-b-0 lg:border-r">
            <div className="hidden px-2 pb-4 lg:block">
              <BrandBlock compact />
            </div>
            <nav
              aria-label="Navegación principal"
              className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto lg:flex-1 lg:flex-col lg:overflow-visible"
            >
              {(role === "karla" ? leaderNav : collaboratorNav).map((item) => {
                if (!("view" in item)) {
                  return (
                    <div
                      className="hidden px-2 pb-1 pt-3 text-[10.5px] font-bold uppercase tracking-[.5px] text-[var(--text-secondary)] lg:block"
                      key={item.label}
                    >
                      {item.label}
                    </div>
                  );
                }

                return (
                  <div className="min-w-fit shrink-0 lg:min-w-0" key={item.view}>
                    <NavButton
                      active={view === item.view}
                      item={item}
                      onClick={() => goToView(item.view)}
                    />
                  </div>
                );
              })}
            </nav>
            <Separator className="my-3 hidden lg:block" />
            <div className="hidden lg:block">
              <div className="flex items-center gap-2 rounded-xl p-2">
                <Avatar className="rounded-[9px]">
                  <AvatarFallback className="rounded-[9px] bg-[var(--primary-light)] font-bold text-[var(--primary-darker)]">
                    {initials(
                      role === "karla" ? data.profile.display_name : activeCollaborator?.name,
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-[var(--ink)]">
                    {role === "karla"
                      ? data.profile.display_name
                      : activeCollaborator?.name ?? "Colaborador"}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {role === "karla" ? "Líder de servicio" : "Colaborador"}
                  </div>
                </div>
              </div>
              <form action={signOutAction} className="mt-2">
                <Button className="w-full" type="submit" variant="outline">
                  <LogOutIcon data-icon="inline-start" />
                  Cerrar sesión
                </Button>
              </form>
            </div>
          </aside>

          <main className="min-w-0 flex-1 bg-[var(--surface)]">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-white px-4 py-4 lg:px-6">
              <div>
                <h1 className="font-[var(--font-heading)] text-xl font-extrabold text-[var(--ink)]">
                  {title}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden h-8 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink-soft)] sm:flex">
                  <SearchIcon className="size-3.5" />
                  Buscar...
                </div>
                <Button aria-label="Notificaciones" size="icon" type="button" variant="outline">
                  <BellIcon />
                </Button>
                {role === "karla" && ["calendar", "patients"].includes(view) ? (
                  <Button onClick={() => goToView("scheduleVisit")} type="button" variant="secondary">
                    <PlusIcon data-icon="inline-start" />
                    Agendar visita
                  </Button>
                ) : null}
              </div>
            </header>
            <div className="p-4 lg:p-6">{renderView()}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
