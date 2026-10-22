import { describe, expect, it } from "vitest";
import { exampleAssessment } from "../src/lib/example";
import { fromJSON, ImportError, toJSON, toMarkdown } from "../src/lib/io";
import { emptyAssessment, emptyImpact, type Impact } from "../src/lib/model";
import { band, matrix, residualScore, score, summarise } from "../src/lib/risk";
import { clearDraft, loadDraft, saveDraft } from "../src/lib/storage";
import { completeness, validate } from "../src/lib/validate";

const harm = (over: Partial<Impact> = {}): Impact => ({ ...emptyImpact("sh-1"), description: "x", ...over });

describe("risk", () => {
  it("multiplies severity by likelihood and bands the result", () => {
    expect(score(5, 5)).toBe(25);
    expect(band(4)).toBe("low");
    expect(band(5)).toBe("moderate");
    expect(band(10)).toBe("high");
    expect(band(15)).toBe("critical");
  });

  it("keeps the inherent score for a harm with no mitigation and zero for a benefit", () => {
    expect(residualScore(harm({ severity: 4, likelihood: 4, residualSeverity: 1, residualLikelihood: 1 }))).toBe(16);
    expect(residualScore(harm({ mitigation: "m", severity: 4, likelihood: 4, residualSeverity: 1, residualLikelihood: 1 }))).toBe(1);
    expect(residualScore(harm({ direction: "benefit" }))).toBe(0);
  });

  it("summarises harms, benefits and unmitigated high harms", () => {
    const s = summarise([harm({ severity: 5, likelihood: 4 }), harm({ direction: "benefit" }), harm({ severity: 1, likelihood: 1 })]);
    expect(s).toMatchObject({ harms: 2, benefits: 1, highestInherent: "critical", unmitigatedHighHarms: 1 });
    expect(summarise([])).toMatchObject({ highestInherent: null, highestResidual: null });
  });

  it("places harms in the matrix by inherent or residual rating", () => {
    const h = harm({ severity: 4, likelihood: 2, mitigation: "m", residualSeverity: 2, residualLikelihood: 1 });
    expect(matrix([h], "inherent")[3]?.[1]).toBe(1);
    expect(matrix([h], "residual")[1]?.[0]).toBe(1);
    expect(matrix([harm({ direction: "benefit" })], "inherent").flat().every((n) => n === 0)).toBe(true);
  });
});

describe("validate", () => {
  it("flags an empty assessment in every section", () => {
    const c = completeness(validate(emptyAssessment()));
    expect(c.complete).toBe(0);
    expect(Object.values(c.bySection).every((n) => n > 0)).toBe(true);
  });

  it("passes the shipped example with no open items", () => {
    expect(validate(exampleAssessment())).toEqual([]);
  });

  it("catches an unknown stakeholder, an unmitigated risky harm and a backwards review date", () => {
    const a = exampleAssessment();
    a.impacts.push(harm({ stakeholderId: "nope", description: "bad", severity: 5, likelihood: 5 }));
    a.review.nextReviewDate = a.review.reviewDate;
    const messages = validate(a).map((i) => i.message);
    expect(messages).toContain('Impact "bad" has no valid stakeholder.');
    expect(messages).toContain('Harm "bad" is rated above low and has no mitigation.');
    expect(messages).toContain("The next review must be after this one.");
  });

  it("asks whether the absence of harms is a finding or a gap", () => {
    const a = exampleAssessment();
    a.impacts = a.impacts.filter((i) => i.direction === "benefit");
    expect(validate(a).map((i) => i.message)).toContain("No harm recorded. Is that a finding or a gap?");
  });
});

describe("json round trip", () => {
  it("returns an identical assessment", () => {
    const a = exampleAssessment();
    expect(fromJSON(toJSON(a))).toEqual(a);
  });

  it.each([
    ["not json", "{", /not valid JSON/],
    ["an array", "[]", /top level/],
    ["wrong version", JSON.stringify({ schemaVersion: 9 }), /schemaVersion/],
  ])("rejects %s", (_n, text, re) => {
    expect(() => fromJSON(text)).toThrow(re);
  });

  it("names the offending field", () => {
    const bad = JSON.parse(toJSON(exampleAssessment())) as ReturnType<typeof exampleAssessment>;
    (bad.impacts[0] as unknown as { severity: number }).severity = 9;
    expect(() => fromJSON(JSON.stringify(bad))).toThrow("impacts[0].severity must be a whole number from 1 to 5");
    const bad2 = JSON.parse(toJSON(exampleAssessment())) as Record<string, unknown>;
    bad2["useCases"] = "x";
    expect(() => fromJSON(JSON.stringify(bad2))).toThrow(ImportError);
  });
});

describe("markdown export", () => {
  it("renders every section and the disclaimer", () => {
    const md = toMarkdown(exampleAssessment());
    for (const h of ["## 1. System overview", "## 5. Impacts", "## 7. Review and sign-off", "## Open items"]) {
      expect(md).toContain(h);
    }
    expect(md).toContain("not a certification");
    expect(md).toContain("Reading Recommender (fictional)");
  });

  it("escapes pipes and line breaks in table cells and handles an empty assessment", () => {
    const a = exampleAssessment();
    a.stakeholders[0]!.name = "a|b\nc";
    expect(toMarkdown(a)).toContain(String.raw`a\|b c`);
    const md = toMarkdown(emptyAssessment());
    expect(md).toContain("Untitled system");
    expect(md).toContain("_None recorded._");
  });
});

describe("storage", () => {
  const fake = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
  };

  it("saves, loads and clears a draft", () => {
    const s = fake();
    expect(loadDraft(s)).toBeNull();
    expect(saveDraft(exampleAssessment(), s)).toBe(true);
    expect(loadDraft(s)).toEqual(exampleAssessment());
    clearDraft(s);
    expect(loadDraft(s)).toBeNull();
  });

  it("survives missing or throwing storage and corrupt data", () => {
    const boom = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); }, removeItem: () => { throw new Error("x"); } };
    expect(loadDraft(boom)).toBeNull();
    expect(saveDraft(exampleAssessment(), boom)).toBe(false);
    expect(() => clearDraft(boom)).not.toThrow();
    expect(loadDraft({ getItem: () => "{broken" })).toBeNull();
  });
});
