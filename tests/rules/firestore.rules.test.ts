/**
 * Pruebas de las reglas de Firestore contra el emulador (usuario anónimo,
 * usuario autenticado sin permisos y admin). Correr con `npm run test:rules`.
 */
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { buildProspectPayload } from "@/lib/prospects";
import { EMPTY_ATTRIBUTION } from "@/lib/attribution";
import { EMPTY_FORM, type FormValues } from "@/lib/types";

const PROJECT_ID = "demo-tres65-landing";
let env: RulesTestEnvironment;

const answers: FormValues = {
  ...EMPTY_FORM,
  fullName: "Ana López Pérez",
  email: "ana@example.com",
  phone: "999 123 4567",
  diversificationInterest: "si",
  previousRealEstateInvestment: "si",
  previousInvestmentTypes: ["departamento"],
  previousInvestmentLocation: "Mérida norte",
  investmentBudget: "3_5m",
  purchaseMethod: "liquidez",
  financingInterest: "tal_vez",
  investmentTimeline: "0_3m",
  decisionMakers: ["pareja"],
  investmentPurposes: ["renta", "retiro"],
  personalUse: "tal_vez",
  meridaExperience: "vivo_aqui",
  meridaMarketKnowledge: "algo",
  openToRecommendations: true,
  eventInterest: "si",
  privacyConsent: true,
};

function payload(id: string, overrides: Record<string, unknown> = {}) {
  return {
    ...buildProspectPayload(id, answers, { ...EMPTY_ATTRIBUTION, utm_source: "whatsapp" }, serverTimestamp()),
    ...overrides,
  };
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8181 },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "admins/admin-uid"), { email: "admin@tres65.test" });
    await setDoc(doc(db, "prospects/existing"), {
      ...buildProspectPayload("existing", answers, EMPTY_ATTRIBUTION, Timestamp.now()),
    });
  });
});

describe("visitante público (sin sesión)", () => {
  it("puede enviar un cuestionario válido", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertSucceeds(setDoc(doc(db, "prospects/nuevo1"), payload("nuevo1")));
  });

  it("no puede leer un prospecto", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "prospects/existing")));
  });

  it("no puede listar prospectos", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDocs(collection(db, "prospects")));
  });

  it("no puede editar un prospecto", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(updateDoc(doc(db, "prospects/existing"), { status: "cerrado" }));
  });

  it("no puede sobrescribir un prospecto existente", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "prospects/existing"), payload("existing")));
  });

  it("no puede borrar un prospecto", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(deleteDoc(doc(db, "prospects/existing")));
  });

  it("no puede leer la lista de admins", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "admins/admin-uid")));
    await assertFails(getDocs(collection(db, "admins")));
  });

  it("no puede crearse como admin", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "admins/intruso"), { email: "x@x.com" }));
  });

  it("rechaza envío sin consentimiento", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "prospects/p2"), payload("p2", { privacyConsent: false })));
  });

  it("rechaza que el público se asigne otro estado", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "prospects/p3"), payload("p3", { status: "cerrado" })));
  });

  it("rechaza campos extra (p. ej. honeypot o notas internas)", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "prospects/p4"), payload("p4", { website: "spam.com" })));
    await assertFails(setDoc(doc(db, "prospects/p5"), payload("p5", { internalNotes: [] })));
  });

  it("rechaza campos faltantes", async () => {
    const db = env.unauthenticatedContext().firestore();
    const partial: Record<string, unknown> = payload("p6");
    delete partial.eventInterest;
    await assertFails(setDoc(doc(db, "prospects/p6"), partial));
  });

  it("rechaza email o teléfono inválidos", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "prospects/p7"), payload("p7", { email: "no-es-correo" })));
    await assertFails(setDoc(doc(db, "prospects/p8"), payload("p8", { phone: "12345" })));
  });

  it("rechaza fechas falsificadas por el cliente", async () => {
    const db = env.unauthenticatedContext().firestore();
    const old = Timestamp.fromDate(new Date("2020-01-01"));
    await assertFails(setDoc(doc(db, "prospects/p9"), payload("p9", { createdAt: old })));
  });

  it("rechaza que el id del documento no coincida", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "prospects/p10"), payload("otro-id")));
  });

  it("rechaza textos excesivamente largos", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "prospects/p11"), payload("p11", { preferredArea: "x".repeat(2000) })));
  });
});

describe("usuario autenticado que NO es admin", () => {
  it("no puede leer ni listar prospectos", async () => {
    const db = env.authenticatedContext("random-uid", { email: "alguien@gmail.com" }).firestore();
    await assertFails(getDoc(doc(db, "prospects/existing")));
    await assertFails(getDocs(collection(db, "prospects")));
  });

  it("no puede editar prospectos", async () => {
    const db = env.authenticatedContext("random-uid").firestore();
    await assertFails(
      updateDoc(doc(db, "prospects/existing"), { status: "contactado", updatedAt: serverTimestamp() }),
    );
  });

  it("no puede darse de alta como admin", async () => {
    const db = env.authenticatedContext("random-uid").firestore();
    await assertFails(setDoc(doc(db, "admins/random-uid"), { email: "alguien@gmail.com" }));
  });
});

describe("admin", () => {
  const adminDb = () => env.authenticatedContext("admin-uid", { email: "admin@tres65.test" }).firestore();

  it("puede leer su propio registro de admin", async () => {
    await assertSucceeds(getDoc(doc(adminDb(), "admins/admin-uid")));
  });

  it("puede listar y leer prospectos", async () => {
    await assertSucceeds(getDocs(collection(adminDb(), "prospects")));
    await assertSucceeds(getDoc(doc(adminDb(), "prospects/existing")));
  });

  it("puede cambiar el estado", async () => {
    await assertSucceeds(
      updateDoc(doc(adminDb(), "prospects/existing"), {
        status: "contactado",
        statusUpdatedAt: serverTimestamp(),
        statusUpdatedBy: "admin@tres65.test",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("puede agregar notas internas", async () => {
    await assertSucceeds(
      updateDoc(doc(adminDb(), "prospects/existing"), {
        internalNotes: arrayUnion({ text: "Le llamé", author: "admin", createdAt: Timestamp.now() }),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("no puede poner un estado inexistente", async () => {
    await assertFails(
      updateDoc(doc(adminDb(), "prospects/existing"), { status: "vip", updatedAt: serverTimestamp() }),
    );
  });

  it("no puede alterar las respuestas del prospecto", async () => {
    await assertFails(
      updateDoc(doc(adminDb(), "prospects/existing"), { email: "otro@x.com", updatedAt: serverTimestamp() }),
    );
  });

  it("no puede borrar prospectos desde la web", async () => {
    await assertFails(deleteDoc(doc(adminDb(), "prospects/existing")));
  });

  it("no puede modificar la lista de admins", async () => {
    await assertFails(setDoc(doc(adminDb(), "admins/nuevo-admin"), { email: "x@x.com" }));
  });
});
