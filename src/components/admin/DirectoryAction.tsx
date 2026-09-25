"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
import { Check, ExternalLink, Loader2, UserPlus } from "lucide-react";
import { addToDirectorio, directoryUrl } from "@/lib/crm";
import type { DirectoryLink, Submission } from "@/lib/types";

/**
 * Botón "Agregar al Directorio" / estado "En Directorio ✓" + "Abrir en Directorio".
 * La búsqueda de duplicados y la creación/vinculación las hace el backend.
 */
export function DirectoryAction({
  submission: s,
  user,
  compact = false,
  onLinked,
}: {
  submission: Submission;
  user: User;
  compact?: boolean;
  onLinked: (id: string, directory: DirectoryLink) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const d = s.directory;

  async function add(e: React.MouseEvent) {
    e.stopPropagation();
    setBusy(true);
    setError("");
    try {
      const res = await addToDirectorio(await user.getIdToken(), s.submissionId);
      onLinked(s.submissionId, res.directory);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No se pudo agregar.");
    } finally {
      setBusy(false);
    }
  }

  if (d) {
    const existed = d.state === "existing";
    return (
      <div className={`flex ${compact ? "flex-col items-start gap-1" : "flex-col gap-2"}`} onClick={(e) => e.stopPropagation()}>
        {d.in_directorio ? (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-medio px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white">
            En Directorio <Check aria-hidden className="size-3.5" strokeWidth={3} />
          </span>
        ) : (
          <span className="inline-flex w-fit rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-sky-800">
            Existe en Chatwoot
          </span>
        )}
        {!compact && existed && (
          <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {d.in_directorio
              ? "Este contacto ya existe en el Directorio. Esta respuesta quedó vinculada sin cambiar su agente, estado ni notas."
              : "Este contacto ya existe en TRES65 (conversación de WhatsApp sin etapa del Directorio). Quedó vinculada sin cambiar nada."}
          </p>
        )}
        {!compact && d.owner_name && <p className="text-sm text-suave">Asesor: {d.owner_name}</p>}
        <a
          href={directoryUrl(d)}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 font-semibold text-medio hover:underline ${compact ? "text-xs" : "min-h-11"}`}
        >
          <ExternalLink aria-hidden className={compact ? "size-3.5" : "size-4"} />
          {d.kind === "chatwoot" && !d.in_directorio ? "Abrir en Chatwoot" : d.kind === "client" ? "Abrir ficha del cliente" : "Abrir en Directorio"}
        </a>
      </div>
    );
  }

  return (
    <div className={compact ? "flex flex-col items-start gap-1" : "flex flex-col gap-2"} onClick={(e) => e.stopPropagation()}>
      {compact && <span className="text-xs text-suave">No agregado</span>}
      <button
        type="button"
        onClick={add}
        disabled={busy}
        className={
          compact
            ? "inline-flex items-center gap-1 rounded-full border border-profundo px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-profundo hover:bg-menta disabled:opacity-50"
            : "inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-profundo px-5 font-semibold text-white hover:bg-medio disabled:opacity-50"
        }
      >
        {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <UserPlus aria-hidden className={compact ? "size-3.5" : "size-4"} />}
        Agregar al Directorio
      </button>
      {error && (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
