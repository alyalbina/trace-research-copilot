"use client";
import { createContext, useContext } from "react";
import type { Workspace } from "@/lib/types";
export interface TraceContext {
  w: Workspace;
  projectId: string;
  setProjectId: (id: string) => void;
  route: string;
  go: (route: string) => void;
  busy: boolean;
  notify: (message: string, error?: boolean) => void;
  act: (
    action: string,
    data?: unknown,
    id?: string,
  ) => Promise<{ id?: string; message: string } | null>;
}
export const Context = createContext<TraceContext | null>(null);
export function useTrace() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing TRACE context.");
  return value;
}
export function useScope() {
  const { w, projectId } = useTrace();
  const ids = new Set(
    w.projects
      .filter(
        (p) => p.status !== "Archived" && (!projectId || p.id === projectId),
      )
      .map((p) => p.id),
  );
  return {
    ...w,
    projects: w.projects.filter((p) => ids.has(p.id)),
    interviews: w.interviews.filter((i) => ids.has(i.projectId)),
    themes: w.themes.filter((t) => ids.has(t.projectId)),
    insights: w.insights.filter((i) => ids.has(i.projectId)),
    opportunities: w.opportunities.filter((o) => ids.has(o.projectId)),
    reports: w.reports.filter((r) => ids.has(r.projectId)),
    runs: w.runs.filter((r) => ids.has(r.projectId)),
  };
}
