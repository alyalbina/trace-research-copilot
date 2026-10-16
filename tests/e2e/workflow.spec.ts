import { test, expect } from "@playwright/test";
test.beforeEach(async ({ request }) => {
  const response = await request.get("/api/workspace");
  expect(response.ok()).toBe(true);
  const workspace = await response.json();
  if (!workspace.projects.length) {
    const seeded = await request.post("/api/workspace", {
      data: { action: "seed" },
    });
    expect(seeded.ok()).toBe(true);
  }
});
test("guided first experience follows a source, survives reload and completes after saving an opportunity", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start walkthrough", exact: true })
    .click();
  const guide = page.getByRole("region", {
    name: "Guided research walkthrough",
  });
  await expect(guide).toContainText("STEP 1 OF 3");
  await guide.getByRole("button", { name: "Open source quote" }).click();
  await expect(page.locator(".transcript-segment.focused mark")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue to review" }),
  ).toBeVisible();
  await page.reload();
  await expect(guide).toContainText("STEP 2 OF 3");
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expect(
    page.getByRole("button", { name: "Verify insight", exact: true }),
  ).toBeInViewport();
  await page
    .getByRole("button", { name: "Verify insight", exact: true })
    .click();
  await expect(guide).toContainText("STEP 3 OF 3");
  await guide
    .getByRole("button", { name: "Create an opportunity", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Opportunity title")
    .fill("Walkthrough — Clear receipt confirmation");
  await page
    .getByRole("dialog")
    .getByLabel("Validation plan")
    .fill(
      "Test whether participants can explain the next step after document submission.",
    );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save opportunity" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Walkthrough — Clear receipt confirmation",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(guide).toContainText("WALKTHROUGH COMPLETE");
  await guide.getByRole("button", { name: "Finish walkthrough" }).click();
  await expect(
    page.getByRole("heading", { name: "Research overview" }),
  ).toBeVisible();
  await page.reload();
  await expect(guide).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Replay walkthrough" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start walkthrough", exact: true }),
  ).toHaveCount(0);
});
test("signature experience: evidence, counter-evidence, review, opportunity, export and persistence", async ({
  page,
  request,
}) => {
  const state = await request.get("/api/workspace");
  expect(state.ok()).toBe(true);
  const w = await state.json();
  if (!w.projects.length)
    await request.post("/api/workspace", { data: { action: "seed" } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Research overview" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore findings", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Themes & insights" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Users feel uncertain about identity verification.",
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Users feel uncertain about identity verification.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Counter-evidence/ }),
  ).toBeVisible();
  await page.locator(".support-grid .quote-card").first().click();
  await expect(page.locator(".transcript-segment.focused")).toBeVisible();
  await expect(page.locator(".transcript-segment.focused mark")).toContainText(
    "After I uploaded my ID",
  );
  await page.getByRole("button", { name: "Back to the finding" }).click();
  await page.getByRole("button", { name: "Edit interpretation" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Interpretation", { exact: true })
    .fill(
      "Three participants were uncertain about receipt and next steps during review. Two comfortable accounts show that clear confirmation and different urgency may explain the contrast. Communication is a hypothesis, not a proven cause of abandonment.",
    );
  await dialog.getByRole("button", { name: "Save interpretation" }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "Verify insight", exact: true })
    .click();
  await expect(page.locator(".review-panel>.badge")).toContainText("Verified");
  await page
    .getByRole("button", { name: "Create opportunity", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Opportunity title")
    .fill("QA — Improve verification transparency");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save opportunity" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "QA — Improve verification transparency",
      level: 1,
    }),
  ).toBeVisible();
  await page.getByLabel("Workflow status").selectOption("Validating");
  await expect(page.getByLabel("Workflow status")).toHaveValue("Validating");
  await page.getByRole("button", { name: "Edit opportunity" }).click();
  await page
    .getByRole("dialog")
    .last()
    .getByLabel("Validation plan")
    .fill(
      "Compare next-step comprehension with representative participants and seek contradictory feedback.",
    );
  await page
    .getByRole("dialog")
    .last()
    .getByRole("button", { name: "Save opportunity" })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "QA — Improve verification transparency",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Compare next-step comprehension with representative participants and seek contradictory feedback.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await page
    .getByRole("button", { name: "Generate report", exact: true })
    .click();
  await expect(page.locator(".report-paper")).toContainText("Source appendix");
  await expect(page.locator(".report-paper")).toContainText(
    "Users feel uncertain",
  );
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Markdown", exact: true }).click(),
  ]);
  expect(file.suggestedFilename()).toBe("trace-research-summary.md");
  expect(errors).toEqual([]);
});
test("create study, import transcript, save quotation, create and verify an insight", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".main-content")
    .getByRole("button", { name: "New study", exact: true })
    .click();
  await page.getByLabel("Study name").fill("QA import study " + Date.now());
  await page
    .getByLabel("Research objective", { exact: true })
    .fill("Understand the clarity of the registration process.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create study", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Import interviews", exact: true })
    .click();
  await page
    .getByLabel("Interview title", { exact: true })
    .fill("QA customer conversation");
  await page
    .getByLabel("Participant identifier", { exact: true })
    .fill("QA-01");
  await page
    .getByLabel("Participant segment", { exact: true })
    .fill("New customer");
  await page
    .getByLabel("Or paste the transcript", { exact: false })
    .fill(
      "Researcher: What happened after sending your document?\nQA-01: I did not know whether the document had arrived, so I looked for a confirmation and waited for an email.",
    );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Import interview", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "QA customer conversation" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save evidence from passage 2" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save quotation" })
    .click();
  await expect(page.getByRole("button", { name: /Observation/ })).toBeVisible();
  await page
    .getByRole("button", { name: "Themes & insights", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create insight", exact: true })
    .click();
  await page
    .getByLabel("Insight title")
    .fill("QA — Receipt confirmation needed");
  await page
    .getByLabel("Interpretation", { exact: false })
    .fill(
      "One participant looked for confirmation after document submission. This supports a question about receipt clarity.",
    );
  await page
    .getByLabel("Limitations & alternative explanations")
    .fill("One interview; no causal claim or population inference.");
  await page.getByRole("dialog").getByRole("checkbox").first().check();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create insight", exact: true })
    .click();
  await page.getByRole("button", { name: "Verify insight" }).click();
  await expect(page.locator(".review-panel>.badge")).toContainText("Verified");
  await page.reload();
  await expect(page.locator(".review-panel>.badge")).toContainText("Verified");
});
test("responsive navigation and representative screens stay within viewport", async ({
  page,
}) => {
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 950 });
    for (const route of [
      "/overview",
      "/findings",
      "/interviews/int-p01?segment=int-p01-s4",
      "/opportunities",
      "/quality",
      "/ask",
    ]) {
      await page.goto("/#" + route);
      await expect(page.locator(".main-content")).toBeVisible();
      await expect(page.locator(".topbar")).toBeVisible();
      await page.waitForFunction(() => document.querySelector(".app-shell"));
      const size = await page.evaluate(() => ({
        viewport: innerWidth,
        width: document.documentElement.scrollWidth,
      }));
      expect(size.width, `${route} at ${width}`).toBeLessThanOrEqual(
        size.viewport + 1,
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.locator(".sidebar.open")).toBeVisible();
  await page
    .getByRole("button", { name: "Evaluation & quality", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Evaluation & quality" }),
  ).toBeVisible();
  await expect(page.locator(".sidebar.open")).not.toBeVisible();
});
test("search opens an exact source, retrieval refuses unsupported questions, and screenshots are produced", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1060 });
  await page.goto("/");
  await page
    .getByLabel("Research project context")
    .selectOption("fintech-onboarding");
  await page.keyboard.press("Control+k");
  await page
    .getByRole("textbox", {
      name: "Search projects, interviews, quotes and insights",
    })
    .fill("After I uploaded my ID");
  await page.locator(".command-results button").first().click();
  await expect(page.locator(".transcript-segment.focused")).toBeVisible();
  await page.goto("/#/ask");
  await page
    .getByRole("textbox", { name: "Question about the research" })
    .fill("quantum teleportation");
  await page.getByRole("button", { name: "Ask research question" }).click();
  await expect(
    page.getByText("Insufficient evidence in this study."),
  ).toBeVisible();
  await page.goto("/#/overview");
  await expect(
    page.getByRole("heading", { name: "Research overview" }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/overview-desktop.png",
    fullPage: true,
  });
  await page.goto("/#/insights/i-uncertain");
  await expect(
    page.getByRole("heading", {
      name: "Users feel uncertain about identity verification.",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/insight-evidence.png",
    fullPage: true,
  });
  await page.goto("/#/interviews/int-p01?segment=int-p01-s4");
  await expect(page.locator(".transcript-segment.focused")).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/transcript-source.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/overview");
  await expect(
    page.getByRole("heading", { name: "Research overview" }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/overview-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Start walkthrough", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Guided research walkthrough" }),
  ).toContainText("STEP 1 OF 3");
  await page.screenshot({
    path: "docs/screenshots/walkthrough-mobile.png",
    fullPage: false,
  });
});
