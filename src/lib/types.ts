import type { Timestamp } from "firebase/firestore";

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

export interface InternalNote {
  text: string;
  author: string;
  createdAt: Timestamp;
}

/**
 * Documento en Firestore: `prospects/{id}`.
 * Estructura plana y con códigos estables para poder conectarlo más adelante
 * al Directorio/CRM de TRES65 sin transformaciones complicadas.
 */
export interface Prospect extends Attribution {
  id: string;
  schemaVersion: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;

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
  privacyConsentAt: Timestamp | null;

  source: string;
  campaign: string;
  assignedAgent: string;
  status: string;

  internalNotes?: InternalNote[];
  statusUpdatedAt?: Timestamp | null;
  statusUpdatedBy?: string;
}
