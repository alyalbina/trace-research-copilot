"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Quote,
  Upload,
  FileText,
  PenLine,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Download,
  MessageSquare,
} from "lucide-react";
import { useTrace, useScope } from "./context";
import {
  Button,
  PageHead,
  Field,
  Modal,
  Status,
  Badge,
  Empty,
  Breadcrumb,
  formObject,
  QuoteCard,
  download,
} from "./ui";
import type { Interview, Segment, Evidence } from "@/lib/types";
import { parseCSV } from "@/lib/ingestion";
import { sourceOf, evidenceFor } from "@/lib/research";
export function ImportDialog({
  projectId: initialProject,
  onClose,
}: {
  projectId?: string;
  onClose: () => void;
}) {
  const { w, projectId, act, busy, go, notify } = useTrace();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState<Record<string, string>[] | null>(null);
  const [title, setTitle] = useState("");
  const file = async (f?: File) => {
    if (!f) return;
    if (f.size > 2_000_000) {
      notify(
        "Files must be smaller than 2 MB. Split larger research imports.",
        true,
      );
      return;
    }
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["txt", "md", "csv"].includes(ext ?? "")) {
      notify(
        "Supported files: TXT, Markdown and documented CSV. PDF, DOCX and audio are not supported in this release.",
        true,
      );
      return;
    }
    try {
      const content = await f.text();
      setFileName(f.name);
      if (ext === "csv") {
        const rows = parseCSV(content);
        if (!rows.length) throw new Error("CSV has no interview rows.");
        setCsv(rows);
        setText("");
      } else {
        setCsv(null);
        setText(content);
        setTitle(f.name.replace(/\.[^.]+$/, ""));
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : "File could not be read.", true);
    }
  };
  return (
    <Modal title="Import interviews" onClose={onClose} wide>
      <div className="import-intro">
        <span className="import-icon">
          <Upload size={24} />
        </span>
        <div>
          <strong>Start with the original conversation.</strong>
          <p>
            Text stays in this workspace. Demo Mode does not send it to an AI
            provider.
          </p>
        </div>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = formObject(e.currentTarget);
          const pid = String(form.projectId);
          const rows = csv
            ? csv.map((r) => ({
                ...r,
                projectId: pid,
                tags: r.tags ?? "",
                notes: r.notes ?? "",
                objective: r.objective ?? "",
              }))
            : [{ ...form, title, transcript: text }];
          const result = await act("interview.import", rows);
          if (result) {
            go("/interviews/" + result.id);
            onClose();
          }
        }}
      >
        <Field label="Research study">
          <select
            name="projectId"
            defaultValue={
              initialProject ||
              projectId ||
              w.projects.find((p) => p.status !== "Archived")?.id
            }
            required
          >
            {w.projects
              .filter((p) => p.status !== "Archived")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </Field>
        <label
          className="upload-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            file(e.dataTransfer.files[0]);
          }}
        >
          <Upload size={22} />
          <strong>{fileName || "Choose a file or drop it here"}</strong>
          <span>TXT, Markdown, or CSV · up to 2 MB</span>
          <input
            type="file"
            accept=".txt,.md,.csv"
            aria-label="Upload transcript file"
            onChange={(e) => file(e.target.files?.[0])}
          />
        </label>
        {csv ? (
          <div className="info-banner green">
            <CheckCircle2 size={18} />
            <span>
              {csv.length} CSV interview records ready to import.
              <small>
                Each row has its own participant, segment, date and transcript.
              </small>
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCsv(null);
                setFileName("");
              }}
            >
              Use pasted text
            </Button>
          </div>
        ) : (
          <>
            <div className="form-grid">
              <Field label="Interview title">
                <input
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="A short, meaningful title"
                  maxLength={250}
                />
              </Field>
              <Field label="Interview date">
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </Field>
              <Field
                label="Participant identifier"
                hint="Use an anonymous identifier, rather than a full name."
              >
                <input
                  name="participant"
                  required
                  placeholder="e.g. P13"
                  maxLength={100}
                />
              </Field>
              <Field label="Participant segment">
                <input
                  name="segment"
                  required
                  placeholder="e.g. Abandoned onboarding"
                  maxLength={250}
                />
              </Field>
            </div>
            <Field
              label="Or paste the transcript"
              hint="Keep original speaker labels and timestamps if available. Minimum 60 characters."
            >
              <textarea
                className="transcript-input"
                name="transcript"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={9}
                minLength={60}
                maxLength={200000}
                required
                placeholder={
                  "Researcher: What happened when you tried to sign up?\nP13: …"
                }
              />
            </Field>
            <Field label="Tags">
              <input
                name="tags"
                placeholder="Comma-separated tags, e.g. onboarding, trust"
                maxLength={1000}
              />
            </Field>
            <input name="notes" type="hidden" value="" />
            <input name="objective" type="hidden" value="" />
          </>
        )}
        <details className="csv-guide">
          <summary>CSV format and supported files</summary>
          <p>
            Required headers:{" "}
            <code>title,participant,segment,date,transcript</code>. Date format:
            YYYY-MM-DD. Quote transcript fields containing commas or newlines;
            double embedded quotation marks. Optional: tags, notes, objective.
            All rows import atomically; duplicates or malformed records are
            rejected.
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              download(
                "trace-import-example.csv",
                'title,participant,segment,date,transcript\n"Example interview","P13","New user","2026-10-14","Researcher: What happened when you signed up?\nP13: I could not find the next step after sending my document, so I came back later."\n',
                "text/csv",
              )
            }
          >
            <Download size={14} /> Download CSV example
          </Button>
          <p>
            PDF, DOCX, and audio are not supported in this MVP. Convert to text
            before importing.
          </p>
        </details>
        <div className="form-actions">
          <span className="quiet">
            Original wording and source offsets are preserved.
          </span>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy}>
            <Plus size={15} />
            Import {csv ? csv.length + " interviews" : "interview"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function Interviews() {
  const { w, go, route } = useTrace();
  const scope = useScope();
  const [importing, setImporting] = useState(false);
  const [query, setQuery] = useState("");
  const routeSegment = new URLSearchParams(route.split("?")[1]).get("segment");
  const [segment, setSegment] = useState(routeSegment ?? "");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  useEffect(() => setSegment(routeSegment ?? ""), [routeSegment]);
  const segments = [
    ...new Set(
      scope.interviews.map(
        (i) => w.participants.find((p) => p.id === i.participantId)?.segment,
      ),
    ),
  ].filter(Boolean);
  const interviews = scope.interviews
    .filter((i) => {
      const p = w.participants.find((p) => p.id === i.participantId);
      return (
        (!segment || p?.segment === segment) &&
        (!status || i.analysisStatus === status) &&
        (i.title + " " + i.transcript + " " + i.tags + " " + p?.identifier)
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    })
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "oldest"
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date),
    );
  return (
    <>
      <PageHead
        eyebrow="THE PRIMARY SOURCE"
        title="Interviews"
        description="Every conversation, preserved in its own words."
        actions={
          <Button variant="primary" onClick={() => setImporting(true)}>
            <Plus size={16} /> Import interviews
          </Button>
        }
      />
      <div className="filter-bar">
        <div className="search-input">
          <Search size={16} />
          <input
            aria-label="Search interviews and transcript text"
            placeholder="Search titles, participants or transcript text…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter participant segment"
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
        >
          <option value="">All segments</option>
          {segments.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter analysis status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option>Demo analyzed</option>
          <option>Manual review</option>
        </select>
        <select
          aria-label="Sort interviews"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>
      <div className="table-meta">
        <span>{interviews.length} interviews</span>
        <span>
          <ShieldCheck size={13} />
          Original wording retained
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Interview</th>
              <th>Participant</th>
              <th>Segment</th>
              <th>Date</th>
              <th>Evidence</th>
              <th>Analysis</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((i) => {
              const p = w.participants.find((p) => p.id === i.participantId);
              const evidence = w.evidence.filter(
                (e) => sourceOf(w, e).interview?.id === i.id,
              );
              return (
                <tr key={i.id}>
                  <td>
                    <button
                      className="interview-title"
                      onClick={() => go("/interviews/" + i.id)}
                    >
                      <span className="table-icon">
                        <MessageSquare size={16} />
                      </span>
                      <span>
                        <strong>{i.title}</strong>
                        <small>
                          {w.projects.find((p) => p.id === i.projectId)?.name} ·{" "}
                          {i.synthetic ? "Synthetic" : "Imported"}
                        </small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span className="participant-cell">
                      <span className="avatar tiny">{p?.identifier}</span>
                      {p?.identifier}
                    </span>
                  </td>
                  <td>{p?.segment}</td>
                  <td className="nowrap">{i.date}</td>
                  <td>{evidence.length} excerpts</td>
                  <td>
                    <Badge tone={i.synthetic ? "indigo" : "neutral"}>
                      {i.analysisStatus}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!interviews.length && (
        <Empty
          title="No matching conversations"
          description="Adjust your filters, or import a new interview to this study."
          action={
            <Button onClick={() => setImporting(true)}>
              Import an interview
            </Button>
          }
        />
      )}{" "}
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </>
  );
}
export function EvidenceForm({
  segment,
  evidence,
  onClose,
  quote,
}: {
  segment: Segment;
  evidence?: Evidence;
  quote?: string;
  onClose: () => void;
}) {
  const { w, act, busy } = useTrace();
  const i = w.interviews.find((i) => i.id === segment.interviewId)!;
  return (
    <Modal
      title={evidence ? "Classify source evidence" : "Save source evidence"}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = formObject(e.currentTarget);
          const r = await act(
            evidence ? "evidence.update" : "evidence.create",
            {
              ...data,
              ...(!evidence
                ? { segmentId: segment.id, quote: quote ?? segment.text }
                : {}),
              themeId: data.themeId || null,
            },
            evidence?.id,
          );
          if (r) onClose();
        }}
      >
        <div className="evidence-preview">
          <Quote size={18} />
          <blockquote>“{evidence?.quote ?? quote ?? segment.text}”</blockquote>
          <small>{segment.id} · exact source text</small>
        </div>
        <Field label="Classification">
          <select name="kind" defaultValue={evidence?.kind ?? "Observation"}>
            {[
              "Pain point",
              "Need",
              "Workaround",
              "Observation",
              "Motivation",
              "Feature request",
            ].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Link to a theme">
          <select name="themeId" defaultValue={evidence?.themeId ?? ""}>
            <option value="">No theme yet</option>
            {w.themes
              .filter((t) => t.projectId === i.projectId)
              .map((t) => (
                <option value={t.id} key={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </Field>
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy}>
            {evidence ? "Save classification" : "Save quotation"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function MetadataForm({
  interview,
  onClose,
}: {
  interview: Interview;
  onClose: () => void;
}) {
  const { w, act, busy } = useTrace();
  const p = w.participants.find((p) => p.id === interview.participantId);
  return (
    <Modal title="Interview details & researcher notes" onClose={onClose} wide>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await act(
            "interview.update",
            formObject(e.currentTarget),
            interview.id,
          );
          if (r) onClose();
        }}
      >
        <Field label="Interview title">
          <input name="title" defaultValue={interview.title} required />
        </Field>
        <div className="form-grid">
          <Field label="Participant identifier">
            <input name="participant" defaultValue={p?.identifier} required />
          </Field>
          <Field label="Participant segment">
            <input name="segment" defaultValue={p?.segment} required />
          </Field>
        </div>
        <Field label="Interview date">
          <input
            type="date"
            name="date"
            defaultValue={interview.date}
            required
          />
        </Field>
        <Field label="Tags" hint="Separate tags with commas.">
          <input name="tags" defaultValue={interview.tags} />
        </Field>
        <Field label="Research objective">
          <textarea
            name="objective"
            defaultValue={interview.objective}
            rows={2}
          />
        </Field>
        <Field label="Researcher notes">
          <textarea name="notes" defaultValue={interview.notes} rows={5} />
        </Field>
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy}>
            Save interview details
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function InterviewDetail({ id }: { id: string }) {
  const { w, go, route, act, busy, journey } = useTrace();
  const interview = w.interviews.find((i) => i.id === id);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState<{
    s: Segment;
    quote?: string;
    e?: Evidence;
  } | null>(null);
  const [selected, setSelected] = useState<{
    s: Segment;
    quote: string;
  } | null>(null);
  const params = new URLSearchParams(route.split("?")[1]);
  const segmentId = params.get("segment");
  const insightId = params.get("insight");
  useEffect(() => {
    if (segmentId) {
      const t = setTimeout(
        () =>
          document.getElementById(segmentId)?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
            block: "center",
          }),
        120,
      );
      return () => clearTimeout(t);
    }
  }, [segmentId, id]);
  if (!interview)
    return (
      <Empty
        title="Interview not found"
        description="This source link does not resolve in your workspace."
      />
    );
  const participant = w.participants.find(
    (p) => p.id === interview.participantId,
  );
  const segments = w.segments
    .filter((s) => s.interviewId === id)
    .sort((a, b) => a.position - b.position);
  const evidence = w.evidence.filter(
    (e) => sourceOf(w, e).interview?.id === id,
  );
  const related = w.insights.filter((i) =>
    w.insightLinks.some(
      (l) =>
        l.insightId === i.id && evidence.some((e) => e.id === l.evidenceId),
    ),
  );
  const focus = related.find((i) => i.id === insightId) ?? related[0];
  const matches = segments.filter((s) =>
    s.text.toLowerCase().includes(search.toLowerCase()),
  );
  const jump = (s: Segment) =>
    go(
      `/interviews/${id}?segment=${s.id}${insightId ? "&insight=" + insightId : ""}`,
    );
  const renderText = (s: Segment) => {
    const q = search
      ? s.text.match(new RegExp(escapeRegExp(search), "i"))?.[0]
      : evidence.find((e) => e.segmentId === s.id)?.quote;
    if (!q) return s.text;
    const at = s.text.indexOf(q);
    return (
      <>
        {s.text.slice(0, at)}
        <mark>{q}</mark>
        {s.text.slice(at + q.length)}
      </>
    );
  };
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Interviews", onClick: () => go("/interviews") },
          { label: interview.title },
        ]}
      />
      {insightId && (
        <button
          className="back-link"
          onClick={() => go("/insights/" + insightId)}
        >
          <ArrowLeft size={14} />
          Back to the finding
        </button>
      )}
      <div className="reader-heading">
        <div>
          <div className="eyebrow">ORIGINAL CONVERSATION</div>
          <h1>{interview.title}</h1>
          <div className="reader-meta">
            <span className="avatar tiny">{participant?.identifier}</span>
            <strong>{participant?.identifier}</strong>
            <span>{participant?.segment}</span>
            <span>{interview.date}</span>
            <Badge tone={interview.synthetic ? "amber" : "neutral"}>
              {interview.synthetic
                ? "Synthetic interview"
                : "Imported transcript"}
            </Badge>
          </div>
        </div>
        <Button onClick={() => setEdit(true)}>
          <PenLine size={14} /> Edit details
        </Button>
      </div>
      <div className="reader-layout">
        <aside className="transcript-nav">
          <div className="reader-section-label">
            IN THIS CONVERSATION <span>{segments.length}</span>
          </div>
          <div className="search-input">
            <Search size={14} />
            <input
              aria-label="Search this transcript"
              placeholder="Find in transcript…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <small className="search-count">
              {matches.length} matching passages
            </small>
          )}
          <div className="passage-nav">
            {(search
              ? matches
              : segments.filter((s) => s.speaker !== "Researcher")
            ).map((s) => (
              <button
                className={s.id === segmentId ? "selected" : ""}
                key={s.id}
                onClick={() => jump(s)}
              >
                <span>§{String(s.position).padStart(2, "0")}</span>
                <span>{s.text.slice(0, 70)}…</span>
                {evidence.some((e) => e.segmentId === s.id) && (
                  <span className="evidence-dot" />
                )}
              </button>
            ))}
          </div>
          <div className="reader-tip">
            <Quote size={17} />
            <p>
              Select a passage to save a precise quotation, or save an entire
              participant response.
            </p>
          </div>
        </aside>
        <section className="transcript-paper">
          <header>
            <span>
              <FileText size={15} />
              Transcript
            </span>
            <Badge tone="green">
              <CheckCircle2 size={11} />
              Original wording
            </Badge>
          </header>
          {segments.map((s) => (
            <article
              id={s.id}
              key={s.id}
              className={`transcript-segment ${s.speaker === "Researcher" ? "researcher" : ""} ${s.id === segmentId ? "focused" : ""}`}
              onMouseUp={(e) => {
                const sel = window.getSelection();
                const text = sel?.toString() ?? "";
                if (
                  text.length >= 8 &&
                  sel?.anchorNode &&
                  sel.focusNode &&
                  e.currentTarget.contains(sel.anchorNode) &&
                  e.currentTarget.contains(sel.focusNode) &&
                  s.text.includes(text)
                ) {
                  setSelected({ s, quote: text });
                } else setSelected(null);
              }}
            >
              <div className="segment-heading">
                <span>{s.speaker ?? "Unlabeled speaker"}</span>
                <small>{s.timestamp ?? `§${s.position}`}</small>
                {s.speaker !== "Researcher" && (
                  <button
                    className="save-passage"
                    aria-label={`Save evidence from passage ${s.position}`}
                    onClick={() => setSaving({ s })}
                  >
                    <Quote size={13} />
                    Save excerpt
                  </button>
                )}
              </div>
              <p>{renderText(s)}</p>
              {s.id === segmentId && journey?.insightId === insightId && (
                <div className="source-journey-next">
                  <p>
                    Read the context above and below this quote, then compare it
                    with the finding.
                  </p>
                  <Button
                    onClick={() => go(`/insights/${insightId}?guide=review`)}
                  >
                    Continue to review <ArrowRight size={16} />
                  </Button>
                </div>
              )}
              {evidence
                .filter((e) => e.segmentId === s.id)
                .map((e) => (
                  <button
                    className="evidence-tag"
                    key={e.id}
                    onClick={() => setSaving({ s, e })}
                  >
                    <Tag size={11} />
                    {e.kind}
                    {e.themeId &&
                      " · " + w.themes.find((t) => t.id === e.themeId)?.title}
                    <PenLine size={10} />
                  </button>
                ))}
            </article>
          ))}
          <div className="transcript-end">
            End of transcript · {segments.length} persistent segments
            <br />
            <small>No speaker identities or timestamps were inferred.</small>
          </div>
        </section>
        <aside className="findings-panel">
          <div className="reader-section-label">
            CONNECTED FINDINGS <span>{related.length}</span>
          </div>
          {focus ? (
            <>
              <button
                className="connected-insight"
                onClick={() => go("/insights/" + focus.id)}
              >
                <Status status={focus.status} />
                <h3>{focus.title}</h3>
                <p>{focus.explanation}</p>
                <span>
                  Open insight <ArrowUpRight size={13} />
                </span>
              </button>
              <div className="reader-section-label">RELATED EVIDENCE</div>
              {evidenceFor(w, focus)
                .filter((e) => sourceOf(w, e).interview?.id !== id)
                .slice(0, 2)
                .map((e) => (
                  <QuoteCard
                    key={e.id}
                    w={w}
                    e={e}
                    go={go}
                    insight={focus}
                    role={e.role}
                    compact
                  />
                ))}
              {related
                .filter((i) => i.id !== focus.id)
                .map((i) => (
                  <button
                    className="mini-finding"
                    key={i.id}
                    onClick={() => go("/insights/" + i.id)}
                  >
                    {i.title}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
            </>
          ) : (
            <div className="reader-empty">
              <LayersIcon />
              <h3>Evidence comes first.</h3>
              <p>
                Save a quote, link it to a theme, then create an insight in
                Themes & Insights.
              </p>
              <Button onClick={() => go("/findings")}>Open findings</Button>
            </div>
          )}
          <div className="reader-section-label">INTERVIEW TAGS</div>
          <div className="tag-list">
            {interview.tags
              .split(",")
              .filter(Boolean)
              .map((t) => (
                <Badge key={t}>{t.trim()}</Badge>
              ))}
            <button
              onClick={() => setEdit(true)}
              aria-label="Edit interview tags"
            >
              <Plus size={13} />
            </button>
          </div>
          <div className="reader-section-label">RESEARCHER NOTES</div>
          <p className="reader-note">{interview.notes || "No notes yet."}</p>
          <Button variant="ghost" onClick={() => setEdit(true)}>
            <PenLine size={13} />
            Edit notes
          </Button>
          <div className="reader-validation">
            <ShieldCheck size={18} />
            <p>
              {interview.synthetic
                ? "Precomputed demo findings"
                : "Manual review mode"}
            </p>
            <small>
              Live AI is not configured. Source validation checks exact quotes.
            </small>
            <Button
              disabled={busy}
              onClick={() =>
                act("demo.validate", { projectId: interview.projectId })
              }
            >
              Validate sources
            </Button>
          </div>
        </aside>
      </div>
      {selected && (
        <div className="selection-toolbar">
          <Quote size={14} />
          <span>{selected.quote.length} characters selected</span>
          <Button
            variant="primary"
            onClick={() => {
              setSaving(selected);
              setSelected(null);
            }}
          >
            Save quotation
          </Button>
          <Button variant="ghost" onClick={() => setSelected(null)}>
            Dismiss
          </Button>
        </div>
      )}
      {edit && (
        <MetadataForm interview={interview} onClose={() => setEdit(false)} />
      )}{" "}
      {saving && (
        <EvidenceForm
          segment={saving.s}
          quote={saving.quote}
          evidence={saving.e}
          onClose={() => setSaving(null)}
        />
      )}
    </>
  );
}
function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function LayersIcon() {
  return <Quote size={25} />;
}
