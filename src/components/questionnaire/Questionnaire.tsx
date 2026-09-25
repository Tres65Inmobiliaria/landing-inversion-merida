"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Lock } from "lucide-react";
import { btn } from "@/components/ui";
import { DECISION_ALONE, OPTIONS, STEPS } from "@/config/questionnaire";
import { AGENT, GENERIC_WHATSAPP_MESSAGE, whatsappUrl } from "@/config/site";
import { captureAttribution, EMPTY_ATTRIBUTION } from "@/lib/attribution";
import { CrmError, newSubmissionId, submitToCrm } from "@/lib/crm";
import { EMPTY_FORM, type Attribution, type FormValues } from "@/lib/types";
import { isBot, LIMITS, validateStep, type FieldErrors } from "@/lib/validation";
import { Checkbox, ChoiceGroup, MultiChoice, TextField } from "./fields";
import { ThankYou } from "./ThankYou";

type Status = "idle" | "submitting" | "error" | "done";

const noopSubscribe = () => () => {};

/** true solo en el navegador ya hidratado (false durante el HTML estático). */
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function Questionnaire() {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorKind, setErrorKind] = useState<"network" | "rate" | "invalid">("network");
  const [done, setDone] = useState<{ name: string; eventInterest: string } | null>(null);
  const attribution = useRef<Attribution>(EMPTY_ATTRIBUTION);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasNavigated = useRef(false);
  // Un id por llenado del formulario: si el envío se reintenta, el CRM no lo duplica.
  const submissionId = useRef<string>("");
  const hydrated = useHydrated();

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  useEffect(() => {
    attribution.current = captureAttribution();
  }, []);

  // Al cambiar de paso, llevar el foco y la vista al inicio de la tarjeta.
  useEffect(() => {
    if (!hasNavigated.current) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [stepIndex, done]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function focusFirstError(errs: FieldErrors) {
    const first = Object.keys(errs)[0];
    if (!first) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(first);
      if (!el) return;
      const target = el.tagName === "FIELDSET" ? el.querySelector<HTMLElement>("input") ?? el : el;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus({ preventScroll: true });
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    const errs = validateStep(step.id, values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      focusFirstError(errs);
      return;
    }
    setErrors({});
    hasNavigated.current = true;

    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }

    setStatus("submitting");
    try {
      // Honeypot: un bot llenó el campo invisible. Fingimos éxito sin guardar.
      if (!submissionId.current) submissionId.current = newSubmissionId();
      if (!isBot(values)) await submitToCrm(values, attribution.current, submissionId.current);
      setDone({ name: values.fullName.trim().replace(/\s+/g, " "), eventInterest: values.eventInterest });
      setStatus("done");
    } catch (err) {
      console.error("No se pudo guardar el cuestionario", err);
      setErrorKind(err instanceof CrmError ? (err.status === 429 ? "rate" : err.status === 400 ? "invalid" : "network") : "network");
      setStatus("error");
    }
  }

  function back() {
    hasNavigated.current = true;
    setErrors({});
    setStepIndex((i) => Math.max(0, i - 1));
  }

  if (status === "done" && done) {
    return (
      <div ref={cardRef} className="scroll-mt-20">
        <ThankYou name={done.name} eventInterest={done.eventInterest} headingRef={headingRef} />
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="scroll-mt-20 rounded-[2rem] border border-borde bg-white p-5 shadow-[0_30px_60px_-40px_rgba(26,79,92,.45)] sm:p-10"
    >
      {/* Progreso */}
      <div>
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-medio">
            Paso {stepIndex + 1} de {STEPS.length}
          </span>
          <span className="text-suave">{progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Progreso del cuestionario"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="mt-3 h-2 overflow-hidden rounded-full bg-menta"
        >
          <div className="h-full rounded-full bg-acento transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} method="post" action="#cuestionario" noValidate className="relative mt-8">
        <h3 ref={headingRef} tabIndex={-1} className="font-serif text-2xl font-semibold text-profundo focus:outline-none sm:text-3xl">
          {step.title}
        </h3>
        <p className="mt-1 text-suave">{step.intro}</p>

        <div className="mt-7 grid gap-7">
          {step.id === "contacto" && (
            <>
              <TextField
                name="fullName"
                label="Nombre completo"
                value={values.fullName}
                onChange={(v) => set("fullName", v)}
                error={errors.fullName}
                autoComplete="name"
                maxLength={LIMITS.name}
                placeholder="Nombre y apellidos"
              />
              <TextField
                name="email"
                type="email"
                inputMode="email"
                label="Correo electrónico"
                hint="Para enviarte información y seguimiento."
                value={values.email}
                onChange={(v) => set("email", v)}
                error={errors.email}
                autoComplete="email"
                maxLength={LIMITS.email}
                placeholder="nombre@correo.com"
              />
              <TextField
                name="phone"
                type="tel"
                inputMode="tel"
                label="Teléfono / WhatsApp"
                hint="10 dígitos. Si no es de México, inclúyelo con lada internacional (+1, +34…)."
                value={values.phone}
                onChange={(v) => set("phone", v)}
                error={errors.phone}
                autoComplete="tel"
                maxLength={20}
                placeholder="999 123 4567"
              />
            </>
          )}

          {step.id === "experiencia" && (
            <>
              <ChoiceGroup
                name="diversificationInterest"
                legend="¿Te interesa diversificar tu portafolio de inversión?"
                options={OPTIONS.diversificationInterest}
                value={values.diversificationInterest}
                onChange={(v) => set("diversificationInterest", v)}
                error={errors.diversificationInterest}
              />
              <ChoiceGroup
                name="previousRealEstateInvestment"
                legend="¿Has invertido en bienes raíces anteriormente?"
                options={OPTIONS.previousRealEstateInvestment}
                value={values.previousRealEstateInvestment}
                onChange={(v) => set("previousRealEstateInvestment", v)}
                error={errors.previousRealEstateInvestment}
              />
              {values.previousRealEstateInvestment === "si" && (
                <div className="grid gap-7 rounded-3xl bg-piedra p-4 sm:p-6">
                  <MultiChoice
                    name="previousInvestmentTypes"
                    legend="¿Qué tipo de inversión?"
                    hint="Puedes elegir varias."
                    options={OPTIONS.previousInvestmentTypes}
                    value={values.previousInvestmentTypes}
                    onChange={(v) => set("previousInvestmentTypes", v)}
                    error={errors.previousInvestmentTypes}
                    columns
                  />
                  {values.previousInvestmentTypes.includes("otro") && (
                    <TextField
                      name="previousInvestmentTypeOther"
                      label="¿Qué otro tipo?"
                      value={values.previousInvestmentTypeOther}
                      onChange={(v) => set("previousInvestmentTypeOther", v)}
                      error={errors.previousInvestmentTypeOther}
                      maxLength={LIMITS.shortText}
                    />
                  )}
                  <TextField
                    name="previousInvestmentLocation"
                    label="¿En qué ciudad o zona?"
                    value={values.previousInvestmentLocation}
                    onChange={(v) => set("previousInvestmentLocation", v)}
                    error={errors.previousInvestmentLocation}
                    maxLength={LIMITS.shortText}
                    placeholder="Ej. Mérida norte, Progreso, CDMX…"
                  />
                </div>
              )}
            </>
          )}

          {step.id === "inversion" && (
            <>
              <ChoiceGroup
                name="investmentBudget"
                legend="¿Tienes un monto o rango definido para esta inversión?"
                options={OPTIONS.investmentBudget}
                value={values.investmentBudget}
                onChange={(v) => set("investmentBudget", v)}
                error={errors.investmentBudget}
                columns
              />
              <ChoiceGroup
                name="purchaseMethod"
                legend="¿Cómo te gustaría realizar la compra?"
                options={OPTIONS.purchaseMethod}
                value={values.purchaseMethod}
                onChange={(v) => set("purchaseMethod", v)}
                error={errors.purchaseMethod}
                columns
              />
              <ChoiceGroup
                name="financingInterest"
                legend="Ya sea que sigas ejerciendo o cuentes con alguna pensión, ¿te interesaría conocer un plan de financiamiento inteligente?"
                options={OPTIONS.financingInterest}
                value={values.financingInterest}
                onChange={(v) => set("financingInterest", v)}
                error={errors.financingInterest}
              />
            </>
          )}

          {step.id === "tiempos" && (
            <>
              <ChoiceGroup
                name="investmentTimeline"
                legend="¿En qué plazo te gustaría concretar una inversión?"
                options={OPTIONS.investmentTimeline}
                value={values.investmentTimeline}
                onChange={(v) => set("investmentTimeline", v)}
                error={errors.investmentTimeline}
              />
              <MultiChoice
                name="decisionMakers"
                legend="¿Esta decisión la tomas solo/a o en conjunto con alguien más?"
                hint="Puedes elegir varias."
                options={OPTIONS.decisionMakers}
                value={values.decisionMakers}
                onChange={(v) => set("decisionMakers", v)}
                error={errors.decisionMakers}
                exclusive={DECISION_ALONE}
                columns
              />
              {values.decisionMakers.includes("otro") && (
                <TextField
                  name="decisionMakersOther"
                  label="¿Con quién más?"
                  value={values.decisionMakersOther}
                  onChange={(v) => set("decisionMakersOther", v)}
                  error={errors.decisionMakersOther}
                  maxLength={LIMITS.shortText}
                />
              )}
            </>
          )}

          {step.id === "objetivos" && (
            <>
              <MultiChoice
                name="investmentPurposes"
                legend="¿Para qué buscas esta propiedad?"
                hint="Elige todas las que apliquen."
                options={OPTIONS.investmentPurposes}
                value={values.investmentPurposes}
                onChange={(v) => set("investmentPurposes", v)}
                error={errors.investmentPurposes}
                columns
              />
              {values.investmentPurposes.includes("otro") && (
                <TextField
                  name="investmentPurposeOther"
                  label="¿Qué otro objetivo?"
                  value={values.investmentPurposeOther}
                  onChange={(v) => set("investmentPurposeOther", v)}
                  error={errors.investmentPurposeOther}
                  maxLength={LIMITS.shortText}
                />
              )}
              <ChoiceGroup
                name="personalUse"
                legend="¿Te gustaría usarla tú en algún momento (por ejemplo, vacacional) o sería 100% inversión?"
                options={OPTIONS.personalUse}
                value={values.personalUse}
                onChange={(v) => set("personalUse", v)}
                error={errors.personalUse}
              />
            </>
          )}

          {step.id === "merida" && (
            <>
              <ChoiceGroup
                name="meridaExperience"
                legend="¿Ya conoces Mérida en persona?"
                options={OPTIONS.meridaExperience}
                value={values.meridaExperience}
                onChange={(v) => set("meridaExperience", v)}
                error={errors.meridaExperience}
              />
              <ChoiceGroup
                name="meridaMarketKnowledge"
                legend="¿Conoces el movimiento y crecimiento que ha tenido Mérida en bienes raíces?"
                options={OPTIONS.meridaMarketKnowledge}
                value={values.meridaMarketKnowledge}
                onChange={(v) => set("meridaMarketKnowledge", v)}
                error={errors.meridaMarketKnowledge}
              />
              <div className="grid gap-3">
                <TextField
                  name="preferredArea"
                  label="¿Tienes alguna zona o colonia en mente?"
                  value={values.preferredArea}
                  onChange={(v) => set("preferredArea", v)}
                  error={errors.preferredArea}
                  maxLength={LIMITS.shortText}
                  placeholder="Ej. Temozón Norte, Centro, Cholul…"
                />
                <Checkbox
                  name="openToRecommendations"
                  checked={values.openToRecommendations}
                  onChange={(v) => set("openToRecommendations", v)}
                >
                  Estoy abierto/a a recomendaciones según mi objetivo.
                </Checkbox>
              </div>
            </>
          )}

          {step.id === "presentacion" && (
            <>
              <ChoiceGroup
                name="eventInterest"
                legend="¿Te interesaría asistir a una presentación breve (1.5 horas) sobre oportunidades de inversión en bienes raíces en Mérida?"
                options={OPTIONS.eventInterest}
                value={values.eventInterest}
                onChange={(v) => set("eventInterest", v)}
                error={errors.eventInterest}
              />
              <div className="rounded-3xl bg-piedra p-4 sm:p-5">
                <Checkbox
                  name="privacyConsent"
                  checked={values.privacyConsent}
                  onChange={(v) => set("privacyConsent", v)}
                  error={errors.privacyConsent}
                >
                  Autorizo a TRES65 Inmobiliaria a utilizar estos datos para contactarme y dar seguimiento a mi
                  solicitud.{" "}
                  <Link
                    href="/aviso-de-privacidad/"
                    target="_blank"
                    className="font-semibold text-medio underline underline-offset-4"
                  >
                    Aviso de Privacidad
                  </Link>
                </Checkbox>
              </div>
            </>
          )}
        </div>

        {/* Honeypot anti-spam: oculto para personas y lectores de pantalla. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">No llenar este campo</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>

        {status === "error" && (
          <div role="alert" className="mt-6 rounded-2xl border border-error/30 bg-error/5 p-4 text-sm text-texto">
            <p className="font-semibold text-error">No pudimos enviar tus respuestas.</p>
            <p className="mt-1">
              {errorKind === "rate"
                ? "Recibimos varios envíos seguidos desde este número o conexión. "
                : errorKind === "invalid"
                  ? "Algún dato no pudo validarse. Revisa tus respuestas. "
                  : "Revisa tu conexión e inténtalo de nuevo. "}
              Si el problema continúa, escríbele directamente a{" "}
              <a
                className="font-semibold text-medio underline"
                href={whatsappUrl(AGENT.whatsapp, GENERIC_WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Damara por WhatsApp
              </a>
              .
            </p>
          </div>
        )}

        <div className="mt-9 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {stepIndex > 0 ? (
            <button type="button" onClick={back} className={btn.ghost}>
              <ArrowLeft aria-hidden className="size-4" /> Atrás
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <button type="submit" className={`${btn.primary} sm:min-w-52`} disabled={!hydrated || status === "submitting"}>
            {status === "submitting" ? (
              <>
                <Loader2 aria-hidden className="size-5 animate-spin" /> Enviando…
              </>
            ) : isLast ? (
              "Enviar respuestas"
            ) : (
              <>
                Continuar <ArrowRight aria-hidden className="size-4" />
              </>
            )}
          </button>
        </div>
        {isLast && (
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-suave sm:justify-end">
            <Lock aria-hidden className="size-4" /> Tus datos solo los consulta el equipo de TRES65.
          </p>
        )}
      </form>
    </div>
  );
}
