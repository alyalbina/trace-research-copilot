"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowRight,
  Lightbulb,
  Columns3,
  List,
  PenLine,
  Quote,
  ShieldCheck,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  Send,
  ChevronRight,
  Settings,
  Link,
  RefreshCw,
  LoaderCircle,
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
  formObject,
  QuoteCard,
  download,
  Breadcrumb,
} from "./ui";
import type { Insight, Opportunity, Report } from "@/lib/types";
import {
  evidenceFor,
  sourceOf,
  priority,
  retrieve,
  evaluate,
} from "@/lib/research";
import { validateQuote } from "@/lib/ingestion";
const statuses = ["Discovery", "Validating", "Planned", "Parked"];
export function OpportunityForm({
  insight,
  opportunity,
  onClose,
}: {
  insight?: Insight;
  opportunity?: Opportunity;
  onClose: () => void;
}) {
  const { w, projectId, act, busy, go } = useTrace();
  const [pid, setPid] = useState(
    insight?.projectId ||
      opportunity?.projectId ||
      projectId ||
      w.projects.find((p) => p.status !== "Archived")?.id ||
      "",
  );
  const [linked, setLinked] = useState(
    insight
      ? [insight.id]
      : w.opportunityLinks
          .filter((l) => l.opportunityId === opportunity?.id)
          .map((l) => l.insightId),
  );
  return (
    <Modal
      title={
        opportunity
          ? "Edit product opportunity"
          : "Create a product opportunity"
      }
      onClose={onClose}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await act(
            opportunity ? "opportunity.update" : "opportunity.create",
            {
              ...formObject(e.currentTarget),
              projectId: pid,
              insightIds: linked,
            },
            opportunity?.id,
          );
          if (r) {
            go("/opportunities?open=" + r.id);
            onClose();
          }
        }}
      >
        <div className="info-banner">
          <Lightbulb size={18} />
          <span>
            A candidate direction for validation. Impact, confidence and effort
            are estimates.
          </span>
        </div>
        <Field label="Study">
          <select
            name="projectId"
            value={pid}
            disabled={!!insight || !!opportunity}
            onChange={(e) => {
              setPid(e.target.value);
              setLinked([]);
            }}
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
        <Field label="Opportunity title">
          <input
            name="title"
            required
            autoFocus
            defaultValue={
              opportunity?.title ??
              (insight?.id === "i-uncertain"
                ? "Improve verification transparency and progress feedback."
                : "")
            }
            maxLength={250}
          />
        </Field>
        <Field label="Customer problem">
          <textarea
            name="problem"
            required
            minLength={10}
            defaultValue={opportunity?.problem ?? insight?.explanation}
            rows={3}
          />
        </Field>
        <Field label="Testable product hypothesis">
          <textarea
            name="hypothesis"
            required
            minLength={10}
            defaultValue={
              opportunity?.hypothesis ??
              (insight
                ? "If we provide a clearer next step at the point of friction, participants may understand what to do and feel more able to continue. Test this before committing to a solution."
                : "")
            }
            rows={3}
          />
        </Field>
        <div className="form-grid">
          <Field label="Proposed solution direction">
            <textarea
              name="direction"
              defaultValue={opportunity?.direction ?? ""}
              rows={2}
            />
          </Field>
          <Field label="Target segment">
            <textarea
              name="segment"
              defaultValue={
                opportunity?.segment ??
                (insight
                  ? [
                      ...new Set(
                        evidenceFor(w, insight).map(
                          (e) => sourceOf(w, e).participant?.segment,
                        ),
                      ),
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : "")
              }
              rows={2}
            />
          </Field>
          <Field label="Assumptions">
            <textarea
              name="assumptions"
              defaultValue={
                opportunity?.assumptions ??
                "The observed friction is relevant to the target customers, and clearer information can address it."
              }
              rows={2}
            />
          </Field>
          <Field label="Expected user outcome">
            <textarea
              name="outcome"
              defaultValue={
                opportunity?.outcome ??
                "Customers understand the next step and can make an informed decision."
              }
              rows={2}
            />
          </Field>
        </div>
        <Field label="Validation plan">
          <textarea
            name="validation"
            defaultValue={
              opportunity?.validation ??
              "Test a prototype with representative participants. Ask them to explain the next step and seek disconfirming feedback."
            }
            rows={3}
          />
        </Field>
        <Field
          label="Proposed success metric"
          hint="A metric to measure in a future test, not a measured result."
        >
          <textarea
            name="metric"
            defaultValue={
              opportunity?.metric ??
              "Next-step comprehension and task completion in a prototype test."
            }
            rows={2}
          />
        </Field>
        <Field label="Risks">
          <textarea
            name="risk"
            defaultValue={
              opportunity?.risk ??
              "Additional information may create friction; copy alone may not address the underlying process."
            }
            rows={2}
          />
        </Field>
        <div className="form-grid three">
          {[
            ["impact", "Estimated impact"],
            ["confidence", "Research confidence"],
            ["effort", "Estimated effort"],
          ].map(([name, label]) => (
            <Field key={name} label={label}>
              <select
                name={name}
                defaultValue={
                  opportunity?.[name as "impact" | "confidence" | "effort"] ?? 2
                }
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
        <Field label="Workflow status">
          <select
            name="status"
            defaultValue={opportunity?.status ?? "Discovery"}
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <fieldset className="linked-insight-choices">
          <legend>Supporting insights</legend>
          {w.insights
            .filter(
              (i) =>
                i.projectId === pid &&
                (i.status === "Verified" || linked.includes(i.id)),
            )
            .map((i) => (
              <label className="inline-check" key={i.id}>
                <input
                  type="checkbox"
                  checked={linked.includes(i.id)}
                  onChange={(e) =>
                    setLinked(
                      e.target.checked
                        ? [...linked, i.id]
                        : linked.filter((x) => x !== i.id),
                    )
                  }
                />
                <span>
                  {i.title} <Status status={i.status} />
                </span>
              </label>
            ))}
          {!w.insights.some(
            (i) => i.projectId === pid && i.status === "Verified",
          ) && (
            <p className="help-text">
              No verified insights in this study. A manual opportunity can be
              saved without evidence, but it must be reviewed before
              prioritization.
            </p>
          )}
        </fieldset>
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy}>
            Save opportunity <ArrowRight size={14} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function Opportunities() {
  const { w, go, act, busy, route } = useTrace();
  const scope = useScope();
  const [view, setView] = useState("kanban");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("priority");
  const [create, setCreate] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const openId = new URLSearchParams(route.split("?")[1]).get("open");
  const open = w.opportunities.find((o) => o.id === openId);
  const opportunities = scope.opportunities
    .filter(
      (o) =>
        (!filter || o.status === filter) &&
        (o.title + " " + o.problem + " " + o.segment)
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "newest"
          ? b.createdAt.localeCompare(a.createdAt)
          : priority(b) - priority(a),
    );
  return (
    <>
      <PageHead
        eyebrow="TURN UNDERSTANDING INTO ACTION"
        title="Opportunity board"
        description="Evidence-informed directions. Testable hypotheses. Thoughtful next steps."
        actions={
          <Button variant="primary" onClick={() => setCreate(true)}>
            <Plus size={16} /> New opportunity
          </Button>
        }
      />
      <div className="filter-bar">
        <div className="search-input">
          <Search size={16} />
          <input
            aria-label="Search opportunities"
            placeholder="Search opportunities…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter opportunity status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Sort opportunities"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="priority">Highest estimated priority</option>
          <option value="newest">Newest first</option>
          <option value="title">Title A–Z</option>
        </select>
        <div className="view-switch">
          <Button
            variant={view === "kanban" ? "default" : "ghost"}
            onClick={() => setView("kanban")}
            aria-label="Kanban view"
            aria-pressed={view === "kanban"}
          >
            <Columns3 size={16} />
          </Button>
          <Button
            variant={view === "table" ? "default" : "ghost"}
            onClick={() => setView("table")}
            aria-label="Table view"
            aria-pressed={view === "table"}
          >
            <List size={16} />
          </Button>
        </div>
      </div>
      <div className="priority-explanation">
        <Lightbulb size={14} /> Priority = estimated impact × research
        confidence ÷ estimated effort. An aid for discussion, not an objective
        business forecast.
      </div>
      {view === "kanban" ? (
        <div className="kanban">
          {statuses
            .filter((s) => !filter || s === filter)
            .map((status, n) => (
              <section
                className="kanban-column"
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/trace-opportunity");
                  if (opportunities.some((o) => o.id === id))
                    act("opportunity.status", { status }, id);
                }}
              >
                <div className="kanban-heading">
                  <span className={"status-dot dot-" + n} />
                  <h2>{status}</h2>
                  <span>
                    {opportunities.filter((o) => o.status === status).length}
                  </span>
                  <Button
                    variant="ghost"
                    aria-label={"Create opportunity in " + status}
                    onClick={() => setCreate(true)}
                  >
                    <Plus size={13} />
                  </Button>
                </div>
                {opportunities
                  .filter((o) => o.status === status)
                  .map((o) => (
                    <button
                      key={o.id}
                      className="opportunity-card"
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/trace-opportunity", o.id)
                      }
                      onClick={() => go("/opportunities?open=" + o.id)}
                    >
                      <span className="eyebrow">CANDIDATE OPPORTUNITY</span>
                      <h3>{o.title}</h3>
                      <p>{o.hypothesis}</p>
                      <div className="opportunity-evidence">
                        <Link size={12} />
                        {
                          w.opportunityLinks.filter(
                            (l) => l.opportunityId === o.id,
                          ).length
                        }{" "}
                        linked insights
                      </div>
                      <div className="opportunity-card-foot">
                        <span>
                          Priority <strong>{priority(o)}</strong>
                        </span>
                        <small>
                          Impact {o.impact} · Effort {o.effort}
                        </small>
                        <ArrowUpRight size={14} />
                      </div>
                    </button>
                  ))}
                {!opportunities.some((o) => o.status === status) && (
                  <div className="kanban-empty">
                    No opportunities here yet.
                    <br />
                    Move a card here or change its status.
                  </div>
                )}
              </section>
            ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>Status</th>
                <th>Impact</th>
                <th>Confidence</th>
                <th>Effort</th>
                <th>Priority</th>
                <th>Sources</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.id}>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => go("/opportunities?open=" + o.id)}
                    >
                      {o.title}
                      <ArrowUpRight size={13} />
                    </button>
                  </td>
                  <td>
                    <select
                      aria-label={"Status for " + o.title}
                      value={o.status}
                      disabled={busy}
                      onChange={(e) =>
                        act(
                          "opportunity.status",
                          { status: e.target.value },
                          o.id,
                        )
                      }
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>{o.impact}/5</td>
                  <td>{o.confidence}/5</td>
                  <td>{o.effort}/5</td>
                  <td>{priority(o)}</td>
                  <td>
                    {
                      w.opportunityLinks.filter((l) => l.opportunityId === o.id)
                        .length
                    }{" "}
                    insights
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!opportunities.length && (
        <Empty
          title="A finding is the beginning of a possibility"
          description="Create an opportunity from a verified insight or describe a manual hypothesis."
          action={
            <Button onClick={() => setCreate(true)}>Create opportunity</Button>
          }
        />
      )}
      {open && (
        <Modal
          title="Product opportunity"
          onClose={() => go("/opportunities")}
          drawer
        >
          <div className="opportunity-detail">
            <Badge tone="amber">Unvalidated recommendation</Badge>
            <h1>{open.title}</h1>
            <div className="form-grid">
              <Field label="Workflow status">
                <select
                  value={open.status}
                  disabled={busy}
                  onChange={(e) =>
                    act(
                      "opportunity.status",
                      { status: e.target.value },
                      open.id,
                    )
                  }
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <div className="opportunity-score">
                <small>Estimated priority</small>
                <strong>{priority(open)}</strong>
              </div>
            </div>
            {[
              ["Customer problem", open.problem],
              ["Product hypothesis", open.hypothesis],
              ["Solution direction", open.direction],
              ["Target segment", open.segment],
              ["Assumptions", open.assumptions],
              ["Expected user outcome", open.outcome],
              ["Validation plan", open.validation],
              ["Proposed success metric", open.metric],
              ["Risks", open.risk],
            ].map(([label, value]) => (
              <section key={label}>
                <h3>{label}</h3>
                <p>{value || "Not recorded yet."}</p>
              </section>
            ))}
            <div className="estimate-grid">
              <span>
                Impact<strong>{open.impact}/5</strong>
              </span>
              <span>
                Confidence<strong>{open.confidence}/5</strong>
              </span>
              <span>
                Effort<strong>{open.effort}/5</strong>
              </span>
            </div>
            <h3>Supporting insights & source evidence</h3>
            {w.opportunityLinks
              .filter((l) => l.opportunityId === open.id)
              .map((l) => {
                const i = w.insights.find((i) => i.id === l.insightId);
                if (!i) return null;
                return (
                  <div className="opportunity-source" key={l.insightId}>
                    <button
                      className="text-link"
                      onClick={() => go("/insights/" + i.id)}
                    >
                      {i.title}
                      <ArrowUpRight size={13} />
                    </button>
                    <Status status={i.status} />
                    {i.status !== "Verified" && (
                      <p className="warning-text">
                        This linked insight has changed. Review its evidence
                        before using this opportunity.
                      </p>
                    )}
                    {evidenceFor(w, i)
                      .slice(0, 2)
                      .map((e) => (
                        <QuoteCard
                          key={e.id}
                          w={w}
                          e={e}
                          go={go}
                          insight={i}
                          compact
                          role={e.role}
                        />
                      ))}
                  </div>
                );
              })}
            {!w.opportunityLinks.some((l) => l.opportunityId === open.id) && (
              <div className="info-banner amber">
                Manual opportunity without linked evidence. Treat it as an
                assumption.
              </div>
            )}
            <Button variant="primary" onClick={() => setEditing(open)}>
              <PenLine size={15} /> Edit opportunity
            </Button>
          </div>
        </Modal>
      )}
      {create && <OpportunityForm onClose={() => setCreate(false)} />}{" "}
      {editing && (
        <OpportunityForm
          opportunity={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
export function AskTrace() {
  const { w, projectId, go } = useTrace();
  const scope = useScope();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { question: string; insights: Insight[]; insufficient: boolean }[]
  >([]);
  const [pending, setPending] = useState(false);
  const pid = projectId || scope.projects[0]?.id;
  const ask = (q: string) => {
    if (!q.trim() || !pid) return;
    setPending(true);
    setQuestion("");
    setTimeout(() => {
      const answer = retrieve(w, pid, q);
      setMessages((m) => [...m, { ...answer }]);
      setPending(false);
    }, 160);
  };
  return (
    <>
      <PageHead
        eyebrow="A CONVERSATION WITH YOUR EVIDENCE"
        title="Ask TRACE"
        description="Explore the research corpus, with the sources always close at hand."
        actions={
          <Badge tone="green">
            <ShieldCheck size={13} />
            Local evidence retrieval
          </Badge>
        }
      />
      <div className="ask-workspace">
        <div className="ask-mode">
          <ScanLine size={17} />
          <span>
            Demo Mode searches stored findings and quotes. No generative AI
            request is made.
          </span>
        </div>
        {!messages.length ? (
          <div className="ask-empty">
            <div className="ask-symbol">
              <ScanLine size={32} />
            </div>
            <h2>What would you like to understand?</h2>
            <p>
              Start with a question. Follow the answer back to the conversation.
            </p>
            <div className="ask-prompts">
              {[
                "What causes uncertainty during verification?",
                "What do users say about privacy and trust?",
                "What contradicts the onboarding findings?",
                "Which accessibility concerns need follow-up?",
              ].map((q) => (
                <button key={q} onClick={() => ask(q)}>
                  {q}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
            <small>
              {scope.interviews.length} interviews ·{" "}
              {scope.insights.filter((i) => i.status !== "Rejected").length}{" "}
              available findings · source-linked research
            </small>
          </div>
        ) : (
          <div className="ask-messages">
            {messages.map((m, n) => (
              <section key={n}>
                <div className="user-question">
                  <span className="avatar small">SR</span>
                  <h3>{m.question}</h3>
                </div>
                <div className="trace-answer">
                  <span className="trace-answer-icon">
                    <ScanLine size={19} />
                  </span>
                  <div>
                    <div className="answer-heading">
                      TRACE <Badge>Local retrieval</Badge>
                    </div>
                    {m.insufficient ? (
                      <>
                        <h3>Insufficient evidence in this study.</h3>
                        <p>
                          I could not find a relevant stored finding for this
                          question. Try a more specific phrase, or collect
                          evidence before drawing a conclusion.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          These stored interpretations and their source excerpts
                          are relevant to your question. They do not establish
                          causation or the biggest issue across a population.
                        </p>
                        {m.insights.map((i) => (
                          <div className="answer-finding" key={i.id}>
                            <button
                              className="text-link"
                              onClick={() => go("/insights/" + i.id)}
                            >
                              {i.title}
                              <ArrowUpRight size={13} />
                            </button>
                            <Status status={i.status} />
                            <p>{i.explanation}</p>
                            {evidenceFor(w, i)
                              .slice(0, 2)
                              .map((e) => (
                                <QuoteCard
                                  w={w}
                                  e={e}
                                  go={go}
                                  insight={i}
                                  role={e.role}
                                  compact
                                  key={e.id}
                                />
                              ))}
                            {evidenceFor(w, i, "contradictory").length > 0 && (
                              <button
                                className="counter-link"
                                onClick={() => go("/insights/" + i.id)}
                              >
                                <AlertTriangle size={13} />
                                {evidenceFor(w, i, "contradictory").length}{" "}
                                contradictory accounts — review the nuance
                              </button>
                            )}
                            <p className="answer-limitations">
                              <strong>Limitations:</strong> {i.limitations}
                            </p>
                          </div>
                        ))}
                      </>
                    )}
                    <div className="answer-footer">
                      <ShieldCheck size={12} />
                      Sources link to stored transcript segments. Synthetic
                      research is not real customer validation.
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
        {pending && (
          <div className="ask-loading">
            <LoaderCircle className="spin" size={16} />
            Retrieving stored evidence…
          </div>
        )}
        <form
          className="ask-composer"
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
        >
          <textarea
            aria-label="Question about the research"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(question);
              }
            }}
            placeholder="Ask a question about this study…"
            rows={2}
          />
          <Button
            variant="primary"
            aria-label="Ask research question"
            disabled={pending || !question.trim()}
          >
            <ArrowUpRight size={18} />
          </Button>
          <small>
            Enter to ask · Shift + Enter for a new line · sources, not certainty
          </small>
        </form>
      </div>
    </>
  );
}
function Markdown({ text }: { text: string }) {
  const { go } = useTrace();
  return (
    <div className="markdown-preview">
      {text.split("\n").map((line, n) => {
        if (line.startsWith("# ")) return <h1 key={n}>{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={n}>{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={n}>{line.slice(4)}</h3>;
        if (line.startsWith("> "))
          return <blockquote key={n}>{line.slice(2)}</blockquote>;
        if (line.startsWith("- "))
          return (
            <p className="md-list" key={n}>
              • {line.slice(2)}
            </p>
          );
        if (line.startsWith("**") && line.endsWith("**"))
          return (
            <p key={n}>
              <strong>{line.slice(2, -2)}</strong>
            </p>
          );
        const match = line.match(/\[Open source\]\(#(\/[^)]+)\)/);
        if (match)
          return (
            <p key={n}>
              {line.slice(0, match.index)}
              <button className="text-link" onClick={() => go(match[1])}>
                Open source <ArrowUpRight size={12} />
              </button>
            </p>
          );
        return line ? <p key={n}>{line}</p> : null;
      })}
    </div>
  );
}
export function Reports({ id }: { id?: string }) {
  const { w, go, projectId, act, busy } = useTrace();
  const scope = useScope();
  const report = w.reports.find((r) => r.id === id);
  const [mode, setMode] = useState("preview");
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  useEffect(() => {
    setTitle(report?.title ?? "");
    setMarkdown(report?.markdown ?? "");
    setMode("preview");
  }, [report?.id, report?.markdown, report?.title]);
  const generate = async () => {
    const pid = projectId || scope.projects[0]?.id;
    if (!pid) return;
    const r = await act("report.generate", { projectId: pid });
    if (r) go("/reports/" + r.id);
  };
  if (report)
    return (
      <>
        <Breadcrumb
          items={[
            { label: "Reports", onClick: () => go("/reports") },
            { label: report.title },
          ]}
        />
        <PageHead
          eyebrow="THE RESEARCH, READY TO SHARE"
          title="Research report"
          description={`${report.title} · Created ${report.createdAt.slice(0, 10)}`}
          actions={
            <>
              <Button
                onClick={() =>
                  download("trace-research-summary.md", report.markdown)
                }
              >
                <Download size={15} />
                Markdown
              </Button>
              <Button onClick={() => window.print()}>
                <Printer size={15} />
                Print / save PDF
              </Button>
              <Button
                variant="primary"
                disabled={busy}
                onClick={() =>
                  act("report.update", { title, markdown }, report.id)
                }
              >
                Save changes
              </Button>
            </>
          }
        />
        <div className="report-toolbar">
          <div className="tabs">
            <button
              className={mode === "preview" ? "active" : ""}
              onClick={() => setMode("preview")}
            >
              Read report
            </button>
            <button
              className={mode === "edit" ? "active" : ""}
              onClick={() => setMode("edit")}
            >
              Edit Markdown
            </button>
          </div>
          <span className="quiet">
            Sources included · Human review required before sharing
          </span>
        </div>
        {mode === "edit" ? (
          <div className="report-editor">
            <Field label="Report title">
              <input
                aria-label="Report title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={250}
              />
            </Field>
            <Field label="Report Markdown">
              <textarea
                className="markdown-editor"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                rows={35}
              />
            </Field>
          </div>
        ) : (
          <article className="report-paper">
            <div className="report-brand">
              <span>TRACE / RESEARCH MEMO</span>
              <span>{report.createdAt.slice(0, 10)}</span>
            </div>
            <Markdown text={markdown} />
          </article>
        )}
      </>
    );
  return (
    <>
      <PageHead
        eyebrow="MAKE THE RESEARCH TRAVEL"
        title="Reports"
        description="Clear findings, honest limitations, and the evidence behind every recommendation."
        actions={
          <Button variant="primary" disabled={busy} onClick={generate}>
            <Plus size={16} />
            Generate report
          </Button>
        }
      />
      <div className="info-banner">
        <ShieldCheck size={19} />
        <span>
          Reports include verified insights, contradictory excerpts, sample
          denominators, opportunities, and a human-readable source appendix.
        </span>
      </div>
      <div className="report-grid">
        {scope.reports.map((r) => (
          <button
            className="report-card"
            key={r.id}
            onClick={() => go("/reports/" + r.id)}
          >
            <div className="report-card-icon">
              <FileText size={25} />
            </div>
            <span className="eyebrow">RESEARCH SUMMARY</span>
            <h2>{r.title}</h2>
            <p>
              {w.projects.find((p) => p.id === r.projectId)?.name} ·{" "}
              {r.createdAt.slice(0, 10)}
            </p>
            <div className="report-card-foot">
              Editable Markdown · source appendix
              <ArrowUpRight size={16} />
            </div>
          </button>
        ))}
      </div>
      {!scope.reports.length && (
        <Empty
          title="Your findings deserve a clear story"
          description="Generate a report from verified insights, then edit it for your audience and export with its sources."
          action={
            <Button variant="primary" disabled={busy} onClick={generate}>
              Generate research report
            </Button>
          }
        />
      )}
    </>
  );
}
export function Quality() {
  const { w, go, act, projectId, busy } = useTrace();
  const scope = useScope();
  const interviewIds = new Set(scope.interviews.map((i) => i.id));
  const filtered = {
    ...w,
    insights: scope.insights,
    evidence: w.evidence.filter((e) =>
      interviewIds.has(sourceOf(w, e).interview?.id ?? ""),
    ),
    evaluationCases: w.evaluationCases.filter((c) =>
      interviewIds.has(
        w.segments.find((s) => s.id === c.segmentId)?.interviewId ?? "",
      ),
    ),
  };
  const evaluation = evaluate(filtered);
  const metrics = [
    [
      "Citation validity",
      evaluation.citations,
      "References resolving to a stored segment.",
    ],
    [
      "Quote exactness",
      evaluation.exactness,
      "Source-resolving excerpts that literally match.",
    ],
    [
      "Annotated precision",
      evaluation.precision,
      "Relevant, correctly classified excerpts / candidates on annotated segments.",
    ],
    [
      "Annotated recall",
      evaluation.recall,
      "Relevant expected segment + class pairs found / all annotated relevant pairs.",
    ],
    [
      "Theme agreement",
      evaluation.theme,
      "Correct extractions matching the expected theme / correct annotated extractions.",
    ],
    [
      "Unsupported source rate",
      evaluation.unsupported,
      "Insights with no valid supporting source / all insights.",
    ],
    [
      "Review acceptance",
      evaluation.agreement,
      "Verified actions / verification, edit, rejection and review actions.",
    ],
  ] as const;
  return (
    <>
      <PageHead
        eyebrow="TRUST IS SOMETHING YOU CAN INSPECT"
        title="Evaluation & quality"
        description="Source checks you can reproduce. Limitations you can see."
        actions={
          <Button
            variant="primary"
            disabled={busy || !scope.projects.length}
            onClick={() =>
              act("demo.validate", {
                projectId: projectId || scope.projects[0]?.id,
              })
            }
          >
            <RefreshCw size={15} />
            Validate sources
          </Button>
        }
      />
      <div className="quality-banner">
        <ShieldCheck size={23} />
        <div>
          <strong>Synthetic-data evaluation</strong>
          <p>
            These numbers are computed from stored records. They describe this
            curated demonstration corpus, not real-world AI performance.
          </p>
        </div>
        <Badge tone="green">Local · no model request</Badge>
      </div>
      <div className="quality-grid">
        {metrics.map(([label, m, description]) => (
          <section className="quality-metric" key={label}>
            <div className="quality-metric-title">
              <span>{label}</span>
              <ShieldCheck size={15} />
            </div>
            <strong>{m.d ? Math.round((m.n / m.d) * 100) + "%" : "N/A"}</strong>
            <div className="quality-denominator">
              {m.n} / {m.d}{" "}
              {label === "Unsupported source rate" ? "unsupported" : "matching"}{" "}
              records
            </div>
            <p>{description}</p>
          </section>
        ))}
      </div>
      <div className="two-column">
        <section className="paper-section">
          <h2>What the checks establish</h2>
          <ul className="question-list">
            <li>Every cited segment exists in the workspace.</li>
            <li>
              Every excerpt is a literal substring of its original segment.
            </li>
            <li>
              Selected annotated excerpts match a reference classification and
              theme.
            </li>
            <li>
              Verification requires supporting evidence and records the
              researcher action.
            </li>
          </ul>
          <h3>What they cannot establish</h3>
          <p>
            Source exactness cannot prove that an interpretation follows from
            the evidence. A linked claim can still be too broad, causal, or
            incomplete.
          </p>
          <p>
            The seed annotations also generate the precomputed demonstration
            findings. This is a consistency benchmark, not an independent
            holdout evaluation. Production precision and recall are unknown.
          </p>
          <p>
            Review acceptance counts actions, rather than independent judgments.
            Seeded review events are demonstration state, not real usage.
          </p>
        </section>
        <section className="paper-section">
          <h2>Reproduce the evaluation</h2>
          <p>From the repository, run:</p>
          <pre>npm run evaluate{"\n"}npm test</pre>
          <p>
            The evaluator validates the seeded reference corpus. The application
            computes current-state metrics, including subsequent human changes.
          </p>
          <h3>Recent validation runs</h3>
          {scope.runs
            .slice()
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 5)
            .map((r) => (
              <div className="validation-run" key={r.id}>
                <strong>
                  {r.mode}
                  <Badge tone={r.status === "Completed" ? "green" : "amber"}>
                    {r.status}
                  </Badge>
                </strong>
                <p>{r.detail}</p>
                <small>{r.createdAt.slice(0, 16).replace("T", " ")} UTC</small>
              </div>
            ))}
        </section>
      </div>
      <div className="section-heading">
        <h2>Annotated evaluation cases</h2>
        <span className="quiet">
          {filtered.evaluationCases.length} cases · includes negative examples
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Expected classification</th>
              <th>Expected theme</th>
              <th>Observed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.evaluationCases.map((c) => {
              const s = w.segments.find((s) => s.id === c.segmentId)!;
              const actual = w.evidence.filter(
                (e) => e.segmentId === c.segmentId,
              );
              const match = c.relevant
                ? actual.some(
                    (e) =>
                      e.kind === c.expectedKind && validateQuote(s, e.quote),
                  )
                : !actual.length;
              return (
                <tr key={c.id}>
                  <td>
                    <button
                      className="text-link"
                      onClick={() =>
                        go("/interviews/" + s.interviewId + "?segment=" + s.id)
                      }
                    >
                      {c.segmentId}
                      <ArrowUpRight size={12} />
                    </button>
                  </td>
                  <td>{c.expectedKind}</td>
                  <td>{c.themeTitle}</td>
                  <td>
                    <Badge tone={match ? "green" : "amber"}>
                      {match ? "Matches reference" : "Review mismatch"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
export function WorkspaceSettings() {
  const { w, act, busy, notify } = useTrace();
  return (
    <>
      <PageHead
        eyebrow="YOUR RESEARCH ENVIRONMENT"
        title="Workspace settings"
        description="A transparent setup for the first serious demonstration."
      />
      <div className="settings-grid">
        <section className="paper-section">
          <h2>Analysis mode</h2>
          <Badge tone="green">Demo Mode active</Badge>
          <p>
            Seeded findings are precomputed and explicitly synthetic. Uploaded
            interviews support manual quotation selection, classification,
            insight creation and review. Ask TRACE retrieves existing findings
            using local keyword matching.
          </p>
          <div className="setting-row">
            <span>External AI requests</span>
            <Badge>Disabled</Badge>
          </div>
          <div className="setting-row">
            <span>Credential required</span>
            <span>None</span>
          </div>
          <div className="setting-row">
            <span>Live AI availability</span>
            <span>Not configured in this build</span>
          </div>
          <p className="help-text">
            Live extraction and synthesis are a later integration. This demo
            does not pretend to analyze uploaded transcripts with a model.
          </p>
        </section>
        <section className="paper-section">
          <h2>Data & workspace</h2>
          <p>
            Research is stored in a relational SQLite database, locally through
            D1 emulation and through a private D1 binding when hosted. This
            release is a single-user workspace. It has no per-team authorization
            or collaboration.
          </p>
          <div className="setting-row">
            <span>Workspace projects</span>
            <strong>{w.projects.length}</strong>
          </div>
          <div className="setting-row">
            <span>Stored transcript segments</span>
            <strong>{w.segments.length}</strong>
          </div>
          <div className="setting-row">
            <span>Source-linked excerpts</span>
            <strong>{w.evidence.length}</strong>
          </div>
          <Button
            onClick={() => {
              const {
                projects,
                participants,
                interviews,
                segments,
                evidence,
                themes,
                insights,
                insightLinks,
                opportunities,
                opportunityLinks,
                reports,
                reviews,
                runs,
                evaluationCases,
              } = w;
              download(
                "trace-workspace-backup.json",
                JSON.stringify(
                  {
                    format: "trace-workspace-v1",
                    exportedAt: new Date().toISOString(),
                    projects,
                    participants,
                    interviews,
                    segments,
                    evidence,
                    themes,
                    insights,
                    insightLinks,
                    opportunities,
                    opportunityLinks,
                    reports,
                    reviews,
                    runs,
                    evaluationCases,
                  },
                  null,
                  2,
                ),
                "application/json",
              );
              notify(
                "Workspace JSON exported. Store this research file privately.",
              );
            }}
          >
            <Download size={15} />
            Export workspace backup
          </Button>
          <p className="help-text">
            JSON is a portable archival export. Importing backups is not
            supported in this release.
          </p>
        </section>
        <section className="paper-section">
          <h2>Keyboard & accessibility</h2>
          <div className="setting-row">
            <span>Search anything</span>
            <kbd>Ctrl / ⌘ K</kbd>
          </div>
          <div className="setting-row">
            <span>Close dialog</span>
            <kbd>Esc</kbd>
          </div>
          <div className="setting-row">
            <span>Ask TRACE</span>
            <kbd>Enter</kbd>
          </div>
          <p>
            Dialogs use native focus containment. Reduced-motion preferences are
            respected. Opportunity status menus provide an alternative to drag
            and drop.
          </p>
        </section>
        <section className="paper-section">
          <h2>About the demonstration</h2>
          <p>
            TRACE — AI Research Copilot
            <br />
            From customer conversations to confident product decisions.
          </p>
          <p>
            The fintech project contains 12 fictional interviews. There are no
            real research participants, traction metrics, customers, or measured
            product outcomes represented here.
          </p>
          <div className="evidence-principle compact">
            <ShieldCheck size={18} />
            <strong>No insight without evidence.</strong>
          </div>
          {!w.projects.length && (
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => act("seed")}
            >
              Load synthetic workspace
            </Button>
          )}
        </section>
      </div>
    </>
  );
}
