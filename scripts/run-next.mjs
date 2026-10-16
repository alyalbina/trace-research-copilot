import "./windows-realpath.mjs";
import { fileURLToPath } from "node:url";
const cli = new URL("../node_modules/next/dist/bin/next", import.meta.url);
const [command, ...args] = process.argv.slice(2);
if (!["dev", "build", "start"].includes(command))
  throw new Error("Expected dev, build or start.");
process.argv = [process.execPath, fileURLToPath(cli), command, ...args];
await import(cli.href);
