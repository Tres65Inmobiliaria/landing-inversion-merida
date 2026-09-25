import { describe, expect, it } from "vitest";
import { STEPS } from "@/config/questionnaire";
import { parseAttribution, EMPTY_ATTRIBUTION } from "./attribution";
import { csvCell, submissionsToCsv } from "./csv";
import { buildSubmissionPayload } from "./crm";
import { EMPTY_FORM, type FormValues, type Submission } from "./types";
import { formatPhone, isBot, isValidEmail, normalizePhone, validateAll, validateStep } from "./validation";

const complete: FormValues = {
  ...EMPTY_FORM,
  fullName: "  Ana   López Pérez ",
  email: " Ana@Example.COM ",
  phone: "(999) 123-4567",
  diversificationInterest: "si",
  previousRealEstateInvestment: "no",
  previousInvestmentTypes: ["casa"],
  previousInvestmentLocation: "CDMX",
  investmentBudget: "3_5m",
  purchaseMethod: "combinacion",
  financingInterest: "si",
  investmentTimeline: "3_6m",
  decisionMakers: ["pareja", "familia"],
  investmentPurposes: ["retiro"],
  personalUse: "inversion",
  meridaExperience: "conozco",
  meridaMarketKnowledge: "poco",
  preferredArea: "",
  openToRecommendations: true,
  eventInterest: "tal_vez",
  privacyConsent: true,
};

describe("teléfono", () => {
  it.each([
    ["9991234567", "+529991234567"],
    ["999 123 4567", "+529991234567"],
    ["+52 999 123 4567", "+529991234567"],
    ["+52 1 999 123 4567", "+529991234567"],
    ["52 999 123 4567", "+529991234567"],
    ["+1 (305) 555-1234", "+13055551234"],
    ["0052 999 123 4567", "+529991234567"],
  ])("%s -> %s", (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it.each(["12345", "0991234567", "abc", "+52 999 12", "1234567890123456789"])("rechaza %s", (raw) => {
    expect(normalizePhone(raw)).toBeNull();
  });

  it("formatea números mexicanos", () => {
    expect(formatPhone("+529992786153")).toBe("999 278 6153");
    expect(formatPhone("+13055551234")).toBe("+13055551234");
  });
});

describe("correo", () => {
  it.each(["ana@example.com", "dr.juan+tres65@hospital.org.mx", "  A@B.CO "])("acepta %s", (e) => {
    expect(isValidEmail(e)).toBe(true);
  });
  it.each(["ana", "ana@", "ana@example", "ana @example.com", "@example.com", "ana@example.c"])(
    "rechaza %s",
    (e) => expect(isValidEmail(e)).toBe(false),
  );
});

describe("validación por paso", () => {
  it("un formulario completo no tiene errores", () => {
    expect(validateAll(complete, STEPS)).toEqual({});
  });

  it("pide nombre y apellido", () => {
    expect(validateStep("contacto", { ...complete, fullName: "Ana" }).fullName).toBeTruthy();
  });

  it("si ya invirtió, exige tipo y zona (lógica condicional)", () => {
    const v = { ...complete, previousRealEstateInvestment: "si", previousInvestmentTypes: [], previousInvestmentLocation: "" };
    const e = validateStep("experiencia", v);
    expect(e.previousInvestmentTypes).toBeTruthy();
    expect(e.previousInvestmentLocation).toBeTruthy();
  });

  it("si nunca invirtió, no exige tipo ni zona", () => {
    const v = { ...complete, previousRealEstateInvestment: "no", previousInvestmentTypes: [], previousInvestmentLocation: "" };
    expect(validateStep("experiencia", v)).toEqual({});
  });

  it("'Otro' exige especificar", () => {
    expect(validateStep("objetivos", { ...complete, investmentPurposes: ["otro"] }).investmentPurposeOther).toBeTruthy();
  });

  it("'Yo solo/a' es excluyente", () => {
    expect(validateStep("tiempos", { ...complete, decisionMakers: ["solo", "pareja"] }).decisionMakers).toBeTruthy();
  });

  it("zona preferida o 'abierto a recomendaciones'", () => {
    const e = validateStep("merida", { ...complete, preferredArea: "", openToRecommendations: false });
    expect(e.preferredArea).toBeTruthy();
    expect(validateStep("merida", { ...complete, preferredArea: "Temozón", openToRecommendations: false })).toEqual({});
  });

  it("el consentimiento es obligatorio", () => {
    expect(validateStep("presentacion", { ...complete, privacyConsent: false }).privacyConsent).toBeTruthy();
  });

  it("rechaza opciones que no existen", () => {
    expect(validateStep("inversion", { ...complete, investmentBudget: "1000m" }).investmentBudget).toBeTruthy();
  });

  it("detecta el honeypot", () => {
    expect(isBot({ website: "" })).toBe(false);
    expect(isBot({ website: "http://spam" })).toBe(true);
  });
});

describe("payload que se envía al CRM", () => {
  const p = buildSubmissionPayload({ ...complete, website: "" }, { ...EMPTY_ATTRIBUTION, utm_source: "qr" }, "sid-123");

  it("normaliza contacto", () => {
    expect(p.fullName).toBe("Ana López Pérez");
    expect(p.email).toBe("ana@example.com");
  });

  it("limpia respuestas condicionales que ya no aplican", () => {
    expect(p.previousInvestmentTypes).toEqual([]);
    expect(p.previousInvestmentLocation).toBe("");
  });

  it("incluye id de envío, versión y atribución", () => {
    expect(p).toMatchObject({ submissionId: "sid-123", utm_source: "qr", privacyConsent: true });
    expect(p.landingVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("NUNCA manda asignación, estado, labels ni campaña (los decide el servidor)", () => {
    for (const k of ["assignee_uid", "agent_uid", "assignedAgent", "status", "labels", "campaign", "source", "createdAt", "privacyConsentAt"]) {
      expect(p).not.toHaveProperty(k);
    }
  });
});

describe("teléfono formato CRM", () => {
  it("muestra 521… como número local y arma wa.me", async () => {
    const { formatPhone, whatsappDigits } = await import("./validation");
    expect(formatPhone("5219992786153")).toBe("999 278 6153");
    expect(whatsappDigits("5219992786153")).toBe("529992786153");
    expect(formatPhone("13055551234")).toBe("+13055551234");
  });
});

describe("atribución", () => {
  it("lee UTMs y referrer", () => {
    const a = parseAttribution(
      "?utm_source=whatsapp&utm_medium=mensaje&utm_campaign=medicos&utm_content=carta&utm_term=x&otro=1",
      "https://l.facebook.com/",
      "https://ejemplo.com/",
    );
    expect(a).toEqual({
      utm_source: "whatsapp",
      utm_medium: "mensaje",
      utm_campaign: "medicos",
      utm_content: "carta",
      utm_term: "x",
      referrer: "https://l.facebook.com/",
      landingUrl: "https://ejemplo.com/",
    });
  });

  it("recorta valores gigantes", () => {
    expect(parseAttribution(`?utm_source=${"a".repeat(1000)}`, "", "").utm_source).toHaveLength(200);
  });
});

describe("CSV", () => {
  it("escapa comillas, comas y saltos de línea", () => {
    expect(csvCell('Hola, "doctor"')).toBe('"Hola, ""doctor"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });

  it("neutraliza fórmulas (CSV injection)", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("+52999")).toBe("'+52999");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("incluye encabezados legibles, estado del CRM y respuestas con etiquetas", () => {
    const row = {
      ...buildSubmissionPayload(complete, EMPTY_ATTRIBUTION, "sid"),
      phone: "5219991234567",
      submittedAt: "2026-09-25T18:00:00Z",
      privacyConsentAt: "2026-09-25T18:00:00Z",
      status: "Listo para asesor",
      owner_name: "Damara Traconis Corres",
      crm_kind: "chatwoot",
      crm_action: "created",
    } as unknown as Submission;
    const csv = submissionsToCsv([row]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Presupuesto");
    expect(csv).toContain("$3 – 5 M MXN");
    expect(csv).toContain("Con mi pareja, Con mi familia");
    expect(csv).toContain("Listo para asesor");
    expect(csv).toContain("Damara Traconis Corres");
    expect(csv).toContain("999 123 4567");
  });
});
