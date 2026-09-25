import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type FieldValue,
} from "firebase/firestore";
import { ADMINS_COLLECTION, CAMPAIGN_DEFAULTS, PROSPECTS_COLLECTION } from "@/config/site";
import { getDb } from "./firebase";
import type { Attribution, FormValues, Prospect } from "./types";
import { normalizeEmail, normalizePhone } from "./validation";

export const SCHEMA_VERSION = 1;

const clean = (s: string) => s.trim().replace(/\s+/g, " ");

/**
 * Convierte el formulario en el documento que se guarda. Limpia respuestas
 * condicionales que ya no aplican (p. ej. si cambió "Sí" por "No").
 * `now` se inyecta para poder probarlo sin Firestore.
 */
export function buildProspectPayload<T>(
  id: string,
  v: FormValues,
  attribution: Attribution,
  now: T,
) {
  const invested = v.previousRealEstateInvestment === "si";
  const types = invested ? v.previousInvestmentTypes : [];
  return {
    id,
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,

    fullName: clean(v.fullName),
    email: normalizeEmail(v.email),
    phone: normalizePhone(v.phone) ?? clean(v.phone),

    diversificationInterest: v.diversificationInterest,
    previousRealEstateInvestment: v.previousRealEstateInvestment,
    previousInvestmentTypes: types,
    previousInvestmentTypeOther: types.includes("otro") ? clean(v.previousInvestmentTypeOther) : "",
    previousInvestmentLocation: invested ? clean(v.previousInvestmentLocation) : "",

    investmentBudget: v.investmentBudget,
    purchaseMethod: v.purchaseMethod,
    financingInterest: v.financingInterest,

    investmentTimeline: v.investmentTimeline,
    decisionMakers: v.decisionMakers,
    decisionMakersOther: v.decisionMakers.includes("otro") ? clean(v.decisionMakersOther) : "",

    investmentPurposes: v.investmentPurposes,
    investmentPurposeOther: v.investmentPurposes.includes("otro") ? clean(v.investmentPurposeOther) : "",
    personalUse: v.personalUse,

    meridaExperience: v.meridaExperience,
    meridaMarketKnowledge: v.meridaMarketKnowledge,
    preferredArea: clean(v.preferredArea),
    openToRecommendations: v.openToRecommendations,

    eventInterest: v.eventInterest,

    privacyConsent: v.privacyConsent === true,
    privacyConsentAt: now,

    ...CAMPAIGN_DEFAULTS,

    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_term: attribution.utm_term,
    referrer: attribution.referrer,
    landingUrl: attribution.landingUrl,
  };
}

/**
 * Guarda el cuestionario. El visitante solo puede CREAR (ver firestore.rules);
 * no puede leer ni este ni ningún otro documento.
 */
export async function submitProspect(v: FormValues, attribution: Attribution): Promise<string> {
  const db = getDb();
  const ref = doc(collection(db, PROSPECTS_COLLECTION));
  const payload = buildProspectPayload<FieldValue>(ref.id, v, attribution, serverTimestamp());
  await setDoc(ref, payload);
  return ref.id;
}

/* ------------------------------ Panel admin ------------------------------ */

export async function isAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(getDb(), ADMINS_COLLECTION, uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export function subscribeProspects(
  onData: (rows: Prospect[]) => void,
  onError: (err: Error) => void,
): () => void {
  const q = query(collection(getDb(), PROSPECTS_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ ...(d.data() as Prospect), id: d.id }))),
    onError,
  );
}

export async function updateProspectStatus(id: string, status: string, by: string): Promise<void> {
  await updateDoc(doc(getDb(), PROSPECTS_COLLECTION, id), {
    status,
    statusUpdatedAt: serverTimestamp(),
    statusUpdatedBy: by,
    updatedAt: serverTimestamp(),
  });
}

export async function addInternalNote(id: string, text: string, author: string): Promise<void> {
  await updateDoc(doc(getDb(), PROSPECTS_COLLECTION, id), {
    internalNotes: arrayUnion({ text: text.trim(), author, createdAt: Timestamp.now() }),
    updatedAt: serverTimestamp(),
  });
}
