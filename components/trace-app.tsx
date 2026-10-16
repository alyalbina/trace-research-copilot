"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Folder,
  MessagesSquare,
  Layers,
  Lightbulb,
  ScanLine,
  FileText,
  ShieldCheck,
  Settings,
  Search,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  Command,
  LoaderCircle,
} from "lucide-react";
import { Context, useTrace, useScope } from "./context";
import { Button, Badge, Status, PageHead, Empty, Modal, Loading } from "./ui";
import type { Workspace } from "@/lib/types";
import { sourceOf, interviewCount } from "@/lib/research";
import { Projects, ProjectDetail, ProjectForm } from "./projects";
import { Interviews, InterviewDetail, ImportDialog } from "./interviews";
import { Findings, InsightDetail } from "./findings";
import {
  Opportunities,
  AskTrace,
  Reports,
  Quality,
  WorkspaceSettings,
} from "./discovery";
const nav = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "projects", label: "Research projects", icon: Folder },
  { id: "interviews", label: "Interviews", icon: MessagesSquare },
  { id: "findings", label: "Themes & insights", icon: Layers },
  { id: "opportunities", label: "Opportunity board", icon: Lightbulb },
  { id: "ask", label: "Ask TRACE", icon: ScanLine },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "quality", label: "Evaluation & quality", icon: ShieldCheck },
];
export default function TraceApp() {
  const [w, setW] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [route, setRoute] = useState("/overview");
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const [menu, setMenu] = useState(false);
  const [smallScreen, setSmallScreen] = useState(false);
  const [search, setSearch] = useState(false);
  const [modal, setModal] = useState("");
  const notify = useCallback((message: string, error = false) => {
    setToast({ message, error });
  }, []);
  const reload = useCallback(async () => {
    const r = await fetch("/api/workspace", { cache: "no-store" });
    const data = (await r.json()) as Workspace & { error?: string };
    if (!r.ok) throw new Error(data.error);
    setW(data);
    return data;
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 860px)");
    const update = () => setSmallScreen(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!menu || !smallScreen) return;
    const controls = () =>
      Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          ".sidebar button:not(:disabled)",
        ),
      );
    controls()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      document.querySelector<HTMLButtonElement>(".mobile-menu")?.focus();
    };
  }, [menu, smallScreen]);
  useEffect(() => {
    reload()
      .then((data) => {
        const saved = localStorage.getItem("trace-project");
        setProjectId(
          data.projects.some((p) => p.id === saved && p.status !== "Archived")
            ? saved!
            : (data.projects.find((p) => p.status !== "Archived")?.id ?? ""),
        );
      })
      .catch((e) => setError(e.message));
    const hash = () => {
      setRoute(decodeURI(location.hash.slice(1)) || "/overview");
      setMenu(false);
      window.scrollTo(0, 0);
    };
    hash();
    window.addEventListener("hashchange", hash);
    return () => window.removeEventListener("hashchange", hash);
  }, [reload]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const go = useCallback((r: string) => {
    location.hash = r;
    setRoute(r);
    setMenu(false);
    window.scrollTo(0, 0);
  }, []);
  const changeProject = (id: string) => {
    setProjectId(id);
    localStorage.setItem("trace-project", id);
  };
  const act = async (action: string, data?: unknown, id?: string) => {
    if (busy) return null;
    setBusy(true);
    try {
      const r = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data, id }),
      });
      const result = (await r.json()) as {
        id?: string;
        message: string;
        error?: string;
      };
      if (!r.ok) throw new Error(result.error);
      const updated = await reload();
      if (action === "seed" && !projectId)
        changeProject(updated.projects[0]?.id ?? "");
      notify(result.message);
      return result;
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Could not save this change.",
        true,
      );
      return null;
    } finally {
      setBusy(false);
    }
  };
  if (error)
    return (
      <main className="startup">
        <ScanLine size={32} />
        <h1>Let’s reconnect your workspace.</h1>
        <p>{error}</p>
        <Button
          variant="primary"
          onClick={() => {
            setError("");
            reload().catch((e) => setError(e.message));
          }}
        >
          Try again
        </Button>
        <p className="muted">
          Local setup: apply the database migration described in the README.
        </p>
      </main>
    );
  if (!w) return <Loading />;
  const active = route.split("?")[0].split("/")[1];
  const id = route.split("?")[0].split("/")[2];
  const activeNav = active === "insights" ? "findings" : active;
  const project = w.projects.find((p) => p.id === projectId);
  return (
    <Context.Provider
      value={{
        w,
        projectId,
        setProjectId: changeProject,
        route,
        go,
        busy,
        notify,
        act,
      }}
    >
      <div className="app-shell">
        {menu && (
          <button
            className="sidebar-backdrop"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          />
        )}
        <aside
          id="trace-navigation"
          inert={smallScreen && !menu}
          className={`sidebar ${menu ? "open" : ""}`}
        >
          <button
            className="brand"
            onClick={() => go("/overview")}
            aria-label="TRACE overview"
          >
            <span className="brand-mark">
              <ScanLine size={22} />
            </span>
            <span>
              trace<span className="brand-dot">.</span>
            </span>
          </button>
          <div className="workspace-label">RESEARCH WORKSPACE</div>
          <button className="workspace-switch" onClick={() => go("/settings")}>
            <span className="workspace-avatar">S</span>
            <span>
              Studio workspace<small>Single-user demo</small>
            </span>
            <ChevronDown size={14} />
          </button>
          <button className="command-search" onClick={() => setSearch(true)}>
            <Search size={15} />
            <span>Search anything</span>
            <kbd>⌘ K</kbd>
          </button>
          <nav aria-label="Main navigation">
            {nav.map((n) => (
              <button
                aria-label={n.label}
                key={n.id}
                className={activeNav === n.id ? "active" : ""}
                onClick={() => go("/" + n.id)}
              >
                <n.icon size={17} />
                <span>{n.label}</span>
                {n.id === "findings" && (
                  <span className="nav-count">
                    {
                      w.insights.filter(
                        (i) =>
                          i.status !== "Rejected" &&
                          w.projects.some(
                            (p) =>
                              p.id === i.projectId && p.status !== "Archived",
                          ),
                      ).length
                    }
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-studies">
            <div className="section-label">
              YOUR STUDIES
              <button
                aria-label="New study"
                onClick={() => setModal("project")}
              >
                <Plus size={14} />
              </button>
            </div>
            {w.projects
              .filter((p) => p.status !== "Archived")
              .slice(0, 4)
              .map((p) => (
                <button
                  key={p.id}
                  className={projectId === p.id ? "selected-study" : ""}
                  onClick={() => {
                    changeProject(p.id);
                    go("/projects/" + p.id);
                  }}
                >
                  <span className="study-dot" />
                  {p.name}
                </button>
              ))}
          </div>
          <div className="sidebar-bottom">
            <div className="demo-note">
              <span className="live-dot" />
              <strong>Demo mode</strong>
              <p>
                Precomputed demo.
                <br />
                Real, traceable workflows.
              </p>
            </div>
            <button
              className={
                active === "settings" ? "active settings-link" : "settings-link"
              }
              onClick={() => go("/settings")}
            >
              <Settings size={17} />
              Settings
            </button>
            <div className="profile">
              <span className="avatar">SR</span>
              <span>
                Studio researcher<small>Local demo workspace</small>
              </span>
            </div>
          </div>
        </aside>
        <div className="workspace-main" inert={smallScreen && menu}>
          <header className="topbar">
            <div className="topbar-left">
              <Button
                className="mobile-menu"
                variant="ghost"
                aria-label="Open navigation"
                aria-controls="trace-navigation"
                aria-expanded={menu}
                onClick={() => setMenu(true)}
              >
                <Menu size={20} />
              </Button>
              <span className="topbar-section">Workspace</span>
              <span className="slash">/</span>
              <label className="project-select">
                <span className="sr-only">Research project context</span>
                <select
                  value={projectId}
                  onChange={(e) => {
                    changeProject(e.target.value);
                    if (id)
                      go("/" + (active === "insights" ? "findings" : active));
                  }}
                >
                  <option value="">All research</option>
                  {w.projects
                    .filter((p) => p.status !== "Archived")
                    .map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="topbar-right">
              <Badge tone="green">
                <span className="live-dot" />
                Demo · no model calls
              </Badge>
              <button
                className="icon-btn"
                aria-label="Open command search"
                onClick={() => setSearch(true)}
              >
                <Search size={18} />
              </button>
              <span className="avatar small">SR</span>
            </div>
          </header>
          <main
            id="main-content"
            className={`main-content ${active === "interviews" && id ? "reader-content" : ""}`}
          >
            {!w.projects.length ? (
              <div className="welcome">
                <div className="eyebrow">WELCOME TO TRACE</div>
                <h1>
                  Good decisions begin
                  <br />
                  with a trace.
                </h1>
                <p>
                  Turn conversations into evidence, insights, and product
                  opportunities. Start with twelve synthetic fintech interviews
                  or create your own study.
                </p>
                <div className="welcome-actions">
                  <Button
                    variant="primary"
                    disabled={busy}
                    onClick={() => act("seed")}
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : (
                      <ScanLine size={17} />
                    )}{" "}
                    Load synthetic workspace
                  </Button>
                  <Button onClick={() => setModal("project")}>
                    <Plus size={16} /> Create a study
                  </Button>
                </div>
                <div className="welcome-principle">
                  NO INSIGHT WITHOUT EVIDENCE.
                </div>
              </div>
            ) : active === "overview" ? (
              <Overview
                openImport={() => setModal("import")}
                newProject={() => setModal("project")}
              />
            ) : active === "projects" ? (
              id ? (
                <ProjectDetail id={id} />
              ) : (
                <Projects />
              )
            ) : active === "interviews" ? (
              id ? (
                <InterviewDetail id={id} />
              ) : (
                <Interviews />
              )
            ) : active === "findings" ? (
              <Findings />
            ) : active === "insights" && id ? (
              <InsightDetail id={id} />
            ) : active === "opportunities" ? (
              <Opportunities />
            ) : active === "ask" ? (
              <AskTrace />
            ) : active === "reports" ? (
              <Reports id={id} />
            ) : active === "quality" ? (
              <Quality />
            ) : active === "settings" ? (
              <WorkspaceSettings />
            ) : (
              <Empty
                title="This view does not exist"
                description="Return to your research overview."
                action={
                  <Button onClick={() => go("/overview")}>Open overview</Button>
                }
              />
            )}
          </main>
          <footer className="app-footer">
            <span>
              <ScanLine size={13} /> TRACE
            </span>
            <span>No insight without evidence.</span>
            <span>{project?.name ?? "All research"} · Demo workspace</span>
          </footer>
        </div>
      </div>
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {busy && (
        <div className="saving-indicator" role="status">
          <LoaderCircle className="spin" size={13} />
          Saving to workspace
        </div>
      )}
      {search && <SearchDialog onClose={() => setSearch(false)} />}
      {modal === "project" && <ProjectForm onClose={() => setModal("")} />}{" "}
      {modal === "import" && <ImportDialog onClose={() => setModal("")} />}
    </Context.Provider>
  );
}
function Overview({
  openImport,
  newProject,
}: {
  openImport: () => void;
  newProject: () => void;
}) {
  const { w, go, act, projectId, busy } = useTrace();
  const scope = useScope();
  const project = scope.projects[0];
  const interviewIds = new Set(scope.interviews.map((i) => i.id));
  const evidence = w.evidence.filter((e) =>
    interviewIds.has(sourceOf(w, e).interview?.id ?? ""),
  );
  const done = scope.interviews.filter(
    (i) => i.analysisStatus === "Demo analyzed",
  ).length;
  const verified = scope.insights.filter((i) => i.status === "Verified").length;
  const participants = new Set(scope.interviews.map((i) => i.participantId));
  const segments = [
    ...new Set(
      scope.interviews.map(
        (i) => w.participants.find((p) => p.id === i.participantId)?.segment,
      ),
    ),
  ].filter(Boolean) as string[];
  const themeEvidence = (tid: string) =>
    evidence.filter((e) => e.themeId === tid);
  const latest = scope.insights
    .filter((i) => i.status !== "Rejected")
    .slice(0, 3);
  const activities = [
    ...w.reviews,
    ...scope.runs.map((r) => ({
      id: r.id,
      entityId: r.projectId,
      action: r.mode,
      note: r.detail,
      createdAt: r.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  return (
    <>
      <PageHead
        eyebrow="YOUR RESEARCH, CONNECTED"
        title="Research overview"
        description="A clearer picture of what your customers are telling you."
        actions={
          <>
            <Button onClick={newProject}>
              <Plus size={15} /> New study
            </Button>
            <Button variant="primary" onClick={openImport}>
              <Plus size={16} /> Import interviews
            </Button>
          </>
        }
      />
      <div className="metrics">
        {[
          {
            label: "Research studies",
            n: scope.projects.length,
            sub: "Research in your workspace",
            path: "/projects",
          },
          {
            label: "Interviews",
            n: scope.interviews.length,
            sub: `${participants.size} distinct participants`,
            path: "/interviews",
          },
          {
            label: "Research themes",
            n: scope.themes.length,
            sub: `${evidence.length} source-linked excerpts`,
            path: "/findings",
          },
          {
            label: "Verified insights",
            n: verified,
            sub: `of ${scope.insights.length} total findings`,
            path: "/findings",
          },
          {
            label: "Opportunities",
            n: scope.opportunities.length,
            sub: `${scope.opportunities.filter((o) => o.status === "Discovery").length} awaiting review`,
            path: "/opportunities",
          },
        ].map((m) => (
          <button className="metric" key={m.label} onClick={() => go(m.path)}>
            <div>
              {m.label}
              <ArrowUpRight size={14} />
            </div>
            <strong>{String(m.n).padStart(2, "0")}</strong>
            <small>{m.sub}</small>
          </button>
        ))}
      </div>
      <div className="overview-grid">
        <section className="study-feature">
          <div className="study-feature-top">
            <Badge tone="indigo">ACTIVE RESEARCH</Badge>
            <span className="quiet">
              {project?.methodology.includes("synthetic")
                ? "Synthetic demo study"
                : "Research study"}
            </span>
          </div>
          <h2>
            {project?.name ?? "Your next research study"}
            <br />
            <span>
              {project?.id === "fintech-onboarding"
                ? "Understanding why new users drop off"
                : ""}
            </span>
          </h2>
          <p>
            {project?.objective ??
              "Add a project to begin collecting research."}
          </p>
          <div className="study-progress">
            <div>
              <span>Demo analysis coverage</span>
              <strong>
                {done} / {scope.interviews.length} interviews
              </strong>
            </div>
            <div className="progress-track">
              <span
                style={{
                  width: `${scope.interviews.length ? (done / scope.interviews.length) * 100 : 0}%`,
                }}
              />
            </div>
            <small>
              Precomputed findings · Imported interviews need manual coding
            </small>
          </div>
          <div className="study-feature-bottom">
            <div className="avatar-stack">
              {scope.interviews.slice(0, 4).map((i) => (
                <span className="avatar small" key={i.id}>
                  {
                    w.participants.find((p) => p.id === i.participantId)
                      ?.identifier
                  }
                </span>
              ))}
              <small>{participants.size} participants</small>
            </div>
            <Button variant="primary" onClick={() => go("/findings")}>
              Explore findings <ArrowRight size={15} />
            </Button>
          </div>
        </section>
        <section className="coverage-panel">
          <div className="panel-heading">
            <h2>Research coverage</h2>
            <span className="quiet">n = {scope.interviews.length}</span>
          </div>
          <p>
            Different experiences.
            <br />A more complete conversation.
          </p>
          <div className="coverage-list">
            {segments.map((s, n) => {
              const count = scope.interviews.filter(
                (i) =>
                  w.participants.find((p) => p.id === i.participantId)
                    ?.segment === s,
              ).length;
              return (
                <button
                  key={s}
                  onClick={() =>
                    go("/interviews?segment=" + encodeURIComponent(s))
                  }
                >
                  <div>
                    <span>{s}</span>
                    <strong>
                      {count}
                      <small> / {scope.interviews.length}</small>
                    </strong>
                  </div>
                  <div className="coverage-track">
                    <span
                      className={"coverage-color-" + (n % 3)}
                      style={{
                        width: `${(count / scope.interviews.length) * 100}%`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <small className="coverage-caution">
            Interview counts describe this sample, not population prevalence.
          </small>
        </section>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">PATTERNS WORTH A CLOSER LOOK</span>
          <h2>Emerging themes</h2>
        </div>
        <Button variant="ghost" onClick={() => go("/findings")}>
          All themes <ArrowRight size={15} />
        </Button>
      </div>
      <div className="theme-overview">
        {scope.themes.slice(0, 3).map((t, n) => {
          const es = themeEvidence(t.id);
          const insight = scope.insights.find((i) => i.themeId === t.id);
          return (
            <button
              className="theme-feature"
              key={t.id}
              onClick={() =>
                go(insight ? "/insights/" + insight.id : "/findings")
              }
            >
              <div className="theme-feature-top">
                <span className="theme-index">0{n + 1}</span>
                <Status status={t.status} />
              </div>
              <h3>{t.title}</h3>
              <p>{t.explanation}</p>
              <div className="theme-feature-foot">
                <span>
                  {interviewCount(w, es)} interviews · {es.length} excerpts
                </span>
                <ArrowUpRight size={18} />
              </div>
            </button>
          );
        })}
      </div>
      <div className="overview-bottom">
        <section>
          <div className="panel-heading">
            <h2>Ready for your review</h2>
            <Badge>
              {scope.insights.filter((i) => i.status === "Under Review").length}{" "}
              open
            </Badge>
          </div>
          {latest.map((i) => (
            <button
              key={i.id}
              className="finding-row"
              onClick={() => go("/insights/" + i.id)}
            >
              <span className="finding-icon">
                <Layers size={17} />
              </span>
              <span>
                <strong>{i.title}</strong>
                <small>
                  {w.insightLinks.filter((l) => l.insightId === i.id).length}{" "}
                  linked excerpts · {i.provenance}
                </small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </section>
        <section>
          <div className="panel-heading">
            <h2>Workspace activity</h2>
            <Activity size={16} />
          </div>
          {activities.map((a) => (
            <button
              key={a.id}
              className="activity-row"
              onClick={() => {
                if (w.insights.some((i) => i.id === a.entityId))
                  go("/insights/" + a.entityId);
                else if (w.interviews.some((i) => i.id === a.entityId))
                  go("/interviews/" + a.entityId);
                else go("/quality");
              }}
            >
              <span className="activity-dot" />
              <span>
                <strong>{a.action}</strong>
                <small>{a.note || "Research workspace updated"}</small>
              </span>
              <time>{a.createdAt.slice(5, 10)}</time>
            </button>
          ))}
        </section>
      </div>
      <div className="evidence-principle">
        <ShieldCheck size={19} />
        <span>
          <strong>Every insight has a source.</strong> Follow a finding all the
          way back to the original conversation.
        </span>
        <Button
          variant="ghost"
          disabled={busy || !project}
          onClick={() =>
            act("demo.validate", { projectId: projectId || project?.id })
          }
        >
          Validate sources <ArrowUpRight size={14} />
        </Button>
      </div>
    </>
  );
}
function SearchDialog({ onClose }: { onClose: () => void }) {
  const { w, go } = useTrace();
  const [query, setQuery] = useState("");
  const term = query.toLowerCase();
  const results = [
    ...w.projects
      .filter((p) => p.status !== "Archived")
      .map((p) => ({
        id: p.id,
        title: p.name,
        type: "Study",
        path: "/projects/" + p.id,
      })),
    ...w.interviews
      .filter((i) =>
        w.projects.some((p) => p.id === i.projectId && p.status !== "Archived"),
      )
      .map((i) => ({
        id: i.id,
        title: i.title,
        type: "Interview",
        path: "/interviews/" + i.id,
      })),
    ...w.insights.map((i) => ({
      id: i.id,
      title: i.title,
      type: "Insight",
      path: "/insights/" + i.id,
    })),
    ...w.evidence.map((e) => ({
      id: e.id,
      title: e.quote,
      type: "Evidence",
      path: `/interviews/${sourceOf(w, e).interview?.id}?segment=${e.segmentId}`,
    })),
    ...w.opportunities.map((o) => ({
      id: o.id,
      title: o.title,
      type: "Opportunity",
      path: "/opportunities?open=" + o.id,
    })),
  ]
    .filter((r) => r.title.toLowerCase().includes(term))
    .slice(0, 12);
  return (
    <Modal title="Search your research" onClose={onClose} wide>
      <div className="search-input large">
        <Search size={20} />
        <input
          autoFocus
          aria-label="Search projects, interviews, quotes and insights"
          placeholder="Find a study, quote, insight, or opportunity…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>ESC</kbd>
      </div>
      <div className="command-results">
        {results.map((r) => (
          <button
            key={r.type + r.id}
            onClick={() => {
              go(r.path);
              onClose();
            }}
          >
            <span>
              <small>{r.type}</small>
              <strong>{r.title}</strong>
            </span>
            <ArrowUpRight size={16} />
          </button>
        ))}
        {!results.length && (
          <Empty
            title="No matching research"
            description="Try a participant phrase, study name, or a shorter search."
          />
        )}
      </div>
      <div className="command-footer">
        <Command size={13} /> Search operates on stored research, including
        exact quotes.
      </div>
    </Modal>
  );
}
