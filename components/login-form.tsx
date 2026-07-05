"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {
  message: "",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor="email">Correo electronico</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="lider@example.com"
        />
      </div>

      <div className="field">
        <label htmlFor="password">Contrasena</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={1}
          placeholder="password123"
        />
      </div>

      {state.message ? (
        <p className="rounded-[10px] border border-[var(--red)] bg-[var(--red-light)] px-3 py-2 text-sm font-semibold text-[var(--red)]">
          {state.message}
        </p>
      ) : null}

      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        {pending ? "Validando..." : "Iniciar sesion"}
      </button>
    </form>
  );
}
