import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

const output = "docs/qa/phase-1b-1";
async function shot(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${output}/${name}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
async function importFixture(page: Page, index: number, width: number) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/?route=tournaments&tab=replayer");
  if (await page.locator(".sidebarUpload").isVisible())
    await page.locator(".sidebarUpload").click();
  else await page.locator(".mobileNavSelect select").selectOption("upload");
  await page
    .getByLabel("Hand history file")
    .setInputFiles(resolve("tests/fixtures/gg", fixtureNames[index]!));
  await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
  await page.getByRole("button", { name: "Open Tournament Review" }).click();
  await page.getByRole("tab", { name: "Replayer", exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
}
async function readableCards(page: Page) {
  const problems = await page
    .locator(".playingCard:not(.cardBack):not(.deckAssetCard)")
    .evaluateAll((cards) => {
      function lum(color: string) {
        const rgb = color
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((v) => {
            v /= 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          });
        return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
      }
      const contrast = (a: string, b: string) =>
        (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
      return cards.flatMap((card) => {
        const style = getComputedStyle(card),
          box = card.getBoundingClientRect(),
          errors: string[] = [];
        if (contrast(style.color, style.backgroundColor) < 4.5)
          errors.push("text contrast");
        if (style.borderTopColor !== "rgb(206, 210, 201)")
          errors.push("approved border token");
        const rank = card.querySelector(".cardCorner strong")!;
        if (Number(getComputedStyle(rank).fontWeight) < 600) errors.push("rank weight");
        for (const glyph of card.querySelectorAll(".cardCorner strong,.cardSuit")) {
          const r = glyph.getBoundingClientRect();
          if (
            r.left < box.left ||
            r.right > box.right ||
            r.top < box.top ||
            r.bottom > box.bottom
          )
            errors.push("glyph clipped");
        }
        return errors.map((e) => `${card.getAttribute("aria-label")}: ${e}`);
      });
    });
  expect(problems).toEqual([]);
}
for (const width of [1440, 390])
  test(`shared card readability at ${width}`, async ({ page }) => {
    await importFixture(page, 0, width);
    await page.locator('[data-hand-id="TM6468725291"]').click();
    const opponent = page.locator('[data-player-id="gg:314729652:ad116bad"]');
    const alias = await opponent.locator(".player-name").innerText();
    await expect(opponent.locator(".player-name")).toHaveAttribute(
      "title",
      new RegExp(`${alias}, anonymized opponent, source ID ad116bad`),
    );
    await page.getByRole("button", { name: "Showdown", exact: true }).click();
    await expect(page.locator(".decisionRibbon")).toContainText("Action 22 /");
    await expect(opponent.getByLabel("Face-down card", { exact: true })).toHaveCount(2);
    await shot(page, `before-show-${width}`);
    await page.getByRole("button", { name: "Forward", exact: true }).click();
    await expect(opponent.getByLabel("Face-down card", { exact: true })).toHaveCount(2);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("switch").click();
    await expect(opponent.getByLabel("Face-down card", { exact: true })).toHaveCount(2);
    await page.getByRole("button", { name: "Forward", exact: true }).click();
    await expect(page.locator(".decisionRibbon")).toContainText("Action 23 /");
    await expect(opponent.getByLabel("Ace of hearts", { exact: true })).toBeVisible();
    await expect(
      opponent.getByLabel("Five of diamonds", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".table-board")).toHaveCount(0);
    await expect(page.locator(".streetNavigation button[aria-current]")).toHaveText(
      "Showdown",
    );
    expect(
      await page.locator(".streetNavigation button").evaluateAll((buttons) =>
        buttons.flatMap((button) => {
          const range = document.createRange();
          range.selectNodeContents(button);
          const rects = [...range.getClientRects()];
          return new Set(rects.map((r) => Math.round(r.top))).size > 1 ||
            button.scrollWidth > button.clientWidth + 1
            ? [button.textContent]
            : [];
        }),
      ),
    ).toEqual([]);
    await shot(page, `first-reveal-${width}`);
    await page.getByRole("button", { name: "Forward", exact: true }).click();
    await expect(page.locator(".decisionRibbon")).toContainText("Action 24 /");
    await expect(
      page.locator(".is-hero").getByLabel("King of diamonds", { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator(".is-hero").getByLabel("King of clubs", { exact: true }),
    ).toBeVisible();
    await page.getByRole("switch").click();
    await expect(opponent.getByLabel("Face-down card", { exact: true })).toHaveCount(2);
    await shot(page, `privacy-${width}`);
    await page.getByRole("switch").click();
    await page.getByRole("button", { name: "Flop", exact: true }).click();
    await shot(page, `cards-${width}`);
    await readableCards(page);
    await expect(page.locator(".streetNavigation button[aria-current]")).toHaveText(
      "Flop",
    );
    await page.getByRole("button", { name: "River", exact: true }).click();
    await expect(page.locator(".streetNavigation button[aria-current]")).toHaveText(
      "Showdown",
    );
    await page.locator(".importedHandRow").first().click();
    await page.locator('[data-hand-id="TM6468725291"]').click();
    await expect(opponent.locator(".player-name")).toHaveText(alias);
    await expect(page.getByRole("switch")).toBeChecked();
    await expect(page.locator(".decisionRibbon")).toContainText("Action 0 /");
  });
