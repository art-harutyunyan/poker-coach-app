import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const output = "docs/qa/nocturne-r1/visual-tests";
const legacy = "docs/qa/visual-migration";
const widths = [1440, 1024, 768, 430, 390];
const pages = ["dashboard", "development", "training", "playbook"] as const;

async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".mainSurface")).toBeVisible();
  // Recharts animates its paths in JavaScript and observes container resizing.
  if (await page.locator(".chartShell").count()) {
    await expect(page.locator(".recharts-area-curve").first()).toBeVisible();
    await page.waitForTimeout(1200);
  }
}

async function shellProblems(page: Page, route: string) {
  return page.evaluate((currentRoute) => {
    const problems: string[] = [];
    const shell = document.querySelector(".nocturneShell")!;
    const rail = document.querySelector(".sidebar")!;
    const mobile = document.querySelector(".mobileNav")!;
    const active = document.querySelector('.navButton[aria-current="page"]');
    if (getComputedStyle(shell).backgroundColor !== "rgb(14, 15, 18)")
      problems.push("Nocturne background missing");
    if (active?.getAttribute("aria-label")?.toLowerCase() !== currentRoute)
      problems.push("current destination differs from route");
    if (innerWidth >= 1180) {
      if (
        rail.getBoundingClientRect().width !== 72 ||
        getComputedStyle(rail).position !== "fixed"
      )
        problems.push("desktop rail is not fixed at 72px");
      if (getComputedStyle(mobile).display !== "none")
        problems.push("mobile navigation visible on desktop");
    } else {
      if (getComputedStyle(rail).display !== "none")
        problems.push("desktop rail visible on mobile");
      if (getComputedStyle(mobile).display === "none")
        problems.push("mobile navigation missing");
    }
    return problems;
  }, route);
}

test.beforeEach(async ({ page }) => {
  // The approved shell uses local Seat Inter; keep reference comparisons independent of Google Fonts availability.
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
});

for (const width of widths) {
  test(`Tournaments retains replay content inside the R1 shell at ${width}px`, async ({
    page,
  }) => {
    await mkdir(output, { recursive: true });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(
      "/?route=tournaments&tab=replayer&previewCards=study&previewSeats=8",
    );
    await ready(page);
    expect(await shellProblems(page, "tournaments")).toEqual([]);
    await expect(page.locator(".pokerStage")).toBeVisible();
    await expect(page.locator(".analysisPanel")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    await page.screenshot({
      path: `${output}/tournaments-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  });

  for (const route of pages) {
    test(`${route} retains its content in the R1 shell at ${width}px`, async ({
      page,
    }) => {
      await mkdir(output, { recursive: true });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/?route=${route}`);
      await ready(page);
      expect(await shellProblems(page, route)).toEqual([]);
      const problems = await page.evaluate(() => {
        const errors: string[] = [];
        const shell = document.querySelector(".appShell")!;
        const main = document.querySelector(".mainSurface")!;
        if (document.documentElement.scrollWidth > innerWidth + 1)
          errors.push("page overflow");
        if (getComputedStyle(shell).backgroundColor !== "rgb(14, 15, 18)")
          errors.push("Nocturne page background missing");
        if (!getComputedStyle(main).fontFamily.includes("Seat Inter"))
          errors.push("old content font");
        for (const el of main.querySelectorAll(
          "h1,h2,.heroBand,.overviewBand,.reviewQueue,.developmentBand,.placeholderBand,.reviewItem,.chartShell,button",
        )) {
          const rect = el.getBoundingClientRect();
          if (rect.width && (rect.left < -1 || rect.right > innerWidth + 1))
            errors.push(`${el.className || el.tagName} clipped`);
        }
        for (const el of main.querySelectorAll<HTMLElement>(
          ".reviewMain small,.reviewMeta b,.metricBlock strong,.placeholderBand p,.dimensionRow p,h1",
        )) {
          if (el.scrollWidth > el.clientWidth + 1)
            errors.push(`${el.className || el.tagName} text clipped`);
        }
        for (const panel of main.querySelectorAll(
          ".heroBand,.overviewBand,.reviewQueue,.developmentBand,.placeholderBand",
        )) {
          const style = getComputedStyle(panel);
          if (
            style.backgroundColor !== "rgb(25, 35, 30)" ||
            style.backgroundImage !== "none" ||
            style.boxShadow !== "none"
          )
            errors.push("old panel surface");
          if (style.borderRadius !== "6px")
            errors.push("panel radius differs from Tournaments");
        }
        for (const tick of main.querySelectorAll(
          ".recharts-cartesian-axis-tick-value",
        )) {
          const rect = tick.getBoundingClientRect();
          const svg = tick.closest("svg")!.getBoundingClientRect();
          if (rect.left < svg.left - 1 || rect.right > svg.right + 1)
            errors.push("chart tick clipped");
        }
        return errors;
      });
      expect(problems).toEqual([]);
      await page.screenshot({
        path: `${output}/${route}-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
      expect(errors).toEqual([]);
    });
  }
}

test("unchanged Phase 0 assets and mock contracts retain their original hashes", async () => {
  const files = JSON.parse(
    await readFile(`${legacy}/protected-files.json`, "utf8"),
  ) as Record<string, string>;
  for (const [file, hash] of Object.entries(files)) {
    // Phase 1B deliberately extends these functional modules. Their demo pixels
    // above and real replay contracts in tournament-import/domain tests remain guarded.
    if (
      [
        // Approved card-system replacement; all other hashes remain protected.
        "src/ui/components/PlayingCard.tsx",
        "src/ui/components/PokerTable.tsx",
        "src/ui/components/PlayerSeat.tsx",
        "src/ui/components/seatLayout.ts",
        "src/ui/components/ReplayControls.tsx",
        "src/domain/replay.ts",
        "src/domain/schemas.ts",
        "src/styles/poker-seats.css",
      ].includes(file)
    )
      continue;
    expect(
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex"),
      file,
    ).toBe(hash);
  }
});

for (const width of [1440, 390]) {
  test(`shared navigation and existing Dashboard actions work at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?route=dashboard&previewCards=study");
    await ready(page);
    for (const route of pages) {
      const title = route[0]!.toUpperCase() + route.slice(1);
      if (width === 1440)
        await page.getByRole("button", { name: title, exact: true }).click();
      else await page.getByLabel("Primary mobile screen").selectOption(route);
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
      await expect(page.locator('.navButton[aria-current="page"]')).toHaveAttribute(
        "aria-label",
        title,
      );
    }
    if (width === 1440)
      await page.getByRole("button", { name: "Dashboard", exact: true }).click();
    else await page.getByLabel("Primary mobile screen").selectOption("dashboard");
    await page.getByRole("button", { name: "Open review", exact: true }).click();
    await expect(
      page.getByRole("tab", { name: "Overview", exact: true }),
    ).toHaveAttribute("data-state", "active");
    await page.getByRole("tab", { name: "Replayer", exact: true }).click();
    await expect(page.locator(".pokerStage")).toBeVisible();
    await page.getByRole("button", { name: "Forward", exact: true }).click();
    await expect(page.locator(".is-acting")).toHaveAttribute("data-position", "BB");
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.locator(".is-acting")).toHaveAttribute("data-position", "SB");
  });
}

test("Dashboard buttons and Development tooltip use approved interaction styles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?route=dashboard");
  await ready(page);
  const primary = page.getByRole("button", { name: "Open review", exact: true });
  await expect(primary).toHaveCSS("background-color", "rgb(213, 191, 144)");
  await primary.hover();
  await expect(primary).toHaveCSS("background-color", "rgb(224, 205, 166)");
  await primary.focus();
  await expect(primary).toHaveCSS("outline-style", "solid");
  await expect(primary).toHaveCSS("outline-color", "rgb(213, 191, 144)");
  const nav = page.getByRole("button", { name: "Playbook", exact: true });
  await nav.hover();
  await expect(nav).toHaveCSS("background-color", "rgb(22, 24, 29)");
  await nav.focus();
  await expect(nav).toHaveCSS("outline-color", "rgb(212, 242, 90)");
  await page.getByRole("button", { name: "Development", exact: true }).click();
  await ready(page);
  await expect(page.locator(".recharts-area-dot")).toHaveCount(5);
  await page.locator(".recharts-area-dot").nth(2).hover();
  await expect(page.locator(".recharts-default-tooltip")).toBeVisible();
  await expect(page.locator(".recharts-default-tooltip")).toHaveCSS(
    "background-color",
    "rgb(25, 35, 30)",
  );
  await writeFile(
    `${output}/interaction-check.txt`,
    "Passed navigation, replay stepping, primary hover/focus, and chart tooltip checks.\n",
  );
});
