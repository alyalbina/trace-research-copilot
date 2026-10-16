"use client";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Layers,
  Plus,
  Quote,
} from "lucide-react";
import { useScope, useTrace } from "./context";
import { Badge, Button, PageHead } from "./ui";
import { evidenceFor, sourceOf } from "@/lib/research";

export function Overview({
  openImport,
  newProject,
}: {
  openImport: () => void;
  newProject: () => void;
}) {
  const { w, go, journey, startJourney, setProjectId, walkthroughCompleted } =
    useTrace();
  const scope = useScope();
  const project = scope.projects[0];
  const pending = scope.insights.filter(
    (i) => i.status === "Under Review" || i.status === "AI Suggested",
  );
  const candidates = [
    ...pending,
    ...scope.insights.filter((i) => i.status === "Verified"),
  ];
  const example = candidates.find((i) =>
    evidenceFor(w, i).some(
      (e) => e.role === "supporting" && sourceOf(w, e).segment,
    ),
  );
  const preview = example ? evidenceFor(w, example) : [];
  const synthetic =
    example &&
    w.interviews.some(
      (i) => i.projectId === example.projectId && i.synthetic === 1,
    );
  const activeJourney =
    journey && scope.insights.some((i) => i.id === journey.insightId);
  const reviewed = scope.insights.filter((i) => i.status === "Verified").length;
  return (
    <div className="research-home">
      <PageHead
        eyebrow="YOUR RESEARCH, CONNECTED"
        title="Research overview"
        description={
          project
            ? `${project.name} · Keep the next decision grounded in evidence.`
            : "Create a study to begin your research."
        }
        actions={
          <>
            <Button onClick={newProject}>
              <Plus size={16} /> New study
            </Button>
            <Button
              variant={walkthroughCompleted ? "primary" : "default"}
              onClick={openImport}
            >
              <Plus size={16} /> Import interviews
            </Button>
          </>
        }
      />
      {!activeJourney && (!walkthroughCompleted || !example) && (
        <section className="first-trace">
          <div className="first-trace-copy">
            <span className="eyebrow">
              {example
                ? "START WITH ONE FINDING"
                : "BUILD YOUR RESEARCH FOUNDATION"}
            </span>
            <h2>
              {example
                ? "Follow the evidence.\nMake the next decision."
                : project
                  ? "Start with a conversation."
                  : "Give your research a home."}
            </h2>
            <p>
              {example
                ? "Read an original quote, review the interpretation and turn it into a testable product opportunity."
                : project
                  ? "Import an interview, save a useful passage and build your first finding from its source."
                  : "Create a study with a clear research question, then add your first interview."}
            </p>
            <Button
              variant="primary"
              onClick={() =>
                example
                  ? startJourney(example.id)
                  : project
                    ? openImport()
                    : newProject()
              }
            >
              {example
                ? "Start walkthrough"
                : project
                  ? "Import your first interview"
                  : "Create your first study"}
              <ArrowRight size={17} />
            </Button>
            <small>
              {example
                ? synthetic
                  ? "3 steps · Synthetic study · Changes are saved"
                  : "3 steps · Your study · Changes are saved"
                : "TXT, Markdown or CSV · Manual analysis in Demo Mode"}
            </small>
          </div>
          {example && (
            <div className="first-trace-preview">
              <span className="home-label">
                <Quote size={16} /> A FINDING WORTH CHECKING
              </span>
              <h3>{example.title}</h3>
              <p>
                {preview.filter((e) => e.role === "supporting").length}{" "}
                supporting excerpts ·{" "}
                {preview.filter((e) => e.role === "contradictory").length}{" "}
                counter-excerpts
              </p>
              <div className="first-trace-route">
                <span>Source</span>
                <ArrowRight size={14} />
                <span>Review</span>
                <ArrowRight size={14} />
                <span>Opportunity</span>
              </div>
            </div>
          )}
        </section>
      )}
      <div className="home-workspace-grid">
        <section
          className="home-review-queue"
          aria-labelledby="review-queue-title"
        >
          <div className="home-section-head">
            <div>
              <span className="eyebrow">YOUR NEXT ACTION</span>
              <h2 id="review-queue-title">
                {pending.length
                  ? `${pending.length} findings to review`
                  : "Your review queue is clear"}
              </h2>
            </div>
            <Badge>{pending.length} open</Badge>
          </div>
          {pending.length ? (
            <div className="home-findings">
              {pending.slice(0, 3).map((i) => (
                <button key={i.id} onClick={() => go("/insights/" + i.id)}>
                  <span className="home-finding-icon">
                    <Layers size={19} />
                  </span>
                  <span>
                    <strong>{i.title}</strong>
                    <small>
                      {
                        w.insightLinks.filter((l) => l.insightId === i.id)
                          .length
                      }{" "}
                      linked excerpts · Ready for researcher review
                    </small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              ))}
            </div>
          ) : (
            <div className="home-queue-empty">
              <CheckCircle2 size={26} />
              <p>
                {scope.insights.length
                  ? "Reviewed findings are ready to inform your next opportunity or report."
                  : "Findings you create from interview evidence will appear here for review."}
              </p>
            </div>
          )}
          <Button variant="ghost" onClick={() => go("/findings")}>
            Explore findings <ArrowRight size={16} />
          </Button>
        </section>
        <section className="home-study" aria-labelledby="study-snapshot-title">
          <div className="home-section-head">
            <div>
              <span className="eyebrow">AT A GLANCE</span>
              <h2 id="study-snapshot-title">Study snapshot</h2>
            </div>
            <FileText size={20} />
          </div>
          <dl>
            {[
              {
                label: "Interviews",
                value: scope.interviews.length,
                route: "/interviews",
              },
              {
                label: "Reviewed findings",
                value: reviewed,
                route: "/findings",
              },
              {
                label: "Product opportunities",
                value: scope.opportunities.length,
                route: "/opportunities",
              },
            ].map((item) => (
              <div key={item.label}>
                <dt>
                  <button onClick={() => go(item.route)}>
                    {item.label}
                    <ArrowUpRight size={14} />
                  </button>
                </dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          {project && (
            <details className="home-study-context">
              <summary>Research objective</summary>
              <p>{project.objective}</p>
              <Button
                variant="ghost"
                onClick={() => {
                  setProjectId(project.id);
                  go("/projects/" + project.id);
                }}
              >
                Open study <ArrowRight size={15} />
              </Button>
            </details>
          )}
        </section>
      </div>
      {walkthroughCompleted && example && !activeJourney && (
        <Button
          variant="ghost"
          className="replay-walkthrough"
          onClick={() => startJourney(example.id)}
        >
          Replay walkthrough <ArrowRight size={15} />
        </Button>
      )}
      <p className="home-mode-note">
        Demo Mode uses prepared example findings and manual analysis for
        imported interviews.{" "}
        <button onClick={() => go("/settings")}>About this workspace</button>
      </p>
    </div>
  );
}
