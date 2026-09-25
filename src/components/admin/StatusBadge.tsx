import { statusLabel } from "@/config/questionnaire";

const COLORS: Record<string, string> = {
  nuevo: "bg-acento/15 text-medio",
  revisado: "bg-sky-100 text-sky-800",
  contactado: "bg-amber-100 text-amber-800",
  descartado: "bg-stone-200 text-stone-700",
  agregado_directorio: "bg-profundo text-white",
};

/** Estado PROPIO de la respuesta (no es el estado del CRM). */
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${COLORS[status] ?? "bg-stone-100"}`}>
      {statusLabel(status)}
    </span>
  );
}
