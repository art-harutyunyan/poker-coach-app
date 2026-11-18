import { expect, test, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
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
  await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
  await page.getByRole("button", { name: "Open Tournament Review" }).click();
  await page.getByRole("tab", { name: "Replayer", exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
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
        if (variant === "table" && innerWidth <= 700) {
          const size = card.closest(".pokerStage")?.getAttribute("data-table-size");
          w =
            size === "9"
              ? 31
              : size === "6"
                ? Math.min(
                    40,
                    card.closest(".pokerStage")!.getBoundingClientRect().width * 0.17 -
                      31,
                  )
                : 35;
          h = (w * 54) / 40;
          rankSize = (w * 25) / 40;
          suitSize = (w * 14) / 40;
        }
        if (variant === "board" && innerWidth <= 700) {
          const stage = card.closest(".pokerStage")!.getBoundingClientRect();
          w = Math.min(46, stage.width * 0.148 - 20.8);
          h = (w * 64) / 46;
          rankSize = (w * 29) / 46;
          suitSize = (w * 17) / 46;
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
            style.backgroundColor !== "rgb(250, 250, 247)" ||
            style.borderTopColor !== "rgb(206, 210, 201)"
          )
            problems.push("face tokens");
          const red = card.getAttribute("data-red") === "true";
          if (style.color !== (red ? "rgb(130, 29, 56)" : "rgb(24, 31, 27)"))
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
async function geometry(page: Page) {
  return page
    .locator(
      ".table-felt,.table-pot > *,.table-brand,.table-street,.player-seat,.player-nameplate,.player-name,.player-stack,.player-action-slot,.player-committed,.seat-dealer,.replayControls,.tabList",
    )
    .evaluateAll((els) =>
      els.map((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const r = el.matches(".table-brand,.table-street")
          ? range.getBoundingClientRect()
          : el.getBoundingClientRect();
        return {
          key: el.className,
          x: r.x,
          y: r.y,
          w: r.width,
          h: r.height,
          text: (() => {
            const copy = el.cloneNode(true) as Element;
            copy
              .querySelectorAll("style,.cardBackArtwork")
              .forEach((style) => style.remove());
            return copy.textContent;
          })(),
        };
      }),
    );
}
for (const width of [1440, 1024, 768, 430, 390])
  test(`approved imported cards at ${width}`, async ({ page }) => {
    await importFixture(page, width);
    await expect(
      page.locator('.importedHeroCards [data-card-variant="compact"]').first(),
    ).toBeVisible();
    const tens = page
      .locator(".importedHeroCards .playingCard")
      .filter({ has: page.locator("strong", { hasText: /^10$/ }) });
    expect(await tens.count()).toBeGreaterThan(0);
    await checkCards(page);
    await shot(page, `navigator-${width}`);
    await page.locator('[data-hand-id="TM6468725291"]').click();
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
    await page.locator('[data-hand-id="TM6469820465"]').click();
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
    // R2's persistent library narrows the 1440px workspace. Compare that
    // layout to its own baseline; keep the older baselines at other widths.
    const current = await geometry(page);
    const prior = JSON.parse(
      await readFile(
        `${output}/${width === 1440 ? "r2-geometry" : "before-geometry"}-${width}.json`,
        "utf8",
      ),
    ) as Awaited<ReturnType<typeof geometry>>;
    const currentFelt = current.find((item) => item.key === "table-felt")!;
    const priorFelt = prior.find((item) => item.key === "table-felt")!;
    const relativeCenter = (
      item: (typeof current)[number],
      felt: (typeof current)[number],
    ) => ({
      x: (item.x + item.w / 2 - felt.x - felt.w / 2) / felt.w,
      y: (item.y + item.h / 2 - felt.y - felt.h / 2) / felt.h,
    });
    expect(current).toHaveLength(prior.length);
    current.forEach((actual, i) => {
      const expected = prior[i]!;
      expect(actual.key).toBe(expected.key);
      expect(actual.text).toBe(expected.text);
      if (
        String(actual.key).includes("player-seat") ||
        actual.key === "table-brand" ||
        actual.key === "table-street" ||
        actual.key === "seat-dealer" ||
        (actual.key === "" && [3, 4].includes(i))
      ) {
        const position = relativeCenter(actual, currentFelt);
        const baseline = relativeCenter(expected, priorFelt);
        expect(Math.abs(position.x - baseline.x), `${i}: ${actual.key} x`).toBeLessThan(
          0.06,
        );
        expect(Math.abs(position.y - baseline.y), `${i}: ${actual.key} y`).toBeLessThan(
          0.08,
        );
      }
      if (String(actual.key).includes("player-nameplate")) {
        expect(Math.abs(actual.w - expected.w)).toBeLessThan(0.02);
        expect(Math.abs(actual.h - expected.h)).toBeLessThan(0.02);
      }
    });
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
    .locator(".importedHandRail")
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
  expect(
    await tableBack
      .locator(".back-inner")
      .evaluate((el) => getComputedStyle(el).getPropertyValue("x")),
  ).toBe("3.5px");
  const motif = await tableBack
    .locator(".back-motif")
    .evaluate((el) => el.getBoundingClientRect().toJSON());
  expect(motif!.width).toBeCloseTo(12);
  expect(motif!.height).toBeCloseTo(18);
});
