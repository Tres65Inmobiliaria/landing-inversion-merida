"use client";

import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { Loader2, Lock } from "lucide-react";
import { btn } from "@/components/ui";
import { getFirebaseAuth } from "@/lib/firebase";

const input =
  "mt-2 block min-h-12 w-full rounded-2xl border border-borde bg-white px-4 text-base focus:border-medio focus:outline-none focus:ring-4 focus:ring-acento/20";

/**
 * Solo inicio de sesión. No existe registro público: las cuentas se crean
 * desde la consola de Firebase y, además, deben estar en /admins/{uid}.
 */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(
        code === "auth/too-many-requests"
          ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
          : code === "auth/network-request-failed"
            ? "Sin conexión. Revisa tu internet."
            : "Correo o contraseña incorrectos.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Escribe tu correo arriba para enviarte el enlace.");
      return;
    }
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
    } catch {
      // No revelamos si el correo existe o no.
    }
    setInfo("Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.");
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <form onSubmit={submit} className="rounded-3xl border border-borde bg-white p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-menta">
          <Lock aria-hidden className="size-6 text-medio" />
        </span>
        <h1 className="mt-5 font-serif text-2xl font-semibold text-profundo">Acceso administrativo</h1>
        <p className="mt-1 text-sm text-suave">Solo para el equipo de TRES65.</p>

        <label htmlFor="admin-email" className="mt-6 block font-semibold text-profundo">
          Correo
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <label htmlFor="admin-password" className="mt-4 block font-semibold text-profundo">
          Contraseña
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-error">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="mt-4 text-sm text-medio">
            {info}
          </p>
        )}

        <button type="submit" disabled={busy} className={`${btn.primary} mt-6 w-full`}>
          {busy ? <Loader2 aria-label="Entrando" className="size-5 animate-spin" /> : "Entrar"}
        </button>
        <button type="button" onClick={reset} className="mt-3 w-full text-center text-sm font-semibold text-medio underline-offset-4 hover:underline">
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </main>
  );
}
