import type { Attribution } from "./types";

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const STORAGE_KEY = "tres65_landing_attribution";
const MAX_LEN = 200;

export const EMPTY_ATTRIBUTION: Attribution = {
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
  referrer: "",
  landingUrl: "",
};

function clip(value: string | null | undefined, max = MAX_LEN): string {
  return (value ?? "").trim().slice(0, max);
}

/** Lee UTMs de un query string. Función pura (testeable). */
export function parseAttribution(search: string, referrer: string, landingUrl: string): Attribution {
  const params = new URLSearchParams(search);
  const out: Attribution = { ...EMPTY_ATTRIBUTION };
  for (const key of UTM_KEYS) out[key] = clip(params.get(key));
  out.referrer = clip(referrer, 500);
  out.landingUrl = clip(landingUrl, 500);
  return out;
}

function hasUtm(a: Attribution): boolean {
  return UTM_KEYS.some((k) => a[k]);
}

/**
 * Captura la atribución al entrar a la página. Si la visita actual no trae
 * UTMs pero una visita anterior en la misma sesión sí, conserva la anterior
 * (primer toque de la sesión). sessionStorage es solo un apoyo: si falla,
 * se usa lo que venga en la URL.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return { ...EMPTY_ATTRIBUTION };
  const current = parseAttribution(
    window.location.search,
    document.referrer,
    window.location.origin + window.location.pathname,
  );
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const prev = { ...EMPTY_ATTRIBUTION, ...(JSON.parse(stored) as Partial<Attribution>) };
      if (hasUtm(prev) && !hasUtm(current)) return prev;
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Almacenamiento no disponible (modo privado, etc.): seguimos sin él.
  }
  return current;
}
