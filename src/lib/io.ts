import {
  IMPACT_DIRECTIONS,
  IMPACT_SCOPES,
  LEVELS,
  LIFECYCLE_STAGES,
  REVIEW_STATUSES,
  SCHEMA_VERSION,

  type Assessment,
  type Impact,
  type Level,
  type Stakeholder,
  type UseCase,
} from "./model";
import { band, inherentScore, residualScore, summarise } from "./risk";
import { validate } from "./validate";

export function toJSON(a: Assessment): string {
  return `${JSON.stringify(a, null, 2)}\n`;
}

export class ImportError extends Error {}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function str(o: Obj, key: string, path: string): string {
  const v = o[key];
  if (typeof v !== "string") throw new ImportError(`${path}.${key} must be a string`);
  return v;
}
function bool(o: Obj, key: string, path: string): boolean {
  const v = o[key];
  if (typeof v !== "boolean") throw new ImportError(`${path}.${key} must be true or false`);
  return v;
}
function oneOf<T extends string>(o: Obj, key: string, path: string, allowed: readonly T[]): T {
  const v = o[key];
  const found = allowed.find((a) => a === v);
  if (found === undefined) throw new ImportError(`${path}.${key} must be one of: ${allowed.join(", ")}`);
  return found;
}
function level(o: Obj, key: string, path: string): Level {
  const v = o[key];
  const found = LEVELS.find((l) => l === v);
  if (found === undefined) throw new ImportError(`${path}.${key} must be a whole number from 1 to 5`);
  return found;
}
function obj(o: Obj, key: string, path: string): Obj {
  const v = o[key];
  if (!isObj(v)) throw new ImportError(`${path}.${key} must be an object`);
  return v;
}
function list<T>(o: Obj, key: string, parse: (item: Obj, path: string) => T): T[] {
  const v = o[key];
  if (!Array.isArray(v)) throw new ImportError(`${key} must be a list`);
  return v.map((item: unknown, n) => {
    if (!isObj(item)) throw new ImportError(`${key}[${n}] must be an object`);
    return parse(item, `${key}[${n}]`);
  });
}

/** Parses untrusted JSON into an Assessment or throws ImportError with a message that names the field. */
export function fromJSON(text: string): Assessment {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError("That file is not valid JSON.");
  }
  if (!isObj(raw)) throw new ImportError("The top level must be an object.");
  if (raw["schemaVersion"] !== SCHEMA_VERSION) {
    throw new ImportError(`Unsupported schemaVersion (expected ${SCHEMA_VERSION}).`);
  }
  const overview = obj(raw, "overview", "assessment");
  const data = obj(raw, "dataAndModel", "assessment");
  const monitoring = obj(raw, "monitoring", "assessment");
  const review = obj(raw, "review", "assessment");
  return {
    schemaVersion: SCHEMA_VERSION,
    overview: {
      name: str(overview, "name", "overview"),
      owner: str(overview, "owner", "overview"),
      purpose: str(overview, "purpose", "overview"),
      stage: oneOf(overview, "stage", "overview", LIFECYCLE_STAGES),
      deploymentContext: str(overview, "deploymentContext", "overview"),
    },
    useCases: list(raw, "useCases", (o, p): UseCase => ({
      id: str(o, "id", p),
      description: str(o, "description", p),
      misuse: bool(o, "misuse", p),
    })),
    stakeholders: list(raw, "stakeholders", (o, p): Stakeholder => ({
      id: str(o, "id", p),
      name: str(o, "name", p),
      role: str(o, "role", p),
      vulnerabilityNotes: str(o, "vulnerabilityNotes", p),
    })),
    dataAndModel: {
      modelType: str(data, "modelType", "dataAndModel"),
      dataSources: str(data, "dataSources", "dataAndModel"),
      usesPersonalData: bool(data, "usesPersonalData", "dataAndModel"),
      humanOversight: str(data, "humanOversight", "dataAndModel"),
    },
    impacts: list(raw, "impacts", (o, p): Impact => ({
      id: str(o, "id", p),
      description: str(o, "description", p),
      stakeholderId: str(o, "stakeholderId", p),
      scope: oneOf(o, "scope", p, IMPACT_SCOPES),
      direction: oneOf(o, "direction", p, IMPACT_DIRECTIONS),
      severity: level(o, "severity", p),
      likelihood: level(o, "likelihood", p),
      mitigation: str(o, "mitigation", p),
      residualSeverity: level(o, "residualSeverity", p),
      residualLikelihood: level(o, "residualLikelihood", p),
    })),
    monitoring: {
      indicators: str(monitoring, "indicators", "monitoring"),
      reviewCadence: str(monitoring, "reviewCadence", "monitoring"),
      incidentContact: str(monitoring, "incidentContact", "monitoring"),
    },
    review: {
      status: oneOf(review, "status", "review", REVIEW_STATUSES),
      reviewer: str(review, "reviewer", "review"),
      reviewDate: str(review, "reviewDate", "review"),
      nextReviewDate: str(review, "nextReviewDate", "review"),
      notes: str(review, "notes", "review"),
    },
  };
}

/** Markdown table cells cannot hold pipes or line breaks. */
const cell = (s: string): string => (s.trim() === "" ? "-" : s.replace(/\|/g, "\\|").replace(/\s*\r?\n\s*/g, " "));
const text = (s: string): string => (s.trim() === "" ? "_Not provided._" : s.trim());

export function toMarkdown(a: Assessment): string {
  const out: string[] = [];
  const name = a.overview.name.trim() || "Untitled system";
  const stakeholder = (id: string): string => cell(a.stakeholders.find((s) => s.id === id)?.name ?? "unknown");
  const sum = summarise(a.impacts);
  const open = validate(a);

  out.push(`# AI system impact assessment: ${name}`, "");
  out.push("> Prepared with ai-governance-toolkit. A structured self-assessment aligned in spirit to ISO/IEC 42005:2025.");
  out.push("> It is not an ISO document, not a certification and not a statement of conformity.", "");

  out.push("## 1. System overview", "");
  out.push(`- **Owner:** ${cell(a.overview.owner)}`);
  out.push(`- **Lifecycle stage:** ${a.overview.stage}`);
  out.push(`- **Purpose:** ${text(a.overview.purpose)}`);
  out.push(`- **Deployment context:** ${text(a.overview.deploymentContext)}`, "");

  out.push("## 2. Uses and misuse", "");
  if (a.useCases.length === 0) out.push("_None recorded._");
  for (const u of a.useCases) out.push(`- ${u.misuse ? "**Foreseeable misuse**" : "**Intended use**"}: ${text(u.description)}`);
  out.push("");

  out.push("## 3. Stakeholders", "");
  if (a.stakeholders.length === 0) out.push("_None recorded._", "");
  else {
    out.push("| Stakeholder | Role | Needs extra care because |", "|---|---|---|");
    for (const s of a.stakeholders) out.push(`| ${cell(s.name)} | ${cell(s.role)} | ${cell(s.vulnerabilityNotes)} |`);
    out.push("");
  }

  out.push("## 4. Data and model", "");
  out.push(`- **Model or technique:** ${text(a.dataAndModel.modelType)}`);
  out.push(`- **Data sources:** ${text(a.dataAndModel.dataSources)}`);
  out.push(`- **Uses personal data:** ${a.dataAndModel.usesPersonalData ? "yes" : "no"}`);
  out.push(`- **Human oversight:** ${text(a.dataAndModel.humanOversight)}`, "");

  out.push("## 5. Impacts", "");
  out.push(
    `${sum.harms} harm(s), ${sum.benefits} benefit(s). Highest inherent risk: ${sum.highestInherent ?? "n/a"}. ` +
      `Highest residual risk: ${sum.highestResidual ?? "n/a"}. Unmitigated high harms: ${sum.unmitigatedHighHarms}.`,
    "",
  );
  if (a.impacts.length > 0) {
    out.push("| Impact | Affects | Scope | Kind | Inherent | Mitigation | Residual |", "|---|---|---|---|---|---|---|");
    for (const i of a.impacts) {
      const harm = i.direction === "harm";
      out.push(
        `| ${cell(i.description)} | ${stakeholder(i.stakeholderId)} | ${i.scope} | ${i.direction} | ` +
          `${harm ? `${inherentScore(i)} (${band(inherentScore(i))})` : "-"} | ${harm ? cell(i.mitigation) : "-"} | ` +
          `${harm ? `${residualScore(i)} (${band(residualScore(i))})` : "-"} |`,
      );
    }
    out.push("");
  }

  out.push("## 6. Monitoring", "");
  out.push(`- **Indicators:** ${text(a.monitoring.indicators)}`);
  out.push(`- **Review cadence:** ${text(a.monitoring.reviewCadence)}`);
  out.push(`- **Incident contact:** ${text(a.monitoring.incidentContact)}`, "");

  out.push("## 7. Review and sign-off", "");
  out.push(`- **Status:** ${a.review.status}`);
  out.push(`- **Reviewer:** ${cell(a.review.reviewer)}`);
  out.push(`- **Reviewed on:** ${cell(a.review.reviewDate)}`);
  out.push(`- **Next review:** ${cell(a.review.nextReviewDate)}`);
  out.push(`- **Notes:** ${text(a.review.notes)}`, "");

  out.push("## Open items", "");
  if (open.length === 0) out.push("None. All sections pass the completeness checks.");
  for (const i of open) out.push(`- ${i.message}`);
  out.push("");
  return out.join("\n");
}

