import { labelFor, labelsFor } from "@/config/questionnaire";
import type { Submission } from "./types";
import { formatPhone } from "./validation";

/** Fecha/hora en hora de Mérida. Acepta ISO (del backend) o epoch en segundos. */
export function formatDateTime(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const d = typeof value === "number" ? new Date(value < 1e12 ? value * 1000 : value) : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("es-MX", {
    timeZone: "America/Merida",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Escapa una celda CSV. Además neutraliza "CSV injection": como los datos los
 * escribe el público, una celda que empiece con = + - @ podría ejecutarse como
 * fórmula al abrir el archivo en Excel/Sheets.
 */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r;]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

const CRM_KIND: Record<string, string> = {
  chatwoot: "Lead (Chatwoot)",
  client: "Cliente con portal",
  manual: "Directorio (manual)",
};
const CRM_ACTION: Record<string, string> = { created: "Contacto nuevo", enriched: "Ya existía en el CRM" };

const COLUMNS: [string, (p: Submission) => unknown][] = [
  ["ID envío", (p) => p.submissionId],
  ["Fecha", (p) => formatDateTime(p.submittedAt)],
  ["Estado en CRM", (p) => p.status],
  ["Asesor", (p) => p.owner_name ?? ""],
  ["Vínculo CRM", (p) => (p.crm_kind ? CRM_KIND[p.crm_kind] : "Pendiente")],
  ["Origen del contacto", (p) => (p.crm_action ? CRM_ACTION[p.crm_action] : "")],
  ["Nombre", (p) => p.fullName],
  ["Correo", (p) => p.email],
  ["Teléfono / WhatsApp", (p) => formatPhone(p.phone)],
  ["Interés en diversificar", (p) => labelFor("diversificationInterest", p.diversificationInterest)],
  ["Ha invertido en bienes raíces", (p) => labelFor("previousRealEstateInvestment", p.previousRealEstateInvestment)],
  ["Tipo de inversión previa", (p) => labelsFor("previousInvestmentTypes", p.previousInvestmentTypes)],
  ["Tipo previo (otro)", (p) => p.previousInvestmentTypeOther],
  ["Ciudad / zona de inversión previa", (p) => p.previousInvestmentLocation],
  ["Presupuesto", (p) => labelFor("investmentBudget", p.investmentBudget)],
  ["Forma de compra", (p) => labelFor("purchaseMethod", p.purchaseMethod)],
  ["Interés en financiamiento", (p) => labelFor("financingInterest", p.financingInterest)],
  ["Plazo", (p) => labelFor("investmentTimeline", p.investmentTimeline)],
  ["Decide con", (p) => labelsFor("decisionMakers", p.decisionMakers)],
  ["Decide con (otro)", (p) => p.decisionMakersOther],
  ["Objetivos", (p) => labelsFor("investmentPurposes", p.investmentPurposes)],
  ["Objetivo (otro)", (p) => p.investmentPurposeOther],
  ["Uso personal", (p) => labelFor("personalUse", p.personalUse)],
  ["Conoce Mérida", (p) => labelFor("meridaExperience", p.meridaExperience)],
  ["Conoce el mercado de Mérida", (p) => labelFor("meridaMarketKnowledge", p.meridaMarketKnowledge)],
  ["Zona preferida", (p) => p.preferredArea],
  ["Abierto a recomendaciones", (p) => (p.openToRecommendations ? "Sí" : "No")],
  ["Interés en presentación", (p) => labelFor("eventInterest", p.eventInterest)],
  ["Consentimiento de privacidad", (p) => (p.privacyConsent ? "Sí" : "No")],
  ["Fecha de consentimiento", (p) => formatDateTime(p.privacyConsentAt)],
  ["Fuente", (p) => p.source],
  ["Campaña", (p) => p.campaign],
  ["utm_source", (p) => p.utm_source],
  ["utm_medium", (p) => p.utm_medium],
  ["utm_campaign", (p) => p.utm_campaign],
  ["utm_content", (p) => p.utm_content],
  ["utm_term", (p) => p.utm_term],
  ["Referrer", (p) => p.referrer],
  ["Versión de la landing", (p) => p.landingVersion],
];

export function submissionsToCsv(rows: Submission[]): string {
  const header = COLUMNS.map(([h]) => csvCell(h)).join(",");
  const body = rows.map((p) => COLUMNS.map(([, get]) => csvCell(get(p))).join(","));
  // BOM para que Excel respete acentos.
  return "﻿" + [header, ...body].join("\r\n");
}

export function downloadCsv(rows: Submission[]): void {
  const blob = new Blob([submissionsToCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `prospectos-tres65-merida-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
