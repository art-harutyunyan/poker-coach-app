import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

const output = "docs/qa/nocturne-r6";

async function openImported(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/?route=tournaments");
  if (width >= 1180)
    await page.getByRole("button", { name: "Import", exact: true }).click();
  else await page.locator(".mobileNavSelect select").selectOption("upload");
  await page
    .getByLabel("Hand history file")
    .setInputFiles(resolve("tests/fixtures/gg", fixtureNames[0]!));
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
  await page.getByRole("tab", { name: "Replayer", exact: true }).click();
  await expect(page.getByRole("region", { name: "Replayer hand strip" })).toBeVisible();
}

async function capture(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `${output}/${name}.png`, animations: "disabled" });
}

for (const width of [1440, 1280, 390]) {
  test(`R6 imported shell at ${width}px`, async ({ page }) => {
    await openImported(page, width);
    const strip = page.getByRole("region", { name: "Replayer hand strip" });
    const items = strip.locator(".noc-replayer-strip__item");
    const browse = strip.getByRole("button", { name: "Browse all 222 hands" });
    await expect(items).toHaveCount(222);
    await expect(items.first()).toHaveAttribute("aria-current", "true");
    await expect(browse).toBeVisible();
    await expect(strip).toContainText("Not analysed");
    await expect(page.getByRole("switch")).toBeChecked();
    const geometry = await page.evaluate(() => {
      const strip = document
        .querySelector(".noc-replayer-strip")!
        .getBoundingClientRect();
      const table = document
        .querySelector(".replayerLayout .tableSection")!
        .getBoundingClientRect();
      const analysis = document
        .querySelector(".replayerLayout .analysisPanel")!
        .getBoundingClientRect();
      const browse = document
        .querySelector(".noc-replayer-strip__browse")!
        .getBoundingClientRect();
      const scroll = document.querySelector(".noc-replayer-strip__scroll")!;
      return {
        strip: strip.toJSON(),
        table: table.toJSON(),
        analysis: analysis.toJSON(),
        browse: browse.toJSON(),
        scrollRight: scroll.getBoundingClientRect().right,
        scrollable: scroll.scrollWidth > scroll.clientWidth,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    expect(geometry.overflow).toBe(false);
    expect(Math.round(geometry.strip.height)).toBe(128);
    expect(geometry.scrollable).toBe(true);
    expect(geometry.browse.left).toBeGreaterThanOrEqual(geometry.scrollRight);
    expect(Math.round(geometry.table.top - geometry.strip.bottom)).toBe(8);
    if (width >= 1280) {
      expect(Math.round(geometry.analysis.width)).toBe(400);
      expect(Math.round(geometry.analysis.left - geometry.table.right)).toBe(8);
    } else expect(geometry.analysis.top).toBeGreaterThan(geometry.table.bottom);
    await capture(page, `imported-${width}`);

    await items.nth(150).click();
    await expect(items.nth(150)).toHaveAttribute("aria-current", "true");
    await expect(page.getByRole("switch")).toBeChecked();
    await expect(items.nth(150)).toBeInViewport();
    if (width === 1440) {
      const row = strip.locator(".noc-replayer-strip__scroll");
      await row.evaluate((element) => {
        element.scrollLeft = 0;
      });
      await page.getByRole("button", { name: "Forward", exact: true }).click();
      expect(await row.evaluate((element) => element.scrollLeft)).toBe(0);
    }
    await browse.click();
    const browser = page.getByRole("dialog", { name: "Browse all hands" });
    await expect(browser.locator(".importedHandRow")).toHaveCount(222);
    const popover = await browser.boundingBox();
    const trigger = await browse.boundingBox();
    const stripBox = await strip.boundingBox();
    expect(popover!.width).toBeLessThanOrEqual(Math.min(640, width - 24));
    expect(
      Math.abs(popover!.x + popover!.width - trigger!.x - trigger!.width),
    ).toBeLessThan(2);
    expect(popover!.y - (stripBox!.y + stripBox!.height)).toBeGreaterThanOrEqual(4);
    expect(popover!.y - (stripBox!.y + stripBox!.height)).toBeLessThanOrEqual(12);
    expect(popover!.height).toBeLessThanOrEqual(440);
    await expect(
      browser.locator(".noc-replayer-strip__popover-header"),
    ).toBeInViewport();
    if (width === 390) {
      const rows = browser.locator(".importedHandRows");
      expect(
        await rows.evaluate((element) => element.scrollHeight > element.clientHeight),
      ).toBe(true);
      expect((await rows.boundingBox())!.width).toBeLessThanOrEqual(320);
      expect(
        (await browser.locator('.importedHandRow[aria-current="true"]').boundingBox())!
          .width,
      ).toBeLessThanOrEqual(320);
    }
    if (width === 1440 || width === 390) await capture(page, `browse-${width}`);
    await browser.getByRole("button", { name: /Showdown 13 \/ 222/ }).click();
    await expect(items).toHaveCount(13);
    await expect(browser).toContainText("Showing 13 of 222 hands");
    await page.keyboard.press("Escape");
    await expect(browser).toHaveCount(0);
    await expect(browse).toBeFocused();
    await capture(page, `filtered-${width}`);
  });
}

test("R6 demo shell keeps its sample action and existing analysis", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?route=tournaments&tab=replayer");
  const strip = page.getByRole("region", { name: "Replayer hand strip" });
  await expect(strip.locator(".noc-replayer-strip__item")).toHaveCount(1);
  await strip.getByRole("button", { name: "Browse all 1 hand" }).click();
  await page
    .getByRole("navigation", { name: "Sample hands" })
    .getByRole("button")
    .click();
  await expect(page.getByRole("dialog", { name: "Browse all hands" })).toHaveCount(0);
  await expect(
    page.getByRole("complementary", { name: "Hand analysis" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark reviewed" })).toBeVisible();
  await capture(page, "demo-1280");
});
