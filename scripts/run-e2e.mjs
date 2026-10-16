import "./windows-realpath.mjs";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import next from "next";
// Keep server and browser runner in one local process tree. This also makes
// Windows sandbox loopback and teardown reliable without killing other servers.
process.env.TRACE_E2E = "1";
process.env.TRACE_DATABASE_PATH = `.sites-runtime/e2e/${randomUUID()}.sqlite`;
process.env.TRACE_BASE_URL = "http://127.0.0.1:5183";
process.env.TRACE_EXTERNAL_SERVER = "1";
const migration = spawnSync(process.execPath, ["scripts/migrate-local.mjs"], {
  stdio: "inherit",
  env: process.env,
});
if (migration.status !== 0) process.exit(migration.status || 1);
const app = next({
  dev: true,
  hostname: "127.0.0.1",
  port: 5183,
  webpack: true,
});
await app.prepare();
const server = createServer(app.getRequestHandler());
await new Promise((resolve) => server.listen(5183, "127.0.0.1", resolve));
const child = spawn(
  process.execPath,
  [
    "--import",
    "./scripts/windows-realpath.mjs",
    "node_modules/@playwright/test/cli.js",
    "test",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit", env: process.env },
);
const code = await new Promise((resolve) => child.on("exit", resolve));
server.closeAllConnections();
server.close();
await app.close();
process.exit(Number(code) || 0);
