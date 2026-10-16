import { z } from "zod";
import type { Workspace, Insight, Opportunity } from "./types";
import {
  type DB,
  insert,
  update,
  loadWorkspace,
  seedDatabase,
} from "./repository";
import { segmentTranscript, validateQuote } from "./ingestion";
import { sourceOf, evidenceFor, buildReport } from "./research";
const short = z.string().trim().min(1).max(250);
const long = z.string().trim().max(30000);
const idSchema = z.string().min(1).max(100);
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Use a valid interview date.",
  );
const projectSchema = z.object({
  name: short,
  objective: z.string().trim().min(10).max(5000),
  questions: long.default(""),
  context: long.default(""),
  methodology: long.default("Semi-structured qualitative interviews."),
  criteria: long.default(""),
  status: z
    .enum(["Active", "Planning", "Completed", "Archived"])
    .default("Active"),
});
const interviewSchema = z.object({
  projectId: idSchema,
  title: short,
  participant: short,
  segment: short,
  date: dateSchema,
  tags: z.string().max(1000).default(""),
  objective: long.default(""),
  notes: long.default(""),
  transcript: z
    .string()
    .min(60, "Transcript must contain at least 60 characters.")
    .max(200000),
});
const evidenceSchema = z.object({
  segmentId: idSchema,
  quote: z.string().min(8).max(30000),
  kind: z.enum([
    "Pain point",
    "Need",
    "Workaround",
    "Observation",
    "Motivation",
    "Feature request",
  ]),
  themeId: z.string().nullable().default(null),
});
const insightSchema = z.object({
  projectId: idSchema,
  themeId: z.string().nullable().default(null),
  title: short,
  explanation: z.string().trim().min(20).max(10000),
  limitations: z.string().trim().min(10).max(5000),
  evidenceIds: z
    .array(idSchema)
    .min(1, "Attach at least one supporting quotation."),
});
const opportunitySchema = z.object({
  projectId: idSchema,
  title: short,
  problem: z.string().trim().min(10).max(10000),
  hypothesis: z.string().trim().min(10).max(5000),
  direction: long.default(""),
  segment: z.string().max(500).default(""),
  assumptions: long.default(""),
  outcome: long.default(""),
  risk: long.default(""),
  impact: z.coerce.number().int().min(1).max(5),
  confidence: z.coerce.number().int().min(1).max(5),
  effort: z.coerce.number().int().min(1).max(5),
  status: z.enum(["Discovery", "Validating", "Planned", "Parked"]),
  metric: long.default(""),
  validation: long.default(""),
  insightIds: z.array(idSchema).default([]),
});
const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
export async function perform(db: DB, body: Record<string, unknown>) {
  const action = z
    .enum([
      "seed",
      "project.create",
      "project.update",
      "interview.import",
      "interview.update",
      "evidence.create",
      "evidence.update",
      "theme.create",
      "theme.update",
      "insight.create",
      "insight.update",
      "insight.review",
      "insight.attach",
      "insight.detach",
      "insight.merge",
      "opportunity.create",
      "opportunity.update",
      "opportunity.status",
      "report.generate",
      "report.update",
      "demo.validate",
    ])
    .parse(body.action);
  if (action === "seed") {
    await seedDatabase(db);
    return { message: "Synthetic research workspace loaded." };
  }
  const w = await loadWorkspace(db);
  const stmts: D1PreparedStatement[] = [];
  let resultId = "";
  let message = "Saved.";
  const data = body.data;
  const id = typeof body.id === "string" ? body.id : "";
  const audit = (entityId: string, action: string, note = "") =>
    stmts.push(
      insert(db, "reviews", {
        id: uuid(),
        entityId,
        action,
        note,
        createdAt: now(),
      }),
    );
  const project = (projectId: string) => {
    const p = w.projects.find((p) => p.id === projectId);
    if (!p) throw new Error("Research project not found.");
    if (p.status === "Archived")
      throw new Error("Restore the project before changing its research.");
    return p;
  };
  const findInsight = (id: string) => {
    const i = w.insights.find((i) => i.id === id);
    if (!i) throw new Error("Insight not found.");
    project(i.projectId);
    return i;
  };
  const checkTheme = (themeId: string | null, projectId: string) => {
    if (
      themeId &&
      !w.themes.some((t) => t.id === themeId && t.projectId === projectId)
    )
      throw new Error("Theme belongs to another project or no longer exists.");
  };
  const checkEvidence = (ids: string[], projectId: string) => {
    for (const id of ids) {
      const e = w.evidence.find((e) => e.id === id);
      if (
        !e ||
        sourceOf(w, e).interview?.projectId !== projectId ||
        !validateQuote(sourceOf(w, e).segment, e.quote)
      )
        throw new Error("Every quotation must match a source in this project.");
    }
  };
  if (action === "project.create") {
    const p = projectSchema.parse(data);
    resultId = uuid();
    stmts.push(
      insert(db, "projects", { ...p, id: resultId, createdAt: now() }),
    );
    audit(resultId, "Project created", p.name);
  }
  if (action === "project.update") {
    const p = projectSchema.parse(data);
    if (!w.projects.some((p) => p.id === id))
      throw new Error("Project not found.");
    stmts.push(update(db, "projects", id, p));
    audit(
      id,
      p.status === "Archived" ? "Project archived" : "Project edited",
      p.name,
    );
  }
  if (action === "interview.import") {
    const items = z.array(interviewSchema).min(1).max(50).parse(data);
    const pending = new Set<string>();
    const participantLookup = new Map(
      w.participants.map((p) => [p.identifier + "\0" + p.segment, p.id]),
    );
    for (const item of items) {
      project(item.projectId);
      const fingerprint = item.projectId + "\0" + item.transcript.trim();
      if (
        pending.has(fingerprint) ||
        w.interviews.some(
          (i) =>
            i.projectId === item.projectId &&
            i.transcript.trim() === item.transcript.trim(),
        )
      )
        throw new Error(
          `Duplicate transcript: ${item.title}. No interviews were imported.`,
        );
      pending.add(fingerprint);
      const participantKey = item.participant + "\0" + item.segment;
      const existingId = participantLookup.get(participantKey);
      const participantId = existingId ?? uuid();
      if (!existingId) {
        stmts.push(
          insert(db, "participants", {
            id: participantId,
            identifier: item.participant,
            segment: item.segment,
          }),
        );
        participantLookup.set(participantKey, participantId);
      }
      resultId = uuid();
      const { participant, segment, ...fields } = item;
      void participant;
      void segment;
      stmts.push(
        insert(db, "interviews", {
          ...fields,
          id: resultId,
          participantId,
          synthetic: 0,
          analysisStatus: "Manual review",
          createdAt: now(),
        }),
      );
      const segments = segmentTranscript(item.transcript, resultId);
      if (!segments.length)
        throw new Error("No readable transcript segments found.");
      segments.forEach((s) =>
        stmts.push(
          insert(db, "segments", s as unknown as Record<string, unknown>),
        ),
      );
      audit(resultId, "Interview imported", item.title);
    }
    message = `${items.length} interview${items.length === 1 ? "" : "s"} imported. Original text and offsets preserved.`;
  }
  if (action === "interview.update") {
    const input = z
      .object({
        title: short,
        participant: short,
        segment: short,
        date: dateSchema,
        tags: z.string().max(1000),
        notes: long,
        objective: long,
      })
      .parse(data);
    const interview = w.interviews.find((i) => i.id === id);
    if (!interview) throw new Error("Interview not found.");
    project(interview.projectId);
    // New participant row avoids changing another interview that shares the old participant.
    const matched = w.participants.find(
      (p) => p.identifier === input.participant && p.segment === input.segment,
    );
    const pid = matched?.id ?? uuid();
    if (!matched)
      stmts.push(
        insert(db, "participants", {
          id: pid,
          identifier: input.participant,
          segment: input.segment,
        }),
      );
    const { participant, segment, ...metadata } = input;
    void participant;
    void segment;
    stmts.push(
      update(db, "interviews", id, { ...metadata, participantId: pid }),
    );
    audit(id, "Interview edited");
  }
  if (action === "theme.create" || action === "theme.update") {
    const input = z
      .object({
        projectId: idSchema,
        title: short,
        explanation: z.string().trim().min(10).max(5000),
        status: z
          .enum(["Under Review", "Verified", "Rejected"])
          .default("Under Review"),
      })
      .parse(data);
    project(input.projectId);
    if (action === "theme.create") {
      resultId = uuid();
      stmts.push(insert(db, "themes", { ...input, id: resultId }));
    } else {
      if (!w.themes.some((t) => t.id === id && t.projectId === input.projectId))
        throw new Error("Theme not found in this project.");
      stmts.push(update(db, "themes", id, input));
    }
    audit(resultId || id, "Theme edited");
  }
  if (action === "evidence.create") {
    const e = evidenceSchema.parse(data);
    const s = w.segments.find((s) => s.id === e.segmentId);
    if (!validateQuote(s, e.quote))
      throw new Error(
        "Quotation does not exactly match the source segment. It was not saved.",
      );
    const i = w.interviews.find((i) => i.id === s?.interviewId)!;
    project(i.projectId);
    checkTheme(e.themeId, i.projectId);
    resultId = uuid();
    stmts.push(
      insert(db, "evidence", {
        ...e,
        id: resultId,
        provenance: "Researcher selected",
        createdAt: now(),
      }),
    );
    audit(resultId, "Evidence saved");
  }
  if (action === "evidence.update") {
    const e = w.evidence.find((e) => e.id === id);
    if (!e) throw new Error("Evidence not found.");
    const pid = sourceOf(w, e).interview!.projectId;
    project(pid);
    const input = z
      .object({
        kind: evidenceSchema.shape.kind,
        themeId: z.string().nullable(),
      })
      .parse(data);
    checkTheme(input.themeId, pid);
    stmts.push(
      update(db, "evidence", id, {
        ...input,
        provenance: "Researcher classified",
      }),
    );
    audit(id, "Evidence classified");
  }
  if (action === "insight.create") {
    const input = insightSchema.parse(data);
    project(input.projectId);
    checkTheme(input.themeId, input.projectId);
    checkEvidence(input.evidenceIds, input.projectId);
    resultId = uuid();
    const { evidenceIds, ...i } = input;
    stmts.push(
      insert(db, "insights", {
        ...i,
        id: resultId,
        status: "Under Review",
        provenance: "Researcher authored",
        createdAt: now(),
      }),
    );
    [...new Set(evidenceIds)].forEach((evidenceId) =>
      stmts.push(
        insert(db, "insightLinks", {
          insightId: resultId,
          evidenceId,
          role: "supporting",
        }),
      ),
    );
    audit(resultId, "Insight created");
  }
  if (action === "insight.update") {
    const i = findInsight(id);
    const input = z
      .object({
        title: short,
        explanation: z.string().trim().min(20).max(10000),
        limitations: z.string().trim().min(10).max(5000),
        themeId: z.string().nullable(),
      })
      .parse(data);
    checkTheme(input.themeId, i.projectId);
    stmts.push(
      update(db, "insights", id, {
        ...input,
        status: "Under Review",
        provenance:
          i.provenance === "Precomputed synthetic demo"
            ? "Demo interpretation edited by researcher"
            : "Researcher authored",
      }),
    );
    audit(
      id,
      "Edited",
      "Interpretation changed; verification requires a new review.",
    );
    message = "Interpretation saved. Review it again before verification.";
  }
  if (action === "insight.review") {
    const i = findInsight(id);
    const input = z
      .object({
        status: z.enum(["Under Review", "Verified", "Rejected"]),
        note: z.string().max(5000).default(""),
      })
      .parse(data);
    if (
      input.status === "Verified" &&
      !evidenceFor(w, i, "supporting").some((e) =>
        validateQuote(sourceOf(w, e).segment, e.quote),
      )
    )
      throw new Error(
        "Attach a valid supporting quotation before verification.",
      );
    stmts.push(update(db, "insights", id, { status: input.status }));
    audit(id, input.status, input.note);
    message = `Insight marked ${input.status.toLowerCase()}.`;
  }
  if (action === "insight.attach" || action === "insight.detach") {
    const i = findInsight(id);
    const input = z
      .object({
        evidenceId: idSchema,
        role: z.enum(["supporting", "contradictory"]).default("supporting"),
      })
      .parse(data);
    checkEvidence([input.evidenceId], i.projectId);
    stmts.push(
      db
        .prepare(
          "DELETE FROM insightLinks WHERE insightId = ? AND evidenceId = ?",
        )
        .bind(id, input.evidenceId),
    );
    if (action === "insight.attach")
      stmts.push(insert(db, "insightLinks", { insightId: id, ...input }));
    stmts.push(update(db, "insights", id, { status: "Under Review" }));
    audit(id, "Evidence links changed");
  }
  if (action === "insight.merge") {
    const source = findInsight(id);
    const { targetId } = z.object({ targetId: idSchema }).parse(data);
    const target = findInsight(targetId);
    if (target.id === source.id || target.projectId !== source.projectId)
      throw new Error("Select a different insight in this project.");
    for (const l of w.insightLinks.filter(
      (l) =>
        l.insightId === source.id &&
        !w.insightLinks.some(
          (t) => t.insightId === target.id && t.evidenceId === l.evidenceId,
        ),
    ))
      stmts.push(insert(db, "insightLinks", { ...l, insightId: target.id }));
    stmts.push(update(db, "insights", target.id, { status: "Under Review" }));
    stmts.push(update(db, "insights", source.id, { status: "Rejected" }));
    audit(
      target.id,
      "Insights merged",
      `Evidence retained from ${source.title}; original retained as rejected. Existing opportunity links remain attached to their original insight.`,
    );
    message = "Evidence merged. Review the combined interpretation.";
  }
  if (action === "opportunity.create" || action === "opportunity.update") {
    const input = opportunitySchema.parse(data);
    project(input.projectId);
    for (const iid of input.insightIds) {
      const i = findInsight(iid);
      const retained =
        action === "opportunity.update" &&
        w.opportunityLinks.some(
          (l) => l.opportunityId === id && l.insightId === iid,
        );
      if (
        i.projectId !== input.projectId ||
        (!retained && i.status !== "Verified")
      )
        throw new Error(
          "New opportunity links require verified insights in the same project.",
        );
    }
    const { insightIds, ...o } = input;
    if (action === "opportunity.create") {
      resultId = uuid();
      stmts.push(
        insert(db, "opportunities", { ...o, id: resultId, createdAt: now() }),
      );
    } else {
      const existing = w.opportunities.find((o) => o.id === id);
      if (!existing || existing.projectId !== input.projectId)
        throw new Error("Opportunity not found.");
      resultId = id;
      stmts.push(update(db, "opportunities", id, o));
      stmts.push(
        db
          .prepare("DELETE FROM opportunityLinks WHERE opportunityId = ?")
          .bind(id),
      );
    }
    [...new Set(insightIds)].forEach((insightId) =>
      stmts.push(
        insert(db, "opportunityLinks", { opportunityId: resultId, insightId }),
      ),
    );
    audit(
      resultId,
      action === "opportunity.create"
        ? "Opportunity created"
        : "Opportunity edited",
    );
  }
  if (action === "opportunity.status") {
    const o = w.opportunities.find((o) => o.id === id);
    if (!o) throw new Error("Opportunity not found.");
    project(o.projectId);
    const { status } = z
      .object({ status: opportunitySchema.shape.status })
      .parse(data);
    stmts.push(update(db, "opportunities", id, { status }));
    audit(id, "Opportunity moved", status);
  }
  if (action === "report.generate") {
    const { projectId } = z.object({ projectId: idSchema }).parse(data);
    const p = project(projectId);
    resultId = uuid();
    stmts.push(
      insert(db, "reports", {
        id: resultId,
        projectId,
        title: p.name + " — Research summary",
        markdown: buildReport(w, projectId),
        createdAt: now(),
      }),
    );
    audit(
      resultId,
      "Report generated",
      "Verified insights with source appendix.",
    );
    message = "Report generated from verified findings.";
  }
  if (action === "report.update") {
    const r = w.reports.find((r) => r.id === id);
    if (!r) throw new Error("Report not found.");
    project(r.projectId);
    const input = z
      .object({ title: short, markdown: z.string().min(20).max(200000) })
      .parse(data);
    stmts.push(update(db, "reports", id, input));
    audit(
      id,
      "Report edited",
      "Manual text may change claims; review citations before sharing.",
    );
  }
  if (action === "demo.validate") {
    const { projectId } = z.object({ projectId: idSchema }).parse(data);
    project(projectId);
    const es = w.evidence.filter(
      (e) => sourceOf(w, e).interview?.projectId === projectId,
    );
    const bad = es.filter(
      (e) => !validateQuote(sourceOf(w, e).segment, e.quote),
    );
    resultId = uuid();
    stmts.push(
      insert(db, "runs", {
        id: resultId,
        projectId,
        mode: "Local source validation",
        status: bad.length ? "Failed" : "Completed",
        detail: `${es.length - bad.length} / ${es.length} quotations match original segments. No live AI analysis occurred. Imported interviews require manual coding in Demo Mode.`,
        createdAt: now(),
      }),
    );
    audit(projectId, "Source validation", `${bad.length} mismatches.`);
    message = bad.length
      ? "Source mismatches detected. Review Evaluation & Quality."
      : `Validated ${es.length} quotations. No AI request was made.`;
  }
  if (!stmts.length) throw new Error("No changes supplied.");
  await db.batch(stmts);
  return { id: resultId, message };
}
