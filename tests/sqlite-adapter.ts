import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
/** Test adapter executes production SQL against real in-memory SQLite, including atomic batches. */
export function testDatabase() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  for (const file of readdirSync(resolve("drizzle"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    sqlite.exec(readFileSync(resolve("drizzle", file), "utf8"));
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
      prepared.run(...this.params);
      return { results: [], success: true };
    }
  }
  return {
    db: {
      prepare(sql: string) {
        return new Statement(sql);
      },
      async batch(statements: Statement[]) {
        sqlite.exec("BEGIN");
        try {
          const result = statements.map((s) => s.execute());
          sqlite.exec("COMMIT");
          return result;
        } catch (e) {
          sqlite.exec("ROLLBACK");
          throw e;
        }
      },
    } as unknown as D1Database,
    close: () => sqlite.close(),
  };
}
