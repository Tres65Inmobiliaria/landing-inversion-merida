"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { Loader2, Mail, MessageCircle, Phone, X } from "lucide-react";
import { labelFor, labelsFor, MANUAL_SUBMISSION_STATUSES } from "@/config/questionnaire";
import { AGENT, whatsappUrl } from "@/config/site";
import { setSubmissionStatus } from "@/lib/crm";
import { formatDateTime } from "@/lib/csv";
import type { DirectoryLink, Submission, SubmissionStatus } from "@/lib/types";
import { formatPhone, whatsappDigits } from "@/lib/validation";
import { DirectoryAction } from "./DirectoryAction";
import { StatusBadge } from "./StatusBadge";

export function ProspectDetail({
  prospect: p,
  user,
  onLinked,
  onStatus,
  onClose,
}: {
  prospect: Submission;
  user: User;
  onLinked: (id: string, directory: DirectoryLink) => void;
  onStatus: (id: string, status: SubmissionStatus) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  // Borrador local del estado; sin cambios pendientes refleja el valor guardado.
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const status = draftStatus ?? p.status;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

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

  async function saveStatus() {
    setBusy(true);
    setMsg(null);
    try {
      await setSubmissionStatus(await user.getIdToken(), p.submissionId, status);
      onStatus(p.submissionId, status as SubmissionStatus);
      setDraftStatus(null);
      setMsg({ kind: "ok", text: "Estado actualizado." });
    } catch (e) {
      console.error(e);
      setMsg({ kind: "error", text: "No se pudo guardar el estado." });
    } finally {
      setBusy(false);
    }
  }

  const firstName = p.fullName.split(" ")[0];
  const waMessage = `Hola ${firstName}, soy ${AGENT.firstName} de TRES65 Inmobiliaria. Gracias por responder el cuestionario sobre oportunidades de inversión en Mérida.`;

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
                <StatusBadge status={p.status} />
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
          <Card title="Seguimiento de la respuesta">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="status" className="text-sm font-semibold text-suave">
                  Estado de respuesta
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setDraftStatus(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-xl border border-borde bg-white px-3 focus:border-medio focus:outline-none focus:ring-4 focus:ring-acento/20"
                >
                  {p.status === "agregado_directorio" && <option value="agregado_directorio">Agregado al Directorio</option>}
                  {MANUAL_SUBMISSION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={saveStatus}
                disabled={busy || status === p.status}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-profundo px-5 font-semibold text-white hover:bg-medio disabled:opacity-50"
              >
                {busy && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar estado
              </button>
            </div>
            {p.status_updated_by && (
              <p className="text-xs text-suave">
                Último cambio: {formatDateTime(p.status_updated_at)} · {p.status_updated_by}
              </p>
            )}
            {msg && (
              <p role="status" className={`text-sm ${msg.kind === "ok" ? "text-medio" : "text-error"}`}>
                {msg.text}
              </p>
            )}
            <p className="text-xs text-suave">Este estado solo organiza las respuestas de la campaña; no cambia nada en el CRM.</p>
          </Card>

          <Card title="Directorio TRES65">
            <DirectoryAction submission={p} user={user} onLinked={onLinked} />
            {!p.directory && (
              <p className="text-xs text-suave">
                Antes de crear, se busca por teléfono y correo. Si la persona ya existe en TRES65 solo se vincula, sin cambiar su
                asesor, estado ni notas. Si no existe, se crea en el Directorio asignada a Damara.
              </p>
            )}
          </Card>

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
