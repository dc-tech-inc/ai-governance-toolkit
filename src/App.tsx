import { useEffect, useMemo, useRef, useState } from "react";
import { SECTION_VIEWS, type Update } from "./components/Sections";
import { exampleAssessment } from "./lib/example";
import { fromJSON, ImportError, toJSON, toMarkdown } from "./lib/io";
import { SECTIONS, emptyAssessment, type Assessment, type SectionKey } from "./lib/model";
import { clearDraft, loadDraft, saveDraft } from "./lib/storage";
import { completeness, validate } from "./lib/validate";

export function download(filename: string, mime: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const slug = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "assessment";

export function App() {
  const [a, setA] = useState<Assessment>(() => loadDraft() ?? emptyAssessment());
  const [section, setSection] = useState<SectionKey>("overview");
  const [notice, setNotice] = useState("");
  const [confirmBlank, setConfirmBlank] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveDraft(a);
  }, [a]);

  const update: Update = (change) =>
    setA((prev) => {
      const next = structuredClone(prev);
      change(next);
      return next;
    });

  const issues = useMemo(() => validate(a), [a]);
  const done = useMemo(() => completeness(issues), [issues]);
  const current = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0]!;
  const View = SECTION_VIEWS[current.key];
  const sectionIssues = issues.filter((i) => i.section === current.key);

  const importFile = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    try {
      setA(fromJSON(await file.text()));
      setNotice(`Imported ${file.name}.`);
    } catch (e) {
      setNotice(e instanceof ImportError ? `Import failed: ${e.message}` : "Import failed: could not read the file.");
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <div className="shell">
      <header className="top">
        <div>
          <h1>AI impact assessment</h1>
          <p className="sub">
            A self-assessment workbook aligned in spirit to ISO/IEC 42005:2025. Not a certification. Everything stays in your browser.
          </p>
        </div>
        <div className="actions" role="toolbar" aria-label="Assessment actions">
          <button type="button" onClick={() => { setA(exampleAssessment()); setNotice("Loaded the fictional example."); }}>
            Load example
          </button>
          {confirmBlank ? (
            <>
              <button type="button" className="danger" onClick={() => { setA(emptyAssessment()); clearDraft(); setConfirmBlank(false); setNotice("Started a blank assessment."); }}>
                Discard and start blank
              </button>
              <button type="button" className="ghost" onClick={() => setConfirmBlank(false)}>
                Keep editing
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmBlank(true)}>Start blank</button>
          )}
          <button type="button" onClick={() => fileInput.current?.click()}>Import JSON</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden aria-label="Import assessment JSON file" onChange={(e) => void importFile(e.target.files?.[0])} />
          <button type="button" onClick={() => download(`${slug(a.overview.name)}.json`, "application/json", toJSON(a))}>
            Export JSON
          </button>
          <button type="button" onClick={() => download(`${slug(a.overview.name)}.md`, "text/markdown", toMarkdown(a))}>
            Export Markdown
          </button>
        </div>
      </header>
      <p className="notice" role="status" aria-live="polite">{notice}</p>

      <div className="body">
        <nav aria-label="Assessment sections" className="ledger">
          <p className="ledger-title">
            <span data-testid="progress">{done.complete} of {done.total}</span> sections complete
          </p>
          <ol>
            {SECTIONS.map((s, n) => {
              const open = done.bySection[s.key];
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    className="nav"
                    aria-current={s.key === section ? "page" : undefined}
                    onClick={() => setSection(s.key)}
                  >
                    <span className="num">{n + 1}</span>
                    <span className="name">{s.title}</span>
                    <span className={open === 0 ? "state ok" : "state"}>{open === 0 ? "done" : `${open} open`}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <main>
          <h2>{current.title}</h2>
          <p className="hint">{current.hint}</p>
          <View a={a} update={update} />
          <section aria-label="Open items for this section" className="open-items">
            <h3>Open items</h3>
            {sectionIssues.length === 0 ? (
              <p className="ok-note">Nothing open in this section.</p>
            ) : (
              <ul>{sectionIssues.map((i, n) => <li key={n}>{i.message}</li>)}</ul>
            )}
          </section>
        </main>
      </div>
      <footer>
        <p>
          Own structure, not the text of the standard. Buy and read the standard on the{" "}
          <a href="https://www.iso.org/standard/42005.html" rel="noreferrer">ISO page for ISO/IEC 42005:2025</a>. MIT licensed.
        </p>
      </footer>
    </div>
  );
}
