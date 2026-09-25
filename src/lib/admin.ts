import { NEAR_TERM_TIMELINES, UNDEFINED_BUDGET } from "@/config/questionnaire";
import type { Submission } from "./types";

export interface Filters {
  search: string;
  status: string;
  eventInterest: string;
  investmentTimeline: string;
  investmentBudget: string;
  directory: string;
}

export const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  eventInterest: "",
  investmentTimeline: "",
  investmentBudget: "",
  directory: "",
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function filterProspects(rows: Submission[], f: Filters): Submission[] {
  const q = normalize(f.search.trim());
  const qDigits = f.search.replace(/\D/g, "");
  return rows.filter((p) => {
    if (f.status && p.status !== f.status) return false;
    if (f.eventInterest && p.eventInterest !== f.eventInterest) return false;
    if (f.investmentTimeline && p.investmentTimeline !== f.investmentTimeline) return false;
    if (f.investmentBudget && p.investmentBudget !== f.investmentBudget) return false;
    if (f.directory === "si" && !p.directory) return false;
    if (f.directory === "no" && p.directory) return false;
    if (q) {
      const inText = normalize(`${p.fullName} ${p.email} ${p.preferredArea}`).includes(q);
      const inPhone = qDigits.length >= 3 && p.phone.replace(/\D/g, "").includes(qDigits);
      if (!inText && !inPhone) return false;
    }
    return true;
  });
}

export function computeKpis(rows: Submission[]) {
  return {
    total: rows.length,
    nuevos: rows.filter((p) => p.status === "nuevo").length,
    presentacion: rows.filter((p) => p.eventInterest === "si").length,
    proxima: rows.filter((p) => NEAR_TERM_TIMELINES.includes(p.investmentTimeline)).length,
    conPresupuesto: rows.filter((p) => p.investmentBudget && p.investmentBudget !== UNDEFINED_BUDGET).length,
    enDirectorio: rows.filter((p) => p.directory).length,
  };
}

