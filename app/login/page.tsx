import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[18px] border border-[var(--line)] bg-white shadow-[0_20px_60px_rgba(38,49,63,.12)] md:grid-cols-[1fr_0.9fr]">
        <div className="auth-hero bg-[var(--primary-darker)] p-8 text-white md:p-10">
          <BrandMark />
          <div className="mt-16 max-w-md">
            <p className="text-sm font-bold uppercase tracking-[.08em] text-white">
              Acceso seguro
            </p>
            <h1 className="mt-3 font-[var(--font-heading)] text-4xl font-extrabold leading-tight">
              Ingresa para ver tu operacion Kromed.
            </h1>
            <p className="mt-5 leading-7 text-white">
              El rol se obtiene desde Supabase. El lider ve la operacion
              completa; cada colaborador ve solo la informacion permitida por
              RLS.
            </p>
          </div>
        </div>
        <div className="p-8 md:p-10">
          <Link className="btn btn-ghost mb-8" href="/">
            Volver
          </Link>
          <h2 className="font-[var(--font-heading)] text-2xl font-extrabold text-[var(--ink)]">
            Iniciar sesion
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Usa tu correo y contrasena asignados. No es posible ingresar sin
            credenciales.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            ¿Necesitas acceso?{" "}
            <Link className="font-bold text-[var(--primary-dark)]" href="/registro">
              Solicitalo al lider
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
