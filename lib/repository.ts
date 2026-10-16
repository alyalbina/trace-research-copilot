import type { Workspace } from "./types";
import { emptyWorkspace } from "./types";
import { makeSeed } from "./seed";
export type DB = D1Database;
export async function loadWorkspace(db: DB): Promise<Workspace> {
  const tables = Object.keys(emptyWorkspace) as (keyof Workspace)[];
  const results = await db.batch(
    tables.map((t) => db.prepare(`SELECT * FROM "${t}"`)),
  );
  return Object.fromEntries(
    tables.map((t, n) => [t, results[n].results]),
  ) as unknown as Workspace;
}
export function insert(db: DB, table: string, row: Record<string, unknown>) {
  const keys = Object.keys(row);
  return db
    .prepare(
      `INSERT INTO "${table}" (${keys.map((k) => `"${k}"`).join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
    )
    .bind(...keys.map((k) => row[k] ?? null));
}
export function update(
  db: DB,
  table: string,
  id: string,
  row: Record<string, unknown>,
) {
  const keys = Object.keys(row);
  return db
    .prepare(
      `UPDATE "${table}" SET ${keys.map((k) => `"${k}" = ?`).join(",")} WHERE id = ?`,
    )
    .bind(...keys.map((k) => row[k] ?? null), id);
}
export async function seedDatabase(db: DB) {
  const existing = await db.prepare("SELECT id FROM projects LIMIT 1").first();
  if (existing)
    throw new Error(
      "The workspace already contains projects. Demo seed will not overwrite research.",
    );
  const w = makeSeed();
  // Parent entities precede their children. D1 batch is atomic.
  const order: (keyof Workspace)[] = [
    "projects",
    "participants",
    "interviews",
    "segments",
    "themes",
    "evidence",
    "insights",
    "insightLinks",
    "opportunities",
    "opportunityLinks",
    "reports",
    "runs",
    "evaluationCases",
    "reviews",
  ];
  await db.batch(
    order.flatMap((t) =>
      w[t].map((row) =>
        insert(db, t, row as unknown as Record<string, unknown>),
      ),
    ),
  );
}
