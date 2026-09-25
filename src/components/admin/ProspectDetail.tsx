"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { ExternalLink, Link2, Loader2, Mail, MessageCircle, Phone, X } from "lucide-react";
import { labelFor, labelsFor } from "@/config/questionnaire";
import { AGENT, whatsappUrl } from "@/config/site";
import { addCrmNote, fetchHistorial, relinkSubmission, type CrmNote } from "@/lib/crm";
import { formatDateTime } from "@/lib/csv";
import type { Submission } from "@/lib/types";
import { formatPhone, whatsappDigits } from "@/lib/validation";
import { StatusBadge } from "./StatusBadge";

/** Portal/dashboard de agentes de TRES65 (para abrir la ficha de un cliente). */
const CRM_WEB_URL = (process.env.NEXT_PUBLIC_CRM_WEB_URL || "https://tres65inmobiliaria.github.io/discovery-inmobiliaria").replace(/\/$/, "");

const KIND_LABEL: Record<string, string> = {
  chatwoot: "Lead en Chatwoot",
  client: "Cliente con portal",
  manual: "Contacto manual del Directorio",
};

export function ProspectDetail({
  prospect: p,
  user,
  canRelink,
  onChanged,
  onClose,
}: {
  prospect: Submission;
  user: User;
  canRelink: boolean;
  onChanged: () => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [notes, setNotes] = useState<CrmNote[] | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"" | "note" | "relink">("");
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const linked = p.crm_status === "linked";
  const canWriteNote = linked && (p.crm_kind === "chatwoot" || p.crm_kind === "client");

  // Ref para no re-ejecutar el efecto de foco/teclado en cada render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, []);

  const loadNotes = useCallback(async () => {
    if (!canWriteNote) return;
    try {
      const data = await fetchHistorial(await user.getIdToken(), p.submissionId);
      setNotes(data.notes);
    } catch (e) {
      console.error(e);
      setNotes([]);
    }
  }, [canWriteNote, user, p.submissionId]);

  useEffect(() => {
    // Historial del contacto en el CRM (fuente externa).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotes();
  }, [loadNotes]);

  async function saveNote() {
    if (!note.trim()) return;
    setBusy("note");
    setMsg(null);
    try {
      await addCrmNote(await user.getIdToken(), p.submissionId, note.trim());
      setNote("");
      setMsg({ kind: "ok", text: "Nota guardada en el CRM." });
      await loadNotes();
    } catch (e) {
      console.error(e);
      setMsg({ kind: "error", text: "No se pudo guardar la nota." });
    } finally {
      setBusy("");
    }
  }

  async function relink() {
    setBusy("relink");
    setMsg(null);
    try {
      await relinkSubmission(await user.getIdToken(), p.submissionId);
      setMsg({ kind: "ok", text: "Vinculado al CRM." });
      onChanged();
    } catch (e) {
      console.error(e);
      setMsg({ kind: "error", text: "Todavía no se pudo vincular. Intenta más tarde." });
    } finally {
      setBusy("");
    }
  }

  const firstName = p.fullName.split(" ")[0];
  const waMessage = `Hola ${firstName}, soy ${AGENT.firstName} de TRES65 Inmobiliaria. Gracias por responder el cuestionario sobre oportunidades de inversión en Mérida.`;
  const crmLink =
    p.crm_kind === "client" && p.client_token
      ? `${CRM_WEB_URL}/cliente-detalle.html?token=${encodeURIComponent(p.client_token)}`
      : p.crm_url;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-profundo/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-titulo"
        className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-piedra shadow-2xl"
      >
        <div className="border-b border-borde bg-white px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-suave">{formatDateTime(p.submittedAt)}</p>
              <h2 id="detalle-titulo" className="mt-0.5 font-serif text-2xl font-semibold break-words text-profundo">
                {p.fullName}
              </h2>
              <div className="mt-2">
                <StatusBadge status={p.status} owner={p.owner_name} />
              </div>
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Cerrar ficha"
              className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-menta"
            >
              <X aria-hidden className="size-6 text-profundo" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={whatsappUrl(whatsappDigits(p.phone), waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-medio px-4 font-semibold text-white hover:bg-profundo"
            >
              <MessageCircle aria-hidden className="size-4" /> WhatsApp
            </a>
            <a
              href={`mailto:${p.email}?subject=${encodeURIComponent("TRES65 Inmobiliaria · Oportunidades en Mérida")}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-profundo px-4 font-semibold text-profundo hover:bg-menta"
            >
              <Mail aria-hidden className="size-4" /> Email
            </a>
            <a
              href={`tel:+${whatsappDigits(p.phone)}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-semibold text-profundo hover:bg-menta"
            >
              <Phone aria-hidden className="size-4" /> Llamar
            </a>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <Card title="En el CRM TRES65">
            <Row label="Estado" value={p.status} />
            <Row label="Asesor" value={p.owner_name || (linked ? "Sin asignar" : "—")} />
            <Row
              label="Vínculo"
              value={
                linked
                  ? `${KIND_LABEL[p.crm_kind ?? ""] ?? "—"} · ${p.crm_action === "created" ? "contacto nuevo creado por la landing" : "ya existía (se conservó su asignación y estado)"}`
                  : "Pendiente: el envío se guardó pero aún no se pudo ligar a un contacto"
              }
            />
            {crmLink && (
              <a
                href={crmLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-fit items-center gap-2 font-semibold text-medio hover:underline"
              >
                <ExternalLink aria-hidden className="size-4" /> {p.crm_kind === "client" ? "Abrir ficha del cliente" : "Abrir conversación en Chatwoot"}
              </a>
            )}
            {!linked && canRelink && (
              <button
                onClick={relink}
                disabled={busy !== ""}
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-profundo px-5 font-semibold text-white hover:bg-medio disabled:opacity-50"
              >
                {busy === "relink" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Link2 aria-hidden className="size-4" />}
                Reintentar vinculación
              </button>
            )}
            <p className="text-xs text-suave">
              El estado y la asignación se cambian en el CRM (Leads / Directorio / Chatwoot), no aquí.
            </p>
          </Card>

          {canWriteNote && (
            <Card title="Notas del contacto">
              <label htmlFor="note" className="text-sm font-semibold text-suave">
                Agregar nota (se guarda en el CRM)
              </label>
              <textarea
                id="note"
                rows={3}
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej. Le llamé, prefiere que la contacten por la tarde."
                className="mt-1 w-full rounded-xl border border-borde bg-white p-3 focus:border-medio focus:outline-none focus:ring-4 focus:ring-acento/20"
              />
              <button
                onClick={saveNote}
                disabled={busy !== "" || !note.trim()}
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border-2 border-profundo px-5 font-semibold text-profundo hover:bg-menta disabled:opacity-50"
              >
                {busy === "note" && <Loader2 aria-hidden className="size-4 animate-spin" />} Agregar nota
              </button>
              {notes === null ? (
                <Loader2 aria-label="Cargando notas" className="size-5 animate-spin text-medio" />
              ) : notes.length === 0 ? (
                <p className="text-sm text-suave">Sin notas.</p>
              ) : (
                <ul className="grid gap-3">
                  {[...notes].reverse().map((n, i) => (
                    <li key={i} className="rounded-2xl bg-piedra p-3">
                      <p className="whitespace-pre-wrap">{n.text}</p>
                      <p className="mt-1 text-xs text-suave">
                        {[n.author, formatDateTime(n.created_at)].filter(Boolean).join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
          {msg && (
            <p role="status" className={`mb-4 text-sm ${msg.kind === "ok" ? "text-medio" : "text-error"}`}>
              {msg.text}
            </p>
          )}

          <Card title="Datos">
            <Row label="Nombre" value={p.fullName} />
            <Row label="Correo" value={p.email} />
            <Row label="Teléfono / WhatsApp" value={formatPhone(p.phone)} />
          </Card>

          <Card title="Perfil">
            <Row label="¿Le interesa diversificar su portafolio?" value={labelFor("diversificationInterest", p.diversificationInterest)} />
            <Row label="¿Ha invertido en bienes raíces?" value={labelFor("previousRealEstateInvestment", p.previousRealEstateInvestment)} />
            {p.previousRealEstateInvestment === "si" && (
              <>
                <Row
                  label="Tipo de inversión"
                  value={[labelsFor("previousInvestmentTypes", p.previousInvestmentTypes), p.previousInvestmentTypeOther]
                    .filter((x) => x && x !== "—")
                    .join(" · ")}
                />
                <Row label="Ciudad o zona" value={p.previousInvestmentLocation} />
              </>
            )}
          </Card>

          <Card title="Capacidad / forma de inversión">
            <Row label="Monto o rango" value={labelFor("investmentBudget", p.investmentBudget)} />
            <Row label="Forma de compra" value={labelFor("purchaseMethod", p.purchaseMethod)} />
            <Row label="Interés en plan de financiamiento" value={labelFor("financingInterest", p.financingInterest)} />
          </Card>

          <Card title="Tiempo">
            <Row label="Plazo para concretar" value={labelFor("investmentTimeline", p.investmentTimeline)} />
            <Row
              label="Toma la decisión"
              value={[labelsFor("decisionMakers", p.decisionMakers), p.decisionMakersOther].filter((x) => x && x !== "—").join(" · ")}
            />
          </Card>

          <Card title="Objetivos">
            <Row
              label="Propósito"
              value={[labelsFor("investmentPurposes", p.investmentPurposes), p.investmentPurposeOther].filter((x) => x && x !== "—").join(" · ")}
            />
            <Row label="Uso personal" value={labelFor("personalUse", p.personalUse)} />
          </Card>

          <Card title="Mérida">
            <Row label="¿Conoce Mérida?" value={labelFor("meridaExperience", p.meridaExperience)} />
            <Row label="Conocimiento del mercado" value={labelFor("meridaMarketKnowledge", p.meridaMarketKnowledge)} />
            <Row label="Zona o colonia en mente" value={p.preferredArea} />
            <Row label="Abierto/a a recomendaciones" value={p.openToRecommendations ? "Sí" : "No"} />
          </Card>

          <Card title="Presentación">
            <Row label="Interés en presentación (1.5 h)" value={labelFor("eventInterest", p.eventInterest)} />
            <Row label="Consentimiento de privacidad" value={p.privacyConsent ? `Sí · ${formatDateTime(p.privacyConsentAt)}` : "No"} />
          </Card>

          <Card title="Atribución">
            <Row label="Fuente" value={p.source} />
            <Row label="Campaña" value={p.campaign} />
            <Row label="utm_source" value={p.utm_source} />
            <Row label="utm_medium" value={p.utm_medium} />
            <Row label="utm_campaign" value={p.utm_campaign} />
            <Row label="utm_content" value={p.utm_content} />
            <Row label="utm_term" value={p.utm_term} />
            <Row label="Referrer" value={p.referrer} />
            <Row label="Página de entrada" value={p.landingUrl} />
            <Row label="Versión de la landing" value={p.landingVersion} />
            <Row label="ID del envío" value={p.submissionId} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl border border-borde bg-white p-5">
      <h3 className="mb-3 text-xs font-bold tracking-[0.16em] text-medio uppercase">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[0.9fr_1.1fr] sm:gap-4">
      <span className="text-sm text-suave">{label}</span>
      <span className="break-words text-texto">{value || "—"}</span>
    </div>
  );
}
