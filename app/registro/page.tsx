import Link from "next/link";
import { BrandMark } from "@/components/brand";

export default function RegistroPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-4 py-10">
      <section className="w-full max-w-2xl rounded-[18px] border border-[var(--line)] bg-white p-8 shadow-[0_20px_60px_rgba(38,49,63,.12)]">
        <BrandMark />
        <div className="mt-10">
          <span className="chip blue">Registro controlado</span>
          <h1 className="mt-5 font-[var(--font-heading)] text-3xl font-extrabold text-[var(--ink)]">
            El alta de usuarios la realiza el lider.
          </h1>
          <p className="mt-4 leading-7 text-[var(--ink-soft)]">
            Para proteger informacion clinica, agenda y pagos, Kromed no permite
            registro publico abierto. Solicita al lider operativo que cree tu
            cuenta y asigne tu rol desde el sistema.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/login">
              Ir a iniciar sesion
            </Link>
            <Link className="btn btn-ghost" href="/">
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
