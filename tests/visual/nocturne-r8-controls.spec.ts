import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { hands } from "../../src/data/mockTournament";
import { buildMultiSeatPreviewHand } from "../../src/data/previewHands";
import { findActionCursor, findStreetCursor } from "../../src/domain/replay";
import { fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

const output = "docs/qa/nocturne-r8";
const previewHand = buildMultiSeatPreviewHand(hands[0]!, 8);

async function openSample(page: Page, width: number, cursor = 0) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/?route=tournaments&tab=replayer&previewSeats=8&qaCursor=${cursor}`);
  await expect(page.locator(".player-seat")).toHaveCount(8);
  await page.evaluate(() => document.fonts.ready);
}

async function capture(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.screenshot({
    path: `${output}/${name}.png`,
    animations: "disabled",
    fullPage: true,
  });
}

for (const width of [1440, 1280, 1024, 768, 390]) {
  test(`R8 compact replay dock at ${width}px`, async ({ page }) => {
    await openSample(page, width);
    const dock = page.getByRole("group", { name: "Replay dock" });
    await expect(dock).toBeVisible();
    await expect(page.getByRole("button", { name: "Start of hand" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Back" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Forward" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Preflop" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(page.getByRole("switch", { name: "Hide result" })).toBeChecked();
    const showdown = page.getByRole("button", { name: "Showdown" });
    await expect(showdown).toBeDisabled();
    expect(await showdown.evaluate((button) => getComputedStyle(button).color)).toBe(
      "rgb(130, 136, 150)",
    );
    await expect(
      dock.getByRole("progressbar", { name: "Replay action progress" }),
    ).toHaveAttribute("aria-valuenow", "0");
    await expect(dock.getByRole("button", { name: /^(Play|Pause)$/ })).toHaveCount(0);

    const geometry = await page.evaluate(() => {
      const stage = document.querySelector(".pokerStage")!.getBoundingClientRect();
      const dock = document
        .querySelector(".replayerCommandDeck")!
        .getBoundingClientRect();
      const hero = document
        .querySelector(".is-hero .player-nameplate")!
        .getBoundingClientRect();
      const next = document
        .querySelector(".replayTransportNext")!
        .getBoundingClientRect();
      return {
        stage: stage.toJSON(),
        dock: dock.toJSON(),
        hero: hero.toJSON(),
        next: next.toJSON(),
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    expect(geometry.overflow).toBe(false);
    expect(geometry.dock.width).toBeLessThanOrEqual(760);
    expect(
      Math.abs(
        geometry.dock.x +
          geometry.dock.width / 2 -
          (geometry.stage.x + geometry.stage.width / 2),
      ),
    ).toBeLessThan(3);
    expect(
      geometry.dock.y - geometry.stage.y - geometry.stage.height,
    ).toBeGreaterThanOrEqual(0);
    expect(
      geometry.dock.y - geometry.stage.y - geometry.stage.height,
    ).toBeLessThanOrEqual(22);
    expect(geometry.dock.y).toBeGreaterThanOrEqual(
      geometry.hero.y + geometry.hero.height,
    );
    expect(geometry.next.width).toBeLessThanOrEqual(44);
    for (const name of ["Start of hand", "Back", "Forward", "Preflop", "Flop"]) {
      const button = page.getByRole("button", { name, exact: true });
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await capture(page, `start-${width}`);
  });
}

test("R8 action, street, keyboard, and privacy controls preserve replay semantics", async ({
  page,
}) => {
  await openSample(page, 1440);
  const progress = page.getByRole("progressbar", { name: "Replay action progress" });
  await page.getByRole("button", { name: "Forward" }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  await capture(page, "mid-preflop-1440");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: "Flop", exact: true }).click();
  await expect(progress).toHaveAttribute(
    "aria-valuenow",
    String(findStreetCursor(previewHand, "FLOP")),
  );
  await expect(page.getByRole("button", { name: "Flop", exact: true })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await capture(page, "flop-1440");
  await page.locator(".pokerStage").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("ArrowLeft");
  await expect(progress).toHaveAttribute(
    "aria-valuenow",
    String(findStreetCursor(previewHand, "FLOP")! - 1),
  );
  await page.getByRole("button", { name: "Turn" }).click();
  await expect(page.getByRole("button", { name: "Turn" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await capture(page, "turn-1440");
  await page.getByRole("button", { name: "River" }).click();
  await expect(page.getByRole("button", { name: "River" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await capture(page, "river-1440");
  const hidden = page.getByRole("switch", { name: "Hide result" });
  await hidden.click();
  await expect(hidden).not.toBeChecked();
  await hidden.click();
  await expect(hidden).toBeChecked();
  await page.getByRole("button", { name: "Start of hand" }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
});

test("R8 Hero-to-act status agrees with the highlighted Hero", async ({ page }) => {
  await openSample(page, 1440, findActionCursor(previewHand, "a-hero-call"));
  await expect(page.locator(".is-hero")).toHaveClass(/is-acting/);
  await expect(page.locator(".decisionRibbonMessage strong")).toContainText(
    "Hero to act",
  );
  await capture(page, "hero-to-act-1440");
});

test("R8 current-action message agrees with the highlighted opponent", async ({
  page,
}) => {
  await openSample(page, 1440, findActionCursor(previewHand, "a-bb-fold"));
  await expect(page.locator('.player-seat[data-position="BB"]')).toHaveClass(
    /is-acting/,
  );
  await expect(page.locator(".decisionRibbonMessage strong")).toContainText(
    "Next to act: BB",
  );
  await capture(page, "opponent-to-act-1440");
});

test("R8 imported hand change resets the dock and keeps strip scrolling independent", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?route=tournaments");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page
    .getByLabel("Hand history file")
    .setInputFiles(resolve("tests/fixtures/gg", fixtureNames[0]!));
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
  await page.getByRole("tab", { name: "Replayer", exact: true }).click();
  const strip = page.getByRole("region", { name: "Replayer hand strip" });
  const progress = page.getByRole("progressbar", { name: "Replay action progress" });
  await page.getByRole("button", { name: "Forward" }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  await strip.locator(".noc-replayer-strip__item").nth(1).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByRole("button", { name: "Preflop" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(page.getByRole("switch", { name: "Hide result" })).toBeChecked();
  const row = strip.locator(".noc-replayer-strip__scroll");
  await row.evaluate((element) => {
    element.scrollLeft = 0;
  });
  await page.getByRole("button", { name: "Forward" }).click();
  expect(await row.evaluate((element) => element.scrollLeft)).toBe(0);
  await capture(page, "imported-1440");
});
