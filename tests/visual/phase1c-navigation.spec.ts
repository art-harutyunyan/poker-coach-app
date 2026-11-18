import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureHand, fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

const output = "docs/qa/phase-1c/1c3";
const fixture = (index: number) => resolve("tests/fixtures/gg", fixtureNames[index]!);

async function importFile(page: Page, index: number) {
  if (await page.locator(".sidebarUpload").isVisible())
    await page.locator(".sidebarUpload").click();
  else await page.locator(".mobileNavSelect select").selectOption("upload");
  await page.getByLabel("Hand history file").setInputFiles(fixture(index));
  await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
}

async function openReplayer(page: Page, id: string) {
  await page
    .locator(".tournamentLibraryRow")
    .filter({ hasText: id })
    .getByRole("button", { name: "Replayer" })
    .click();
}

async function screenshot(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.screenshot({
    path: `${output}/${name}.png`,
    fullPage: true,
    animations: "disabled",
  });
}

async function tableGeometry(page: Page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".pokerStage")!.getBoundingClientRect();
    const rect = (element: Element) => {
      const r = element.getBoundingClientRect();
      return [r.x - stage.x, r.y - stage.y, r.width, r.height];
    };
    return {
      table: rect(document.querySelector(".pokerStage")!),
      seats: [...document.querySelectorAll(".player-seat")].map(rect),
    };
  });
}

test("222-hand source filters keep replay, geometry and ordered navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?route=tournaments");
  await importFile(page, 0);
  await openReplayer(page, "314729652");
  const rail = page.locator(".importedHandRail");
  await expect(rail.getByRole("button", { name: "All 222 / 222" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(rail.getByRole("button", { name: "Played 53 / 222" })).toBeVisible();
  await expect(rail.getByRole("button", { name: "Postflop 30 / 222" })).toBeVisible();
  await expect(rail.getByRole("button", { name: "Showdown 13 / 222" })).toBeVisible();
  await rail.locator('[data-hand-id="TM6468722697"]').click();
  await page.getByRole("button", { name: "Forward", exact: true }).click();
  const beforeGeometry = await tableGeometry(page);
  const beforeHeader = await page.locator(".handStudyHeader").textContent();
  const beforeCursor = await page.locator(".decisionRibbon").textContent();
  const beforeBacks = await page.locator(".pokerStage .cardBack").count();
  await rail.getByRole("button", { name: "Showdown 13 / 222" }).click();
  await expect(rail.locator(".importedHandRow")).toHaveCount(13);
  await expect(rail.getByText("Current hand is outside this filter")).toBeVisible();
  expect(await page.locator(".handStudyHeader").textContent()).toBe(beforeHeader);
  expect(await page.locator(".decisionRibbon").textContent()).toBe(beforeCursor);
  expect(await page.locator(".pokerStage .cardBack").count()).toBe(beforeBacks);
  await expect(page.getByRole("switch")).toBeChecked();
  expect(await tableGeometry(page)).toEqual(beforeGeometry);
  await rail.getByRole("button", { name: "Next filtered hand" }).click();
  await expect(page.locator(".decisionRibbon")).toContainText("Action 0 /");
  await expect(page.getByRole("switch")).toBeChecked();
  await rail.locator(".importedHandRow").last().click();
  await expect(rail.getByRole("button", { name: "Next filtered hand" })).toBeDisabled();
  await screenshot(page, "filtered-222-desktop");
});

test("233-hand filters restore per entry and Queue remains complete", async ({
  page,
}) => {
  await page.goto("/?route=tournaments");
  await importFile(page, 3);
  await openReplayer(page, "309704619");
  const rail = page.locator(".importedHandRail");
  await expect(rail.getByRole("button", { name: "Played 50 / 233" })).toBeVisible();
  await expect(rail.getByRole("button", { name: "Postflop 29 / 233" })).toBeVisible();
  await expect(rail.getByRole("button", { name: "Showdown 11 / 233" })).toBeVisible();
  await rail.getByRole("button", { name: "Postflop 29 / 233" }).click();
  await expect(rail.locator(".importedHandRow")).toHaveCount(29);
  await page.getByRole("button", { name: "Tournament Library" }).click();
  await importFile(page, 2);
  await openReplayer(page, "317697722");
  await expect(rail.getByRole("button", { name: "All 28 / 28" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Tournament Library" }).click();
  await openReplayer(page, "309704619");
  await expect(rail.getByRole("button", { name: "Postflop 29 / 233" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("tab", { name: "Review Queue", exact: true }).click();
  await expect(page.locator(".importedHandList .importedHandRow")).toHaveCount(233);
  await page.locator('.importedHandList [data-hand-id="TM6378370688"]').click();
  await expect(rail.getByText("Current hand is outside this filter")).toBeVisible();
  await expect(rail.locator(".importedHandRow")).toHaveCount(29);
});

test("zero-match filter retains current hand and offers All", async ({ page }) => {
  await page.goto("/?route=tournaments");
  await page.locator(".sidebarUpload").click();
  await page.getByLabel("Hand history file").setInputFiles({
    name: "fold.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(fixtureHand(2, "TM6522429068")),
  });
  await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .locator(".tournamentLibraryRow")
    .getByRole("button", { name: "Replayer" })
    .click();
  const rail = page.locator(".importedHandRail");
  await rail.getByRole("button", { name: "Showdown 0 / 1" }).click();
  await expect(rail.getByText("No hands match this filter")).toBeVisible();
  await expect(rail.locator(".importedHandRow")).toHaveCount(0);
  await expect(page.locator(".handStudyHeader")).toContainText("TM6522429068");
  await expect(rail.getByRole("button", { name: "Next filtered hand" })).toBeDisabled();
  await screenshot(page, "zero-match");
  await rail.getByRole("button", { name: "Show all hands" }).click();
  await expect(rail.locator(".importedHandRow")).toHaveCount(1);
});

test("mobile outside-filter notice and Show all remain visible without moving the table", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/?route=tournaments");
  await importFile(page, 0);
  await openReplayer(page, "314729652");
  const rail = page.locator(".importedHandRail");
  const before = await tableGeometry(page);
  await rail.getByRole("button", { name: "Played 53 / 222" }).click();
  await expect(rail.getByText("Current hand is outside this filter")).toBeVisible();
  const showAll = rail.getByRole("button", { name: "Show all hands" });
  await expect(showAll).toBeVisible();
  const button = await showAll.boundingBox();
  const railBox = await rail.boundingBox();
  expect(button!.x).toBeGreaterThanOrEqual(railBox!.x);
  expect(button!.x + button!.width).toBeLessThanOrEqual(railBox!.x + railBox!.width);
  expect(button!.y + button!.height).toBeLessThanOrEqual(railBox!.y + railBox!.height);
  expect(await tableGeometry(page)).toEqual(before);
  await showAll.click();
  await expect(rail.locator(".importedHandRow")).toHaveCount(222);
});

test("mobile unknown-count notice stays inside the navigator without moving the table", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/?route=tournaments");
  await importFile(page, 3);
  await openReplayer(page, "309704619");
  const rail = page.locator(".importedHandRail");
  const before = await tableGeometry(page);
  await rail.getByRole("button", { name: "Played 50 / 233" }).click();
  const notice = rail.getByText("1 hand needs source review");
  await expect(notice).toBeVisible();
  const noticeBox = await notice.boundingBox();
  const railBox = await rail.boundingBox();
  const controlsBox = await rail.locator(".handFilterControls").boundingBox();
  const navigationBox = await rail.locator(".handFilterNavigation").boundingBox();
  const headingCountBox = await rail.locator("h2 span").boundingBox();
  expect(noticeBox!.y + noticeBox!.height).toBeLessThanOrEqual(
    railBox!.y + railBox!.height,
  );
  expect(noticeBox!.x).toBeGreaterThanOrEqual(controlsBox!.x);
  expect(noticeBox!.x + noticeBox!.width).toBeLessThanOrEqual(
    controlsBox!.x + controlsBox!.width,
  );
  expect(noticeBox!.y).toBeGreaterThanOrEqual(
    headingCountBox!.y + headingCountBox!.height,
  );
  expect(noticeBox!.y + noticeBox!.height).toBeLessThanOrEqual(navigationBox!.y);
  expect(await tableGeometry(page)).toEqual(before);
  await screenshot(page, "unknown-390");
});

for (const width of [1440, 1024, 768, 430, 390]) {
  test(`navigator controls stay local and table geometry stays fixed at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?route=tournaments");
    await importFile(page, 2);
    await openReplayer(page, "317697722");
    const rail = page.locator(".importedHandRail");
    const options = await rail.locator(".handFilterOptions").evaluate((element) => ({
      viewport: element.clientWidth,
      content: element.scrollWidth,
    }));
    expect(options.content).toBeLessThanOrEqual(options.viewport + 1);
    const geometry = await tableGeometry(page);
    await rail.getByRole("button", { name: "Played 6 / 28" }).click();
    expect(await tableGeometry(page)).toEqual(geometry);
    await expect(rail.locator(".importedHandRow")).toHaveCount(6);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    if (width === 1440 || width === 390) await screenshot(page, `navigator-${width}`);
  });
}

test("compact controls remain reachable at 200% zoom", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?route=tournaments");
  await importFile(page, 2);
  await openReplayer(page, "317697722");
  await page.evaluate(() => (document.documentElement.style.zoom = "2"));
  const rail = page.locator(".importedHandRail");
  await rail.getByRole("button", { name: "Postflop 5 / 28" }).click();
  await expect(rail.locator(".importedHandRow")).toHaveCount(5);
  await screenshot(page, "navigator-zoom-200");
});
