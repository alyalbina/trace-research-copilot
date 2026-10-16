import type { Workspace, Insight, Evidence, Opportunity } from "./types";
import { validateQuote } from "./ingestion";
export function sourceOf(w: Workspace, e: Evidence) {
  const segment = w.segments.find((s) => s.id === e.segmentId);
  const interview = w.interviews.find((i) => i.id === segment?.interviewId);
  const participant = w.participants.find(
    (p) => p.id === interview?.participantId,
  );
  return { segment, interview, participant };
}
export function evidenceFor(w: Workspace, i: Insight, role?: string) {
  return w.insightLinks
    .filter((l) => l.insightId === i.id && (!role || l.role === role))
    .flatMap((l) => {
      const e = w.evidence.find((e) => e.id === l.evidenceId);
      return e ? [{ ...e, role: l.role }] : [];
    });
}
export function interviewCount(w: Workspace, es: Evidence[]) {
  return new Set(es.map((e) => sourceOf(w, e).interview?.id).filter(Boolean))
    .size;
}
export function priority(o: Opportunity) {
  return Math.round(((o.impact * o.confidence) / o.effort) * 10) / 10;
}
export function evaluate(w: Workspace) {
  const valid = w.evidence.filter((e) => sourceOf(w, e).segment);
  const exact = w.evidence.filter((e) =>
    validateQuote(sourceOf(w, e).segment, e.quote),
  );
  const annotated = w.evaluationCases;
  const relevant = annotated.filter((c) => c.relevant === 1);
  const annotatedIds = new Set(annotated.map((c) => c.segmentId));
  const candidates = w.evidence.filter((e) => annotatedIds.has(e.segmentId));
  const correct = candidates.filter((e) =>
    annotated.some(
      (c) =>
        c.segmentId === e.segmentId &&
        c.relevant === 1 &&
        c.expectedKind === e.kind,
    ),
  );
  const found = relevant.filter((c) =>
    w.evidence.some(
      (e) => e.segmentId === c.segmentId && e.kind === c.expectedKind,
    ),
  );
  const coherent = correct.filter((e) =>
    annotated.some(
      (c) =>
        c.segmentId === e.segmentId &&
        w.themes.find((t) => t.id === e.themeId)?.title === c.themeTitle,
    ),
  );
  const unsupported = w.insights.filter(
    (i) =>
      !evidenceFor(w, i, "supporting").some((e) =>
        validateQuote(sourceOf(w, e).segment, e.quote),
      ),
  );
  const human = w.reviews.filter((r) =>
    ["Verified", "Rejected", "Edited", "Under Review"].includes(r.action),
  );
  return {
    citations: { n: valid.length, d: w.evidence.length },
    exactness: { n: exact.length, d: w.evidence.length },
    precision: { n: correct.length, d: candidates.length },
    recall: { n: found.length, d: relevant.length },
    theme: { n: coherent.length, d: correct.length },
    unsupported: { n: unsupported.length, d: w.insights.length },
    agreement: {
      n: human.filter((r) => r.action === "Verified").length,
      d: human.length,
    },
  };
}
export function retrieve(w: Workspace, projectId: string, question: string) {
  const stop = new Set(
    "what why how are the do does users user about biggest which is a an of for to and in me tell evidence have with show who".split(
      " ",
    ),
  );
  const terms =
    question
      .toLowerCase()
      .match(/[a-z]+/g)
      ?.filter((t) => !stop.has(t) && t.length > 2) ?? [];
  const expanded = terms.flatMap((t) => [
    t,
    ...(t.includes("onboard")
      ? ["verification", "registration", "signup"]
      : []),
    ...(t.includes("trust") ? ["privacy", "data", "consent"] : []),
  ]);
  const scored = w.insights
    .filter((i) => i.projectId === projectId && i.status !== "Rejected")
    .map((i) => ({
      i,
      score: expanded.reduce(
        (n, t) =>
          n +
          ((
            i.title +
            " " +
            i.explanation +
            " " +
            evidenceFor(w, i)
              .map((e) => e.quote)
              .join(" ")
          )
            .toLowerCase()
            .includes(t)
            ? 1
            : 0),
        0,
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return {
    insights: scored.map((x) => x.i),
    question,
    mode: "Local evidence retrieval",
    insufficient: scored.length === 0,
  };
}
export function buildReport(w: Workspace, projectId: string) {
  const p = w.projects.find((p) => p.id === projectId);
  if (!p) throw new Error("Project not found.");
  const interviews = w.interviews.filter((i) => i.projectId === projectId);
  const insights = w.insights.filter(
    (i) => i.projectId === projectId && i.status === "Verified",
  );
  const ops = w.opportunities.filter((o) => o.projectId === projectId);
  const synthetic = interviews.some((i) => i.synthetic === 1);
  const sourceIds = new Set<string>();
  const findings = insights
    .map((i) => {
      const es = evidenceFor(w, i);
      es.forEach((e) => sourceIds.add(e.id));
      return `### ${i.title}\n\n${i.explanation}\n\nStatus: ${i.status}. Provenance: ${i.provenance}. ${interviewCount(w, es)} distinct contributing interviews.\n\n${es
        .map((e) => {
          const { interview, participant, segment } = sourceOf(w, e);
          return `> ${e.quote}\n\n${e.role === "contradictory" ? "Contradictory" : "Supporting"} evidence — ${participant?.identifier}, ${participant?.segment}; ${interview?.title}; segment ${segment?.id}, characters ${segment?.startOffset}–${segment?.endOffset}. [Open source](#/interviews/${interview?.id}?segment=${segment?.id})`;
        })
        .join("\n\n")}\n\nLimitations: ${i.limitations}`;
    })
    .join("\n\n");
  const appendix = [...sourceIds]
    .map((id) => {
      const e = w.evidence.find((e) => e.id === id)!;
      const { interview, segment } = sourceOf(w, e);
      return `- ${id}: ${interview?.title} (${interview?.date}), segment ${segment?.id}, original characters ${segment?.startOffset}–${segment?.endOffset}.`;
    })
    .join("\n");
  return `# ${p.name} — Research summary\n\n${synthetic ? "**Contains synthetic demonstration interviews. These findings are not real customer research or product validation.**" : "Single-user research workspace export."}\n\n## Executive summary\n\n${insights.length} researcher-verified insights from ${interviews.length} interviews. Recommendations below remain unvalidated hypotheses.\n\n## Research objective\n\n${p.objective}\n\n## Research questions\n\n${p.questions}\n\n## Methodology and sample\n\n${p.methodology}\n\nParticipant criteria: ${p.criteria}\n\n${[
    ...new Set(
      interviews.map(
        (i) => w.participants.find((p) => p.id === i.participantId)?.segment,
      ),
    ),
  ]
    .filter(Boolean)
    .map(
      (s) =>
        `- ${s}: ${interviews.filter((i) => w.participants.find((p) => p.id === i.participantId)?.segment === s).length} / ${interviews.length} interviews`,
    )
    .join(
      "\n",
    )}\n\nInterview counts describe this sample, not population prevalence.\n\n## Key findings and contradictory evidence\n\n${findings || "No verified findings yet. Review insights before reporting them."}\n\n## Candidate product opportunities\n\n${
    ops
      .map(
        (o) =>
          `### ${o.title}\n\nProblem: ${o.problem}\n\nHypothesis: ${o.hypothesis}\n\nAssumptions: ${o.assumptions}\n\nExpected outcome: ${o.outcome}\n\nValidation: ${o.validation}\n\nProposed metric (not measured): ${o.metric}\n\nRisks: ${o.risk}\n\nLinked insights: ${
            w.opportunityLinks
              .filter((l) => l.opportunityId === o.id)
              .map((l) => w.insights.find((i) => i.id === l.insightId)?.title)
              .join("; ") || "None; manual recommendation."
          }`,
      )
      .join("\n\n") || "No candidate opportunities."
  }\n\n## Research limitations\n\n${synthetic ? "This dataset was authored for software demonstration. It does not establish market needs. " : ""}Small purposive qualitative sample; no statistical inference. Human verification does not imply the interpretation has been independently validated. Quotes are checked for literal source matches, which cannot prove a claim follows from them.\n\n## Next research steps\n\nTest the hypotheses with representative participants. Seek disconfirming evidence and recruit underrepresented segments.\n\n## Source appendix\n\n${appendix || "No cited evidence."}\n\nSource links are relative to the TRACE workspace. Character offsets and segment IDs remain human-readable after export.\n`;
}
