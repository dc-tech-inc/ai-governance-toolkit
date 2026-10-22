import {
  IMPACT_DIRECTIONS,
  IMPACT_SCOPES,
  LEVELS,
  LIFECYCLE_STAGES,
  REVIEW_STATUSES,
  emptyImpact,
  newId,
  type Assessment,
  type Level,
  type SectionKey,
} from "../lib/model";
import { band, inherentScore, matrix, residualScore, summarise } from "../lib/risk";
import { Check, Select, TextArea, TextField } from "./fields";
import { RiskMatrix } from "./RiskMatrix";

export type Update = (change: (draft: Assessment) => void) => void;
interface Props {
  a: Assessment;
  update: Update;
}

const opts = <T extends string>(values: readonly T[]) => values.map((v) => ({ value: v, label: v }));
const levelOpts = LEVELS.map((l) => ({ value: l, label: String(l) }));

function Empty({ children }: { children: string }) {
  return <p className="empty">{children}</p>;
}

function Overview({ a, update }: Props) {
  const o = a.overview;
  return (
    <>
      <TextField label="System name" value={o.name} onChange={(v) => update((d) => void (d.overview.name = v))} />
      <TextField
        label="Accountable owner"
        hint="A role or team, not a personal contact."
        value={o.owner}
        onChange={(v) => update((d) => void (d.overview.owner = v))}
      />
      <TextArea label="Purpose" value={o.purpose} onChange={(v) => update((d) => void (d.overview.purpose = v))} />
      <Select
        label="Lifecycle stage"
        value={o.stage}
        options={opts(LIFECYCLE_STAGES)}
        onChange={(v) => update((d) => void (d.overview.stage = v))}
      />
      <TextArea
        label="Deployment context"
        hint="Where it runs, for whom, and what it is not allowed to decide."
        value={o.deploymentContext}
        onChange={(v) => update((d) => void (d.overview.deploymentContext = v))}
      />
    </>
  );
}

function UseCases({ a, update }: Props) {
  return (
    <>
      {a.useCases.length === 0 ? <Empty>No uses recorded yet. Add an intended use first.</Empty> : null}
      {a.useCases.map((u, n) => (
        <fieldset key={u.id} className="card">
          <legend>{u.misuse ? "Foreseeable misuse" : "Intended use"} {n + 1}</legend>
          <TextArea
            label="Description"
            value={u.description}
            onChange={(v) => update((d) => void (d.useCases[n]!.description = v))}
          />
          <Check label="This is a misuse to prevent" checked={u.misuse} onChange={(v) => update((d) => void (d.useCases[n]!.misuse = v))} />
          <button type="button" className="ghost" onClick={() => update((d) => void d.useCases.splice(n, 1))}>
            Remove
          </button>
        </fieldset>
      ))}
      <div className="row">
        <button type="button" onClick={() => update((d) => void d.useCases.push({ id: newId("uc"), description: "", misuse: false }))}>
          Add intended use
        </button>
        <button type="button" onClick={() => update((d) => void d.useCases.push({ id: newId("uc"), description: "", misuse: true }))}>
          Add foreseeable misuse
        </button>
      </div>
    </>
  );
}

function Stakeholders({ a, update }: Props) {
  return (
    <>
      {a.stakeholders.length === 0 ? <Empty>No stakeholders yet. Include people who never use the system.</Empty> : null}
      {a.stakeholders.map((s, n) => (
        <fieldset key={s.id} className="card">
          <legend>Stakeholder {n + 1}</legend>
          <TextField label="Name or group" value={s.name} onChange={(v) => update((d) => void (d.stakeholders[n]!.name = v))} />
          <TextField label="Role" value={s.role} onChange={(v) => update((d) => void (d.stakeholders[n]!.role = v))} />
          <TextArea
            label="Needs extra care because"
            hint="Optional. Age, dependence, power imbalance, sensitivity of the data."
            rows={2}
            value={s.vulnerabilityNotes}
            onChange={(v) => update((d) => void (d.stakeholders[n]!.vulnerabilityNotes = v))}
          />
          <button type="button" className="ghost" onClick={() => update((d) => void d.stakeholders.splice(n, 1))}>
            Remove
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        onClick={() => update((d) => void d.stakeholders.push({ id: newId("sh"), name: "", role: "", vulnerabilityNotes: "" }))}
      >
        Add stakeholder
      </button>
    </>
  );
}

function DataAndModel({ a, update }: Props) {
  const m = a.dataAndModel;
  return (
    <>
      <TextField label="Model or technique" value={m.modelType} onChange={(v) => update((d) => void (d.dataAndModel.modelType = v))} />
      <TextArea
        label="Data sources"
        hint="Describe the data. Never paste real personal data into this tool."
        value={m.dataSources}
        onChange={(v) => update((d) => void (d.dataAndModel.dataSources = v))}
      />
      <Check label="The system uses personal data" checked={m.usesPersonalData} onChange={(v) => update((d) => void (d.dataAndModel.usesPersonalData = v))} />
      <TextArea
        label="Human oversight"
        hint="Who can see, question, override or switch it off?"
        value={m.humanOversight}
        onChange={(v) => update((d) => void (d.dataAndModel.humanOversight = v))}
      />
    </>
  );
}

function Impacts({ a, update }: Props) {
  const sum = summarise(a.impacts);
  const stakeholderOpts = a.stakeholders.map((s) => ({ value: s.id, label: s.name || "(unnamed)" }));
  return (
    <>
      <div className="summary" role="group" aria-label="Impact summary">
        <span>{sum.harms} harm(s)</span>
        <span>{sum.benefits} benefit(s)</span>
        <span>Highest inherent: {sum.highestInherent ?? "n/a"}</span>
        <span>Highest residual: {sum.highestResidual ?? "n/a"}</span>
      </div>
      <div className="matrices">
        <RiskMatrix title="Before mitigation" grid={matrix(a.impacts, "inherent")} />
        <RiskMatrix title="After mitigation" grid={matrix(a.impacts, "residual")} />
      </div>
      {a.impacts.length === 0 ? <Empty>No impacts yet. Record benefits as well as harms.</Empty> : null}
      {a.impacts.map((i, n) => {
        const harm = i.direction === "harm";
        const set = (change: (x: typeof i) => void): void => update((d) => void change(d.impacts[n]!));
        return (
          <fieldset key={i.id} className="card">
            <legend>
              Impact {n + 1}
              {harm ? (
                <span className={`chip ${band(inherentScore(i))}`}>
                  {band(inherentScore(i))} {"->"} {band(residualScore(i))}
                </span>
              ) : (
                <span className="chip benefit">benefit</span>
              )}
            </legend>
            <TextArea label="What happens" value={i.description} onChange={(v) => set((x) => void (x.description = v))} />
            <div className="grid2">
              <Select
                label="Who is affected"
                value={i.stakeholderId}
                options={[{ value: "", label: "Choose a stakeholder" }, ...stakeholderOpts]}
                onChange={(v) => set((x) => void (x.stakeholderId = v))}
              />
              <Select label="Scope" value={i.scope} options={opts(IMPACT_SCOPES)} onChange={(v) => set((x) => void (x.scope = v))} />
              <Select label="Kind" value={i.direction} options={opts(IMPACT_DIRECTIONS)} onChange={(v) => set((x) => void (x.direction = v))} />
            </div>
            <div className="grid2">
              <Select<Level> label={harm ? "Severity (1-5)" : "Size of benefit (1-5)"} value={i.severity} options={levelOpts} onChange={(v) => set((x) => void (x.severity = v))} />
              <Select<Level> label="Likelihood (1-5)" value={i.likelihood} options={levelOpts} onChange={(v) => set((x) => void (x.likelihood = v))} />
            </div>
            {harm ? (
              <>
                <TextArea label="Mitigation" hint="Leave empty if there is none; the rating then stays as is." value={i.mitigation} onChange={(v) => set((x) => void (x.mitigation = v))} />
                <div className="grid2">
                  <Select<Level> label="Residual severity" value={i.residualSeverity} options={levelOpts} onChange={(v) => set((x) => void (x.residualSeverity = v))} />
                  <Select<Level> label="Residual likelihood" value={i.residualLikelihood} options={levelOpts} onChange={(v) => set((x) => void (x.residualLikelihood = v))} />
                </div>
              </>
            ) : null}
            <button type="button" className="ghost" onClick={() => update((d) => void d.impacts.splice(n, 1))}>
              Remove
            </button>
          </fieldset>
        );
      })}
      <button type="button" onClick={() => update((d) => void d.impacts.push(emptyImpact(d.stakeholders[0]?.id ?? "")))}>
        Add impact
      </button>
    </>
  );
}

function Monitoring({ a, update }: Props) {
  const m = a.monitoring;
  return (
    <>
      <TextArea label="Indicators to watch" value={m.indicators} onChange={(v) => update((d) => void (d.monitoring.indicators = v))} />
      <TextField label="Review cadence" value={m.reviewCadence} onChange={(v) => update((d) => void (d.monitoring.reviewCadence = v))} />
      <TextField
        label="Incident contact"
        hint="A shared mailbox or team, not a personal address."
        value={m.incidentContact}
        onChange={(v) => update((d) => void (d.monitoring.incidentContact = v))}
      />
    </>
  );
}

function Review({ a, update }: Props) {
  const r = a.review;
  return (
    <>
      <Select label="Status" value={r.status} options={opts(REVIEW_STATUSES)} onChange={(v) => update((d) => void (d.review.status = v))} />
      <TextField label="Reviewer" value={r.reviewer} onChange={(v) => update((d) => void (d.review.reviewer = v))} />
      <div className="grid2">
        <TextField label="Reviewed on" type="date" value={r.reviewDate} onChange={(v) => update((d) => void (d.review.reviewDate = v))} />
        <TextField label="Next review" type="date" value={r.nextReviewDate} onChange={(v) => update((d) => void (d.review.nextReviewDate = v))} />
      </div>
      <TextArea label="Notes" value={r.notes} onChange={(v) => update((d) => void (d.review.notes = v))} />
    </>
  );
}

export const SECTION_VIEWS: Record<SectionKey, (p: Props) => React.JSX.Element> = {
  overview: Overview,
  useCases: UseCases,
  stakeholders: Stakeholders,
  dataAndModel: DataAndModel,
  impacts: Impacts,
  monitoring: Monitoring,
  review: Review,
};
