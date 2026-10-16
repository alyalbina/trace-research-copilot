export type ReviewStatus =
  "AI Suggested" | "Under Review" | "Verified" | "Rejected";
export interface Project {
  id: string;
  name: string;
  objective: string;
  questions: string;
  context: string;
  methodology: string;
  criteria: string;
  status: string;
  createdAt: string;
}
export interface Participant {
  id: string;
  identifier: string;
  segment: string;
}
export interface Interview {
  id: string;
  projectId: string;
  participantId: string;
  title: string;
  date: string;
  tags: string;
  objective: string;
  notes: string;
  transcript: string;
  synthetic: number;
  analysisStatus: string;
  createdAt: string;
}
export interface Segment {
  id: string;
  interviewId: string;
  position: number;
  speaker: string | null;
  timestamp: string | null;
  text: string;
  startOffset: number;
  endOffset: number;
}
export interface Evidence {
  id: string;
  segmentId: string;
  quote: string;
  kind: string;
  themeId: string | null;
  provenance: string;
  createdAt: string;
}
export interface Theme {
  id: string;
  projectId: string;
  title: string;
  explanation: string;
  status: string;
}
export interface Insight {
  id: string;
  projectId: string;
  themeId: string | null;
  title: string;
  explanation: string;
  limitations: string;
  status: ReviewStatus;
  provenance: string;
  createdAt: string;
}
export interface InsightLink {
  insightId: string;
  evidenceId: string;
  role: "supporting" | "contradictory";
}
export interface Opportunity {
  id: string;
  projectId: string;
  title: string;
  problem: string;
  hypothesis: string;
  direction: string;
  segment: string;
  assumptions: string;
  outcome: string;
  risk: string;
  impact: number;
  confidence: number;
  effort: number;
  status: string;
  metric: string;
  validation: string;
  createdAt: string;
}
export interface OpportunityLink {
  opportunityId: string;
  insightId: string;
}
export interface Report {
  id: string;
  projectId: string;
  title: string;
  markdown: string;
  createdAt: string;
}
export interface Review {
  id: string;
  entityId: string;
  action: string;
  note: string;
  createdAt: string;
}
export interface AnalysisRun {
  id: string;
  projectId: string;
  mode: string;
  status: string;
  detail: string;
  createdAt: string;
}
export interface EvaluationCase {
  id: string;
  segmentId: string;
  expectedKind: string;
  themeTitle: string;
  relevant: number;
}
export interface Workspace {
  projects: Project[];
  participants: Participant[];
  interviews: Interview[];
  segments: Segment[];
  evidence: Evidence[];
  themes: Theme[];
  insights: Insight[];
  insightLinks: InsightLink[];
  opportunities: Opportunity[];
  opportunityLinks: OpportunityLink[];
  reports: Report[];
  reviews: Review[];
  runs: AnalysisRun[];
  evaluationCases: EvaluationCase[];
}
export const emptyWorkspace: Workspace = {
  projects: [],
  participants: [],
  interviews: [],
  segments: [],
  evidence: [],
  themes: [],
  insights: [],
  insightLinks: [],
  opportunities: [],
  opportunityLinks: [],
  reports: [],
  reviews: [],
  runs: [],
  evaluationCases: [],
};
