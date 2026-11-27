import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { hands } from "../../src/data/mockTournament";
import {
  buildAllInPreviewHand,
  buildMultiSeatPreviewHand,
} from "../../src/data/previewHands";
import { findActionCursor } from "../../src/domain/replay";
import { fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

const output = "docs/qa/nocturne-r7";
const hand = hands[0]!;
const eightSeatHand = buildMultiSeatPreviewHand(hand, 8);

async function openPreview(
  page: Page,
  width: number,
  count: 6 | 8 | 9,
  cursor: number,
) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(
    `/?route=tournaments&tab=replayer&previewSeats=${count}&qaCursor=${cursor}`,
  );
  await expect(page.locator(".player-seat")).toHaveCount(count);
  await page.evaluate(() => document.fonts.ready);
}

test("R7 six-seat opponent decision keeps Hero neutral", async ({ page }) => {
  await openPreview(page, 1440, 6, findActionCursor(hand, "a-bb-fold"));
  await expect(page.locator('.player-seat[data-position="BB"]')).toHaveAttribute(
    "data-state",
    "to-act",
  );
  await expect(
    page.locator('.player-seat[data-position="BB"] .player-status'),
  ).toHaveText("To act");
  await expect(page.locator(".is-hero")).not.toHaveClass(/is-acting/);
  await expect(page.locator('.player-nameplate[aria-current="true"]')).toHaveCount(1);
  const heroActionOverlap = await page.evaluate(() => {
    const chip = document
      .querySelector(".is-hero .player-action-slot")!
      .getBoundingClientRect();
    return [
      ...document.querySelectorAll(
        ".player-cards,.player-nameplate,.table-pot,.table-board,.player-committed",
      ),
    ].some((item) => {
      const rect = item.getBoundingClientRect();
      return (
        Math.min(chip.right, rect.right) - Math.max(chip.left, rect.left) > 1 &&
        Math.min(chip.bottom, rect.bottom) - Math.max(chip.top, rect.top) > 1
      );
    });
  });
  expect(heroActionOverlap).toBe(false);
  await mkdir(output, { recursive: true });
  await page.screenshot({
    path: `${output}/opponent-to-act-1440-6max.png`,
    animations: "disabled",
  });
});

test("R7 all-in state retains cards and explicit status", async ({ page }) => {
  const preview = buildAllInPreviewHand(hand);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    `/?route=tournaments&tab=replayer&previewSeats=6&qaScenario=all-in&qaCursor=${findActionCursor(preview, "qa-bb-fold")}`,
  );
  await expect(page.locator(".is-hero")).toHaveAttribute("data-state", "all-in");
  await expect(page.locator(".is-hero .player-status")).toHaveText("All-in");
  await expect(page.locator(".is-hero .playingCard")).toHaveCount(2);
  await mkdir(output, { recursive: true });
  await page.screenshot({
    path: `${output}/all-in-1440-6max.png`,
    animations: "disabled",
  });
});

test("R7 imported reveal stays compact and obeys Hide Result", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?route=tournaments&tab=replayer");
  await page.locator(".sidebarUpload").click();
  await page
    .getByLabel("Hand history file")
    .setInputFiles(resolve("tests/fixtures/gg", fixtureNames[0]));
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
  await page.getByRole("tab", { name: "Replayer", exact: true }).click();
  await page.getByRole("button", { name: /Browse all \d+ hands/ }).click();
  await page
    .getByRole("dialog", { name: "Browse all hands" })
    .locator('[data-hand-id="TM6468725291"]')
    .click();
  const opponent = page.locator('[data-player-id="gg:314729652:ad116bad"]');
  await page.getByRole("button", { name: "Showdown", exact: true }).click();
  await expect(opponent.getByRole("img", { name: "Face-down card" })).toHaveCount(2);
  await page.getByRole("button", { name: "Forward", exact: true }).click();
  await expect(opponent.getByRole("img", { name: "Face-down card" })).toHaveCount(2);
  const actionCommitOverlap = await page.evaluate(() => {
    const intersects = (a: DOMRect, b: DOMRect) =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    return [...document.querySelectorAll(".player-action-slot")].some((action) =>
      [...document.querySelectorAll(".player-committed")].some((commit) =>
        intersects(action.getBoundingClientRect(), commit.getBoundingClientRect()),
      ),
    );
  });
  expect(actionCommitOverlap).toBe(false);
  await mkdir(output, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${output}/concealed-1440.png`,
    animations: "disabled",
    fullPage: true,
  });
  await page.getByRole("switch").click();
  await expect(opponent.getByRole("img", { name: "Ace of hearts" })).toBeVisible();
  const sizes = await opponent.locator(".playingCard").evaluateAll((cards) =>
    cards.map((card) => ({
      width: card.getBoundingClientRect().width,
      height: card.getBoundingClientRect().height,
    })),
  );
  expect(sizes).toHaveLength(2);
  expect(
    sizes.every(
      ({ width, height }) => Math.abs(width - 27) < 1 && Math.abs(height - 38) < 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `${output}/revealed-1440.png`,
    animations: "disabled",
    fullPage: true,
  });
});

for (const [width, count] of [
  [1440, 8],
  [1280, 8],
  [768, 9],
  [390, 8],
  [390, 9],
] as const) {
  test(`R7 table geometry at ${width}px ${count}-max`, async ({ page }) => {
    const preview = count === 9 ? buildMultiSeatPreviewHand(hand, 9) : eightSeatHand;
    await openPreview(page, width, count, findActionCursor(preview, "a-hero-call"));
    const geometry = await page.evaluate(() => {
      const stage = document.querySelector(".pokerStage")!;
      const felt = document.querySelector(".table-felt")!;
      const hero = document.querySelector(".is-hero")!;
      const rect = (element: Element) => element.getBoundingClientRect();
      const intersects = (a: DOMRect, b: DOMRect) =>
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
      const plates = [...stage.querySelectorAll(".player-nameplate")];
      const cards = [...stage.querySelectorAll(".player-cards")];
      const actions = [...stage.querySelectorAll(".player-action-slot")];
      const commits = [...stage.querySelectorAll(".player-committed")];
      const board = stage.querySelector(".table-board");
      const center = [
        ...stage.querySelectorAll(
          ".table-brand,.table-pot,.table-street,.preflop-label",
        ),
      ];
      const dealer = stage.querySelector(".seat-dealer")!;
      const collisions: string[] = [];
      for (const [i, plate] of plates.entries()) {
        for (const other of plates.slice(i + 1))
          if (intersects(rect(plate), rect(other))) collisions.push(`plate ${i}`);
        const pair = plate.parentElement!.querySelector(".player-cards");
        if (pair) {
          const gap = rect(plate).top - rect(pair).bottom;
          if (Math.abs(gap - 4) > 1) collisions.push(`cards detached ${i}: ${gap}`);
          if (
            Math.abs(
              rect(pair).left +
                rect(pair).width / 2 -
                rect(plate).left -
                rect(plate).width / 2,
            ) > 1
          )
            collisions.push(`cards off-center ${i}`);
        }
      }
      for (const [i, pair] of cards.entries())
        for (const plate of plates)
          if (intersects(rect(pair), rect(plate)))
            collisions.push(`cards ${i} / plate`);
      for (const [i, action] of actions.entries()) {
        for (const plate of plates)
          if (intersects(rect(action), rect(plate)))
            collisions.push(`action ${i} / plate`);
        for (const pair of cards)
          if (intersects(rect(action), rect(pair)))
            collisions.push(`action ${i} / cards`);
        if (board && intersects(rect(action), rect(board)))
          collisions.push(`action ${i} / board`);
        for (const item of center)
          if (intersects(rect(action), rect(item)))
            collisions.push(`action ${i} / center`);
        for (const commit of commits)
          if (intersects(rect(action), rect(commit)))
            collisions.push(`action ${i} / commit`);
      }
      for (const [i, commit] of commits.entries()) {
        for (const plate of plates)
          if (intersects(rect(commit), rect(plate)))
            collisions.push(`commit ${i} / plate`);
        for (const pair of cards)
          if (intersects(rect(commit), rect(pair)))
            collisions.push(`commit ${i} / cards`);
        if (board && intersects(rect(commit), rect(board)))
          collisions.push(`commit ${i} / board`);
        for (const item of center)
          if (intersects(rect(commit), rect(item)))
            collisions.push(`commit ${i} / center`);
      }
      for (const item of [...plates, ...cards, ...actions, ...commits])
        if (intersects(rect(dealer), rect(item))) collisions.push("dealer collision");
      return {
        stage: rect(stage).toJSON(),
        felt: rect(felt).toJSON(),
        hero: rect(hero).toJSON(),
        feltColor: getComputedStyle(felt).backgroundColor,
        railColor: getComputedStyle(felt).borderTopColor,
        opponentCards: [
          ...stage.querySelectorAll(".player-seat:not(.is-hero) .playingCard"),
        ].map((card) => rect(card).toJSON()),
        heroCards: [...stage.querySelectorAll(".is-hero .playingCard")].map((card) =>
          rect(card).toJSON(),
        ),
        collisions,
        debug: [...commits, ...actions, ...cards, ...center, dealer].map((element) => ({
          label: element.className,
          rect: {
            x: Math.round(rect(element).x),
            y: Math.round(rect(element).y),
            w: Math.round(rect(element).width),
            h: Math.round(rect(element).height),
          },
        })),
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    expect(geometry.feltColor).toBe("rgb(44, 36, 66)");
    expect(geometry.railColor).toBe("rgb(8, 8, 11)");
    expect(geometry.stage.width).toBeLessThanOrEqual(900);
    expect(geometry.stage.height).toBeGreaterThanOrEqual(460);
    expect(geometry.stage.height).toBeLessThanOrEqual(width < 700 ? 600 : 500);
    expect(
      Math.abs(
        geometry.hero.x +
          geometry.hero.width / 2 -
          geometry.stage.x -
          geometry.stage.width / 2,
      ),
    ).toBeLessThan(2);
    expect(geometry.hero.y).toBeGreaterThan(
      geometry.stage.y + geometry.stage.height * 0.65,
    );
    expect(
      geometry.opponentCards.every(
        (card) => Math.abs(card.width - 27) < 1 && Math.abs(card.height - 38) < 1,
      ),
    ).toBe(true);
    expect(
      geometry.heroCards.every(
        (card) => Math.abs(card.width - 50) < 1 && Math.abs(card.height - 70) < 1,
      ),
    ).toBe(true);
    expect(geometry.collisions, JSON.stringify(geometry.debug)).toEqual([]);
    expect(geometry.overflow).toBe(false);
    await mkdir(output, { recursive: true });
    await page.screenshot({
      path: `${output}/table-${width}-${count}max.png`,
      animations: "disabled",
    });
  });
}

for (const width of [1440, 768, 390]) {
  test(`R7 flop board clears seat units at ${width}px`, async ({ page }) => {
    await openPreview(
      page,
      width,
      8,
      findActionCursor(eightSeatHand, "a-hero-check-flop"),
    );
    await expect(page.locator(".table-board .playingCard")).toHaveCount(3);
    const result = await page.evaluate(() => {
      const board = document.querySelector(".table-board")!;
      const boardRect = board.getBoundingClientRect();
      const overlaps = [
        ...document.querySelectorAll(
          ".player-nameplate,.player-cards,.player-action-slot,.player-committed",
        ),
      ]
        .filter((item) => {
          const rect = item.getBoundingClientRect();
          return (
            Math.min(rect.right, boardRect.right) -
              Math.max(rect.left, boardRect.left) >
              1 &&
            Math.min(rect.bottom, boardRect.bottom) -
              Math.max(rect.top, boardRect.top) >
              1
          );
        })
        .map((item) => item.className);
      return {
        cards: [...board.querySelectorAll(".playingCard")].map((card) =>
          card.getBoundingClientRect().toJSON(),
        ),
        overlaps,
      };
    });
    expect(
      result.cards.every(
        (card) => Math.abs(card.width - 44) < 1 && Math.abs(card.height - 62) < 1,
      ),
    ).toBe(true);
    expect(result.overlaps).toEqual([]);
    await mkdir(output, { recursive: true });
    await page.screenshot({
      path: `${output}/flop-${width}.png`,
      animations: "disabled",
    });
  });
}

for (const count of [8, 9] as const)
  for (const [street, actionId, expectedSize] of [
    ["turn", "a-btn-check-turn", 36],
    ["river", "a-btn-fold-river", 28],
  ] as const) {
    test(`R7 ${count}-max mobile ${street} board clears seats`, async ({ page }) => {
      const preview = buildMultiSeatPreviewHand(hand, count);
      await openPreview(page, 390, count, findActionCursor(preview, actionId));
      const result = await page.evaluate(() => {
        const board = document.querySelector(".table-board")!;
        const boardRect = board.getBoundingClientRect();
        const overlap = [
          ...document.querySelectorAll(".player-nameplate,.player-cards"),
        ].some((item) => {
          const rect = item.getBoundingClientRect();
          return (
            Math.min(rect.right, boardRect.right) -
              Math.max(rect.left, boardRect.left) >
              1 &&
            Math.min(rect.bottom, boardRect.bottom) -
              Math.max(rect.top, boardRect.top) >
              1
          );
        });
        return {
          cards: [...board.querySelectorAll(".playingCard")].map(
            (card) => card.getBoundingClientRect().width,
          ),
          overlap,
        };
      });
      expect(result.cards).toHaveLength(street === "turn" ? 4 : 5);
      expect(result.cards.every((size) => Math.abs(size - expectedSize) < 1)).toBe(
        true,
      );
      expect(result.overlap).toBe(false);
      await mkdir(output, { recursive: true });
      await page.screenshot({
        path: `${output}/${street}-390-${count}max.png`,
        animations: "disabled",
      });
    });
  }
