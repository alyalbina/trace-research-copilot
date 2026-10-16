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
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  Command,
  LoaderCircle,
} from "lucide-react";
import { Context, useTrace, type ResearchJourney } from "./context";
import { Overview } from "./overview";
import { ResearchWalkthrough } from "./journey";
import { Button, Badge, Empty, Modal, Loading } from "./ui";
import type { Workspace } from "@/lib/types";
import { sourceOf } from "@/lib/research";
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
  const [journey, setJourney] = useState<ResearchJourney | null>(null);
  const [walkthroughCompleted, setWalkthroughCompleted] = useState(false);
  const [journeyLoaded, setJourneyLoaded] = useState(false);
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
  useEffect(() => {
    try {
      setWalkthroughCompleted(
        localStorage.getItem("trace-walkthrough-completed-v1") === "true",
      );
      const saved = JSON.parse(
        localStorage.getItem("trace-journey-v1") || "null",
      );
      if (
        saved &&
        typeof saved.insightId === "string" &&
        typeof saved.startedAt === "string" &&
        !Number.isNaN(Date.parse(saved.startedAt)) &&
        typeof saved.sourceVisited === "boolean"
      )
        setJourney(saved);
    } catch {
      /* Storage can be unavailable in a private browser session. */
    }
    setJourneyLoaded(true);
  }, []);
  useEffect(() => {
    if (!journeyLoaded) return;
    try {
      localStorage.setItem("trace-journey-v1", JSON.stringify(journey));
    } catch {
      /* Keep the walkthrough usable without persistence. */
    }
  }, [journey, journeyLoaded]);
  useEffect(() => {
    if (!w || !journey || journey.sourceVisited) return;
    const segmentId = new URLSearchParams(route.split("?")[1]).get("segment");
    const evidence = w.evidence.find(
      (e) =>
        e.segmentId === segmentId &&
        w.insightLinks.some(
          (l) => l.insightId === journey.insightId && l.evidenceId === e.id,
        ),
    );
    if (
      evidence &&
      route.split("?")[0] ===
        "/interviews/" + sourceOf(w, evidence).interview?.id
    )
      setJourney((current) =>
        current ? { ...current, sourceVisited: true } : null,
      );
  }, [w, journey, route]);
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
      if (
        new URLSearchParams(location.hash.split("?")[1]).get("guide") !==
        "review"
      )
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
    if (new URLSearchParams(r.split("?")[1]).get("guide") !== "review")
      window.scrollTo(0, 0);
  }, []);
  const changeProject = (id: string) => {
    setProjectId(id);
    localStorage.setItem("trace-project", id);
  };
  const startJourney = (insightId: string) => {
    const insight = w?.insights.find((i) => i.id === insightId);
    if (!insight) return;
    changeProject(insight.projectId);
    setJourney({
      insightId,
      startedAt: new Date().toISOString(),
      sourceVisited: false,
    });
    go("/insights/" + insightId);
  };
  const endJourney = (completed = false) => {
    setJourney(null);
    if (completed) {
      setWalkthroughCompleted(true);
      try {
        localStorage.setItem("trace-walkthrough-completed-v1", "true");
      } catch {
        /* Completion still applies for this session. */
      }
    }
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
        journey,
        walkthroughCompleted,
        startJourney,
        endJourney,
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
            <ResearchWalkthrough />
            {!w.projects.length ? (
              <div className="welcome">
                <div className="eyebrow">WELCOME TO TRACE</div>
                <h1>
                  Good decisions begin
                  <br />
                  with a trace.
                </h1>
                <p>
                  Follow a finding to its original conversation, review the
                  evidence and create a product opportunity. Try a prepared
                  study with twelve synthetic interviews, or start your own.
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
                    Try the example study
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
