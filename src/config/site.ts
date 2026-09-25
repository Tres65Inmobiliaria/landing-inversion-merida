/**
 * Datos de contacto y valores por defecto de la campaña.
 * Fuente: "Carta de invitación — Diversifica tu patrimonio en Mérida" y
 * "Cuestionario_Filtro_Inversionistas_Merida.docx".
 */
export const SITE = {
  brand: "TRES65 Inmobiliaria",
  website: "https://www.tres65inmobiliaria.com",
  city: "Mérida, Yucatán",
  yearsOfExperience: 9,
  privacyEmail: "contacto@tres65inmobiliaria.com",
} as const;

export const AGENT = {
  name: "Damara Traconis",
  firstName: "Damara",
  role: "Asesora inmobiliaria",
  phoneDisplay: "999 278 6153",
  /** Número para wa.me: código de país + 10 dígitos, sin signos. */
  whatsapp: "529992786153",
  email: "damara@tres65inmobiliaria.com",
} as const;

/** Valores que se guardan en cada prospecto de esta landing. */
export const CAMPAIGN_DEFAULTS = {
  source: "landing",
  campaign: "medicos_merida",
  assignedAgent: AGENT.name,
  status: "nuevo",
} as const;

/** Nombre de la colección en Firestore (proyecto Firebase exclusivo de esta landing). */
export const PROSPECTS_COLLECTION = "prospects";
export const ADMINS_COLLECTION = "admins";

export function whatsappUrl(phoneDigits: string, message?: string): string {
  const base = `https://wa.me/${phoneDigits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Mensaje precargado tras completar el cuestionario. */
export function damaraWhatsappMessage(name: string): string {
  return `Hola Damara, soy ${name}. Acabo de completar el cuestionario de inversión de TRES65 y me gustaría recibir más información.`;
}

/** Mensaje precargado desde el footer (sin cuestionario). */
export const GENERIC_WHATSAPP_MESSAGE =
  "Hola Damara, me gustaría recibir más información sobre las oportunidades inmobiliarias en Mérida.";
