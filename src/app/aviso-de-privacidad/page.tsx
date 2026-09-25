import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { container } from "@/components/ui";
import aviso from "./aviso.json";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | TRES65 Inmobiliaria",
};

/**
 * Texto oficial del Aviso de Privacidad de TRES65 (el mismo que usa el portal
 * de clientes). Si TRES65 publica una versión distinta, reemplazar aviso.json.
 */
export default function AvisoDePrivacidad() {
  return (
    <>
      <Header />
      <main className={`${container} max-w-3xl py-12 sm:py-16`}>
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-semibold text-medio hover:underline">
          <ArrowLeft aria-hidden className="size-4" /> Volver
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-profundo sm:text-4xl">Aviso de Privacidad</h1>
        <div className="mt-8 grid gap-4 text-[0.98rem] leading-relaxed text-texto">
          {(aviso as [string, string][]).map(([kind, text], i) =>
            kind === "h" ? (
              <h2 key={i} className="mt-4 text-lg font-semibold text-profundo">
                {text}
              </h2>
            ) : (
              <p key={i}>{text}</p>
            ),
          )}
        </div>
      </main>
    </>
  );
}
