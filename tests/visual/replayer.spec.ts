import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { hands } from "../../src/data/mockTournament";
import {
  buildAllInPreviewHand,
  buildMultiSeatPreviewHand,
} from "../../src/data/previewHands";
import {
  buildReplayState,
  findActionCursor,
  flattenActions,
} from "../../src/domain/replay";

const output = "docs/qa/replayer-shell/seat-regression";
const widths = [1600, 1440, 1280, 1024, 768, 430, 390, 375];
const sizes = [6, 8, 9] as const;

async function ready(page: Page) {
  await expect(page.locator(".player-nameplate").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".cardAssetLoading")).toHaveCount(0, { timeout: 20000 });
  await expect
    .poll(
      () =>
        page
          .locator(".pokerStage img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      { timeout: 20000 },
    )
    .toBe(true);
  await page.waitForTimeout(200);
}

async function checkGeometry(page: Page) {
  const problems = await page.evaluate(() => {
    const errors: string[] = [];
    const rect = (node: Element) => node.getBoundingClientRect();
    const intersects = (a: DOMRect, b: DOMRect) =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    const plates = [...document.querySelectorAll(".player-nameplate")];
    const clusters = [...document.querySelectorAll(".player-seat")];
    if (document.documentElement.scrollWidth > window.innerWidth + 1)
      errors.push("page overflow");
    for (const [i, plate] of plates.entries()) {
      const p = rect(plate);
      const badge = rect(plate.querySelector(".player-position-badge")!);
      if (p.left < -1 || p.right > window.innerWidth + 1)
        errors.push(`plate ${i} clipped`);
      if (
        badge.right > p.right ||
        badge.left < p.left + p.width / 2 ||
        badge.top < p.top ||
        badge.top > p.top + 7
      )
        errors.push(`badge ${i} not top right`);
      const cards = plate.querySelector(".player-cards");
      if (cards) {
        const c = rect(cards);
        if (
          Math.abs((c.left + c.right) / 2 - (p.left + p.right) / 2) > 1 ||
          Math.abs(c.bottom - p.top) > 3
        )
          errors.push(`cards ${i} detached`);
      }
      for (const other of plates.slice(i + 1))
        if (intersects(p, rect(other))) errors.push(`plate ${i} overlaps another`);
      const name = plate.querySelector(".player-name")!;
      if (!name.textContent || getComputedStyle(name).display === "none")
        errors.push(`name ${i} missing`);
    }
    const center = [...document.querySelectorAll(".table-pot,.table-board")];
    const commits = [...document.querySelectorAll(".player-committed")];
    for (const [i, commit] of commits.entries()) {
      const c = rect(commit);
      if (center.some((element) => intersects(c, rect(element))))
        errors.push(`bet ${i} overlaps pot/board`);
      for (const other of commits.slice(i + 1))
        if (intersects(c, rect(other))) errors.push(`bet ${i} overlaps another bet`);
      for (const plate of plates)
        if (intersects(c, rect(plate))) errors.push(`bet ${i} overlaps plate`);
    }
    for (const [i, cluster] of clusters.entries()) {
      for (const cards of cluster.querySelectorAll(".player-cards")) {
        for (const other of clusters.slice(i + 1)) {
          for (const child of other.querySelectorAll(".player-nameplate,.player-cards"))
            if (intersects(rect(cards), rect(child))) errors.push(`cards ${i} collide`);
        }
      }
    }
    const dealer = document.querySelector(".seat-dealer")!;
    if (dealer.closest(".player-seat")?.getAttribute("data-position") !== "BTN")
      errors.push("dealer ownership");
    for (const element of document.querySelectorAll(
      ".player-cards,.player-position-badge,.player-action-slot,.player-committed",
    )) {
      if (intersects(rect(dealer), rect(element))) errors.push("dealer collision");
    }
    const hero = rect(document.querySelector(".is-hero")!);
    const table = rect(document.querySelector(".pokerStage")!);
    if (
      Math.abs(hero.left + hero.width / 2 - table.left - table.width / 2) > 1 ||
      hero.top < table.top + table.height * 0.65
    )
      errors.push("Hero displaced");
    return errors;
  });
  expect(problems).toEqual([]);
}

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

for (const width of widths)
  for (const count of sizes) {
    test(`${width}px ${count}-max geometry and replay states`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const hand =
        count === 6 ? hands[0]! : buildMultiSeatPreviewHand(hands[0]!, count);
      const checkpoints = [
        ["initial", 0],
        ["blinds", findActionCursor(hand, "a-utg-fold")],
        ["raise", findActionCursor(hand, "a-hero-call")],
        ["call", findActionCursor(hand, "a-bb-fold")],
        ["flop", findActionCursor(hand, "a-hero-check-flop")],
        ["check", findActionCursor(hand, "a-btn-cbet")],
        ["bet", findActionCursor(hand, "a-hero-call-flop")],
        ["turn", findActionCursor(hand, "a-btn-check-turn")],
        ["river", findActionCursor(hand, "a-btn-fold-river")],
      ] as const;
      for (const [label, cursor] of checkpoints) {
        await page.goto(
          `/?route=tournaments&tab=replayer&previewSeats=${count}&qaCursor=${cursor}`,
          { waitUntil: "domcontentloaded" },
        );
        await ready(page);
        await checkGeometry(page);
        const state = buildReplayState(hand, cursor);
        await expect(page.locator(".player-seat")).toHaveCount(count);
        await expect(page.locator(".is-folded .player-cards")).toHaveCount(0);
        await expect(page.locator(".player-cards")).toHaveCount(
          state.seats.filter((seat) => !seat.isFolded).length,
        );
        for (const seat of state.seats) {
          const plate = page.locator(`[data-player-id="${seat.id}"]`);
          await expect(plate.locator(".player-stack")).toHaveText(
            `${seat.stackBB.toFixed(1)} BB`,
          );
          if (seat.isActive)
            await expect(plate.locator(".player-nameplate")).toHaveAttribute(
              "aria-current",
              "true",
            );
        }
        if (label === "raise")
          await page.screenshot({
            path: `${output}/${width}-${count}max.png`,
            fullPage: true,
          });
        if ((width === 1440 || width === 390) && count === 8)
          await page
            .locator(".pokerStage")
            .screenshot({ path: `${output}/${width}-8max-${label}.png` });
      }
      expect(errors).toEqual([]);
    });
  }

for (const width of [1440, 390])
  for (const count of sizes) {
    test(`${width}px ${count}-max all-in`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const base = buildAllInPreviewHand(hands[0]!);
      const hand = count === 6 ? base : buildMultiSeatPreviewHand(base, count);
      await page.goto(
        `/?route=tournaments&tab=replayer&previewSeats=${count}&qaScenario=all-in&qaCursor=${findActionCursor(hand, "qa-bb-fold")}`,
      );
      await ready(page);
      await checkGeometry(page);
      await expect(page.locator(".is-hero")).toHaveAttribute("data-state", "all-in");
      await expect(page.locator(".is-hero .player-action-text")).toContainText(
        "All-in",
      );
      await page.screenshot({
        path: `${output}/${width}-${count}max-all-in.png`,
        fullPage: true,
      });
    });
  }

test("themes, Back/Forward, keyboard and Hide Result preserve state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?route=tournaments&tab=replayer&previewSeats=8");
  await ready(page);
  const before = await page.locator(".table-pot").innerText();
  await page.getByRole("button", { name: "Forward", exact: true }).click();
  await expect(page.locator(".is-acting")).toHaveAttribute("data-position", "BB");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.locator(".table-pot")).toHaveText(before);
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".is-acting")).toHaveAttribute("data-position", "BB");
  await page.locator(".visualPreviewDisclosure summary").click();
  const bounds = await page
    .locator(".player-seat")
    .evaluateAll((xs) => xs.map((x) => x.getBoundingClientRect().toJSON()));
  for (const cards of ["letele", "block52"]) {
    await page.getByLabel("Card deck preview").selectOption(cards);
    await ready(page);
    expect(
      await page
        .locator(".player-seat")
        .evaluateAll((xs) => xs.map((x) => x.getBoundingClientRect().toJSON())),
    ).toEqual(bounds);
  }
  for (const theme of ["graphite-emerald", "felt-texture", "deep-emerald"]) {
    await page.goto(
      "/?route=tournaments&tab=replayer&previewSeats=8&previewCards=letele&qaCursor=20",
    );
    await ready(page);
    for (const card of ["Ad", "7s", "2c"]) {
      const face = page.locator(
        `.table-board .deckAssetCard[aria-label="${card}"] svg`,
      );
      await expect(face).toBeVisible();
      await expect(face).not.toHaveClass(/B-1/);
    }
    await checkGeometry(page);
    await page.locator(".visualPreviewDisclosure summary").click();
    await page.getByLabel("Table skin preview").selectOption(theme);
    await expect(page.locator(".pokerStage")).toHaveAttribute(
      "data-table-theme",
      theme,
    );
  }
  await page.getByLabel("Chip style preview").selectOption("block52");
  await ready(page);
  await checkGeometry(page);
  const forward = page.getByRole("button", { name: "Forward", exact: true });
  while (await forward.isEnabled()) await forward.click();
  await expect(page.locator(".timelineAction[title*='wins']")).toHaveCount(0);
  const grade = await page.locator(".analysisStatusCard[data-grade]").textContent();
  await page.getByRole("switch").click();
  await expect(forward).toBeEnabled();
  await forward.click();
  await expect(page.locator(".table-pot")).toContainText("0 BB");
  await expect(page.locator(".analysisStatusCard[data-grade]")).toHaveText(grade!);
  await page.getByRole("switch").click();
  await expect(page.locator(".table-pot")).not.toContainText("0 BB");
  expect(flattenActions(hands[0]!).length).toBeGreaterThan(0);
});
