import type { Impact, Level } from "./model";

export type RiskBand = "low" | "moderate" | "high" | "critical";

/** Plain severity x likelihood product, 1..25. A team can disagree with the bands; they live in one place. */
export function score(severity: Level, likelihood: Level): number {
  return severity * likelihood;
}

export function band(value: number): RiskBand {
  if (value >= 15) return "critical";
  if (value >= 10) return "high";
  if (value >= 5) return "moderate";
  return "low";
}

export function inherentScore(impact: Impact): number {
  return score(impact.severity, impact.likelihood);
}

const hasMitigation = (impact: Impact): boolean => impact.mitigation.trim() !== "";

/** Benefits have no residual risk; a harm without a mitigation keeps its inherent score. */
export function residualScore(impact: Impact): number {
  if (impact.direction === "benefit") return 0;
  return hasMitigation(impact) ? score(impact.residualSeverity, impact.residualLikelihood) : inherentScore(impact);
}

export interface RiskSummary {
  harms: number;
  benefits: number;
  highestInherent: RiskBand | null;
  highestResidual: RiskBand | null;
  unmitigatedHighHarms: number;
}

export function summarise(impacts: readonly Impact[]): RiskSummary {
  const harms = impacts.filter((i) => i.direction === "harm");
  const top = (values: number[]): RiskBand | null => (values.length === 0 ? null : band(Math.max(...values)));
  const high = (i: Impact): boolean => {
    const b = band(inherentScore(i));
    return b === "high" || b === "critical";
  };
  return {
    harms: harms.length,
    benefits: impacts.length - harms.length,
    highestInherent: top(harms.map(inherentScore)),
    highestResidual: top(harms.map(residualScore)),
    unmitigatedHighHarms: harms.filter((i) => high(i) && !hasMitigation(i)).length,
  };
}

/** Counts of harms per (severity row, likelihood column) cell, for the matrix. */
export function matrix(impacts: readonly Impact[], kind: "inherent" | "residual"): number[][] {
  const grid = Array.from({ length: 5 }, () => Array<number>(5).fill(0));
  for (const i of impacts) {
    if (i.direction !== "harm") continue;
    const useResidual = kind === "residual" && hasMitigation(i);
    const sev = useResidual ? i.residualSeverity : i.severity;
    const lik = useResidual ? i.residualLikelihood : i.likelihood;
    const row = grid[sev - 1];
    if (row) row[lik - 1] = (row[lik - 1] ?? 0) + 1;
  }
  return grid;
}
