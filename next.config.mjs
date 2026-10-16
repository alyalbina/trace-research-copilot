/** @type {import('next').NextConfig} */
const config = {
  distDir: process.env.TRACE_E2E ? ".next-e2e" : ".next",
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["node:sqlite"],
  devIndicators: false,
  experimental: { cpus: 2 },
  typescript: { ignoreBuildErrors: false },
};
export default config;
