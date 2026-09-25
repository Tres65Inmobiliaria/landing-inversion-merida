import type { Attribution, FormValues, Submission } from "./types";

/**
 * Backend del CRM TRES65 (agente-tres65). La landing NO escribe en Firestore:
 * envía el cuestionario a un endpoint controlado que valida, deduplica, crea o
 * enriquece el contacto real (Chatwoot / clients / Directorio) y asigna a Damara.
 */
export const CRM_API_URL = (process.env.NEXT_PUBLIC_CRM_API_URL || "https://agente-tres65-production.up.railway.app").replace(
  /\/$/,
  "",
);

export const LANDING_VERSION = "2.0.0";

/** Id estable del envío (el backend lo usa para que un reintento no duplique). */
export function newSubmissionId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

/**
 * Cuerpo que se envía al backend: SOLO respuestas, contacto y atribución.
 * Asignación, estado, labels, campaña y fechas los decide el servidor.
 */
export function buildSubmissionPayload(v: FormValues, attribution: Attribution, submissionId: string) {
  const invested = v.previousRealEstateInvestment === "si";
  return {
    submissionId,
    landingVersion: LANDING_VERSION,
    fullName: v.fullName.trim().replace(/\s+/g, " "),
    email: v.email.trim().toLowerCase(),
    phone: v.phone.trim(),
    diversificationInterest: v.diversificationInterest,
    previousRealEstateInvestment: v.previousRealEstateInvestment,
    previousInvestmentTypes: invested ? v.previousInvestmentTypes : [],
    previousInvestmentTypeOther: invested && v.previousInvestmentTypes.includes("otro") ? v.previousInvestmentTypeOther.trim() : "",
    previousInvestmentLocation: invested ? v.previousInvestmentLocation.trim() : "",
    investmentBudget: v.investmentBudget,
    purchaseMethod: v.purchaseMethod,
    financingInterest: v.financingInterest,
    investmentTimeline: v.investmentTimeline,
    decisionMakers: v.decisionMakers,
    decisionMakersOther: v.decisionMakers.includes("otro") ? v.decisionMakersOther.trim() : "",
    investmentPurposes: v.investmentPurposes,
    investmentPurposeOther: v.investmentPurposes.includes("otro") ? v.investmentPurposeOther.trim() : "",
    personalUse: v.personalUse,
    meridaExperience: v.meridaExperience,
    meridaMarketKnowledge: v.meridaMarketKnowledge,
    preferredArea: v.preferredArea.trim(),
    openToRecommendations: v.openToRecommendations,
    eventInterest: v.eventInterest,
    privacyConsent: v.privacyConsent === true,
    website: v.website,
    ...attribution,
  };
}

export class CrmError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${CRM_API_URL}${path}`, { ...init, headers: { ...headers, ...(init.headers as object) } });
  let data: { ok?: boolean; error?: string } & Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    // respuesta vacía o no JSON
  }
  if (!res.ok || data.ok === false) throw new CrmError(data.error || `Error ${res.status}`, res.status);
  return data as T;
}

/* ------------------------------ Público ------------------------------ */

export async function submitToCrm(v: FormValues, attribution: Attribution, submissionId: string): Promise<void> {
  await call("/landing/inversion-merida/submit", {
    method: "POST",
    body: JSON.stringify(buildSubmissionPayload(v, attribution, submissionId)),
  });
}

/* ------------------------------ Panel ------------------------------ */

const BASE = "/portal/landing/inversion-merida/submissions";

export async function fetchSubmissions(token: string) {
  return call<{ submissions: Submission[]; full_view: boolean }>(BASE, { method: "GET" }, token);
}

export interface CrmNote {
  text: string;
  author: string;
  created_at: string | number;
}

export async function fetchHistorial(token: string, id: string) {
  return call<{ notes: CrmNote[] }>(`${BASE}/${encodeURIComponent(id)}/historial`, { method: "GET" }, token);
}

export async function addCrmNote(token: string, id: string, text: string) {
  return call(`${BASE}/${encodeURIComponent(id)}/nota`, { method: "POST", body: JSON.stringify({ text }) }, token);
}

export async function relinkSubmission(token: string, id: string) {
  return call(`${BASE}/${encodeURIComponent(id)}/vincular`, { method: "POST" }, token);
}
