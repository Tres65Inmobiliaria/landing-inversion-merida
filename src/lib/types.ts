/** Estado del formulario en el navegador. */
export interface FormValues {
  fullName: string;
  email: string;
  phone: string;

  diversificationInterest: string;
  previousRealEstateInvestment: string;
  previousInvestmentTypes: string[];
  previousInvestmentTypeOther: string;
  previousInvestmentLocation: string;

  investmentBudget: string;
  purchaseMethod: string;
  financingInterest: string;

  investmentTimeline: string;
  decisionMakers: string[];
  decisionMakersOther: string;

  investmentPurposes: string[];
  investmentPurposeOther: string;
  personalUse: string;

  meridaExperience: string;
  meridaMarketKnowledge: string;
  preferredArea: string;
  openToRecommendations: boolean;

  eventInterest: string;
  privacyConsent: boolean;

  /** Honeypot: invisible para personas. Si trae algo, es un bot. */
  website: string;
}

export const EMPTY_FORM: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  diversificationInterest: "",
  previousRealEstateInvestment: "",
  previousInvestmentTypes: [],
  previousInvestmentTypeOther: "",
  previousInvestmentLocation: "",
  investmentBudget: "",
  purchaseMethod: "",
  financingInterest: "",
  investmentTimeline: "",
  decisionMakers: [],
  decisionMakersOther: "",
  investmentPurposes: [],
  investmentPurposeOther: "",
  personalUse: "",
  meridaExperience: "",
  meridaMarketKnowledge: "",
  preferredArea: "",
  openToRecommendations: false,
  eventInterest: "",
  privacyConsent: false,
  website: "",
};

export interface Attribution {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  referrer: string;
  landingUrl: string;
}

export type SubmissionStatus = "nuevo" | "revisado" | "contactado" | "descartado" | "agregado_directorio";

/** Resultado de "Agregar al Directorio" (lo escribe el backend). */
export interface DirectoryLink {
  /** created = la landing creó el contacto; existing = ya existía y solo se vinculó. */
  state: "created" | "existing";
  kind: "manual" | "client" | "chatwoot";
  /** false solo si existe en Chatwoot pero sin etapa del Directorio. */
  in_directorio: boolean;
  manual_id?: string;
  client_token?: string;
  conv_id?: string | null;
  contact_id?: number;
  matched_by?: "phone" | "email";
  owner_uid?: string | null;
  owner_name?: string | null;
  chatwoot_url?: string;
  converted_at?: string;
  converted_by?: string;
  linked_at?: string;
  linked_by?: string;
}

/**
 * Fila del panel: una respuesta al cuestionario (campaign_submissions en el
 * Firestore de TRES65), con su estado propio y su vínculo con el Directorio.
 */
export interface Submission extends Attribution {
  submissionId: string;
  campaign: string;
  source: string;
  landingVersion: string;
  submittedAt: string;

  fullName: string;
  email: string;
  /** Formato canónico del CRM: dígitos, México como 521XXXXXXXXXX. */
  phone: string;
  phone_key: string;

  diversificationInterest: string;
  previousRealEstateInvestment: string;
  previousInvestmentTypes: string[];
  previousInvestmentTypeOther: string;
  previousInvestmentLocation: string;

  investmentBudget: string;
  purchaseMethod: string;
  financingInterest: string;

  investmentTimeline: string;
  decisionMakers: string[];
  decisionMakersOther: string;

  investmentPurposes: string[];
  investmentPurposeOther: string;
  personalUse: string;

  meridaExperience: string;
  meridaMarketKnowledge: string;
  preferredArea: string;
  openToRecommendations: boolean;

  eventInterest: string;

  privacyConsent: boolean;
  privacyConsentAt: string;

  /** Estado PROPIO de la respuesta (no es el estado del CRM). */
  status: SubmissionStatus;
  status_updated_at?: string;
  status_updated_by?: string;

  /** Vínculo con el Directorio de TRES65; null hasta "Agregar al Directorio". */
  directory: DirectoryLink | null;
}
