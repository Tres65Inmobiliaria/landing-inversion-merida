import { DECISION_ALONE, OPTIONS, type StepId } from "@/config/questionnaire";
import type { FormValues } from "./types";

export type FieldErrors = Partial<Record<keyof FormValues, string>>;

export const LIMITS = {
  name: 120,
  email: 254,
  shortText: 160,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  return email.length <= LIMITS.email && EMAIL_RE.test(email);
}

/**
 * Normaliza un teléfono a formato internacional `+<dígitos>`.
 * - 10 dígitos (formato MX local)            -> +52XXXXXXXXXX
 * - 52 + 10 dígitos / 521 + 10 dígitos        -> +52XXXXXXXXXX
 * - Con "+" y 11–15 dígitos (otro país)       -> se respeta
 * Devuelve null si no parece un número válido.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  const hasPlus = trimmed.startsWith("+") || trimmed.startsWith("00");
  const intl = trimmed.startsWith("00") ? digits.slice(2) : digits;

  if (!hasPlus && digits.length === 10) {
    return /^[2-9]/.test(digits) ? `+52${digits}` : null;
  }
  if (intl.startsWith("521") && intl.length === 13) return `+52${intl.slice(3)}`;
  if (intl.startsWith("52") && intl.length === 12) {
    return /^[2-9]/.test(intl.slice(2)) ? `+${intl}` : null;
  }
  if (hasPlus && intl.length >= 11 && intl.length <= 15 && !intl.startsWith("0")) {
    return `+${intl}`;
  }
  return null;
}

/**
 * Teléfono legible. Acepta el formato del CRM ("5219992786153"), E.164
 * ("+529992786153") o 10 dígitos. México -> "999 278 6153"; otros -> "+<dígitos>".
 */
export function formatPhone(phone: string): string {
  const d = (phone || "").replace(/\D/g, "");
  const m = /^(?:521|52)?(\d{3})(\d{3})(\d{4})$/.exec(d);
  if (m && (d.length === 10 || d.startsWith("52"))) return `${m[1]} ${m[2]} ${m[3]}`;
  return d ? `+${d}` : "";
}

/** Dígitos para wa.me: México siempre como 52 + 10 dígitos. */
export function whatsappDigits(phone: string): string {
  const d = (phone || "").replace(/\D/g, "");
  if (d.length === 13 && d.startsWith("521")) return `52${d.slice(3)}`;
  if (d.length === 10) return `52${d}`;
  return d;
}

function isOption(key: keyof typeof OPTIONS, value: string): boolean {
  return OPTIONS[key].some((o) => o.value === value);
}

function areOptions(key: keyof typeof OPTIONS, values: string[]): boolean {
  return values.length > 0 && values.every((v) => isOption(key, v));
}

const REQUIRED = "Elige una opción para continuar.";
const REQUIRED_MULTI = "Elige al menos una opción.";

export function validateStep(step: StepId, v: FormValues): FieldErrors {
  const e: FieldErrors = {};
  switch (step) {
    case "contacto": {
      const name = v.fullName.trim();
      if (!name) e.fullName = "Escribe tu nombre completo.";
      else if (name.length > LIMITS.name) e.fullName = "El nombre es demasiado largo.";
      else if (name.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length < 2)
        e.fullName = "Escribe tu nombre y al menos un apellido.";

      if (!v.email.trim()) e.email = "Escribe tu correo electrónico.";
      else if (!isValidEmail(v.email)) e.email = "Revisa tu correo; parece incompleto (ej. nombre@correo.com).";

      if (!v.phone.trim()) e.phone = "Escribe tu teléfono o WhatsApp.";
      else if (!normalizePhone(v.phone))
        e.phone = "Escribe un número de 10 dígitos, o con lada internacional (ej. +1 305 555 1234).";
      break;
    }
    case "experiencia": {
      if (!isOption("diversificationInterest", v.diversificationInterest)) e.diversificationInterest = REQUIRED;
      if (!isOption("previousRealEstateInvestment", v.previousRealEstateInvestment))
        e.previousRealEstateInvestment = REQUIRED;
      if (v.previousRealEstateInvestment === "si") {
        if (!areOptions("previousInvestmentTypes", v.previousInvestmentTypes))
          e.previousInvestmentTypes = REQUIRED_MULTI;
        if (v.previousInvestmentTypes.includes("otro") && !v.previousInvestmentTypeOther.trim())
          e.previousInvestmentTypeOther = "Cuéntanos qué tipo de inversión.";
        if (!v.previousInvestmentLocation.trim())
          e.previousInvestmentLocation = "Escribe la ciudad o zona (aunque sea aproximada).";
      }
      break;
    }
    case "inversion": {
      if (!isOption("investmentBudget", v.investmentBudget)) e.investmentBudget = REQUIRED;
      if (!isOption("purchaseMethod", v.purchaseMethod)) e.purchaseMethod = REQUIRED;
      if (!isOption("financingInterest", v.financingInterest)) e.financingInterest = REQUIRED;
      break;
    }
    case "tiempos": {
      if (!isOption("investmentTimeline", v.investmentTimeline)) e.investmentTimeline = REQUIRED;
      if (!areOptions("decisionMakers", v.decisionMakers)) e.decisionMakers = REQUIRED_MULTI;
      else if (v.decisionMakers.includes(DECISION_ALONE) && v.decisionMakers.length > 1)
        e.decisionMakers = "Si decides solo/a, no elijas otras opciones.";
      if (v.decisionMakers.includes("otro") && !v.decisionMakersOther.trim())
        e.decisionMakersOther = "Cuéntanos con quién.";
      break;
    }
    case "objetivos": {
      if (!areOptions("investmentPurposes", v.investmentPurposes)) e.investmentPurposes = REQUIRED_MULTI;
      if (v.investmentPurposes.includes("otro") && !v.investmentPurposeOther.trim())
        e.investmentPurposeOther = "Cuéntanos cuál.";
      if (!isOption("personalUse", v.personalUse)) e.personalUse = REQUIRED;
      break;
    }
    case "merida": {
      if (!isOption("meridaExperience", v.meridaExperience)) e.meridaExperience = REQUIRED;
      if (!isOption("meridaMarketKnowledge", v.meridaMarketKnowledge)) e.meridaMarketKnowledge = REQUIRED;
      if (!v.preferredArea.trim() && !v.openToRecommendations)
        e.preferredArea = "Escribe una zona o marca que estás abierto/a a recomendaciones.";
      break;
    }
    case "presentacion": {
      if (!isOption("eventInterest", v.eventInterest)) e.eventInterest = REQUIRED;
      if (!v.privacyConsent) e.privacyConsent = "Necesitamos tu autorización para poder contactarte.";
      break;
    }
  }

  // Límite de longitud para cualquier texto libre del paso.
  const freeText: (keyof FormValues)[] = [
    "previousInvestmentTypeOther",
    "previousInvestmentLocation",
    "decisionMakersOther",
    "investmentPurposeOther",
    "preferredArea",
  ];
  for (const k of freeText) {
    const val = v[k];
    if (typeof val === "string" && val.trim().length > LIMITS.shortText && !e[k]) {
      e[k] = `Máximo ${LIMITS.shortText} caracteres.`;
    }
  }
  return e;
}

export function validateAll(v: FormValues, steps: readonly { id: StepId }[]): FieldErrors {
  return steps.reduce<FieldErrors>((acc, s) => ({ ...acc, ...validateStep(s.id, v) }), {});
}

/** Detecta si el honeypot fue llenado (bot). */
export function isBot(v: Pick<FormValues, "website">): boolean {
  return v.website.trim().length > 0;
}
