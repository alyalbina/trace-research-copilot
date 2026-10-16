import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
const file = resolve(
  process.env.TRACE_DATABASE_PATH || ".trace-data/trace.sqlite",
);
let connection: DatabaseSync | undefined;
export function getDatabase(): D1Database {
  if (!existsSync(file))
    throw new Error(
      "Database has not been initialized. Run npm run db:migrate, then restart TRACE.",
    );
  connection ??= new DatabaseSync(file);
  connection.exec("PRAGMA foreign_keys = ON;");
  const sqlite = connection;
  class Statement {
    sql: string;
    params: (string | number | null)[] = [];
    constructor(sql: string) {
      this.sql = sql;
    }
    bind(...params: (string | number | null)[]) {
      this.params = params;
      return this;
    }
    async first() {
      return sqlite.prepare(this.sql).get(...this.params) ?? null;
    }
    async all() {
      return { results: sqlite.prepare(this.sql).all(...this.params) };
    }
    execute() {
      const prepared = sqlite.prepare(this.sql);
      if (/^SELECT/i.test(this.sql))
        return { results: prepared.all(...this.params), success: true };
      const result = prepared.run(...this.params);
      return {
        results: [],
        success: true,
        meta: { changes: Number(result.changes) },
      };
    }
  }
  return {
    prepare(sql: string) {
      return new Statement(sql);
    },
    async batch(statements: Statement[]) {
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        const results = statements.map((s) => s.execute());
        sqlite.exec("COMMIT");
        return results;
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  } as unknown as D1Database;
}
