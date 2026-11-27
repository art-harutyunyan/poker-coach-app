import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

async function openFixture(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/?route=tournaments");
  await page
    .getByRole("region", { name: "Tournament Library" })
    .getByRole("button", { name: "Import", exact: true })
    .click();
  await page
    .getByLabel("Hand history file")
    .setInputFiles(resolve("tests/fixtures/gg", fixtureNames[0]!));
  await expect(
    page.getByRole("button", { name: "Open tournament", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
}

async function capture(page: Page, name: string) {
  await mkdir("docs/qa/nocturne-r4", { recursive: true });
  await page.screenshot({
    path: `docs/qa/nocturne-r4/${name}.png`,
    animations: "disabled",
  });
}

test("R4 many-hand browser keeps a compact scroll region and accessible stats at 1440", async ({
  page,
}) => {
  await openFixture(page, 1440);
  const library = page.getByRole("region", { name: "Tournament Library" });
  const overview = page.getByRole("region", { name: "Tournament overview" });
  const browser = page.getByRole("region", { name: "Tournament hand browser" });
  const rows = browser.locator("[data-hand-id]");
  await expect(rows).toHaveCount(222);
  await expect(browser).toContainText("Not analysed");
  await expect(browser.getByRole("button", { name: /Graded/ })).toBeDisabled();
  await expect(browser.getByRole("button", { name: /^Grade:/ })).toBeDisabled();
  await expect(page.getByRole("region", { name: "Tournament Stats" })).toBeAttached();
  expect(Math.round((await library.boundingBox())!.width)).toBe(364);
  expect((await browser.boundingBox())!.y).toBeGreaterThan(
    (await overview.boundingBox())!.y + (await overview.boundingBox())!.height,
  );
  expect(
    await browser
      .locator(".noc-hand-browser__scroll")
      .evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1441);
  await capture(page, "many-hands-1440");

  await rows.nth(1).click();
  const selectedPosition = await rows
    .nth(1)
    .locator('[data-label="Position"]')
    .textContent();
  await expect(
    page.getByRole("tab", { name: "Overview", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await expect(rows.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(browser.getByRole("button", { name: "Open in Replayer" })).toBeVisible();
  await capture(page, "selected-1440");

  await browser.getByRole("searchbox", { name: "Search hands" }).fill("47");
  await expect(browser).toContainText(/Showing .* of 222/);
  await capture(page, "search-1440");
  await browser
    .getByRole("combobox", { name: "Filter by position" })
    .selectOption(selectedPosition === "BB" ? "CO" : "BB");
  await expect(browser).toContainText("Selected hand is outside these results");
  await capture(page, "filter-1440");
  await browser.getByRole("button", { name: "Clear filters" }).click();
  await expect(rows).toHaveCount(222);
  await browser.getByRole("button", { name: "Open in Replayer" }).click();
  await expect(
    page.getByRole("tab", { name: "Replayer", exact: true }),
  ).toHaveAttribute("data-state", "active");
});

test("R4 browser fits 1280 and stacked fallbacks", async ({ page }) => {
  for (const width of [1280, 1024, 390]) {
    await openFixture(page, width);
    const browser = page.getByRole("region", { name: "Tournament hand browser" });
    await expect(browser.locator("[data-hand-id]")).toHaveCount(222);
    await expect(
      browser.getByRole("button", { name: "Open in Replayer" }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Tournament Stats" })).toBeAttached();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    if (width === 390) {
      expect(
        await browser
          .locator(".noc-hand-browser__scroll")
          .evaluate((element) => element.clientHeight),
      ).toBeGreaterThanOrEqual(140);
    }
    if (width <= 1024) await browser.scrollIntoViewIfNeeded();
    await capture(page, `many-hands-${width}`);
  }
});
