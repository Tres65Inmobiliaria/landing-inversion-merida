import { labelFor } from "@/config/questionnaire";

const COLORS: Record<string, string> = {
  nuevo: "bg-acento/15 text-medio",
  contactado: "bg-sky-100 text-sky-800",
  seguimiento: "bg-amber-100 text-amber-800",
  cita_agendada: "bg-violet-100 text-violet-800",
  interesado: "bg-emerald-100 text-emerald-800",
  no_interesado: "bg-stone-200 text-stone-700",
  cerrado: "bg-profundo text-white",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${COLORS[status] ?? "bg-stone-100"}`}>
      {labelFor("status", status)}
    </span>
  );
}
