"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Loader2, LogOut } from "lucide-react";
import logo from "@/assets/logo-tres65.png";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { Dashboard } from "./Dashboard";
import { LoginForm } from "./LoginForm";

type State = { kind: "loading" } | { kind: "signedOut" } | { kind: "signedIn"; user: User };

export function AdminApp() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) return;
    // Quién puede ver qué lo decide el backend del CRM (mismas reglas que el Directorio).
    return onAuthStateChanged(getFirebaseAuth(), (user) =>
      setState(user ? { kind: "signedIn", user } : { kind: "signedOut" }),
    );
  }, [configured]);

  const logout = () => signOut(getFirebaseAuth());

  return (
    <div className="min-h-dvh bg-piedra">
      <header className="sticky top-0 z-30 border-b border-borde bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src={logo} alt="TRES65 Inmobiliaria" className="h-8 w-auto" priority />
            <span className="hidden border-l border-borde pl-3 text-sm font-semibold text-suave sm:inline">
              Prospectos · Inversión Mérida
            </span>
          </div>
          {state.kind === "signedIn" && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-suave md:inline">{state.user.email}</span>
              <button onClick={logout} className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-profundo hover:bg-menta">
                <LogOut aria-hidden className="size-4" /> Salir
              </button>
            </div>
          )}
        </div>
      </header>

      {!configured ? (
        <Centered>
          <p className="font-semibold text-profundo">Firebase no está configurado.</p>
          <p className="mt-2 text-suave">Faltan las variables NEXT_PUBLIC_FIREBASE_* del CRM (ver .env.example).</p>
        </Centered>
      ) : state.kind === "loading" ? (
        <Centered>
          <Loader2 aria-label="Cargando" className="mx-auto size-8 animate-spin text-medio" />
        </Centered>
      ) : state.kind === "signedOut" ? (
        <LoginForm />
      ) : (
        <Dashboard user={state.user} onLogout={logout} />
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-5 py-24 text-center">
      <div className="rounded-3xl border border-borde bg-white p-8">{children}</div>
    </main>
  );
}
