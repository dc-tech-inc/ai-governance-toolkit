/** Our own assessment structure. It is not the text of ISO/IEC 42005; see docs/alignment-map.md. */

export const SCHEMA_VERSION = 1;

export const LIFECYCLE_STAGES = ["concept", "development", "pilot", "production", "retired"] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const IMPACT_SCOPES = ["individual", "group", "society", "environment"] as const;
export type ImpactScope = (typeof IMPACT_SCOPES)[number];

export const IMPACT_DIRECTIONS = ["benefit", "harm"] as const;
export type ImpactDirection = (typeof IMPACT_DIRECTIONS)[number];

export const REVIEW_STATUSES = ["draft", "in-review", "approved", "needs-changes"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export type Level = 1 | 2 | 3 | 4 | 5;
export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];

export interface SystemOverview {
  name: string;
  owner: string;
  purpose: string;
  stage: LifecycleStage;
  deploymentContext: string;
}

export interface UseCase {
  id: string;
  description: string;
  /** true = a use the owner wants to prevent but can foresee. */
  misuse: boolean;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  /** Why this party may need extra care (age, dependence, power imbalance...). Optional. */
  vulnerabilityNotes: string;
}

export interface DataAndModel {
  modelType: string;
  dataSources: string;
  usesPersonalData: boolean;
  humanOversight: string;
}

export interface Impact {
  id: string;
  description: string;
  stakeholderId: string;
  scope: ImpactScope;
  direction: ImpactDirection;
  severity: Level;
  likelihood: Level;
  mitigation: string;
  /** Re-rating after the mitigation. Only meaningful for harms. */
  residualSeverity: Level;
  residualLikelihood: Level;
}

export interface Monitoring {
  indicators: string;
  reviewCadence: string;
  incidentContact: string;
}

export interface Review {
  status: ReviewStatus;
  reviewer: string;
  reviewDate: string;
  nextReviewDate: string;
  notes: string;
}

export interface Assessment {
  schemaVersion: typeof SCHEMA_VERSION;
  overview: SystemOverview;
  useCases: UseCase[];
  stakeholders: Stakeholder[];
  dataAndModel: DataAndModel;
  impacts: Impact[];
  monitoring: Monitoring;
  review: Review;
}

export type SectionKey =
  | "overview"
  | "useCases"
  | "stakeholders"
  | "dataAndModel"
  | "impacts"
  | "monitoring"
  | "review";

export const SECTIONS: readonly { key: SectionKey; title: string; hint: string }[] = [
  { key: "overview", title: "System overview", hint: "What the system is, who owns it, where it runs." },
  { key: "useCases", title: "Uses and misuse", hint: "Intended uses and the misuse you can foresee." },
  { key: "stakeholders", title: "Stakeholders", hint: "Who is affected, including people who never use it." },
  { key: "dataAndModel", title: "Data and model", hint: "What it learns from and what keeps a human in the loop." },
  { key: "impacts", title: "Impacts", hint: "Benefits and harms, rated before and after mitigation." },
  { key: "monitoring", title: "Monitoring", hint: "How you will notice that the assessment has gone stale." },
  { key: "review", title: "Review and sign-off", hint: "Who looked at it, when, and when to look again." },
];

let counter = 0;
/** Ids only need to be unique within one assessment, so a counter plus a little randomness is enough. */
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyAssessment(): Assessment {
  return {
    schemaVersion: SCHEMA_VERSION,
    overview: { name: "", owner: "", purpose: "", stage: "concept", deploymentContext: "" },
    useCases: [],
    stakeholders: [],
    dataAndModel: { modelType: "", dataSources: "", usesPersonalData: false, humanOversight: "" },
    impacts: [],
    monitoring: { indicators: "", reviewCadence: "", incidentContact: "" },
    review: { status: "draft", reviewer: "", reviewDate: "", nextReviewDate: "", notes: "" },
  };
}

export function emptyImpact(stakeholderId = ""): Impact {
  return {
    id: newId("imp"),
    description: "",
    stakeholderId,
    scope: "individual",
    direction: "harm",
    severity: 3,
    likelihood: 3,
    mitigation: "",
    residualSeverity: 3,
    residualLikelihood: 3,
  };
}
