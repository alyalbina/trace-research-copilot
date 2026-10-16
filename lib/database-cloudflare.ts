import { env } from "cloudflare:workers";
export function getDatabase() {
  if (!env.DB)
    throw new Error(
      "Research database is unavailable. Apply the D1 migration before starting TRACE.",
    );
  return env.DB;
}
