import { expect, test, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureHand, fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

const output = "docs/qa/phase-1c/1c2";
const widths = [1440, 1024, 768, 430, 390];
const fixture = (index: number) => resolve("tests/fixtures/gg", fixtureNames[index]!);

async function openUpload(page: Page) {
  if (await page.locator(".sidebarUpload").isVisible())
    await page.locator(".sidebarUpload").click();
  else await page.locator(".mobileNavSelect select").selectOption("upload");
  await expect(page.getByRole("dialog")).toBeVisible();
}
async function importFile(page: Page, index: number) {
  await openUpload(page);
  await page.getByLabel("Hand history file").setInputFiles(fixture(index));
  await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
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

test("four real tournaments coexist, duplicates and conflicts preserve entries, reload clears memory", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?route=tournaments");
  const before = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }));
  for (const index of [0, 3, 1, 2]) await importFile(page, index);
  await expect(page.locator(".tournamentLibraryRow")).toHaveCount(4);
  await openUpload(page);
  await page.getByLabel("Hand history file").setInputFiles({
    name: "renamed.txt",
    mimeType: "text/plain",
    buffer: await readFile(fixture(0)),
  });
  await expect(page.getByRole("heading", { name: "Already imported" })).toBeVisible();
  await expect(page.locator(".tournamentLibraryRow")).toHaveCount(4);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await openUpload(page);
  await page.getByLabel("Hand history file").setInputFiles({
    name: "partial.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(fixtureHand(0, "TM6469820465")),
  });
  await expect(page.getByRole("alert")).toContainText(
    "already imported with different contents",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.locator(".tournamentLibraryRow")).toHaveCount(4);
  expect(
    await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    })),
  ).toEqual(before);
  expect(errors).toEqual([]);
  await page.reload();
  await expect(page.locator(".tournamentLibraryRow")).toHaveCount(0);
});

test("A and B restore independent hand, replay cursor, privacy and tab state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?route=tournaments");
  await importFile(page, 0);
  const aRow = page.locator(".tournamentLibraryRow").filter({ hasText: "314729652" });
  await aRow.getByRole("button", { name: "Open Tournament" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("tab", { name: "Replayer", exact: true }).click();
  const aHand = await page
    .locator(".importedHandRail [data-hand-id]")
    .nth(1)
    .getAttribute("data-hand-id");
  await page.locator(`.importedHandRail [data-hand-id="${aHand}"]`).click();
  await page.getByRole("button", { name: "Forward", exact: true }).click();
  await page.getByRole("switch").click();
  await expect(page.getByRole("switch")).not.toBeChecked();
  await page.getByRole("button", { name: "Tournament Library" }).click();
  await importFile(page, 3);
  const bRow = page.locator(".tournamentLibraryRow").filter({ hasText: "309704619" });
  await bRow.getByRole("button", { name: "Replayer" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".decisionRibbon")).toContainText("Action 0 /");
  await expect(page.getByRole("switch")).toBeChecked();
  await page.getByRole("tab", { name: "Review Queue", exact: true }).click();
  await page.getByRole("button", { name: "Tournament Library" }).click();
  await aRow.getByRole("button", { name: "Replayer" }).click();
  await expect(
    page.getByRole("tab", { name: "Replayer", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await expect(page.locator(".decisionRibbon")).toContainText("Action 1 /");
  await expect(page.getByRole("switch")).not.toBeChecked();
  await expect(
    page.locator(`.importedHandRail [data-hand-id="${aHand}"]`),
  ).toHaveAttribute("aria-current", "true");
  await shot(page, "restored-a-1440");
  await page.getByRole("button", { name: "Tournament Library" }).click();
  await bRow.getByRole("button", { name: "Review Queue" }).focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("tab", { name: "Review Queue", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await shot(page, "restored-b-1440");
});

for (const width of widths) {
  test(`Library and selected workspace at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?route=tournaments");
    await importFile(page, 0);
    await expect(
      page.getByRole("heading", { name: "Tournament Library" }),
    ).toBeVisible();
    if (width === 1440 || width === 390) await shot(page, `library-${width}`);
    await page.getByRole("button", { name: "Open Tournament" }).click();
    await expect(
      page.getByRole("button", { name: "Tournament Library" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Tournament overview" }),
    ).toContainText("#314729652");
    await page.getByRole("tab", { name: "Replayer", exact: true }).click();
    await expect(page.locator(".player-seat")).toHaveCount(7);
    await expect(page.locator(".playingCard[data-card-variant]").first()).toBeVisible();
    if (width === 1440 || width === 390) await shot(page, `replayer-${width}`);
    await page.getByRole("button", { name: "Tournament Library" }).click();
    await expect(page.locator(".tournamentLibraryRow")).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
  });
}
