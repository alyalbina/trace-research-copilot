"use client";
import { ArrowRight, Check, X } from "lucide-react";
import { useTrace } from "./context";
import { Button } from "./ui";
import { evidenceFor, sourceOf } from "@/lib/research";

export function ResearchWalkthrough() {
  const { w, journey, endJourney, go, projectId } = useTrace();
  const insight = w.insights.find((i) => i.id === journey?.insightId);
  if (!journey || !insight || (projectId && projectId !== insight.projectId))
    return null;
  if (w.projects.find((p) => p.id === insight.projectId)?.status === "Archived")
    return null;
  const source = evidenceFor(w, insight).find((e) => e.role === "supporting");
  if (!source) return null;
  const { interview, segment } = sourceOf(w, source);
  if (!interview || !segment) return null;
  const opportunity = w.opportunities.find(
    (o) =>
      o.createdAt >= journey.startedAt &&
      w.opportunityLinks.some(
        (l) => l.opportunityId === o.id && l.insightId === insight.id,
      ),
  );
  const reviewed = insight.status === "Verified";
  const step = !journey.sourceVisited
    ? 0
    : !reviewed
      ? 1
      : !opportunity
        ? 2
        : 3;
  const titles = [
    "Read the original quote",
    "Review the interpretation",
    "Create a testable opportunity",
  ];
  const descriptions = [
    "Open the highlighted passage and read the surrounding conversation. A quote is the starting point for your judgment.",
    "Compare the supporting and contradictory accounts. Edit or flag the finding if needed; verify it when you are satisfied.",
    "Turn the reviewed finding into a hypothesis. Add a validation plan before saving your opportunity.",
  ];
  const next = () => {
    if (step === 0)
      go(
        `/interviews/${interview.id}?segment=${segment.id}&insight=${insight.id}`,
      );
    else if (step === 1) go(`/insights/${insight.id}?guide=review`);
    else if (step === 2) go(`/insights/${insight.id}?guide=opportunity`);
    else {
      endJourney(true);
      go("/overview");
    }
  };
  return (
    <section
      className={`research-walkthrough ${step === 3 ? "complete" : ""}`}
      aria-label="Guided research walkthrough"
    >
      <div className="walkthrough-heading">
        <span className="eyebrow">
          {step === 3
            ? "WALKTHROUGH COMPLETE"
            : `YOUR FIRST TRACE · STEP ${step + 1} OF 3`}
        </span>
        <button
          className="icon-btn"
          aria-label="Exit walkthrough"
          onClick={() => endJourney()}
        >
          <X size={18} />
        </button>
      </div>
      <ol className="walkthrough-steps" aria-label="Walkthrough progress">
        {titles.map((title, n) => (
          <li
            key={title}
            aria-current={step === n ? "step" : undefined}
            className={n < step ? "done" : ""}
          >
            <span>{n < step ? <Check size={14} /> : n + 1}</span>
            {title}
          </li>
        ))}
      </ol>
      <div className="walkthrough-action">
        <div aria-live="polite">
          <h2>
            {step === 3
              ? "Your opportunity is connected to its evidence."
              : titles[step]}
          </h2>
          <p>
            {step === 3
              ? "You followed a finding to its source, reviewed the interpretation and saved a product hypothesis. You can now include it in a research report."
              : descriptions[step]}
          </p>
        </div>
        <Button variant="primary" onClick={next}>
          {
            [
              "Open source quote",
              "Review finding",
              "Create an opportunity",
              "Finish walkthrough",
            ][step]
          }{" "}
          <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}
