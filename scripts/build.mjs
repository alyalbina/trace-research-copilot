// Sites invokes the standard build script with TRACE_BUILD_TARGET=worker.
if (process.env.TRACE_BUILD_TARGET === "worker") {
  process.argv = [process.execPath, "scripts/run-framework.mjs", "build"];
  await import("./run-framework.mjs");
} else {
  process.argv = [
    process.execPath,
    "scripts/run-next.mjs",
    "build",
    "--webpack",
  ];
  await import("./run-next.mjs");
}
