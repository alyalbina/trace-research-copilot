import { build } from "vite";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
await build({
  configFile: false,
  logLevel: "error",
  build: {
    ssr: "scripts/evaluate.ts",
    outDir: ".sites-runtime/evaluation",
    rollupOptions: { output: { entryFileNames: "evaluate.mjs" } },
  },
});
await import(
  pathToFileURL(resolve(".sites-runtime/evaluation/evaluate.mjs")).href
);
