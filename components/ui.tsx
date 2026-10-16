"use client";
import {
  useEffect,
  useRef,
  useId,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from "react";
import {
  X,
  ArrowUpRight,
  Check,
  ChevronRight,
  Quote,
  LoaderCircle,
} from "lucide-react";
import type { Evidence, Workspace, Insight } from "@/lib/types";
import { sourceOf } from "@/lib/research";
export function Button({
  children,
  variant = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
}) {
  return (
    <button className={`btn ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Status({ status }: { status: string }) {
  return (
    <Badge
      tone={
        status === "Verified"
          ? "green"
          : status === "Rejected"
            ? "muted"
            : status === "Under Review"
              ? "amber"
              : "indigo"
      }
    >
      {status === "Verified" && <Check size={11} />} {status}
    </Badge>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  drawer = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const cancel = (e: Event) => {
      e.preventDefault();
      closeRef.current();
    };
    dialog?.addEventListener("cancel", cancel);
    return () => {
      dialog?.removeEventListener("cancel", cancel);
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${wide ? "wide" : ""} ${drawer ? "drawer" : ""}`}
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <Button variant="ghost" aria-label="Close dialog" onClick={onClose}>
          <X size={19} />
        </Button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {isValidElement(children)
        ? cloneElement(
            children as ReactElement<{
              id: string;
              "aria-describedby"?: string;
            }>,
            { id, "aria-describedby": hint ? id + "-hint" : undefined },
          )
        : children}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Quote size={25} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading-page">
      <LoaderCircle className="spin" size={24} />
      <p>Opening your research workspace…</p>
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
export function PageHead({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="head-actions">{actions}</div>
    </div>
  );
}
export function QuoteCard({
  w,
  e,
  go,
  insight,
  role,
  compact = false,
}: {
  w: Workspace;
  e: Evidence;
  go: (route: string) => void;
  insight?: Insight;
  role?: string;
  compact?: boolean;
}) {
  const { interview, participant, segment } = sourceOf(w, e);
  return (
    <button
      className={`quote-card ${role === "contradictory" ? "contradictory" : ""} ${compact ? "compact" : ""}`}
      onClick={() =>
        go(
          `/interviews/${interview?.id}?segment=${segment?.id}${insight ? "&insight=" + insight.id : ""}`,
        )
      }
    >
      <div className="quote-label">
        <span>
          <Quote size={13} />
          {role === "contradictory" ? "Counter-evidence" : "Source evidence"}
        </span>
        <ArrowUpRight size={15} />
      </div>
      <blockquote>“{e.quote}”</blockquote>
      <div className="quote-attribution">
        <span className="avatar tiny">{participant?.identifier}</span>
        <span>
          <strong>{participant?.identifier}</strong>
          <small>
            {participant?.segment} · {interview?.date}
          </small>
        </span>
        <span className="source-id">§{segment?.position}</span>
      </div>
    </button>
  );
}
export function Breadcrumb({
  items,
}: {
  items: { label: string; onClick?: () => void }[];
}) {
  return (
    <div className="breadcrumb">
      {items.map((i, n) => (
        <span key={n}>
          {n > 0 && <ChevronRight size={12} />}
          <button onClick={i.onClick} disabled={!i.onClick}>
            {i.label}
          </button>
        </span>
      ))}
    </div>
  );
}
export function formObject(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}
export function download(
  filename: string,
  content: string,
  type = "text/markdown",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
