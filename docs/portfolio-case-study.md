# TRACE — Making research decisions traceable

**From customer conversations to confident product decisions.**

TRACE is a working, single-user qualitative research workspace. This case study describes a software demonstration built around synthetic interviews. It does not claim customer validation, real field research, commercial adoption or measured improvements in onboarding.

## The product problem

Research becomes difficult to trust when a summary is separated from the conversations behind it. A plausible paragraph may hide a weak source, lose a minority perspective, or turn a nuanced observation into an unsupported recommendation. Product managers need a concise interpretation; researchers need to inspect, correct and qualify it. Both need a path back to the original wording.

TRACE organizes that path as a connected workflow: project → interview → source excerpt → theme → reviewed insight → candidate opportunity → research report.

## Users and strategy

The intended users are UX researchers, product managers and product/business analysts. Researchers need source fidelity and review control. Product managers need understandable findings and testable directions. Analysts need participant segments, explicit assumptions and structured links.

The first release prioritizes the trust-critical vertical slice over automated feature breadth. A free demonstration must work without an API account. Imported research therefore supports a complete manual workflow, while the seeded project supplies precomputed findings with explicit provenance. This makes the product usable and the scope honest before a model is connected.

## The demonstration study

The fintech project explores friction in registration and identity verification. Twelve fictional transcripts cover completed and abandoned onboarding, first-time fintech use, experienced digital banking, verification failures and privacy concerns.

The material intentionally includes disagreement. Some participants describe silence after submission; others are comfortable waiting when an email confirms the next step. Failed photo checks invite guesses about lighting, but the transcripts do not establish the cause. One participant has trouble reading consent copy and explicitly cautions against generalizing from a single account.

These details support a more credible synthesis demonstration than a set of uniformly convenient quotes. They remain authored examples, not evidence about the fintech market.

## The defining workflow

A reviewer opens “Users feel uncertain about identity verification.” The detail view separates the interpretation, supporting passages, contradictory passages and limitations. Selecting a quote opens the original interview, highlights its persistent segment and preserves a route back to the finding.

The researcher can narrow the interpretation, record a review note and mark it verified. Editing or changing sources returns it to review. Only a verified finding can create a new evidence-linked opportunity. The opportunity stores a hypothesis, assumptions, target segment, estimated priority, proposed success measure and validation plan. Its linked insight and original quotes remain inspectable.

The final report includes verified findings, contradictory evidence, limitations, candidate opportunities and a source appendix. Markdown export preserves human-readable interview and segment references. Browser printing provides a PDF-saving route.

## Key UX decisions

**A research instrument, not a chat-first interface.** The primary navigation follows research tasks. Ask TRACE is one view among projects, transcripts, themes, opportunities, reports and quality checks.

**Quotes as navigable objects.** A passage is a doorway to its original context, rather than an ornamental card. Source identifiers and character offsets persist across reloads.

**Counter-evidence has its own space.** Contradictions are placed beside supporting accounts and carried into reports. Their absence is described as an evidence gap, never proof of consensus.

**Review states have consequences.** Verification gates new opportunity links. Subsequent edits invalidate that review state. Existing opportunities retain their links and expose the current state of the finding.

**Counts show their sample.** Segment comparisons display interview denominators. The interface avoids translating a qualitative sample into population prevalence.

**A restrained visual system.** A dark navigation rail, warm neutral canvas, compact metadata and quiet green evidence surfaces distinguish navigation, interpretation and primary material. Responsive layouts move the transcript's contextual panel below the reader on small screens; opportunity status menus remain available alongside drag and drop.

**An overview that points to work.** The home screen prioritizes a first-use walkthrough and findings awaiting review. A compact study snapshot replaces the previous five-counter strip, coverage chart, theme gallery and activity feed. Reading surfaces use 15–17 px text and secondary labels stay at least 12 px. These are design changes, not measured usability improvements.

**Guidance that survives navigation.** The walkthrough accompanies the researcher from a finding to its highlighted source, back to the review controls and into opportunity creation. It progresses from source navigation and saved domain states, persists in the same browser, and can be exited. Completing it removes the introductory hero on later visits while preserving a replay action.

## Engineering and reliability

The app uses React, TypeScript, Next.js, a normalized SQLite schema and Zod validation. A shared action layer handles ingestion, exact-source checks, review transitions, linking and reports. The local database adapter uses Node SQLite; the hosted Worker adapter uses D1. Drizzle migrations define fourteen related tables.

Transcript segmentation preserves original text and UTF-16 character offsets. Speaker and timestamp metadata are parsed only when supplied. Imported batches reject malformed records and duplicate transcripts atomically. Evidence cannot be attached across study boundaries, and archived studies reject mutations until restored.

Research is rendered as text rather than executable markup. Demo Mode makes no external model request. Local server startup binds to loopback, and hosted access is private at the platform level. This release has no team collaboration or per-tenant authorization.

## What “AI” means in this release

The product is designed for an AI-assisted research workflow, but this build deliberately runs in Demo Mode. Its seeded findings are precomputed; source validation is deterministic; Ask TRACE retrieves stored findings through keyword matching. Uploaded interviews are not automatically synthesized by an LLM.

Live model integration remains future work. It needs server-only credentials, informed data transmission, bounded retries and timeouts, structured output validation, exact-source rejection and independent quality evaluation. Claiming that those capabilities already exist would weaken the central trust proposition.

## Evaluation

The test suite checks source offsets, exact quotation matching, malformed imports, duplicate rejection, cross-project protection, archive/restore behavior and persistent domain workflows against SQLite. Browser scenarios cover source navigation, counter-evidence, review, opportunity editing, report download, research import, search and responsive overflow.

The quality screen computes citation validity, quote exactness, annotated extraction consistency, theme agreement, source-less claim rate and review-action acceptance. Every measure defines its numerator and denominator. The reference annotations also supply the precomputed demo outputs, so these results are consistency checks rather than an independent holdout benchmark. No real-world AI performance is inferred.

## Implemented scope and next steps

Implemented capabilities include project creation/editing/archiving, TXT/MD/CSV ingestion, persistent transcript segments, quote selection and classification, themes, sourced insight authoring, review history, duplicate merging, opportunity management, local research retrieval, editable reports, Markdown export, print styling, archival JSON export and reproducible source checks.

The next priorities are independent annotations and live structured extraction, semantic retrieval, multi-user authorization, pagination for larger corpora, accessible usability testing and report export validation with real stakeholder documents. The product should earn broader automation through measured reliability rather than introduce it as a decorative promise.
