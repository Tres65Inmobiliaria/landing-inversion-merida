const COLORS: Record<string, string> = {
  "Listo para asesor": "bg-acento/15 text-medio",
  "Cliente potencial": "bg-amber-100 text-amber-800",
  "Cliente creado": "bg-profundo text-white",
  "Cierre perdido": "bg-stone-200 text-stone-700",
  Descartado: "bg-stone-200 text-stone-700",
  "Sin etapa": "bg-sky-100 text-sky-800",
  "Pendiente de vincular": "bg-red-100 text-red-800",
};

/** Estado del contacto en el CRM TRES65 (misma clasificación que el Directorio). */
export function StatusBadge({ status, owner }: { status: string; owner?: string | null }) {
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${COLORS[status] ?? "bg-stone-100"}`}>
        {status}
      </span>
      {owner && <span className="text-xs text-suave">{owner}</span>}
    </span>
  );
}
