import { describe, it, expect } from "vitest";
import { segmentTranscript, validateQuote, parseCSV } from "../lib/ingestion";
import { makeSeed } from "../lib/seed";
import {
  evaluate,
  sourceOf,
  evidenceFor,
  buildReport,
  retrieve,
} from "../lib/research";
import { perform } from "../lib/actions";
import { loadWorkspace } from "../lib/repository";
import { testDatabase } from "./sqlite-adapter";
import { sameOrigin } from "../lib/http";
describe("Same-origin requests behind the local Next server", () => {
  it("uses the public Host rather than a rewritten internal hostname", () => {
    expect(
      sameOrigin(
        new Request("http://localhost:5183/api/workspace", {
          headers: { host: "127.0.0.1:5183", origin: "http://127.0.0.1:5183" },
        }),
      ),
    ).toBe(true);
  });
  it("rejects foreign and malformed origins", () => {
    expect(
      sameOrigin(
        new Request("http://localhost/api/workspace", {
          headers: { host: "trace.test", origin: "https://attacker.test" },
        }),
      ),
    ).toBe(false);
    expect(
      sameOrigin(
        new Request("http://localhost/api/workspace", {
          headers: { host: "trace.test", origin: "null" },
        }),
      ),
    ).toBe(false);
  });
});
describe("Source integrity", () => {
  it("preserves original offsets across CRLF and optional speaker/time labels", () => {
    const text =
      "[01:24] P01: I could not find my next step.\r\n\r\nUnlabelled response here.\r\nResearcher: Why?";
    const ss = segmentTranscript(text, "x");
    expect(ss).toHaveLength(3);
    for (const s of ss)
      expect(text.slice(s.startOffset, s.endOffset)).toBe(s.text);
    expect(ss[0].timestamp).toBe("01:24");
    expect(ss[0].speaker).toBe("P01");
    expect(ss[1].speaker).toBeNull();
    expect(ss[1].timestamp).toBeNull();
  });
  it("rejects fabricated quotes, altered punctuation, and missing sources", () => {
    const [s] = segmentTranscript("P01: I needed a clear next step.", "x");
    expect(validateQuote(s, "I needed a clear next step.")).toBe(true);
    expect(validateQuote(s, "I needed a clear next step!")).toBe(false);
    expect(validateQuote(undefined, "Fake source quote.")).toBe(false);
  });
  it("parses quoted multi-line CSV and fails malformed records", () => {
    const rows = parseCSV(
      'title,participant,segment,date,transcript\r\n"My, interview",P01,New,2026-10-01,"P01: I said ""yes"".\nP01: Then I waited."',
    );
    expect(rows[0].title).toBe("My, interview");
    expect(rows[0].transcript).toContain('I said "yes".\n');
    expect(() =>
      parseCSV(
        'title,participant,segment,date,transcript\na,b,c,d,"unterminated',
      ),
    ).toThrow("unclosed");
    expect(() =>
      parseCSV("title,participant,segment,date,transcript\na,b,c,d"),
    ).toThrow("columns");
  });
  it("links every seeded quote exactly and retains contradictory accounts", () => {
    const w = makeSeed();
    expect(w.interviews).toHaveLength(12);
    expect(w.segments).toHaveLength(144);
    for (const e of w.evidence)
      expect(validateQuote(sourceOf(w, e).segment, e.quote)).toBe(true);
    expect(evidenceFor(w, w.insights[0], "contradictory")).toHaveLength(2);
  });
  it("computes evaluation and detects deliberate corruption", () => {
    const w = makeSeed();
    expect(evaluate(w).citations).toEqual({ n: 18, d: 18 });
    expect(evaluate(w).recall).toEqual({ n: 18, d: 18 });
    w.evidence[0].quote = "A fabricated customer said this.";
    w.evidence[1].segmentId = "missing";
    expect(evaluate(w).exactness).toEqual({ n: 16, d: 18 });
    expect(evaluate(w).citations).toEqual({ n: 17, d: 18 });
  });
  it("does not fabricate answers when retrieval has no matching evidence", () => {
    const w = makeSeed();
    expect(
      retrieve(w, w.projects[0].id, "quantum teleportation").insufficient,
    ).toBe(true);
    expect(
      retrieve(w, w.projects[0].id, "verification uncertainty").insights[0].id,
    ).toBe("i-uncertain");
  });
  it("exports only verified findings with source references and honest limitations", () => {
    const w = makeSeed();
    const md = buildReport(w, w.projects[0].id);
    expect(md).toContain("synthetic");
    expect(md).toContain("Source appendix");
    expect(md).toContain("characters");
    expect(md).not.toContain("### Users feel uncertain");
    expect(md).toContain("### A preparation checklist");
  });
});
describe("Persistent research workflow against SQLite", () => {
  it("seeds atomically and will not overwrite existing research", async () => {
    const { db, close } = testDatabase();
    try {
      await perform(db, { action: "seed" });
      const w = await loadWorkspace(db);
      expect(w.interviews).toHaveLength(12);
      expect(w.evidence).toHaveLength(18);
      await expect(perform(db, { action: "seed" })).rejects.toThrow(
        "already contains",
      );
    } finally {
      close();
    }
  });
  it("supports import → exact quotation → insight → review → opportunity → report", async () => {
    const { db, close } = testDatabase();
    try {
      const p = await perform(db, {
        action: "project.create",
        data: {
          name: "Test study",
          objective: "Understand the registration experience.",
        },
      });
      const imported = await perform(db, {
        action: "interview.import",
        data: [
          {
            projectId: p.id,
            title: "Test conversation",
            participant: "T01",
            segment: "New user",
            date: "2026-10-14",
            transcript:
              "Researcher: Tell me about the registration.\nT01: I could not find what to do after submitting my identity document. I waited and then called support.",
          },
        ],
      });
      let w = await loadWorkspace(db);
      const segment = w.segments.find(
        (s) => s.interviewId === imported.id && s.speaker === "T01",
      )!;
      const e = await perform(db, {
        action: "evidence.create",
        data: {
          segmentId: segment.id,
          quote: segment.text,
          kind: "Pain point",
        },
      });
      const i = await perform(db, {
        action: "insight.create",
        data: {
          projectId: p.id,
          title: "Next step unclear",
          explanation:
            "One participant could not identify the next action after document submission.",
          limitations:
            "One interview only; timing and cause are not independently established.",
          evidenceIds: [e.id],
        },
      });
      await expect(
        perform(db, {
          action: "opportunity.create",
          data: {
            projectId: p.id,
            title: "Clear next steps",
            problem: "The next step was unclear.",
            hypothesis:
              "A clear confirmation may help users understand the next action.",
            impact: 2,
            confidence: 2,
            effort: 2,
            status: "Discovery",
            insightIds: [i.id],
          },
        }),
      ).rejects.toThrow("verified");
      await perform(db, {
        action: "insight.review",
        id: i.id,
        data: { status: "Verified" },
      });
      const o = await perform(db, {
        action: "opportunity.create",
        data: {
          projectId: p.id,
          title: "Clear next steps",
          problem: "The next step was unclear.",
          hypothesis:
            "A clear confirmation may help users understand the next action.",
          impact: 2,
          confidence: 2,
          effort: 2,
          status: "Discovery",
          insightIds: [i.id],
        },
      });
      await perform(db, {
        action: "opportunity.status",
        id: o.id,
        data: { status: "Validating" },
      });
      const r = await perform(db, {
        action: "report.generate",
        data: { projectId: p.id },
      });
      w = await loadWorkspace(db);
      expect(w.opportunities[0].status).toBe("Validating");
      expect(w.opportunityLinks[0].insightId).toBe(i.id);
      expect(w.reports.find((x) => x.id === r.id)?.markdown).toContain(
        segment.id,
      );
      await perform(db, {
        action: "insight.update",
        id: i.id,
        data: {
          title: "A narrower finding",
          explanation:
            "This one participant was uncertain about the next step. Other explanations remain plausible.",
          limitations: "Single account with uncertain causality.",
          themeId: null,
        },
      });
      expect((await loadWorkspace(db)).insights[0].status).toBe("Under Review");
    } finally {
      close();
    }
  });
  it("rejects invalid quotes, cross-project evidence and duplicate imports without partial writes", async () => {
    const { db, close } = testDatabase();
    try {
      await perform(db, { action: "seed" });
      const w = await loadWorkspace(db);
      await expect(
        perform(db, {
          action: "evidence.create",
          data: {
            segmentId: w.segments[0].id,
            quote: "I am a fabricated quote.",
            kind: "Observation",
          },
        }),
      ).rejects.toThrow("exactly match");
      const p = await perform(db, {
        action: "project.create",
        data: {
          name: "Other study",
          objective: "Understand another research question.",
        },
      });
      await expect(
        perform(db, {
          action: "insight.create",
          data: {
            projectId: p.id,
            title: "Invalid source",
            explanation: "This claim has evidence from the wrong project.",
            limitations: "This is a cross-project negative test.",
            evidenceIds: [w.evidence[0].id],
          },
        }),
      ).rejects.toThrow("this project");
      const item = {
        projectId: w.projects[0].id,
        title: "Duplicate",
        participant: "T01",
        segment: "New",
        date: "2026-10-14",
        transcript: w.interviews[0].transcript,
      };
      await expect(
        perform(db, { action: "interview.import", data: [item] }),
      ).rejects.toThrow("Duplicate");
      expect((await loadWorkspace(db)).interviews).toHaveLength(12);
    } finally {
      close();
    }
  });
  it("prevents edits to archived research and preserves source data on restore", async () => {
    const { db, close } = testDatabase();
    try {
      await perform(db, { action: "seed" });
      const w = await loadWorkspace(db);
      const p = w.projects[0];
      await perform(db, {
        action: "project.update",
        id: p.id,
        data: { ...p, status: "Archived" },
      });
      await expect(
        perform(db, {
          action: "insight.review",
          id: w.insights[0].id,
          data: { status: "Verified" },
        }),
      ).rejects.toThrow("Restore");
      await perform(db, {
        action: "project.update",
        id: p.id,
        data: { ...p, status: "Active" },
      });
      expect((await loadWorkspace(db)).segments).toHaveLength(144);
    } finally {
      close();
    }
  });
});
