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

/**
 * Fila del panel: una respuesta al cuestionario (campaign_submissions en el CRM)
 * + su estado y asesor ACTUALES en el CRM TRES65 (calculados por el backend).
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

  /** Estado en el CRM (misma clasificación que el Directorio). */
  status: string;
  owner_uid: string | null;
  owner_name: string | null;
  crm_status: "linked" | "pending_review" | "error" | "processing" | null;
  crm_kind: "chatwoot" | "client" | "manual" | null;
  crm_action: "created" | "enriched" | null;
  conv_id: string | null;
  client_token: string | null;
  crm_url?: string;
}
