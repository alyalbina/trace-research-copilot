import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
const file = resolve(
  process.env.TRACE_DATABASE_PATH || ".trace-data/trace.sqlite",
);
mkdirSync(dirname(file), { recursive: true });
const db = new DatabaseSync(file);
db.exec(
  "PRAGMA foreign_keys = ON; CREATE TABLE IF NOT EXISTS _trace_migrations (name TEXT PRIMARY KEY, appliedAt TEXT NOT NULL);",
);
for (const name of readdirSync("drizzle")
  .filter((n) => n.endsWith(".sql"))
  .sort()) {
  if (db.prepare("SELECT name FROM _trace_migrations WHERE name=?").get(name))
    continue;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(readFileSync(resolve("drizzle", name), "utf8"));
    db.prepare("INSERT INTO _trace_migrations VALUES (?,?)").run(
      name,
      new Date().toISOString(),
    );
    db.exec("COMMIT");
    console.log("Applied " + name);
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
db.close();
console.log("SQLite workspace ready: " + file);
