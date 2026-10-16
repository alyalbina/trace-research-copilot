# Validation record

The application was exercised on Windows with Node.js 24 in a restricted desktop sandbox.

- **13 Vitest tests passed.** Source offsets, exact quotation matching, CSV parsing, corrupted/missing evidence, insufficient retrieval, verified-only report generation, same-origin handling, atomic seeding, persistent import-to-report commands, duplicate/cross-project rejection and archive/restore behavior were exercised against SQLite.
- **4 Playwright workflows passed.** The complete source-to-opportunity-to-report scenario, imported-interview-to-verified-insight persistence, responsive navigation and overflow, and source search/insufficient-evidence handling all ran in Chromium.
- **Responsive checks passed** on representative screens at 1440, 1280, 1024, 768 and 390 px. This checks overflow and navigation; it is not formal device certification or WCAG conformance.
- **Next.js production build passed**, including its TypeScript stage, static page generation and dynamic API build.
- **Production smoke test passed:** the built page and database API returned HTTP 200, 12 synthetic interviews persisted, and a foreign-origin mutation returned HTTP 403.
- **Hosted Worker build passed.** A bundle check confirms the D1 database adapter is present and local Node SQLite code is absent.
- **Synthetic reference evaluation passed:** 18/18 references resolve and 18/18 quotations match. The curated precision, recall and theme labels are consistent with the authored reference set. These are not independent model performance results.
- Screenshots in `docs/screenshots/` were generated from the running app and visually inspected. The overview screenshots show the original synthetic seed; review workflow tests use a separate temporary database.

The local Windows Workers emulator crashed before serving requests. The independent Next.js/Node SQLite runtime was used for the functional browser tests. The production hosting service reports deployment state separately from these local checks. Live AI, real customer validation, team collaboration and formal accessibility conformance were not tested or claimed.
