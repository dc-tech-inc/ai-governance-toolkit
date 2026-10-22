import type { Assessment, SectionKey } from "./model";
import { SECTIONS } from "./model";
import { band, inherentScore } from "./risk";

export interface Issue {
  section: SectionKey;
  message: string;
}

const blank = (s: string): boolean => s.trim() === "";

/** Completeness checks, not correctness: they say what is still empty, not whether the assessment is good. */
export function validate(a: Assessment): Issue[] {
  const issues: Issue[] = [];
  const add = (section: SectionKey, message: string): void => void issues.push({ section, message });

  if (blank(a.overview.name)) add("overview", "Give the system a name.");
  if (blank(a.overview.owner)) add("overview", "Name an accountable owner.");
  if (blank(a.overview.purpose)) add("overview", "Describe the purpose of the system.");
  if (blank(a.overview.deploymentContext)) add("overview", "Describe where and how it is deployed.");

  if (!a.useCases.some((u) => !u.misuse)) add("useCases", "Add at least one intended use.");
  if (!a.useCases.some((u) => u.misuse)) add("useCases", "Add at least one foreseeable misuse.");
  for (const u of a.useCases) if (blank(u.description)) add("useCases", "A use case has no description.");

  if (a.stakeholders.length === 0) add("stakeholders", "Add at least one stakeholder.");
  for (const s of a.stakeholders) if (blank(s.name)) add("stakeholders", "A stakeholder has no name.");

  if (blank(a.dataAndModel.modelType)) add("dataAndModel", "State what kind of model or technique is used.");
  if (blank(a.dataAndModel.dataSources)) add("dataAndModel", "List the data sources.");
  if (blank(a.dataAndModel.humanOversight)) add("dataAndModel", "Describe human oversight.");

  if (a.impacts.length === 0) add("impacts", "Record at least one impact.");
  else if (!a.impacts.some((i) => i.direction === "harm")) {
    add("impacts", "No harm recorded. Is that a finding or a gap?");
  }
  const known = new Set(a.stakeholders.map((s) => s.id));
  for (const i of a.impacts) {
    const label = i.description.trim() || "(untitled)";
    if (blank(i.description)) add("impacts", "An impact has no description.");
    if (!known.has(i.stakeholderId)) add("impacts", `Impact "${label}" has no valid stakeholder.`);
    if (i.direction === "harm" && band(inherentScore(i)) !== "low" && blank(i.mitigation)) {
      add("impacts", `Harm "${label}" is rated above low and has no mitigation.`);
    }
  }

  if (blank(a.monitoring.indicators)) add("monitoring", "List the indicators you will watch.");
  if (blank(a.monitoring.reviewCadence)) add("monitoring", "State how often the assessment is reviewed.");
  if (blank(a.monitoring.incidentContact)) add("monitoring", "Name an incident contact.");

  if (blank(a.review.reviewer)) add("review", "Name the reviewer.");
  if (blank(a.review.reviewDate)) add("review", "Record the review date.");
  if (blank(a.review.nextReviewDate)) add("review", "Schedule the next review.");
  if (a.review.reviewDate && a.review.nextReviewDate && a.review.nextReviewDate <= a.review.reviewDate) {
    add("review", "The next review must be after this one.");
  }
  return issues;
}

export interface Completeness {
  complete: number;
  total: number;
  bySection: Record<SectionKey, number>;
}

export function completeness(issues: readonly Issue[]): Completeness {
  const bySection = Object.fromEntries(SECTIONS.map((s) => [s.key, 0])) as Record<SectionKey, number>;
  for (const i of issues) bySection[i.section] += 1;
  return { complete: SECTIONS.filter((s) => bySection[s.key] === 0).length, total: SECTIONS.length, bySection };
}
