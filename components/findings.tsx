"use client";
import { useState } from "react";
import {
  Plus,
  ArrowUpRight,
  ArrowRight,
  Search,
  Layers,
  Quote,
  CheckCircle2,
  ShieldCheck,
  PenLine,
  Lightbulb,
  Link,
  AlertTriangle,
  GitMerge,
  X,
  SlidersHorizontal,
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
} from "./ui";
import type { Theme, Insight } from "@/lib/types";
import { sourceOf, evidenceFor, interviewCount } from "@/lib/research";
import { EvidenceForm } from "./interviews";
import { OpportunityForm } from "./discovery";
export function ThemeForm({
  theme,
  onClose,
}: {
  theme?: Theme;
  onClose: () => void;
}) {
  const { w, projectId, act, busy } = useTrace();
  return (
    <Modal
      title={theme ? "Edit theme" : "Create a research theme"}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await act(
            theme ? "theme.update" : "theme.create",
            formObject(e.currentTarget),
            theme?.id,
          );
          if (r) onClose();
        }}
      >
        <Field label="Study">
          <select
            name="projectId"
            defaultValue={theme?.projectId || projectId}
            required
          >
            {w.projects
              .filter((p) => p.status !== "Archived")
              .map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Theme name">
          <input
            name="title"
            defaultValue={theme?.title}
            required
            autoFocus
            maxLength={250}
          />
        </Field>
        <Field label="What connects the evidence?">
          <textarea
            name="explanation"
            defaultValue={theme?.explanation}
            required
            minLength={10}
            rows={4}
          />
        </Field>
        <Field label="Review status">
          <select name="status" defaultValue={theme?.status ?? "Under Review"}>
            <option>Under Review</option>
            <option>Verified</option>
            <option>Rejected</option>
          </select>
        </Field>
        <p className="help-text">
          To separate a broad theme, create a narrower one and reclassify the
          relevant excerpts in Evidence View.
        </p>
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy}>
            Save theme
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function InsightForm({
  insight,
  onClose,
}: {
  insight?: Insight;
  onClose: () => void;
}) {
  const { w, projectId, act, busy, go } = useTrace();
  const [pid, setPid] = useState(
    insight?.projectId ||
      projectId ||
      w.projects.find((p) => p.status !== "Archived")?.id ||
      "",
  );
  const [selected, setSelected] = useState<string[]>([]);
  const es = w.evidence.filter(
    (e) => sourceOf(w, e).interview?.projectId === pid,
  );
  return (
    <Modal
      title={
        insight
          ? "Edit the interpretation"
          : "Create an evidence-backed insight"
      }
      onClose={onClose}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = formObject(e.currentTarget);
          const data = insight
            ? {
                title: form.title,
                explanation: form.explanation,
                limitations: form.limitations,
                themeId: form.themeId || null,
              }
            : { ...form, themeId: form.themeId || null, evidenceIds: selected };
          const r = await act(
            insight ? "insight.update" : "insight.create",
            data,
            insight?.id,
          );
          if (r) {
            go("/insights/" + (insight?.id || r.id));
            onClose();
          }
        }}
      >
        <Field label="Study">
          <select
            name="projectId"
            value={pid}
            onChange={(e) => {
              setPid(e.target.value);
              setSelected([]);
            }}
            disabled={!!insight}
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
        <Field label="Insight title">
          <input
            name="title"
            defaultValue={insight?.title}
            required
            maxLength={250}
            autoFocus
          />
        </Field>
        <Field
          label="Interpretation"
          hint="Distinguish what participants said from what you infer."
        >
          <textarea
            name="explanation"
            defaultValue={insight?.explanation}
            rows={5}
            required
            minLength={20}
          />
        </Field>
        <Field label="Limitations & alternative explanations">
          <textarea
            name="limitations"
            defaultValue={insight?.limitations}
            rows={3}
            required
            minLength={10}
          />
        </Field>
        <Field label="Theme">
          <select name="themeId" defaultValue={insight?.themeId ?? ""}>
            <option value="">No theme</option>
            {w.themes
              .filter((t) => t.projectId === pid)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </Field>
        {!insight && (
          <fieldset className="evidence-choices">
            <legend>Supporting quotations · choose at least one</legend>
            {es.map((e) => {
              const source = sourceOf(w, e);
              return (
                <label key={e.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(e.id)}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? [...selected, e.id]
                          : selected.filter((id) => id !== e.id),
                      )
                    }
                  />
                  <span>
                    “{e.quote}”
                    <small>
                      {source.participant?.identifier} ·{" "}
                      {source.interview?.title}
                    </small>
                  </span>
                </label>
              );
            })}
            {!es.length && (
              <p>
                Save a quotation from an interview before creating an insight.
              </p>
            )}
          </fieldset>
        )}
        <div className="form-actions">
          <span className="quiet">Editing returns this finding to review.</span>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={busy || (!insight && !selected.length)}
          >
            {insight ? "Save interpretation" : "Create insight"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function Findings() {
  const { w, go } = useTrace();
  const scope = useScope();
  const [view, setView] = useState("themes");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [segment, setSegment] = useState("");
  const [date, setDate] = useState("");
  const [sort, setSort] = useState("evidence");
  const [modal, setModal] = useState("");
  const [theme, setTheme] = useState<Theme | null>(null);
  const [editEvidence, setEditEvidence] = useState<string | null>(null);
  const term = query.toLowerCase();
  const insights = scope.insights
    .filter((i) => {
      const es = evidenceFor(w, i);
      return (
        (!status || i.status === status) &&
        (!date || i.createdAt.slice(0, 10) >= date) &&
        (!segment ||
          es.some((e) => sourceOf(w, e).participant?.segment === segment)) &&
        (i.title + " " + i.explanation).toLowerCase().includes(term)
      );
    })
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "newest"
          ? b.createdAt.localeCompare(a.createdAt)
          : evidenceFor(w, b).length - evidenceFor(w, a).length,
    );
  const participantSegments = [
    ...new Set(
      scope.interviews.map(
        (i) => w.participants.find((p) => p.id === i.participantId)?.segment,
      ),
    ),
  ].filter(Boolean) as string[];
  const interviewIds = new Set(scope.interviews.map((i) => i.id));
  const evidence = w.evidence.filter(
    (e) =>
      interviewIds.has(sourceOf(w, e).interview?.id ?? "") &&
      (!segment || sourceOf(w, e).participant?.segment === segment) &&
      (e.quote + " " + e.kind).toLowerCase().includes(term),
  );
  return (
    <>
      <PageHead
        eyebrow="FROM CONVERSATIONS TO CLARITY"
        title="Themes & insights"
        description="Find the pattern. Keep the nuance. Follow the evidence."
        actions={
          <>
            <Button onClick={() => setModal("theme")}>
              <Plus size={15} /> New theme
            </Button>
            <Button variant="primary" onClick={() => setModal("insight")}>
              <Plus size={16} /> Create insight
            </Button>
          </>
        }
      />
      <div className="tabs" role="tablist" aria-label="Research views">
        {[
          ["themes", "Theme explorer"],
          ["insights", "Insight library"],
          ["evidence", "Evidence view"],
          ["segments", "Segment comparison"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            className={view === id ? "active" : ""}
            onClick={() => setView(id)}
          >
            {label}
            {id === "insights" && <span>{scope.insights.length}</span>}
          </button>
        ))}
      </div>
      <div className="filter-bar">
        <div className="search-input">
          <Search size={15} />
          <input
            aria-label="Search findings"
            placeholder="Search findings and evidence…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter review status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All review states</option>
          <option>Under Review</option>
          <option>Verified</option>
          <option>Rejected</option>
          <option>AI Suggested</option>
        </select>
        <select
          aria-label="Filter participant segment"
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
        >
          <option value="">All participant segments</option>
          {participantSegments.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {view !== "evidence" && (
          <>
            <input
              aria-label="Findings created since"
              type="date"
              value={date}
              title="Created since"
              onChange={(e) => setDate(e.target.value)}
            />
            <select
              aria-label="Sort findings"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="evidence">Most evidence</option>
              <option value="newest">Newest findings</option>
              <option value="title">Title A–Z</option>
            </select>
          </>
        )}
      </div>
      {view === "themes" && (
        <div className="theme-explorer">
          {scope.themes
            .filter(
              (t) =>
                !query ||
                t.title.toLowerCase().includes(term) ||
                insights.some((i) => i.themeId === t.id),
            )
            .filter((t) => !status || t.status === status)
            .map((t, n) => {
              const es = evidence.filter((e) => e.themeId === t.id);
              const found = insights.filter((i) => i.themeId === t.id);
              return (
                <section key={t.id} className="theme-row">
                  <div className="theme-row-heading">
                    <span className="theme-index">
                      {String(n + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h2>{t.title}</h2>
                      <p>{t.explanation}</p>
                      <div className="inline-meta">
                        <span>
                          {interviewCount(w, es)} / {scope.interviews.length}{" "}
                          interviews
                        </span>
                        <span>{es.length} excerpts</span>
                        <Status status={t.status} />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      aria-label={"Edit theme " + t.title}
                      onClick={() => setTheme(t)}
                    >
                      <PenLine size={15} />
                    </Button>
                  </div>
                  <div className="theme-findings">
                    {found.map((i) => (
                      <button
                        key={i.id}
                        onClick={() => go("/insights/" + i.id)}
                      >
                        <span>
                          <Layers size={14} />
                          <strong>{i.title}</strong>
                        </span>
                        <span>
                          <small>{evidenceFor(w, i).length} sources</small>
                          <Status status={i.status} />
                          <ArrowUpRight size={16} />
                        </span>
                      </button>
                    ))}
                    {!found.length && (
                      <p className="help-text">
                        No findings match these filters in this theme.
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
        </div>
      )}
      {view === "insights" && (
        <div className="insight-grid">
          {insights.map((i) => {
            const es = evidenceFor(w, i);
            return (
              <button
                className="insight-card"
                key={i.id}
                onClick={() => go("/insights/" + i.id)}
              >
                <div className="insight-card-top">
                  <span className="quiet">
                    {w.themes.find((t) => t.id === i.themeId)?.title ??
                      "Unclassified"}
                  </span>
                  <Status status={i.status} />
                </div>
                <h2>{i.title}</h2>
                <p>{i.explanation}</p>
                <div className="insight-card-foot">
                  <span>
                    {interviewCount(w, es)} interviews · {es.length} excerpts
                  </span>
                  {es.some((e) => e.role === "contradictory") && (
                    <Badge tone="amber">Counter-evidence</Badge>
                  )}
                  <ArrowUpRight size={18} />
                </div>
              </button>
            );
          })}
        </div>
      )}
      {view === "evidence" && (
        <>
          <div className="info-banner">
            <ShieldCheck size={18} />
            <span>
              Quotations preserve the original wording. Classification is an
              interpretation you can correct.
            </span>
          </div>
          <div className="evidence-grid">
            {evidence.map((e) => (
              <div key={e.id}>
                <QuoteCard w={w} e={e} go={go} />
                <div className="evidence-controls">
                  <Badge tone="green">{e.kind}</Badge>
                  <span>
                    {w.themes.find((t) => t.id === e.themeId)?.title ??
                      "No theme"}
                  </span>
                  <Button
                    variant="ghost"
                    aria-label={"Classify evidence " + e.id}
                    onClick={() => setEditEvidence(e.id)}
                  >
                    <PenLine size={13} />
                    Classify
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {view === "segments" && (
        <>
          <div className="info-banner amber">
            <AlertTriangle size={18} />
            <span>
              Observed coverage within this interview sample. These counts are
              not statistical differences or population prevalence. Filters
              apply to the excerpts counted below; denominators retain the full
              segment sample.
            </span>
          </div>
          <div className="table-wrap">
            <table className="segment-table">
              <thead>
                <tr>
                  <th>Research theme</th>
                  {participantSegments.map((s) => (
                    <th key={s}>
                      {s}
                      <small>
                        n ={" "}
                        {
                          scope.interviews.filter(
                            (i) =>
                              w.participants.find(
                                (p) => p.id === i.participantId,
                              )?.segment === s,
                          ).length
                        }
                      </small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scope.themes.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => {
                          setView("themes");
                          setQuery(t.title);
                        }}
                      >
                        {t.title}
                      </button>
                    </td>
                    {participantSegments.map((s) => {
                      const total = scope.interviews.filter(
                        (i) =>
                          w.participants.find((p) => p.id === i.participantId)
                            ?.segment === s,
                      ).length;
                      const es = evidence.filter(
                        (e) =>
                          e.themeId === t.id &&
                          sourceOf(w, e).participant?.segment === s,
                      );
                      const count = interviewCount(w, es);
                      return (
                        <td key={s}>
                          <span
                            className={`comparison-cell ${count ? "has-evidence" : ""}`}
                          >
                            {count} / {total}
                            <small>{es.length} excerpts</small>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {((view === "insights" && !insights.length) ||
        (view === "evidence" && !evidence.length) ||
        (!scope.themes.length && view === "themes")) && (
        <Empty
          title="No findings in this view yet"
          description="Save source quotations or adjust the filters to explore your research."
          action={
            <Button onClick={() => go("/interviews")}>Open interviews</Button>
          }
        />
      )}
      {modal === "theme" && <ThemeForm onClose={() => setModal("")} />}{" "}
      {modal === "insight" && <InsightForm onClose={() => setModal("")} />}{" "}
      {theme && <ThemeForm theme={theme} onClose={() => setTheme(null)} />}{" "}
      {editEvidence &&
        (() => {
          const e = w.evidence.find((e) => e.id === editEvidence)!;
          return (
            <EvidenceForm
              evidence={e}
              segment={sourceOf(w, e).segment!}
              onClose={() => setEditEvidence(null)}
            />
          );
        })()}
    </>
  );
}
export function InsightDetail({ id }: { id: string }) {
  const { w, go, act, busy } = useTrace();
  const i = w.insights.find((i) => i.id === id);
  const [modal, setModal] = useState("");
  const [note, setNote] = useState("");
  if (!i)
    return (
      <Empty
        title="Insight not found"
        description="This finding is not in the current workspace."
      />
    );
  const es = evidenceFor(w, i);
  const support = es.filter((e) => e.role === "supporting");
  const contra = es.filter((e) => e.role === "contradictory");
  const theme = w.themes.find((t) => t.id === i.themeId);
  const linkedOps = w.opportunities.filter((o) =>
    w.opportunityLinks.some(
      (l) => l.opportunityId === o.id && l.insightId === id,
    ),
  );
  const participants = [
    ...new Set(es.map((e) => sourceOf(w, e).participant?.segment)),
  ].filter(Boolean);
  const project = w.projects.find((p) => p.id === i.projectId);
  const archived = project?.status === "Archived";
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Themes & insights", onClick: () => go("/findings") },
          { label: theme?.title ?? "Insight" },
          { label: "Finding" },
        ]}
      />
      <div className="insight-detail">
        <div className="insight-main">
          <div className="insight-detail-meta">
            <Badge tone="indigo">RESEARCH INSIGHT</Badge>
            <Status status={i.status} />
            <span className="quiet">{i.provenance}</span>
          </div>
          <h1>{i.title}</h1>
          <p className="insight-lead">{i.explanation}</p>
          <div className="insight-evidence-summary">
            <span>
              <MessagesIcon />
              {interviewCount(w, es)} /{" "}
              {w.interviews.filter((v) => v.projectId === i.projectId).length}{" "}
              interviews
            </span>
            <span>
              <Quote size={15} />
              {es.length} linked excerpts
            </span>
            <span>
              <ShieldCheck size={15} />
              Source quotations checked
            </span>
          </div>
          <div className="interpretation-label">
            <span className="live-dot" />
            Research interpretation · sample counts do not imply prevalence
          </div>
          <div className="section-heading">
            <h2>
              Supporting evidence <span>{support.length}</span>
            </h2>
            <Button
              variant="ghost"
              disabled={archived}
              onClick={() => setModal("attach")}
            >
              <Plus size={14} />
              Attach evidence
            </Button>
          </div>
          <div className="support-grid">
            {support.map((e) => (
              <div key={e.id}>
                <QuoteCard w={w} e={e} go={go} insight={i} />
                <button
                  className="unlink-evidence"
                  disabled={busy || archived}
                  onClick={() =>
                    act("insight.detach", { evidenceId: e.id }, id)
                  }
                >
                  Remove link
                </button>
              </div>
            ))}
          </div>
          {!support.length && (
            <Empty
              title="This claim needs a source"
              description="Attach a quotation before marking the interpretation as verified."
            />
          )}
          <div className="section-heading">
            <h2>
              <AlertTriangle size={17} /> Counter-evidence{" "}
              <span>{contra.length}</span>
            </h2>
            <span className="quiet">Keep the disagreement visible.</span>
          </div>
          {contra.length ? (
            <div className="support-grid">
              {contra.map((e) => (
                <div key={e.id}>
                  <QuoteCard
                    w={w}
                    e={e}
                    go={go}
                    insight={i}
                    role="contradictory"
                  />
                  <button
                    className="unlink-evidence"
                    disabled={busy || archived}
                    onClick={() =>
                      act("insight.detach", { evidenceId: e.id }, id)
                    }
                  >
                    Remove link
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="counter-empty">
              No contradictory excerpts linked. This is not evidence of
              agreement; seek disconfirming accounts.
            </div>
          )}
          <section className="limitations">
            <div>
              <AlertTriangle size={19} />
              <h2>What this finding does — and does not — tell us</h2>
            </div>
            <p>{i.limitations}</p>
          </section>
          <div className="section-heading">
            <h2>Connected product opportunities</h2>
            <Button
              variant="ghost"
              disabled={i.status !== "Verified" || archived}
              onClick={() => setModal("opportunity")}
            >
              <Plus size={14} />
              Create opportunity
            </Button>
          </div>
          {linkedOps.map((o) => (
            <button
              className="linked-opportunity"
              key={o.id}
              onClick={() => go("/opportunities?open=" + o.id)}
            >
              <span className="finding-icon">
                <Lightbulb size={19} />
              </span>
              <span>
                <strong>{o.title}</strong>
                <small>{o.hypothesis}</small>
              </span>
              <Badge>{o.status}</Badge>
              <ArrowUpRight size={16} />
            </button>
          ))}
          {!linkedOps.length && (
            <p className="help-text">
              Verify the insight, then translate it into a testable opportunity.
              The source links travel with it.
            </p>
          )}
        </div>
        <aside className="insight-aside">
          <section className="review-panel">
            <div className="panel-heading">
              <h2>Researcher review</h2>
              <ShieldCheck size={17} />
            </div>
            <Status status={i.status} />
            <p>
              Check the source, challenge the interpretation, and preserve what
              remains uncertain.
            </p>
            <Button disabled={archived} onClick={() => setModal("edit")}>
              <PenLine size={14} />
              Edit interpretation
            </Button>
            <textarea
              aria-label="Review note"
              placeholder="Optional review note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
            <Button
              variant="primary"
              disabled={busy || archived || i.status === "Verified"}
              onClick={() =>
                act("insight.review", { status: "Verified", note }, id)
              }
            >
              <CheckCircle2 size={15} />
              Verify insight
            </Button>
            <div className="review-secondary">
              <Button
                variant="ghost"
                disabled={busy || archived}
                onClick={() =>
                  act(
                    "insight.review",
                    {
                      status: "Under Review",
                      note:
                        note ||
                        "Flagged for stronger evidence or a narrower claim.",
                    },
                    id,
                  )
                }
              >
                Flag weak claim
              </Button>
              <Button
                variant="ghost"
                disabled={busy || archived}
                onClick={() =>
                  act("insight.review", { status: "Rejected", note }, id)
                }
              >
                Reject
              </Button>
            </div>
            {i.status === "Verified" && (
              <Button
                disabled={archived}
                onClick={() => setModal("opportunity")}
              >
                <Lightbulb size={14} />
                Create opportunity
              </Button>
            )}
          </section>
          <section className="trace-chain">
            <div className="eyebrow">FOLLOW THE TRACE</div>
            {[
              {
                name: "Source interviews",
                value: interviewCount(w, es),
                path: "/interviews",
              },
              {
                name: "Verified source excerpts",
                value: es.length,
                path: "/findings",
              },
              {
                name: theme?.title ?? "Unclassified theme",
                value: "Theme",
                path: "/findings",
              },
              { name: i.title, value: i.status, path: "/insights/" + id },
              {
                name: "Product opportunities",
                value: linkedOps.length,
                path: "/opportunities",
              },
            ].map((n, x) => (
              <button key={x} onClick={() => go(n.path)}>
                <span className="chain-node">{x + 1}</span>
                <span>
                  <strong>{n.name}</strong>
                  <small>{n.value}</small>
                </span>
                <ArrowUpRight size={12} />
              </button>
            ))}
          </section>
          <section className="insight-context">
            <h3>Contributing segments</h3>
            {participants.map((p) => (
              <Badge key={p}>{p}</Badge>
            ))}
            <h3>Study</h3>
            <button
              className="text-link"
              onClick={() => go("/projects/" + i.projectId)}
            >
              {project?.name}
              <ArrowUpRight size={12} />
            </button>
            <h3>Review history</h3>
            {w.reviews
              .filter((r) => r.entityId === id)
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 5)
              .map((r) => (
                <div className="review-history" key={r.id}>
                  <strong>{r.action}</strong>
                  <small>
                    {r.note || "Researcher action"} · {r.createdAt.slice(0, 10)}
                  </small>
                </div>
              ))}
            <Button
              variant="ghost"
              disabled={archived}
              onClick={() => setModal("merge")}
            >
              <GitMerge size={14} /> Merge duplicate finding
            </Button>
          </section>
        </aside>
      </div>
      {modal === "edit" && (
        <InsightForm insight={i} onClose={() => setModal("")} />
      )}{" "}
      {modal === "opportunity" && (
        <OpportunityForm insight={i} onClose={() => setModal("")} />
      )}{" "}
      {modal === "attach" && (
        <Modal title="Attach source evidence" onClose={() => setModal("")} wide>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await act(
                "insight.attach",
                formObject(e.currentTarget),
                id,
              );
              if (r) setModal("");
            }}
          >
            <Field label="Evidence excerpt">
              <select name="evidenceId" required>
                {w.evidence
                  .filter(
                    (e) => sourceOf(w, e).interview?.projectId === i.projectId,
                  )
                  .map((e) => (
                    <option value={e.id} key={e.id}>
                      {sourceOf(w, e).participant?.identifier}:{" "}
                      {e.quote.slice(0, 130)}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Relationship to this claim">
              <select name="role">
                <option value="supporting">Supporting evidence</option>
                <option value="contradictory">Contradictory evidence</option>
              </select>
            </Field>
            <p className="help-text">
              Changing the source set returns the interpretation to review.
            </p>
            <div className="form-actions">
              <Button type="button" onClick={() => setModal("")}>
                Cancel
              </Button>
              <Button variant="primary" disabled={busy}>
                Attach evidence
              </Button>
            </div>
          </form>
        </Modal>
      )}{" "}
      {modal === "merge" && (
        <Modal title="Merge duplicate findings" onClose={() => setModal("")}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const data = formObject(e.currentTarget);
              const r = await act("insight.merge", data, id);
              if (r) {
                go("/insights/" + String(data.targetId));
                setModal("");
              }
            }}
          >
            <p>
              This finding’s evidence will be added to the selected target. This
              original stays available as rejected. Existing opportunity links
              stay on their original finding. Review the target interpretation
              after merging.
            </p>
            <Field label="Target finding">
              <select name="targetId" required>
                {w.insights
                  .filter(
                    (t) =>
                      t.id !== id &&
                      t.projectId === i.projectId &&
                      t.status !== "Rejected",
                  )
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="form-actions">
              <Button type="button" onClick={() => setModal("")}>
                Cancel
              </Button>
              <Button variant="primary" disabled={busy}>
                Merge evidence
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
function MessagesIcon() {
  return <Layers size={15} />;
}
