import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

const output = "docs/qa/nocturne-r2";

async function capture(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.screenshot({
    path: `${output}/${name}.png`,
    fullPage: true,
    animations: "disabled",
  });
}

async function importFixture(page: Page, index: number) {
  await page
    .getByRole("region", { name: "Tournament Library" })
    .getByRole("button", { name: "Import", exact: true })
    .click();
  await page
    .getByLabel("Hand history file")
    .setInputFiles(resolve("tests/fixtures/gg", fixtureNames[index]!));
  await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
}

for (const width of [1440, 1280]) {
  test(`R2 library keeps real data and selected workspace at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?route=tournaments");
    const library = page.getByRole("region", { name: "Tournament Library" });
    await expect(library).toBeVisible();
    if (width === 1440) await capture(page, "empty-1440");
    await importFixture(page, 0);
    await importFixture(page, 1);
    if (width === 1440) await importFixture(page, 2);
    await expect(library.locator(".tournamentLibraryRow")).toHaveCount(
      width === 1440 ? 3 : 2,
    );
    expect(Math.round((await library.boundingBox())!.width)).toBe(364);
    expect(
      await library
        .locator(".tournamentLibraryList")
        .evaluate((element) => getComputedStyle(element).overflowY),
    ).toBe("auto");
    await expect(library).toContainText("Stored in this session only");
    await expect(library).not.toContainText("$0.00");
    await capture(page, `multiple-${width}`);

    const first = library.getByRole("article", { name: /tournament 314729652/i });
    await first.getByRole("button", { name: "Open Tournament" }).click();
    await expect(first).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".importedTournamentContext")).toContainText(
      "Daily Monster Stack",
    );
    await expect(page.locator(".importedTournament")).toBeVisible();
    await page.mouse.move(width - 10, 20);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);

    await library
      .getByRole("searchbox", { name: "Search tournaments" })
      .fill("no matching tournament");
    await expect(library.getByText(/No tournaments match/)).toBeVisible();
    await expect(page.locator(".importedTournament")).toBeVisible();
    if (width === 1440) await capture(page, "search-empty-1440");
  });
}
