/**
 * Opciones del cuestionario. Los `value` son códigos estables que el backend del
 * CRM valida con una lista blanca (agente-tres65/landing_campaign.py → OPTIONS):
 * si agregas o cambias un `value` aquí, cámbialo también allá o el envío se
 * rechazará. Los `label` (lo que ve el prospecto) se pueden cambiar libremente.
 */
export type Option = { value: string; label: string };

export const OPTIONS = {
  diversificationInterest: [
    { value: "si", label: "Sí, me interesa" },
    { value: "tal_vez", label: "Tal vez, quiero conocer opciones" },
    { value: "no", label: "Por ahora no" },
  ],
  previousRealEstateInvestment: [
    { value: "si", label: "Sí" },
    { value: "no", label: "No, sería mi primera inversión inmobiliaria" },
  ],
  previousInvestmentTypes: [
    { value: "terreno", label: "Terreno" },
    { value: "casa", label: "Casa" },
    { value: "departamento", label: "Departamento" },
    { value: "comercial", label: "Comercial" },
    { value: "otro", label: "Otro" },
  ],
  investmentBudget: [
    { value: "menos_2m", label: "Menos de $2 M MXN" },
    { value: "2_3m", label: "$2 – 3 M MXN" },
    { value: "3_5m", label: "$3 – 5 M MXN" },
    { value: "5_8m", label: "$5 – 8 M MXN" },
    { value: "mas_8m", label: "Más de $8 M MXN" },
    { value: "sin_definir", label: "Aún no lo tengo definido" },
  ],
  purchaseMethod: [
    { value: "liquidez", label: "Liquidez propia" },
    { value: "credito", label: "Crédito / financiamiento" },
    { value: "combinacion", label: "Una combinación de ambos" },
    { value: "no_se", label: "Aún no lo sé" },
  ],
  financingInterest: [
    { value: "si", label: "Sí, me gustaría conocerlo" },
    { value: "tal_vez", label: "Tal vez, quiero más información" },
    { value: "no", label: "No por ahora" },
  ],
  investmentTimeline: [
    { value: "0_3m", label: "En los próximos 3 meses" },
    { value: "3_6m", label: "Entre 3 y 6 meses" },
    { value: "6_12m", label: "Entre 6 y 12 meses" },
    { value: "mas_adelante", label: "Más adelante" },
    { value: "explorando", label: "Apenas estoy explorando" },
  ],
  decisionMakers: [
    { value: "solo", label: "Yo solo/a" },
    { value: "pareja", label: "Con mi pareja" },
    { value: "familia", label: "Con mi familia" },
    { value: "socios", label: "Con socio(s)" },
    { value: "otro", label: "Otro" },
  ],
  investmentPurposes: [
    { value: "retiro", label: "Plan de retiro" },
    { value: "renta", label: "Ingreso por renta" },
    { value: "diversificacion", label: "Diversificación patrimonial" },
    { value: "herencia", label: "Herencia / patrimonio familiar" },
    { value: "segunda_residencia", label: "Segunda residencia" },
    { value: "vacacional", label: "Uso vacacional" },
    { value: "otro", label: "Otro" },
  ],
  personalUse: [
    { value: "si", label: "Sí, me gustaría usarla en algún momento" },
    { value: "tal_vez", label: "Tal vez" },
    { value: "inversion", label: "Sería 100% inversión" },
  ],
  meridaExperience: [
    { value: "vivo_aqui", label: "Vivo en Mérida o sus alrededores" },
    { value: "conozco", label: "Sí, la conozco en persona" },
    { value: "primera_vez", label: "Sería mi primera vez explorando la zona" },
  ],
  meridaMarketKnowledge: [
    { value: "lo_sigo", label: "Sí, lo sigo de cerca" },
    { value: "algo", label: "He escuchado algo" },
    { value: "poco", label: "No mucho, me gustaría conocerlo" },
  ],
  eventInterest: [
    { value: "si", label: "Sí, me interesa asistir" },
    { value: "tal_vez", label: "Tal vez, quiero más información" },
    { value: "no", label: "No por ahora" },
  ],
} satisfies Record<string, Option[]>;

export type OptionKey = keyof typeof OPTIONS;

/** Valores que el dashboard considera "inversión próxima". */
export const NEAR_TERM_TIMELINES = ["0_3m", "3_6m"];

/** Valor que significa "sin presupuesto definido". */
export const UNDEFINED_BUDGET = "sin_definir";

/** Opción excluyente en "¿Quién toma la decisión?". */
export const DECISION_ALONE = "solo";

/**
 * Estados del CRM TRES65 tal como los muestra el Directorio (no hay un estado
 * paralelo de la landing). "Pendiente de vincular" = el envío se guardó pero el
 * backend aún no pudo ligarlo a un contacto (p. ej. Chatwoot no respondió).
 */
export const CRM_STATUSES: Option[] = [
  { value: "Listo para asesor", label: "Listo para asesor" },
  { value: "Cliente potencial", label: "Cliente potencial" },
  { value: "Cliente creado", label: "Cliente creado" },
  { value: "Cierre perdido", label: "Cierre perdido" },
  { value: "Descartado", label: "Descartado" },
  { value: "Sin etapa", label: "Sin etapa" },
  { value: "Pendiente de vincular", label: "Pendiente de vincular" },
];

export function labelFor(key: OptionKey, value: string | undefined | null): string {
  if (!value) return "—";
  const list: Option[] = OPTIONS[key];
  return list.find((o) => o.value === value)?.label ?? value;
}

export function labelsFor(key: OptionKey, values: string[] | undefined | null): string {
  if (!values || values.length === 0) return "—";
  return values.map((v) => labelFor(key, v)).join(", ");
}

/** Pasos del formulario multi-step. */
export const STEPS = [
  { id: "contacto", title: "Sobre ti", intro: "Para enviarte información y darte seguimiento." },
  { id: "experiencia", title: "Tu experiencia", intro: "Nos ayuda a saber desde dónde partir." },
  { id: "inversion", title: "Tu inversión", intro: "Solo rangos aproximados; nada de esto es un compromiso." },
  { id: "tiempos", title: "Tiempos y decisión", intro: "Así sabemos qué tan pronto te sería útil la información." },
  { id: "objetivos", title: "Tus objetivos", intro: "Lo que buscas define qué tipo de propiedad tiene sentido." },
  { id: "merida", title: "Mérida", intro: "Para saber cuánto contexto de la ciudad compartirte." },
  { id: "presentacion", title: "Presentación", intro: "Último paso." },
] as const;

export type StepId = (typeof STEPS)[number]["id"];
