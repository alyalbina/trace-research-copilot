import type { Segment } from "./types";
/** Offsets address the original string, including CRLF. Speaker/time remain null unless present. */
export function segmentTranscript(
  transcript: string,
  interviewId: string,
): Segment[] {
  const segments: Segment[] = [];
  const lines = transcript.matchAll(/[^\r\n]+/g);
  for (const line of lines) {
    const raw = line[0];
    if (!raw.trim()) continue;
    const m = raw.match(
      /^(?:\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*)?(?:([A-Za-z][A-Za-z0-9 _-]{0,35}):\s*)?/,
    );
    const prefix = m?.[0] ?? "";
    const content = raw.slice(prefix.length);
    if (!content.trim()) continue;
    const startOffset = (line.index ?? 0) + prefix.length;
    segments.push({
      id: `${interviewId}-s${segments.length + 1}`,
      interviewId,
      position: segments.length + 1,
      speaker: m?.[2] ?? null,
      timestamp: m?.[1] ?? null,
      text: content,
      startOffset,
      endOffset: startOffset + content.length,
    });
  }
  return segments;
}
export function validateQuote(segment: Segment | undefined, quote: string) {
  return !!segment && quote.trim().length >= 8 && segment.text.includes(quote);
}
/** RFC4180-style quoted CSV, including embedded commas/newlines and escaped double quotes. */
export function parseCSV(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (!quoted && cell.length > 0)
        throw new Error("Unexpected quote in CSV. Quote complete fields.");
      else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  const headers =
    rows.shift()?.map((x) => x.replace(/^\uFEFF/, "").trim()) ?? [];
  for (const h of ["title", "participant", "segment", "date", "transcript"])
    if (!headers.includes(h)) throw new Error(`CSV needs a ${h} column.`);
  return rows.map((r, n) => {
    if (r.length !== headers.length)
      throw new Error(
        `CSV row ${n + 2} has ${r.length} columns; expected ${headers.length}.`,
      );
    return Object.fromEntries(headers.map((h, i) => [h, r[i]]));
  });
}
