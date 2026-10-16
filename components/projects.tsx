"use client";
import { useState } from "react";
import {
  Plus,
  Folder,
  ArrowUpRight,
  ArrowRight,
  MessagesSquare,
  Layers,
  Archive,
  PenLine,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useTrace } from "./context";
import {
  Button,
  PageHead,
  Field,
  Modal,
  Status,
  Badge,
  Empty,
  Breadcrumb,
  formObject,
} from "./ui";
import type { Project } from "@/lib/types";
import { ImportDialog } from "./interviews";
export function ProjectForm({
  project,
  onClose,
}: {
  project?: Project;
  onClose: () => void;
}) {
  const { act, busy, go, setProjectId } = useTrace();
  return (
    <Modal
      title={project ? "Edit research study" : "Create a research study"}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = formObject(e.currentTarget);
          const r = await act(
            project ? "project.update" : "project.create",
            data,
            project?.id,
          );
          if (r) {
            setProjectId(project?.id || r.id!);
            go("/projects/" + (project?.id || r.id));
            onClose();
          }
        }}
      >
        <Field label="Study name">
          <input
            autoFocus
            name="name"
            required
            maxLength={250}
            defaultValue={project?.name}
            placeholder="e.g. Understanding first-time activation"
          />
        </Field>
        <Field label="Research objective">
          <textarea
            name="objective"
            required
            minLength={10}
            defaultValue={project?.objective}
            placeholder="What do you need to understand, and why?"
            rows={3}
          />
        </Field>
        <Field label="Research questions" hint="One question per line.">
          <textarea
            name="questions"
            defaultValue={project?.questions}
            rows={4}
          />
        </Field>
        <div className="form-grid">
          <Field label="Methodology">
            <textarea
              name="methodology"
              defaultValue={
                project?.methodology ??
                "Semi-structured qualitative interviews."
              }
              rows={3}
            />
          </Field>
          <Field label="Participant criteria">
            <textarea
              name="criteria"
              defaultValue={project?.criteria}
              rows={3}
            />
          </Field>
        </div>
        <Field label="Product context">
          <textarea name="context" defaultValue={project?.context} rows={2} />
        </Field>
        <Field label="Study status">
          <select name="status" defaultValue={project?.status ?? "Planning"}>
            <option>Planning</option>
            <option>Active</option>
            <option>Completed</option>
            {project?.status === "Archived" && <option>Archived</option>}
          </select>
        </Field>
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy}>
            {project ? "Save study" : "Create study"} <ArrowRight size={15} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function Projects() {
  const { w, go, setProjectId } = useTrace();
  const [create, setCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);
  const projects = w.projects.filter(
    (p) =>
      (archived || p.status !== "Archived") &&
      (p.name + " " + p.objective).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHead
        eyebrow="THE START OF EVERY TRACE"
        title="Research projects"
        description="Give each study a purpose. Keep every conversation connected to it."
        actions={
          <Button variant="primary" onClick={() => setCreate(true)}>
            <Plus size={16} /> New study
          </Button>
        }
      />
      <div className="filter-bar">
        <input
          aria-label="Search studies"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search studies…"
        />
        <label className="inline-check">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
          Include archived
        </label>
        <span className="quiet">{projects.length} studies</span>
      </div>
      <div className="project-grid">
        {projects.map((p) => (
          <button
            key={p.id}
            className="project-card"
            onClick={() => {
              setProjectId(p.id);
              go("/projects/" + p.id);
            }}
          >
            <div className="project-card-top">
              <span className="project-symbol">
                <Folder size={22} />
              </span>
              <Badge tone={p.status === "Active" ? "green" : "neutral"}>
                {p.status}
              </Badge>
            </div>
            <h2>{p.name}</h2>
            <p>{p.objective}</p>
            <div className="project-meta">
              <span>
                <MessagesSquare size={14} />
                {w.interviews.filter((i) => i.projectId === p.id).length}{" "}
                interviews
              </span>
              <span>
                <Layers size={14} />
                {w.insights.filter((i) => i.projectId === p.id).length} insights
              </span>
              <ArrowUpRight size={18} />
            </div>
            <small>Created {p.createdAt.slice(0, 10)}</small>
          </button>
        ))}
      </div>
      {!projects.length && (
        <Empty
          title="A place for your next question"
          description="Create a study, define its objective, and add your first interview."
          action={
            <Button onClick={() => setCreate(true)}>Create a study</Button>
          }
        />
      )}{" "}
      {create && <ProjectForm onClose={() => setCreate(false)} />}
    </>
  );
}
export function ProjectDetail({ id }: { id: string }) {
  const { w, go, act, busy, setProjectId } = useTrace();
  const p = w.projects.find((p) => p.id === id);
  const [edit, setEdit] = useState(false);
  const [importing, setImporting] = useState(false);
  const [archive, setArchive] = useState(false);
  if (!p)
    return (
      <Empty
        title="Study not found"
        description="This link may refer to a study outside this workspace."
      />
    );
  const interviews = w.interviews.filter((i) => i.projectId === id);
  const insights = w.insights.filter(
    (i) => i.projectId === id && i.status !== "Rejected",
  );
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Research projects", onClick: () => go("/projects") },
          { label: p.name },
        ]}
      />
      <PageHead
        eyebrow="RESEARCH STUDY"
        title={p.name}
        description={p.objective}
        actions={
          <>
            <Button onClick={() => setEdit(true)}>
              <PenLine size={15} /> Edit study
            </Button>
            {p.status === "Archived" ? (
              <Button
                variant="primary"
                disabled={busy}
                onClick={() =>
                  act("project.update", { ...p, status: "Active" }, id)
                }
              >
                Restore study
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setProjectId(id);
                  setImporting(true);
                }}
              >
                <Plus size={16} /> Import interviews
              </Button>
            )}
          </>
        }
      />
      <div className="study-detail-banner">
        <Badge tone={p.status === "Active" ? "green" : "neutral"}>
          {p.status}
        </Badge>
        <span>{interviews.length} interviews</span>
        <span>
          {insights.filter((i) => i.status === "Verified").length} verified
          findings
        </span>
        <span>
          {w.opportunities.filter((o) => o.projectId === id).length}{" "}
          opportunities
        </span>
        {interviews.some((i) => i.synthetic === 1) && (
          <Badge tone="amber">Includes synthetic demonstration research</Badge>
        )}
      </div>
      <div className="two-column">
        <section className="paper-section">
          <div className="panel-heading">
            <h2>The study brief</h2>
            <Folder size={17} />
          </div>
          <h3>Research questions</h3>
          <ul className="question-list">
            {p.questions
              .split("\n")
              .filter(Boolean)
              .map((q, n) => (
                <li key={n}>{q}</li>
              ))}
          </ul>
          <h3>Methodology</h3>
          <p>{p.methodology}</p>
          <h3>Participant criteria</h3>
          <p>{p.criteria || "No criteria recorded yet."}</p>
          <h3>Product context</h3>
          <p>{p.context || "No product context recorded yet."}</p>
        </section>
        <section className="paper-section">
          <div className="panel-heading">
            <h2>Recent findings</h2>
            <Button
              variant="ghost"
              onClick={() => {
                setProjectId(id);
                go("/findings");
              }}
            >
              Explore findings <ArrowRight size={14} />
            </Button>
          </div>
          {insights.slice(0, 4).map((i) => (
            <button
              className="detail-list-row"
              key={i.id}
              onClick={() => go("/insights/" + i.id)}
            >
              <span>
                <strong>{i.title}</strong>
                <small>
                  {w.insightLinks.filter((l) => l.insightId === i.id).length}{" "}
                  linked excerpts
                </small>
              </span>
              <Status status={i.status} />
            </button>
          ))}
          {!insights.length && (
            <Empty
              title="Your first finding starts with evidence"
              description="Import a transcript, save a quote, then create an insight."
            />
          )}
          <div className="next-step">
            <CheckCircle2 size={20} />
            <div>
              <h3>A useful next step</h3>
              <p>
                {insights.length
                  ? "Review the interpretations, seek counter-evidence, and verify the findings you can support."
                  : "Add interviews and start collecting source-linked quotations."}
              </p>
            </div>
          </div>
        </section>
      </div>
      <div className="section-heading">
        <h2>Conversations in this study</h2>
        <span className="quiet">{interviews.length} interviews</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Interview</th>
              <th>Participant</th>
              <th>Segment</th>
              <th>Date</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((i) => {
              const part = w.participants.find((p) => p.id === i.participantId);
              return (
                <tr key={i.id}>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => go("/interviews/" + i.id)}
                    >
                      {i.title}
                      <ArrowUpRight size={13} />
                    </button>
                  </td>
                  <td>{part?.identifier}</td>
                  <td>{part?.segment}</td>
                  <td>{i.date}</td>
                  <td>
                    <Badge tone={i.synthetic ? "amber" : "neutral"}>
                      {i.synthetic ? "Synthetic" : "Imported"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!interviews.length && (
        <Empty
          title="No conversations yet"
          description="Paste a transcript or upload a TXT, Markdown, or CSV file."
          action={
            <Button onClick={() => setImporting(true)}>
              Import an interview
            </Button>
          }
        />
      )}
      <div className="study-detail-footer">
        <span>
          Created {p.createdAt.slice(0, 10)} · {p.id}
        </span>
        {p.status !== "Archived" && (
          <Button variant="ghost" onClick={() => setArchive(true)}>
            <Archive size={14} /> Archive study
          </Button>
        )}
      </div>
      {edit && <ProjectForm project={p} onClose={() => setEdit(false)} />}{" "}
      {importing && (
        <ImportDialog projectId={id} onClose={() => setImporting(false)} />
      )}{" "}
      {archive && (
        <Modal title="Archive this study?" onClose={() => setArchive(false)}>
          <p>
            Its interviews, evidence and reports will remain available from the
            archived study. Restore the study to make changes.
          </p>
          <div className="form-actions">
            <Button onClick={() => setArchive(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                const r = await act(
                  "project.update",
                  { ...p, status: "Archived" },
                  id,
                );
                if (r) {
                  setProjectId("");
                  setArchive(false);
                  go("/projects");
                }
              }}
            >
              Archive study
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
