import Link from "next/link";
import { signOut } from "@/lib/auth-actions";
import { BrandMark } from "@/components/brand";

const adminItems = [
  "Dashboard",
  "Pacientes",
  "Agenda",
  "Colaboradores",
  "Finanzas",
  "Automatizacion",
];

const collaboratorItems = ["Mi agenda", "Mis pacientes", "Evoluciones", "Pagos"];

export function DashboardShell({
  children,
  displayName,
  role,
}: {
  children: React.ReactNode;
  displayName: string;
  role: "admin" | "collaborator";
}) {
  const items = role === "admin" ? adminItems : collaboratorItems;

  return (
    <div className="browserframe">
      <div className="applayout">
        <aside className="sidebar">
          <div className="slogo">
            <BrandMark compact />
          </div>
          <nav className="snav" aria-label="Navegacion principal">
            <div className="snav-label">
              {role === "admin" ? "Lider" : "Colaborador"}
            </div>
            {items.map((item, index) => (
              <Link
                className={`sitem ${index === 0 ? "active" : ""}`}
                href="/dashboard"
                key={item}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {item}
              </Link>
            ))}
          </nav>
          <div className="sfoot">
            <div className="userchip">
              <div className="avatar">
                {displayName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <div className="n">{displayName}</div>
                <div className="r">
                  {role === "admin" ? "Lider operativo" : "Colaborador"}
                </div>
              </div>
            </div>
            <form action={signOut} className="mt-3">
              <button className="btn btn-ghost w-full" type="submit">
                Cerrar sesion
              </button>
            </form>
          </div>
        </aside>
        <main className="mainarea">{children}</main>
      </div>
    </div>
  );
}
