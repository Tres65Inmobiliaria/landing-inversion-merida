"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { ChevronRight, Download, Loader2, Search, X } from "lucide-react";
import { labelFor, labelsFor, OPTIONS, STATUSES, type Option } from "@/config/questionnaire";
import { computeKpis, EMPTY_FILTERS, filterProspects, type Filters } from "@/lib/admin";
import { downloadCsv, formatDateTime } from "@/lib/csv";
import { subscribeProspects } from "@/lib/prospects";
import type { Prospect } from "@/lib/types";
import { formatPhone } from "@/lib/validation";
import { ProspectDetail } from "./ProspectDetail";
import { StatusBadge } from "./StatusBadge";

export function Dashboard({ user }: { user: User }) {
  const [rows, setRows] = useState<Prospect[] | null>(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  // Enlace directo a una ficha: /admin/?p=<id>. (Este componente solo se monta en el navegador.)
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("p"),
  );

  useEffect(
    () =>
      subscribeProspects(
        (data) => {
          setRows(data);
          setError("");
        },
        (err) => {
          console.error(err);
          setError("No se pudieron cargar los prospectos. Recarga la página o vuelve a iniciar sesión.");
        },
      ),
    [],
  );

  function open(id: string | null) {
    setSelectedId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("p", id);
    else url.searchParams.delete("p");
    window.history.replaceState(null, "", url);
  }

  const filtered = useMemo(() => (rows ? filterProspects(rows, filters) : []), [rows, filters]);
  const kpis = useMemo(() => computeKpis(rows ?? []), [rows]);
  const selected = rows?.find((r) => r.id === selectedId) ?? null;
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
  const set = (k: keyof Filters) => (v: string) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-profundo">Prospectos</h1>
          <p className="text-suave">Campaña “Diversifica tu patrimonio en Mérida”</p>
        </div>
        <button
          onClick={() => downloadCsv(filtered)}
          disabled={!filtered.length}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-profundo px-5 font-semibold text-profundo transition hover:bg-menta disabled:opacity-50"
        >
          <Download aria-hidden className="size-4" /> Exportar CSV
          {hasFilters && rows && <span className="text-sm font-normal">({filtered.length})</span>}
        </button>
      </div>

      {/* KPIs */}
      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Total prospectos" value={kpis.total} />
        <Kpi label="Nuevos" value={kpis.nuevos} onClick={() => setFilters({ ...EMPTY_FILTERS, status: "nuevo" })} />
        <Kpi label="Interesados en presentación" value={kpis.presentacion} onClick={() => setFilters({ ...EMPTY_FILTERS, eventInterest: "si" })} />
        <Kpi label="Inversión próxima (≤ 6 meses)" value={kpis.proxima} />
        <Kpi label="Con presupuesto definido" value={kpis.conPresupuesto} />
      </dl>

      {/* Búsqueda y filtros */}
      <section aria-label="Filtros" className="mt-6 rounded-3xl border border-borde bg-white p-4 sm:p-5">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-suave" />
          <label htmlFor="search" className="sr-only">
            Buscar por nombre, correo o teléfono
          </label>
          <input
            id="search"
            type="search"
            placeholder="Buscar por nombre, correo o teléfono"
            value={filters.search}
            onChange={(e) => set("search")(e.target.value)}
            className="min-h-12 w-full rounded-2xl border border-borde bg-piedra pr-4 pl-12 focus:border-medio focus:outline-none focus:ring-4 focus:ring-acento/20"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Select label="Estado" value={filters.status} onChange={set("status")} options={STATUSES} />
          <Select label="Presentación" value={filters.eventInterest} onChange={set("eventInterest")} options={OPTIONS.eventInterest} />
          <Select label="Plazo" value={filters.investmentTimeline} onChange={set("investmentTimeline")} options={OPTIONS.investmentTimeline} />
          <Select label="Presupuesto" value={filters.investmentBudget} onChange={set("investmentBudget")} options={OPTIONS.investmentBudget} />
          <Select label="Forma de compra" value={filters.purchaseMethod} onChange={set("purchaseMethod")} options={OPTIONS.purchaseMethod} />
        </div>
        {hasFilters && (
          <button onClick={() => setFilters(EMPTY_FILTERS)} className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-medio hover:underline">
            <X aria-hidden className="size-4" /> Limpiar filtros
          </button>
        )}
      </section>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-error/5 p-4 text-error">
          {error}
        </p>
      )}

      {/* Resultados */}
      <section aria-label="Lista de prospectos" className="mt-6">
        {rows === null && !error ? (
          <div className="grid place-items-center py-20">
            <Loader2 aria-label="Cargando prospectos" className="size-8 animate-spin text-medio" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-borde bg-white p-10 text-center text-suave">
            {rows?.length ? "Ningún prospecto coincide con los filtros." : "Aún no hay prospectos."}
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-suave">
              {filtered.length} {filtered.length === 1 ? "prospecto" : "prospectos"}
            </p>

            {/* Móvil: tarjetas */}
            <ul className="grid gap-3 lg:hidden">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => open(p.id)}
                    className="w-full rounded-2xl border border-borde bg-white p-4 text-left transition hover:border-acento"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-profundo">{p.fullName}</p>
                        <p className="text-sm text-suave">{formatDateTime(p.createdAt)}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                      <dt className="text-suave">Presupuesto</dt>
                      <dd>{labelFor("investmentBudget", p.investmentBudget)}</dd>
                      <dt className="text-suave">Plazo</dt>
                      <dd>{labelFor("investmentTimeline", p.investmentTimeline)}</dd>
                      <dt className="text-suave">Presentación</dt>
                      <dd>{labelFor("eventInterest", p.eventInterest)}</dd>
                    </dl>
                  </button>
                </li>
              ))}
            </ul>

            {/* Escritorio: tabla */}
            <div className="hidden overflow-x-auto rounded-3xl border border-borde bg-white lg:block">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-menta/60 text-xs tracking-wide text-profundo uppercase">
                  <tr>
                    {["Fecha", "Nombre", "WhatsApp", "Email", "Presupuesto", "Forma de compra", "Plazo", "Objetivo", "Presentación", "Estado", ""].map((h) => (
                      <th key={h} scope="col" className="px-4 py-3 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => open(p.id)}
                      className="cursor-pointer align-top transition hover:bg-piedra"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-suave">{formatDateTime(p.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold text-profundo">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            open(p.id);
                          }}
                          className="text-left hover:underline"
                        >
                          {p.fullName}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatPhone(p.phone)}</td>
                      <td className="max-w-48 truncate px-4 py-3">{p.email}</td>
                      <td className="px-4 py-3">{labelFor("investmentBudget", p.investmentBudget)}</td>
                      <td className="px-4 py-3">{labelFor("purchaseMethod", p.purchaseMethod)}</td>
                      <td className="px-4 py-3">{labelFor("investmentTimeline", p.investmentTimeline)}</td>
                      <td className="max-w-56 px-4 py-3">{labelsFor("investmentPurposes", p.investmentPurposes)}</td>
                      <td className="px-4 py-3">{labelFor("eventInterest", p.eventInterest)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-2 py-3">
                        <ChevronRight aria-hidden className="size-4 text-suave" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {selected && <ProspectDetail key={selected.id} prospect={selected} user={user} onClose={() => open(null)} />}
    </main>
  );
}

function Kpi({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  const content = (
    <>
      <dt className="text-sm leading-tight text-suave">{label}</dt>
      <dd className="mt-2 font-serif text-3xl font-semibold text-profundo">{value}</dd>
    </>
  );
  const cls = "flex h-full flex-col justify-between rounded-2xl border border-borde bg-white p-4 text-left";
  return onClick ? (
    <div>
      <button onClick={onClick} className={`${cls} w-full transition hover:border-acento`} title="Filtrar">
        {content}
      </button>
    </div>
  ) : (
    <div className={cls}>{content}</div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  const id = `f-${label}`;
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-suave">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-xl border border-borde bg-white px-3 text-sm focus:border-medio focus:outline-none focus:ring-4 focus:ring-acento/20"
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
