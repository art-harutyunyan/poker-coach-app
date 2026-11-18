import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

for (const width of [1440, 1280, 1024]) {
  test(`R3 real unavailable overview at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?route=tournaments");
    const library = page.getByRole("region", { name: "Tournament Library" });
    await library.getByRole("button", { name: "Import", exact: true }).click();
    await page
      .getByLabel("Hand history file")
      .setInputFiles(resolve("tests/fixtures/gg", fixtureNames[0]!));
    await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
    await page.getByRole("button", { name: "Open Tournament Review" }).click();

    const overview = page.getByRole("region", { name: "Tournament overview" });
    await expect(overview).toContainText("Daily Monster Stack");
    await expect(overview).toContainText("Buy-in $2.50");
    await expect(overview).toContainText("No summary file imported");
    await expect(overview).toContainText("Analysis not available for this tournament");
    await expect(overview).not.toContainText("Decisions graded");
    await expect(page.locator(".importMetadataGrid")).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: "Tournament hand browser" }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Tournament Stats" })).toBeVisible();
    if (width >= 1180)
      expect(Math.round((await library.boundingBox())!.width)).toBe(364);
    else expect((await library.boundingBox())!.width).toBeGreaterThan(364);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    const overviewBox = (await overview.boundingBox())!;
    const handsBox = (await page
      .getByRole("region", { name: "Tournament hand browser" })
      .boundingBox())!;
    expect(handsBox.y).toBeGreaterThan(overviewBox.y + overviewBox.height);
  });
}
