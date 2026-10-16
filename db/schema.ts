import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
export const projects = sqliteTable("projects", {
  id: text().primaryKey(),
  name: text().notNull(),
  objective: text().notNull(),
  questions: text().notNull(),
  context: text().notNull(),
  methodology: text().notNull(),
  criteria: text().notNull(),
  status: text().notNull(),
  createdAt: text().notNull(),
});
export const participants = sqliteTable("participants", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  segment: text().notNull(),
});
export const interviews = sqliteTable(
  "interviews",
  {
    id: text().primaryKey(),
    projectId: text()
      .notNull()
      .references(() => projects.id),
    participantId: text()
      .notNull()
      .references(() => participants.id),
    title: text().notNull(),
    date: text().notNull(),
    tags: text().notNull(),
    objective: text().notNull(),
    notes: text().notNull(),
    transcript: text().notNull(),
    synthetic: integer().notNull(),
    analysisStatus: text().notNull(),
    createdAt: text().notNull(),
  },
  (t) => [
    uniqueIndex("interview_transcript_project").on(t.projectId, t.transcript),
  ],
);
export const segments = sqliteTable("segments", {
  id: text().primaryKey(),
  interviewId: text()
    .notNull()
    .references(() => interviews.id),
  position: integer().notNull(),
  speaker: text(),
  timestamp: text(),
  text: text().notNull(),
  startOffset: integer().notNull(),
  endOffset: integer().notNull(),
});
export const themes = sqliteTable("themes", {
  id: text().primaryKey(),
  projectId: text()
    .notNull()
    .references(() => projects.id),
  title: text().notNull(),
  explanation: text().notNull(),
  status: text().notNull(),
});
export const evidence = sqliteTable("evidence", {
  id: text().primaryKey(),
  segmentId: text()
    .notNull()
    .references(() => segments.id),
  quote: text().notNull(),
  kind: text().notNull(),
  themeId: text().references(() => themes.id),
  provenance: text().notNull(),
  createdAt: text().notNull(),
});
export const insights = sqliteTable("insights", {
  id: text().primaryKey(),
  projectId: text()
    .notNull()
    .references(() => projects.id),
  themeId: text().references(() => themes.id),
  title: text().notNull(),
  explanation: text().notNull(),
  limitations: text().notNull(),
  status: text().notNull(),
  provenance: text().notNull(),
  createdAt: text().notNull(),
});
export const insightLinks = sqliteTable(
  "insightLinks",
  {
    insightId: text()
      .notNull()
      .references(() => insights.id),
    evidenceId: text()
      .notNull()
      .references(() => evidence.id),
    role: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.insightId, t.evidenceId] })],
);
export const opportunities = sqliteTable("opportunities", {
  id: text().primaryKey(),
  projectId: text()
    .notNull()
    .references(() => projects.id),
  title: text().notNull(),
  problem: text().notNull(),
  hypothesis: text().notNull(),
  direction: text().notNull(),
  segment: text().notNull(),
  assumptions: text().notNull(),
  outcome: text().notNull(),
  risk: text().notNull(),
  impact: integer().notNull(),
  confidence: integer().notNull(),
  effort: integer().notNull(),
  status: text().notNull(),
  metric: text().notNull(),
  validation: text().notNull(),
  createdAt: text().notNull(),
});
export const opportunityLinks = sqliteTable(
  "opportunityLinks",
  {
    opportunityId: text()
      .notNull()
      .references(() => opportunities.id),
    insightId: text()
      .notNull()
      .references(() => insights.id),
  },
  (t) => [primaryKey({ columns: [t.opportunityId, t.insightId] })],
);
export const reports = sqliteTable("reports", {
  id: text().primaryKey(),
  projectId: text()
    .notNull()
    .references(() => projects.id),
  title: text().notNull(),
  markdown: text().notNull(),
  createdAt: text().notNull(),
});
export const reviews = sqliteTable("reviews", {
  id: text().primaryKey(),
  entityId: text().notNull(),
  action: text().notNull(),
  note: text().notNull(),
  createdAt: text().notNull(),
});
export const runs = sqliteTable("runs", {
  id: text().primaryKey(),
  projectId: text()
    .notNull()
    .references(() => projects.id),
  mode: text().notNull(),
  status: text().notNull(),
  detail: text().notNull(),
  createdAt: text().notNull(),
});
export const evaluationCases = sqliteTable("evaluationCases", {
  id: text().primaryKey(),
  segmentId: text()
    .notNull()
    .references(() => segments.id),
  expectedKind: text().notNull(),
  themeTitle: text().notNull(),
  relevant: integer().notNull(),
});
