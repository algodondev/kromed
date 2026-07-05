import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChartPie,
  ClipboardPlus,
  ReceiptText,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { BrandMark } from "@/components/brand";

const valueItems = [
  { label: "Pacientes", icon: "patients" },
  { label: "Agendamiento", icon: "schedule" },
  { label: "Reportes", icon: "reports" },
  { label: "Pagos", icon: "payments" },
];

const features = [
  {
    title: "Agenda inteligente",
    text: "Centraliza visitas, disponibilidad y conflictos de horario para coordinar atencion sin hojas sueltas.",
    icon: "calendar",
  },
  {
    title: "Gestion de pacientes",
    text: "Organiza fichas, tratamientos, responsables y evolucion clinica con acceso por rol.",
    icon: "clinical",
  },
  {
    title: "Reportes operativos",
    text: "Da visibilidad a visitas pendientes, validaciones, pagos y actividad de automatizacion.",
    icon: "analytics",
  },
  {
    title: "Pagos y liquidaciones",
    text: "Mantiene trazabilidad de cobros, insumos, alquileres y pagos a colaboradores.",
    icon: "wallet",
  },
];

function LandingIcon({ name }: { name: string }) {
  const props = {
    "aria-hidden": true,
    size: 22,
    strokeWidth: 2.2,
  } as const;

  switch (name) {
    case "patients":
      return <UsersRound {...props} />;
    case "schedule":
      return <CalendarClock {...props} />;
    case "reports":
      return <ChartPie {...props} />;
    case "payments":
      return <ReceiptText {...props} />;
    case "calendar":
      return <CalendarDays {...props} />;
    case "clinical":
      return <ClipboardPlus {...props} />;
    case "analytics":
      return <ChartNoAxesColumnIncreasing {...props} />;
    case "wallet":
      return <WalletCards {...props} />;
    default:
      return <ChartPie {...props} />;
  }
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <header className="topbar">
        <BrandMark />
        <nav
          className="hidden items-center gap-6 text-sm font-bold text-[var(--ink-soft)] md:flex"
          aria-label="Navegacion publica"
        >
          <a href="#inicio">Inicio</a>
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <div className="topbar-right">
          <Link className="btn btn-ghost" href="/login">
            Iniciar sesion
          </Link>
          <Link className="btn btn-primary" href="/registro">
            Registrarse
          </Link>
        </div>
      </header>

      <section
        id="inicio"
        className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-14 md:grid-cols-[1.05fr_0.95fr] md:px-10 md:py-20"
      >
        <div>
          <h1 className="max-w-3xl font-[var(--font-heading)] text-4xl font-extrabold leading-tight text-[var(--ink)] md:text-6xl">
            Gestion clinica, agenda y pagos en un solo sistema.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-soft)] md:text-lg">
            Kromed ayuda a equipos de atencion a coordinar pacientes,
            colaboradores, visitas, validaciones y finanzas con trazabilidad y
            control por rol.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/login">
              Comenzar ahora
            </Link>
            <a className="btn btn-ghost" href="#funcionalidades">
              Ver funcionalidades
            </a>
          </div>
        </div>

        <div className="rounded-[18px] border border-[var(--line)] bg-white p-4 shadow-[0_20px_60px_rgba(38,49,63,.12)]">
          <div className="rounded-[14px] bg-[var(--surface)] p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.08em] text-[var(--text-secondary)]">
                  Vista operativa
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-[var(--ink)]">
                  Resumen diario
                </h2>
              </div>
              <span className="chip blue">Demo</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Visitas", "24"],
                ["Pendientes", "6"],
                ["Validacion", "3"],
                ["Pagos", "$1.8k"],
              ].map(([label, value]) => (
                <div className="stat m-0" key={label}>
                  <div className="v">{value}</div>
                  <div className="l">{label}</div>
                </div>
              ))}
            </div>
            <div className="panel mt-4 mb-0">
              <h3>Agenda proxima</h3>
              <div className="space-y-3">
                {["Evaluacion inicial", "Terapia respiratoria", "Seguimiento"].map(
                  (item, index) => (
                    <div
                      className="flex items-center justify-between rounded-[10px] bg-[var(--surface)] px-3 py-3"
                      key={item}
                    >
                      <div>
                        <div className="tname">{item}</div>
                        <div className="tmeta">
                          {index + 8}:00 AM · Colaborador asignado
                        </div>
                      </div>
                      <span className={index === 1 ? "chip amber" : "chip green"}>
                        {index === 1 ? "Revisar" : "Listo"}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-12 md:px-10">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="font-[var(--font-heading)] text-2xl font-extrabold text-[var(--ink)]">
            Gestiona todo tu proceso de atencion en un solo sistema
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {valueItems.map(({ label, icon }) => (
              <div className="panel m-0 text-center" key={label}>
                <div className="feature-icon mx-auto mb-3">
                  <LandingIcon name={icon} />
                </div>
                <h3 className="m-0">{label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="funcionalidades"
        className="mx-auto max-w-7xl px-6 py-14 md:px-10"
      >
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-extrabold uppercase tracking-[.08em] text-[var(--primary-dark)]">
            Funcionalidades
          </p>
          <h2 className="mt-2 font-[var(--font-heading)] text-3xl font-extrabold text-[var(--ink)]">
            Herramientas para operar con claridad
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          {features.map(({ title, text, icon }) => (
            <article className="panel m-0" key={title}>
              <div className="feature-icon mb-4">
                <LandingIcon name={icon} />
              </div>
              <h3>{title}</h3>
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer id="contacto" className="border-t border-[var(--line)] bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[var(--text-secondary)] md:flex-row md:items-center md:justify-between">
          <BrandMark compact />
          <div className="flex flex-wrap gap-4">
            <span>contacto@kromed.example</span>
            <span>Soporte</span>
            <span>Privacidad</span>
            <span>© 2026 Kromed</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
