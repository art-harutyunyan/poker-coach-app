import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureHand, fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

const output = "docs/qa/phase-1c/1c4";
const fixture = (index: number) => resolve("tests/fixtures/gg", fixtureNames[index]!);
const audited = [
  {
    id: "314729652",
    values: [
      ["vpip", "52 / 222", "23.4%"],
      ["pfr", "38 / 222", "17.1%"],
      ["threeBet", "7 / 84", "8.3%"],
      ["sawFlop", "30 / 222", "13.5%"],
      ["wtsd", "13 / 30", "43.3%"],
      ["wsd", "11 / 13", "84.6%"],
    ],
  },
  {
    id: "314806258",
    values: [
      ["vpip", "42 / 190", "22.1%"],
      ["pfr", "31 / 190", "16.3%"],
      ["threeBet", "8 / 78", "10.3%"],
      ["sawFlop", "33 / 190", "17.4%"],
      ["wtsd", "22 / 33", "66.7%"],
      ["wsd", "13 / 22", "59.1%"],
    ],
  },
  {
    id: "317697722",
    values: [
      ["vpip", "6 / 28", "21.4%"],
      ["pfr", "6 / 28", "21.4%"],
      ["threeBet", "2 / 11", "18.2%"],
      ["sawFlop", "5 / 28", "17.9%"],
      ["wtsd", "2 / 5", "40.0%"],
      ["wsd", "1 / 2", "50.0%"],
    ],
  },
  {
    id: "309704619",
    values: [
      ["vpip", "48 / 232", "20.7%"],
      ["pfr", "38 / 232", "16.4%"],
      ["threeBet", "13 / 96", "13.5%"],
      ["sawFlop", "29 / 232", "12.5%"],
      ["wtsd", "11 / 29", "37.9%"],
      ["wsd", "8 / 11", "72.7%"],
    ],
  },
] as const;

async function openUpload(page: Page) {
  if (await page.locator(".sidebarUpload").isVisible())
    await page.locator(".sidebarUpload").click();
  else await page.locator(".mobileNavSelect select").selectOption("upload");
}
async function importFile(page: Page, index: number) {
  await openUpload(page);
  await page.getByLabel("Hand history file").setInputFiles(fixture(index));
  await expect(
    page.getByRole("button", { name: "Open tournament", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
}
async function shot(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.screenshot({
    path: `${output}/${name}.png`,
    fullPage: true,
    animations: "disabled",
  });
}

test("all four imported tournaments show independently audited counts and masked outcome", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?route=tournaments");
  for (const [index, expected] of audited.entries()) {
    await importFile(page, index);
    const row = page.locator(".tournamentLibraryRow").filter({ hasText: expected.id });
    await expect(row).not.toContainText("VPIP");
    await row.getByRole("button", { name: "Open Tournament" }).click();
    const stats = page.getByRole("region", { name: "Tournament Stats" });
    await expect(stats).toContainText("Single-tournament sample");
    const masked = stats.locator('[data-metric="wsd"]');
    await expect(masked).toContainText("Outcome stat hidden");
    await expect(masked).not.toContainText(expected.values[5][1]);
    await expect(masked).not.toContainText(expected.values[5][2]);
    for (const [id, count, rate] of expected.values.slice(0, 5)) {
      await expect(stats.locator(`[data-metric="${id}"]`)).toContainText(count);
      await expect(stats.locator(`[data-metric="${id}"]`)).toContainText(rate);
    }
    await masked.getByRole("button", { name: "Show outcome stat" }).click();
    await expect(masked).toContainText(expected.values[5][1]);
    await expect(masked).toContainText(expected.values[5][2]);
    if (index === 0) await shot(page, "overview-revealed-1440");
    await page.getByRole("button", { name: "Tournament Library" }).click();
    await expect(
      page.getByRole("heading", { name: "Tournament Library" }),
    ).toBeVisible();
    await expect(
      page.locator(".tournamentLibraryRow").filter({ hasText: expected.id }),
    ).not.toContainText("VPIP");
  }
  await expect(page.locator(".tournamentLibraryRow")).toHaveCount(4);
  await shot(page, "library-four-tournaments-1440");
});

test("one-hand outcome stays masked until explicit reveal and Hide Result remasks it", async ({
  page,
}) => {
  await page.goto("/?route=tournaments");
  await openUpload(page);
  await page.getByLabel("Hand history file").setInputFiles({
    name: "one.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(fixtureHand(0, "TM6468725291")),
  });
  await expect(
    page.getByRole("button", { name: "Open tournament", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
  const wsd = page.locator('[data-metric="wsd"]');
  await expect(wsd).toContainText("Outcome stat hidden");
  await expect(wsd).not.toContainText("100.0%");
  expect(await wsd.evaluate((element) => element.outerHTML)).not.toMatch(
    /100\.0%|1 \/ 1 confirmed showdowns|TM6468725291/,
  );
  await wsd.getByRole("button", { name: "Show outcome stat" }).click();
  await expect(wsd).toContainText("100.0%");
  await page.getByRole("tab", { name: "Replayer", exact: true }).click();
  await expect(page.getByRole("switch")).toBeChecked();
  await expect(page.locator(".decisionRibbon")).toContainText("Action 0 /");
  await page.getByRole("switch").click();
  await page.getByRole("switch").click();
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await expect(wsd).toContainText("Outcome stat hidden");
  await expect(wsd).not.toContainText("100.0%");
  expect(await wsd.evaluate((element) => element.outerHTML)).not.toMatch(
    /100\.0%|1 \/ 1 confirmed showdowns|TM6468725291/,
  );
});

test("A and B retain separate outcome visibility across Library switching", async ({
  page,
}) => {
  await page.goto("/?route=tournaments");
  await importFile(page, 0);
  const a = page.locator(".tournamentLibraryRow").filter({ hasText: "314729652" });
  await a.getByRole("button", { name: "Open Tournament" }).click();
  await page
    .locator('[data-metric="wsd"]')
    .getByRole("button", { name: "Show outcome stat" })
    .click();
  await expect(page.locator('[data-metric="wsd"]')).toContainText("84.6%");
  await page.getByRole("button", { name: "Tournament Library" }).click();
  await importFile(page, 2);
  await page
    .locator(".tournamentLibraryRow")
    .filter({ hasText: "317697722" })
    .getByRole("button", { name: "Open Tournament" })
    .click();
  await expect(page.locator('[data-metric="wsd"]')).toContainText(
    "Outcome stat hidden",
  );
  await page.getByRole("button", { name: "Tournament Library" }).click();
  await a.getByRole("button", { name: "Open Tournament" }).click();
  await expect(page.locator('[data-metric="wsd"]')).toContainText("84.6%");
});

test("coverage links open the source hand and preserve the saved Replayer filter", async ({
  page,
}) => {
  await page.goto("/?route=tournaments");
  await importFile(page, 3);
  await page
    .locator(".tournamentLibraryRow")
    .getByRole("button", { name: "Replayer" })
    .click();
  await page.getByRole("button", { name: "Browse all 233 hands" }).click();
  const rail = page
    .getByRole("dialog", { name: "Browse all hands" })
    .locator(".importedHandRail");
  await rail.getByRole("button", { name: "Postflop 29 / 233" }).click();
  await page.getByRole("button", { name: "Close hand browser" }).click();
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  const vpip = page.locator('[data-metric="vpip"]');
  await expect(vpip).toContainText("48 / 232");
  await vpip.locator("summary", { hasText: "Definition" }).focus();
  await page.keyboard.press("Enter");
  await expect(vpip).toContainText("voluntary preflop");
  await vpip.locator("summary", { hasText: "Coverage" }).focus();
  await page.keyboard.press("Enter");
  await expect(vpip).toContainText("1 excluded");
  await shot(page, "coverage-1440");
  await vpip.getByRole("button", { name: /TM6377256916/ }).click();
  await expect(
    page.getByRole("tab", { name: "Replayer", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await expect(page.locator(".handStudyHeader")).toContainText("TM6377256916");
  await page.getByRole("button", { name: "Browse all 233 hands" }).click();
  await expect(rail.getByRole("button", { name: "Postflop 29 / 233" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(rail).toContainText("Current hand is outside this filter");
});

for (const width of [1440, 1024, 768, 430, 390]) {
  test(`Overview stats fit current Study shell at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?route=tournaments");
    await importFile(page, 0);
    await page
      .locator(".tournamentLibraryRow")
      .getByRole("button", { name: "Open Tournament" })
      .click();
    await expect(page.locator(".tournamentStatsGrid [data-metric]")).toHaveCount(6);
    await expect(page.locator(".tournamentStats")).toContainText("Outcome stat hidden");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    if (width === 1440 || width === 390) await shot(page, `overview-masked-${width}`);
  });
}

test("200% zoom and forced colors retain accessible stats controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.goto("/?route=tournaments");
  await importFile(page, 2);
  await page
    .locator(".tournamentLibraryRow")
    .getByRole("button", { name: "Open Tournament" })
    .click();
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await expect(page.locator('[data-metric="wsd"] button')).toBeVisible();
  await shot(page, "stats-zoom-200");
  await page.evaluate(() => {
    document.documentElement.style.zoom = "";
  });
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.locator('[data-metric="vpip"] summary').first()).toBeVisible();
  await shot(page, "stats-forced-colors");
});
