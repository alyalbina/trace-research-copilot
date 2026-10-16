import { getDatabase } from "@/lib/database";
import { loadWorkspace } from "@/lib/repository";
import { perform } from "@/lib/actions";
import { z } from "zod";
import { sameOrigin } from "@/lib/http";
export const dynamic = "force-dynamic";
function database() {
  return getDatabase();
}
export async function GET() {
  try {
    return Response.json(await loadWorkspace(database()), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Workspace could not load." },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request))
      return Response.json(
        { error: "Use TRACE from its own origin." },
        { status: 403 },
      );
    if (!request.headers.get("content-type")?.includes("application/json"))
      return Response.json({ error: "Send JSON data." }, { status: 415 });
    const raw = await request.text();
    if (raw.length > 2_000_000)
      return Response.json(
        { error: "Import is too large. Split into batches smaller than 2 MB." },
        { status: 413 },
      );
    const body = z.record(z.unknown()).parse(JSON.parse(raw));
    const result = await perform(database(), body);
    return Response.json(result);
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? e.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")
        : e instanceof Error
          ? e.message
          : "Could not save this change.";
    return Response.json({ error: message }, { status: 400 });
  }
}
