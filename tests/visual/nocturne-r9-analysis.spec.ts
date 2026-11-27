import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureHand, fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";
import { hands } from "../../src/data/mockTournament";
import { buildMultiSeatPreviewHand } from "../../src/data/previewHands";
import { findActionCursor } from "../../src/domain/replay";

const output = "docs/qa/nocturne-r9";

async function capture(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `${output}/${name}.png`, animations: "disabled" });
}

async function openImported(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/?route=tournaments");
  if (width >= 1180) {
    await page.getByRole("button", { name: "Import", exact: true }).click();
  } else {
    await page.locator(".mobileNavSelect select").selectOption("upload");
  }
  if (width === 1440) {
    await page
      .getByLabel("Hand history file")
      .setInputFiles(resolve("tests/fixtures/gg", fixtureNames[0]!));
  } else {
    await page.getByLabel("Hand history file").setInputFiles({
      name: "single-hand.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(fixtureHand(0, "TM6468725291")),
    });
  }
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
  await page.getByRole("tab", { name: "Replayer", exact: true }).click();
}

for (const width of [1440, 1280, 1024, 390]) {
  test(`R9 imported analysis at ${width}px`, async ({ page }) => {
    test.setTimeout(90000);
    await openImported(page, width);
    const panel = page.getByRole("complementary", { name: "Hand analysis" });
    await expect(
      panel.getByRole("heading", { name: "Analysis not available yet" }),
    ).toBeVisible();
    await expect(panel).toContainText(
      "Decision grades, EV, recommendations, and strategy explanations",
    );
    await expect(panel).not.toContainText(/Strategy Mix|72%|Illustrative mock|Mistake/);
    const geometry = await page.evaluate(() => {
      const table = document
        .querySelector(".replayerLayout .tableSection")!
        .getBoundingClientRect();
      const analysis = document
        .querySelector(".replayerLayout .analysisPanel")!
        .getBoundingClientRect();
      return {
        table: table.toJSON(),
        analysis: analysis.toJSON(),
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    expect(geometry.overflow).toBe(false);
    if (width >= 1280) {
      expect(Math.round(geometry.analysis.width)).toBe(400);
      expect(Math.round(geometry.analysis.left - geometry.table.right)).toBe(8);
      expect(geometry.analysis.height).toBeGreaterThanOrEqual(500);
    } else {
      expect(geometry.analysis.top).toBeGreaterThan(geometry.table.bottom);
    }
    await capture(page, `imported-${width}`);
    if (width <= 1024) {
      await panel.screenshot({
        path: `${output}/imported-panel-${width}.png`,
        animations: "disabled",
      });
    }
    await page.getByRole("button", { name: "Forward", exact: true }).click();
    await expect(panel).toContainText("Analysis not available yet");
    await expect(panel).not.toContainText(/Strategy Mix|72%|Illustrative mock|Mistake/);
    if (width === 1440) {
      await page.getByRole("button", { name: "Flop", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Flop", exact: true }),
      ).toHaveAttribute("aria-current", "step");
      await expect(panel).toContainText("Analysis not available yet");
      await capture(page, "imported-flop-1440");
      await page.locator(".noc-replayer-strip__item").nth(1).click();
      await expect(panel).toContainText("Analysis not available yet");
      await expect(panel).not.toContainText(
        /Strategy Mix|72%|Illustrative mock|Mistake/,
      );
      await capture(page, "imported-next-hand-1440");
    }
  });
}

test("R9 illustrative demo analysis scrolls within the desktop tile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?route=tournaments&tab=replayer");
  const panel = page.getByRole("complementary", { name: "Hand analysis" });
  await expect(panel).toContainText("Illustrative analysis");
  await expect(panel.getByRole("tab", { name: "Decision" })).toBeVisible();
  await expect(panel.getByRole("tab", { name: "Context" })).toBeVisible();
  await expect(page.locator(".is-hero")).toHaveClass(/is-acting/);
  const geometry = await panel.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
  }));
  expect(geometry.height).toBeGreaterThanOrEqual(500);
  expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
  expect(geometry.overflowY).toBe("auto");
  await capture(page, "demo-1440");
  await panel.getByRole("tab", { name: "Context" }).click();
  await expect(panel).toContainText("does not re-analyze later actions");
});

test("R9 demo panel remains illustrative on an opponent turn", async ({ page }) => {
  const hand = buildMultiSeatPreviewHand(hands[0]!, 8);
  const cursor = findActionCursor(hand, "a-bb-fold");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/?route=tournaments&tab=replayer&previewSeats=8&qaCursor=${cursor}`);
  await expect(page.locator('.player-seat[data-position="BB"]')).toHaveClass(
    /is-acting/,
  );
  const panel = page.getByRole("complementary", { name: "Hand analysis" });
  await expect(panel).toContainText("Illustrative analysis");
  await expect(panel).toContainText("Mock / not solver truth");
  await capture(page, "demo-opponent-1440");
});

test("R9 analysis panel uses internal scrolling on a short desktop viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.goto("/?route=tournaments&tab=replayer");
  const panel = page.getByRole("complementary", { name: "Hand analysis" });
  const geometry = await panel.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  expect(geometry.height).toBeLessThanOrEqual(380);
  expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
});

test("R9 imported analysis scrolls by keyboard on a short viewport", async ({
  page,
}) => {
  await openImported(page, 1440);
  await page.setViewportSize({ width: 1440, height: 500 });
  const panel = page.getByRole("complementary", { name: "Hand analysis" });
  await expect(panel).toHaveAttribute("tabindex", "0");
  await panel.focus();
  await expect(panel).toBeFocused();
  await page.keyboard.press("PageDown");
  expect(await panel.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
});
