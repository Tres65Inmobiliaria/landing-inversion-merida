import { labelFor, labelsFor } from "@/config/questionnaire";
import type { Prospect } from "./types";
import { formatPhone } from "./validation";

type Ts = { toDate: () => Date } | null | undefined;

export function formatDateTime(ts: Ts): string {
  if (!ts) return "";
  const d = ts.toDate();
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

const COLUMNS: [string, (p: Prospect) => unknown][] = [
  ["ID", (p) => p.id],
  ["Fecha", (p) => formatDateTime(p.createdAt)],
  ["Estado", (p) => labelFor("status", p.status)],
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
  ["Asesora asignada", (p) => p.assignedAgent],
  ["Fuente", (p) => p.source],
  ["Campaña", (p) => p.campaign],
  ["utm_source", (p) => p.utm_source],
  ["utm_medium", (p) => p.utm_medium],
  ["utm_campaign", (p) => p.utm_campaign],
  ["utm_content", (p) => p.utm_content],
  ["utm_term", (p) => p.utm_term],
  ["Referrer", (p) => p.referrer],
  ["Notas internas", (p) => (p.internalNotes ?? []).map((n) => `[${n.author}] ${n.text}`).join(" | ")],
  ["Última actualización", (p) => formatDateTime(p.updatedAt)],
];

export function prospectsToCsv(rows: Prospect[]): string {
  const header = COLUMNS.map(([h]) => csvCell(h)).join(",");
  const body = rows.map((p) => COLUMNS.map(([, get]) => csvCell(get(p))).join(","));
  // BOM para que Excel respete acentos.
  return "﻿" + [header, ...body].join("\r\n");
}

export function downloadCsv(rows: Prospect[]): void {
  const blob = new Blob([prospectsToCsv(rows)], { type: "text/csv;charset=utf-8" });
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
