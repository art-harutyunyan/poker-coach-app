import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

const output = "docs/qa/playing-cards";
async function importFixture(page: Page, width: number) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/?route=tournaments&tab=replayer");
  if (await page.locator(".sidebarUpload").isVisible())
    await page.locator(".sidebarUpload").click();
  else await page.locator(".mobileNavSelect select").selectOption("upload");
  await page
    .getByLabel("Hand history file")
    .setInputFiles(resolve("tests/fixtures/gg", fixtureNames[0]));
  await expect(
    page.getByRole("button", { name: "Open tournament", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
  await page.getByRole("tab", { name: "Replayer", exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
}
async function selectImportedHand(page: Page, handId: string) {
  await page.getByRole("button", { name: /Browse all \d+ hands/ }).click();
  const browser = page.getByRole("dialog", { name: "Browse all hands" });
  await browser.locator(`[data-hand-id="${handId}"]`).click();
  await expect(browser).toHaveCount(0);
  await expect(
    page.locator(`.noc-replayer-strip__item[data-hand-id="${handId}"]`),
  ).toHaveAttribute("aria-current", "true");
}
async function shot(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${output}/${name}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
async function checkCards(page: Page) {
  const errors = await page
    .locator(".playingCard[data-card-variant]")
    .evaluateAll((cards) =>
      cards.flatMap((card) => {
        const variant = card.getAttribute("data-card-variant")!;
        let [w, h, rankSize, suitSize] = (
          {
            compact: [24, 34, 16, 9],
            table: [40, 54, 25, 14],
            board: [46, 64, 29, 17],
          } as Record<string, number[]>
        )[variant]!;
        const stage = card.closest(".pokerStage");
        if (stage && variant === "table") {
          const hero = Boolean(card.closest(".is-hero"));
          [w, h, rankSize, suitSize] = hero ? [50, 70, 31, 18] : [27, 38, 17, 10];
        }
        if (stage && variant === "board") {
          const count = Number(stage.getAttribute("data-board-count"));
          [w, h, rankSize, suitSize] =
            innerWidth <= 700 && count >= 4
              ? count === 4
                ? [36, 51, 23, 13]
                : [28, 40, 18, 10]
              : [44, 62, 28, 16];
        }
        const box = card.getBoundingClientRect(),
          style = getComputedStyle(card),
          problems: string[] = [];
        if (
          Math.abs(parseFloat(style.width) - w!) > 0.02 ||
          Math.abs(parseFloat(style.height) - h!) > 0.02
        )
          problems.push(`size ${style.width}x${style.height}`);
        if (card.classList.contains("cardBack")) {
          const back = card.querySelector("svg.study-card-back");
          if (!back || back.getAttribute("data-variant") !== variant)
            problems.push("back variant");
          if (
            card.querySelector(".cardCorner,.cardSuit,text,title") ||
            card.hasAttribute("data-red") ||
            card.getAttribute("aria-label") !== "Face-down card"
          )
            problems.push("concealed identity");
        } else {
          if (
            style.backgroundColor !==
              (stage ? "rgb(244, 244, 241)" : "rgb(250, 250, 247)") ||
            style.borderTopColor !== "rgb(206, 210, 201)"
          )
            problems.push("face tokens");
          const red = card.getAttribute("data-red") === "true";
          if (
            style.color !==
            (stage
              ? red
                ? "rgb(210, 58, 74)"
                : "rgb(22, 24, 29)"
              : red
                ? "rgb(130, 29, 56)"
                : "rgb(24, 31, 27)")
          )
            problems.push("ink");
          const rank = card.querySelector("strong")!,
            svg = card.querySelector("svg")!;
          if (Math.abs(parseFloat(getComputedStyle(rank).fontSize) - rankSize!) > 0.02)
            problems.push("rank size");
          if (Math.abs(parseFloat(getComputedStyle(svg).width) - suitSize!) > 0.02)
            problems.push("suit size");
          if (rank.textContent === "T") problems.push("domain T visible");
          const range = document.createRange();
          range.selectNodeContents(rank);
          const text = range.getBoundingClientRect();
          if (text.left < box.left + 1 - 0.1 || text.right > box.right - 1 + 0.1)
            problems.push("rank clips");
          if (range.getClientRects().length !== 1) problems.push("rank wraps");
          const suit = svg.getBoundingClientRect();
          if (
            suit.bottom > box.bottom - 1 + 0.1 ||
            suit.left < box.left ||
            suit.right > box.right
          )
            problems.push("suit clips");
        }
        return problems.map(
          (p) => `${variant} ${card.getAttribute("aria-label")}: ${p}`,
        );
      }),
    );
  expect(errors).toEqual([]);
}
for (const width of [1440, 1024, 768, 430, 390])
  test(`approved imported cards at ${width}`, async ({ page }) => {
    await importFixture(page, width);
    await expect(
      page.locator('.noc-replayer-strip__cards [data-card-variant="compact"]').first(),
    ).toBeVisible();
    const tens = page
      .locator(".noc-replayer-strip__cards .playingCard")
      .filter({ has: page.locator("strong", { hasText: /^10$/ }) });
    expect(await tens.count()).toBeGreaterThan(0);
    await page.getByRole("button", { name: /Browse all \d+ hands/ }).click();
    await expect(
      page.locator('.importedHeroCards [data-card-variant="compact"]').first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close hand browser" }).click();
    await checkCards(page);
    await shot(page, `navigator-${width}`);
    await selectImportedHand(page, "TM6468725291");
    const opponent = page.locator('[data-player-id="gg:314729652:ad116bad"]');
    await page.getByRole("button", { name: "Showdown", exact: true }).click();
    await expect(opponent.getByRole("img", { name: "Face-down card" })).toHaveCount(2);
    const concealed = await opponent.locator(".player-cards").innerHTML();
    await page.getByRole("button", { name: "Forward", exact: true }).click();
    expect(await opponent.locator(".player-cards").innerHTML()).toBe(concealed);
    await page.getByRole("switch").click();
    await expect(opponent.getByRole("img", { name: "Ace of hearts" })).toBeVisible();
    await expect(opponent.locator('[data-card-variant="table"]')).toHaveCount(2);
    await checkCards(page);
    await shot(page, `revealed-${width}`);
    await page.getByRole("switch").click();
    expect(await opponent.locator(".player-cards").innerHTML()).toBe(concealed);
    await shot(page, `concealed-${width}`);
    await selectImportedHand(page, "TM6469820465");
    await page.getByRole("button", { name: "River", exact: true }).click();
    await expect(page.locator('.table-board [data-card-variant="board"]')).toHaveCount(
      5,
    );
    await checkCards(page);
    const board = await page.locator(".table-board").boundingBox();
    const stage = await page.locator(".pokerStage").boundingBox();
    expect(board!.x).toBeGreaterThanOrEqual(stage!.x);
    expect(board!.x + board!.width).toBeLessThanOrEqual(stage!.x + stage!.width);
    await shot(page, `board-${width}`);
    const overlaps = await page.evaluate(() => {
      const board = document.querySelector(".table-board")!.getBoundingClientRect();
      const overlaps = [...document.querySelectorAll(".player-nameplate")]
        .map((el) => ({
          position: el.parentElement!.getAttribute("data-position"),
          r: el.getBoundingClientRect(),
        }))
        .filter(
          ({ r }) =>
            r.left < board.right &&
            r.right > board.left &&
            r.top < board.bottom &&
            r.bottom > board.top,
        );
      return overlaps.map(({ position, r }) => ({ position, rect: r.toJSON() }));
    });
    await expect(page.locator(".table-felt")).toHaveCSS(
      "background-color",
      "rgb(44, 36, 66)",
    );
    const nameplateOverlaps = await page
      .locator(".player-nameplate")
      .evaluateAll((plates) => {
        const rects = plates.map((plate) => plate.getBoundingClientRect());
        return rects.flatMap((a, i) =>
          rects
            .slice(i + 1)
            .flatMap((b) =>
              Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
                ? [i]
                : [],
            ),
        );
      });
    expect(nameplateOverlaps).toEqual([]);
    expect(overlaps).toEqual([]);
    await page.getByRole("tab", { name: "Review Queue", exact: true }).click();
    await expect(
      page.locator('.importedHandList [data-card-variant="compact"]').first(),
    ).toBeVisible();
    await checkCards(page);
    await shot(page, `queue-${width}`);
  });

test("compact Ten at 200% zoom and forced colors retains rank and suit", async ({
  page,
}) => {
  await importFixture(page, 1440);
  await page.evaluate(() => (document.documentElement.style.zoom = "2"));
  await checkCards(page);
  await page
    .locator(".noc-replayer-strip")
    .screenshot({ path: `${output}/zoom-200.png`, animations: "disabled" });
  await page.evaluate(() => (document.documentElement.style.zoom = "1"));
  await page.emulateMedia({ forcedColors: "active" });
  const ten = page.getByRole("img", { name: /Ten of/ }).first();
  await expect(ten.locator("strong")).toHaveText("10");
  await expect(ten.locator("svg")).toBeVisible();
  await shot(page, "forced-colors");
});

test("approved shared card specimens and concealed variants", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 520 });
  await page.goto("/");
  await page.evaluate(async () => {
    const cardModule = "/src/ui/components/PlayingCard.tsx";
    const reactModule = "/node_modules/.vite/deps/react.js";
    const domModule = "/node_modules/.vite/deps/react-dom_client.js";
    const [{ PlayingCard }, { default: React }, { default: ReactDOM }] =
      await Promise.all([import(cardModule), import(reactModule), import(domModule)]);
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    host.style.cssText =
      "padding:32px;background:#171d1b;color:#fafaf7;min-height:520px";
    ReactDOM.createRoot(host).render(
      React.createElement(
        "div",
        null,
        ...["compact", "table", "board"].map((variant) =>
          React.createElement(
            "section",
            { key: variant, style: { marginBottom: 24 } },
            React.createElement("p", null, variant),
            React.createElement(
              "div",
              { style: { display: "flex", gap: 6, marginTop: 8 } },
              ...["s", "h", "d", "c"].map((suit) =>
                React.createElement(PlayingCard, {
                  key: suit,
                  rank: "T",
                  suit,
                  variant,
                }),
              ),
              React.createElement(PlayingCard, { concealed: true, variant }),
            ),
          ),
        ),
      ),
    );
  });
  await expect(page.getByRole("img", { name: "Face-down card" })).toHaveCount(3);
  await checkCards(page);
  await shot(page, "approved-specimens");
  const tableBack = page.locator('.cardBack[data-card-variant="table"]');
  await tableBack.evaluate((el) => ((el as HTMLElement).style.width = "31px"));
  await expect(tableBack.locator("svg.study-card-back")).toHaveAttribute(
    "data-variant",
    "table",
  );
  expect(
    await tableBack
      .locator(".back-outer")
      .evaluate((el) => getComputedStyle(el).getPropertyValue("rx")),
  ).toBe("4px");
  const motif = await tableBack
    .locator(".back-motif")
    .evaluate((el) => el.getBoundingClientRect().toJSON());
  expect(motif!.width).toBeCloseTo(12);
  expect(motif!.height).toBeCloseTo(12);
});
