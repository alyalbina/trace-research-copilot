import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: process.env.TRACE_BASE_URL || "http://127.0.0.1:5182",
    headless: true,
    trace: "retain-on-failure",
    launchOptions: process.env.TRACE_BROWSER_PATH
      ? { executablePath: process.env.TRACE_BROWSER_PATH }
      : {},
  },
  webServer: process.env.TRACE_EXTERNAL_SERVER
    ? undefined
    : {
        command:
          "node scripts/run-next.mjs dev --hostname 127.0.0.1 --port 5182 --webpack",
        url: "http://127.0.0.1:5182",
        reuseExistingServer: false,
        timeout: 180000,
        env: { TRACE_E2E: "1" },
      },
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: ".sites-runtime/test-results",
});
