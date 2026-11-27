import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureHand, fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";
import { hands } from "../../src/data/mockTournament";
import { buildMultiSeatPreviewHand } from "../../src/data/previewHands";
import { findActionCursor } from "../../src/domain/replay";

const output = "docs/qa/nocturne-r10";

async function capture(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${output}/${name}.png`, animations: "disabled" });
}

async function openImported(page: Page, width: number, full = false, fixtureIndex = 0) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/?route=tournaments");
  if (width >= 1180) {
    await page.getByRole("button", { name: "Import", exact: true }).click();
  } else {
    await page.locator(".mobileNavSelect select").selectOption("upload");
  }
  await page.getByLabel("Hand history file").setInputFiles(
    full
      ? resolve("tests/fixtures/gg", fixtureNames[fixtureIndex]!)
      : {
          name: "single-hand.txt",
          mimeType: "text/plain",
          buffer: Buffer.from(fixtureHand(0, "TM6468725291")),
        },
  );
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
  await page.getByRole("tab", { name: "Replayer", exact: true }).click();
}

test("R10 Browse all uses compact Nocturne cards and keeps real navigation", async ({
  page,
}) => {
  test.setTimeout(90000);
  await openImported(page, 1440, true);
  await expect(page.locator(".handStudyHeader h2")).toContainText("Hand #1");
  const dockHeight = await page
    .locator(".replayerCommandDeck")
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(dockHeight).toBeLessThanOrEqual(112);
  await capture(page, "imported-1440");
  const trigger = page.getByRole("button", { name: "Browse all 222 hands" });
  await trigger.click();
  const browser = page.getByRole("dialog", { name: "Browse all hands" });
  await expect(browser.getByRole("heading", { name: "Browse all hands" })).toHaveCount(
    1,
  );
  await expect(browser.getByRole("heading", { name: /Hands \(222\)/ })).toHaveCount(0);
  await expect(
    browser.getByRole("button", { name: "Close hand browser" }),
  ).toBeFocused();
  const geometry = await browser.evaluate((element) => {
    const row = element.querySelector<HTMLElement>(
      ".importedHandRow:not([aria-current])",
    )!;
    const filter = element.querySelector<HTMLElement>(".handFilterOption")!;
    const rows = element.querySelector<HTMLElement>(".importedHandRows")!;
    const box = element.getBoundingClientRect();
    return {
      width: box.width,
      right: box.right,
      rowBackground: getComputedStyle(row).backgroundColor,
      rowRadius: getComputedStyle(row).borderRadius,
      filterFontSize: parseFloat(getComputedStyle(filter).fontSize),
      rowsScrollable: rows.scrollHeight > rows.clientHeight,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  expect(Math.round(geometry.width)).toBe(640);
  expect(geometry.rowBackground).toBe("rgb(31, 34, 41)");
  expect(geometry.rowRadius).toBe("10px");
  expect(geometry.filterFontSize).toBeGreaterThanOrEqual(12);
  expect(geometry.rowsScrollable).toBe(true);
  expect(geometry.overflow).toBe(false);
  await capture(page, "browse-1440");
  await browser.getByRole("button", { name: /Showdown 13 \/ 222/ }).click();
  await expect(browser.locator(".importedHandRow")).toHaveCount(13);
  await expect(browser).toContainText("Showing 13 of 222 hands");
  const review = browser.locator(".handFilterUnknown summary");
  if (await review.count()) {
    await review.click();
    const panel = browser.locator(".handFilterReviewPanel");
    await expect(panel).toBeVisible();
    const visiblePanel = await panel.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const parent = element.closest("[role=dialog]")!.getBoundingClientRect();
      return bounds.bottom <= parent.bottom;
    });
    expect(visiblePanel).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(browser).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  const target = browser.locator(".importedHandRow").last();
  const targetId = await target.getAttribute("data-hand-id");
  await target.click();
  await expect(browser).toHaveCount(0);
  await expect(page.locator(".handStudyHeader")).toContainText(targetId!);
  await expect(
    page.locator(`.noc-replayer-strip__item[data-hand-id="${targetId}"]`),
  ).toHaveAttribute("aria-current", "true");
  await trigger.click();
  await browser.getByRole("button", { name: /All 222 \/ 222/ }).click();
  const selectedVisible = await browser
    .locator('.importedHandRow[aria-current="true"]')
    .evaluate((element) => {
      const item = element.getBoundingClientRect();
      const viewport = element.parentElement!.getBoundingClientRect();
      return item.top >= viewport.top && item.bottom <= viewport.bottom;
    });
  expect(selectedVisible).toBe(true);
});

for (const width of [1280, 1024, 768, 390]) {
  test(`R10 Browse all stays usable at ${width}px`, async ({ page }) => {
    await openImported(page, width);
    await capture(page, `imported-${width}`);
    await page.getByRole("button", { name: "Browse all 1 hand" }).click();
    const browser = page.getByRole("dialog", { name: "Browse all hands" });
    await expect(
      browser.getByRole("button", { name: "Close hand browser" }),
    ).toBeVisible();
    const geometry = await browser.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(width);
    expect(geometry.overflow).toBe(false);
    await capture(page, `browse-${width}`);
    await browser.getByRole("button", { name: "Close hand browser" }).click();
    await expect(page.getByRole("button", { name: "Browse all 1 hand" })).toBeFocused();
    const analysis = page.getByRole("complementary", { name: "Hand analysis" });
    if (width < 1100) {
      const tableBottom = await page
        .locator(".tableSection")
        .evaluate((element) => element.getBoundingClientRect().bottom);
      const panelTop = await analysis.evaluate(
        (element) => element.getBoundingClientRect().top,
      );
      expect(panelTop).toBeGreaterThan(tableBottom);
    }
    await page.locator(".replayerCommandDeck").scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: "Forward", exact: true }),
    ).toBeVisible();
    await expect(analysis).toContainText("Analysis not available yet");
    if (width === 390) {
      await analysis.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${output}/imported-panel-390.png`,
        animations: "disabled",
      });
    }
  });
}

test("R10 final table and dock states retain approved replay geometry", async ({
  page,
}) => {
  const hand = hands[0]!;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    `/?route=tournaments&tab=replayer&previewSeats=6&qaCursor=${findActionCursor(hand, "a-hero-call")}`,
  );
  await expect(page.locator(".is-hero")).toHaveClass(/is-acting/);
  await capture(page, "hero-to-act-1440-6max");
  await page.goto(
    `/?route=tournaments&tab=replayer&previewSeats=6&qaCursor=${findActionCursor(hand, "a-bb-fold")}`,
  );
  await expect(page.locator('.player-seat[data-position="BB"]')).toHaveClass(
    /is-acting/,
  );
  await capture(page, "opponent-to-act-1440-6max");
  await page.getByRole("button", { name: "Flop", exact: true }).click();
  await expect(page.locator(".table-board .playingCard")).toHaveCount(3);
  await expect(page.locator('.player-seat[data-state="folded"]')).not.toHaveCount(0);
  await capture(page, "postflop-folded-1440-6max");
  const nineHand = buildMultiSeatPreviewHand(hand, 9);
  await page.goto(
    `/?route=tournaments&tab=replayer&previewSeats=9&qaCursor=${findActionCursor(nineHand, "a-hero-call")}`,
  );
  await expect(page.locator(".player-seat")).toHaveCount(9);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
  ).toBe(false);
  await capture(page, "table-1440-9max");
});

test("R10 narrow outside-filter controls stay in the popover flow", async ({
  page,
}) => {
  test.setTimeout(90000);
  await openImported(page, 390, true);
  await page.getByRole("button", { name: "Browse all 222 hands" }).click();
  const browser = page.getByRole("dialog", { name: "Browse all hands" });
  await browser.getByRole("button", { name: /Played 53 \/ 222/ }).click();
  await expect(browser.getByText("Current hand is outside this filter")).toBeVisible();
  const positionStyle = await browser
    .locator(".handFilterPosition")
    .evaluate((element) => ({
      position: getComputedStyle(element).position,
      fontSize: parseFloat(getComputedStyle(element).fontSize),
    }));
  expect(positionStyle.position).toBe("static");
  expect(positionStyle.fontSize).toBeGreaterThanOrEqual(12);
  await expect(browser.getByRole("button", { name: "Show all hands" })).toBeVisible();
  await capture(page, "outside-filter-390");
});

test("R10 narrow source review leaves the hand list reachable", async ({ page }) => {
  test.setTimeout(90000);
  await openImported(page, 390, true, 3);
  await page.setViewportSize({ width: 390, height: 600 });
  await page.getByRole("button", { name: "Browse all 233 hands" }).click();
  const browser = page.getByRole("dialog", { name: "Browse all hands" });
  await browser.getByRole("button", { name: /Played 50 \/ 233/ }).click();
  const review = browser.getByText("1 hand needs source review");
  await expect(review).toBeVisible();
  expect(
    await review.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
  ).toBeGreaterThanOrEqual(12);
  await review.click();
  const reviewPanel = browser.locator(".handFilterReviewPanel");
  await reviewPanel.scrollIntoViewIfNeeded();
  await expect(reviewPanel).toBeVisible();
  await capture(page, "source-review-open-390-short");
  const rows = browser.locator(".importedHandRows");
  expect(
    await rows.evaluate((element) => element.getBoundingClientRect().height),
  ).toBeGreaterThanOrEqual(80);
  await rows.scrollIntoViewIfNeeded();
  await expect(rows.locator(".importedHandRow").first()).toBeVisible();
  const bounds = await browser.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      left: box.left,
      right: box.right,
      bottom: box.bottom,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(390);
  expect(bounds.bottom).toBeLessThanOrEqual(600);
  expect(bounds.overflow).toBe(false);
  await capture(page, "source-review-list-390-short");
});
