import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

const output = "docs/qa/phase-1b-corrections";
async function screenshot(page: Page, name: string) {
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
  await expect(
    page.getByRole("button", { name: "Open tournament", exact: true }),
  ).toBeVisible();
  if (index === 3 && width === 1440) await screenshot(page, "import-success-1440");
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
  await page.getByRole("tab", { name: "Replayer", exact: true }).click();
}

for (const width of [1440, 390]) {
  test(`TM6468725291 consumed SHOW and privacy through the real UI at ${width}`, async ({
    page,
  }) => {
    await importFixture(page, 0, width);
    await page.locator('[data-hand-id="TM6468725291"]').click();
    const opponent = page.locator('[data-player-id="gg:314729652:ad116bad"]');
    const hero = page.locator(".player-seat.is-hero");
    expect(
      await page.locator(".player-name").evaluateAll((names) =>
        names.every((name) => {
          const bounds = name.getBoundingClientRect();
          const plate = name.closest(".player-nameplate")!.getBoundingClientRect();
          return (
            bounds.left >= plate.left &&
            bounds.right <= plate.right &&
            getComputedStyle(name).overflow === "hidden" &&
            Boolean(name.getAttribute("title"))
          );
        }),
      ),
    ).toBe(true);
    await page.getByRole("switch").click();
    await expect(page.getByRole("switch")).not.toBeChecked();
    for (let i = 0; i < 22; i++)
      await page.getByRole("button", { name: "Forward", exact: true }).click();
    await expect(page.locator(".decisionRibbon")).toContainText("Action 22 /");
    await expect(opponent.getByLabel("Face-down card", { exact: true })).toHaveCount(2);
    await expect(page.locator(".table-board")).toHaveCount(0);
    await page.getByRole("button", { name: "Forward", exact: true }).click();
    for (const card of ["Ace of hearts", "Five of diamonds"]) {
      await expect(opponent.getByLabel(card, { exact: true })).toBeVisible();
      await opponent.getByLabel(card, { exact: true }).scrollIntoViewIfNeeded();
      await expect(opponent.getByLabel(card, { exact: true })).toBeInViewport();
    }
    expect(
      await page.locator(".player-seat").evaluateAll((seats) =>
        seats.flatMap((seat) => {
          const action = seat
            .querySelector(".player-action-text")
            ?.getBoundingClientRect();
          const name = seat.querySelector(".player-name")!.getBoundingClientRect();
          const stack = seat.querySelector(".player-stack")!.getBoundingClientRect();
          const plate = seat
            .querySelector(".player-nameplate")!
            .getBoundingClientRect();
          const actionOverlapsPlate =
            action &&
            Math.min(action.right, plate.right) - Math.max(action.left, plate.left) >
              1 &&
            Math.min(action.bottom, plate.bottom) - Math.max(action.top, plate.top) > 1;
          return actionOverlapsPlate || name.bottom > stack.top + 0.5
            ? [
                {
                  id: (seat as HTMLElement).dataset.playerId,
                  actionBottom: action?.bottom,
                  nameTop: name.top,
                  nameBottom: name.bottom,
                  stackTop: stack.top,
                },
              ]
            : [];
        }),
      ),
    ).toEqual([]);
    await expect(page.locator(".table-board")).toHaveCount(0);
    for (const card of ["King of diamonds", "King of clubs"])
      await expect(hero.getByLabel(card, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Forward", exact: true }).click();
    await screenshot(page, `show-off-${width}`);
    await page.getByRole("switch").click();
    await expect(opponent.getByLabel("Face-down card", { exact: true })).toHaveCount(2);
    await expect(opponent.getByLabel("Ace of hearts", { exact: true })).toHaveCount(0);
    await expect(hero.getByLabel("King of diamonds", { exact: true })).toBeVisible();
    await screenshot(page, `show-hidden-${width}`);
    await page.getByRole("button", { name: "Flop", exact: true }).click();
    await expect(page.locator(".table-board .playingCard")).toHaveCount(3);
    await page.getByRole("button", { name: "River", exact: true }).click();
    await expect(page.locator(".table-board .playingCard")).toHaveCount(5);
  });
}

for (const width of [1440, 1024, 768, 430, 390]) {
  test(`Daily Classic full import, shared cards and contextual import at ${width}`, async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (e) => runtimeErrors.push(e.message));
    await importFixture(page, 3, width);
    await page.getByRole("tab", { name: "Overview", exact: true }).click();
    await expect(page.getByText("Info (3)", { exact: true })).toBeVisible();
    await expect(page.getByText("Warnings (4)", { exact: true })).toBeVisible();
    await page.getByText("Info (3)", { exact: true }).click();
    await page.getByText("Warnings (4)", { exact: true }).click();
    await expect(
      page.getByText("Timezone not provided by GG", { exact: true }),
    ).toBeVisible();
    const overview = page.getByRole("region", { name: "Tournament overview" });
    await expect(overview).toContainText("Buy-in $10.00");
    await expect(overview).not.toContainText(/currency unknown|timezone unknown/i);
    if (width === 1440 || width === 390) {
      await mkdir("docs/qa/phase-1b-1", { recursive: true });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `docs/qa/phase-1b-1/overview-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
    await page.getByRole("tab", { name: "Replayer", exact: true }).click();
    const strip = page.getByRole("region", { name: "Replayer hand strip" });
    await expect(strip).toContainText("Daily Classic $10");
    await expect(strip).toContainText("233 hands");
    await expect(
      page
        .locator(".workspaceChrome")
        .getByRole("button", { name: "Upload tournament" }),
    ).toHaveCount(0);
    const browse = strip.getByRole("button", { name: "Browse all 233 hands" });
    await browse.click();
    const browser = page.getByRole("dialog", { name: "Browse all hands" });
    const row = browser.locator('[data-hand-id="TM6378370688"]');
    await expect(row.getByLabel("Ten of hearts", { exact: true })).toBeVisible();
    await expect(row.getByLabel("Seven of spades", { exact: true })).toBeVisible();
    await expect(row).toContainText("8/9 players");
    const markup = await row.innerHTML();
    expect(
      await browser.locator(".importedHandRows").evaluate((list) => {
        const clipped: string[] = [];
        for (const row of list.querySelectorAll<HTMLElement>(".importedHandRow")) {
          const bounds = row.getBoundingClientRect();
          for (const item of row.querySelectorAll(
            ".importedHandId, .importedHandIdentity",
          )) {
            const rect = item.getBoundingClientRect();
            if (rect.bottom > bounds.bottom + 1 || rect.right > bounds.right + 1)
              clipped.push(row.dataset.handId!);
          }
        }
        return clipped;
      }),
    ).toEqual([]);
    await row.click();
    await expect(page.locator(".handStudyHeader")).toContainText("TM6378370688");
    await expect(
      page.locator(".player-seat:not(.is-hero) .player-name").first(),
    ).toHaveText(/^[A-Z][a-z]+(?: \d+)?$/);
    expect(
      await page
        .locator(".player-seat:not(.is-hero) .player-name")
        .evaluateAll((names) =>
          names.every(
            (el) =>
              el.getAttribute("title")?.includes("anonymized opponent, source ID ") &&
              el.scrollWidth <= el.clientWidth,
          ),
        ),
    ).toBe(true);
    await expect(page.locator(".player-seat.is-hero .player-name")).toHaveText("Hero");
    if (width === 1440 || width === 390) {
      await browse.click();
      await screenshot(page, `hand-rail-${width}`);
      await page.keyboard.press("Escape");
    }
    await page.getByRole("tab", { name: "Review Queue", exact: true }).click();
    await expect(page.locator(".importedHandRow")).toHaveCount(233);
    const queueRow = page.locator('[data-hand-id="TM6378370688"]');
    await queueRow.scrollIntoViewIfNeeded();
    expect(await queueRow.innerHTML()).toBe(markup);
    const rows = page.locator(".importedHandRows");
    expect(await rows.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    expect(await rows.evaluate((el) => el.clientHeight)).toBeLessThanOrEqual(1000);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBe(true);
    await expect(page.locator(".importedTournament")).not.toContainText(
      /Excellent|Mistake|Inaccurate|missed opportunity|recommended action/i,
    );
    if (width === 1440 || width === 390)
      await screenshot(page, `review-queue-${width}`);
    for (const tab of ["Overview", "Replayer", "Review Queue"]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      const action =
        tab === "Replayer"
          ? page.locator(".sidebarUpload")
          : page
              .locator(".importedTournamentContext")
              .getByRole("button", { name: "Import tournament", exact: true });
      if (tab === "Replayer" && !(await action.isVisible())) {
        await page.locator(".mobileNavSelect select").selectOption("upload");
      } else {
        await expect(action).toBeVisible();
        await action.click();
      }
      await expect(page.getByRole("button", { name: "Choose files" })).toBeVisible();
      await page.getByRole("button", { name: "Close dialog" }).click();
      if (await action.isVisible()) await expect(action).toBeFocused();
    }
    if (width === 390) {
      await page.getByRole("tab", { name: "Replayer", exact: true }).click();
      await page.getByRole("switch").click();
      await page.getByRole("button", { name: "River", exact: true }).click();
      while (
        await page.getByRole("button", { name: "Forward", exact: true }).isEnabled()
      )
        await page.getByRole("button", { name: "Forward", exact: true }).click();
      const partial = page.locator('[data-player-id="gg:309704619:f5cbea50"]');
      await expect(partial.locator(".playingCard:not(.cardBack)")).toHaveCount(0);
      await expect(
        page.locator(".importedResults li").filter({ hasText: "(f5cbea50)" }),
      ).toContainText("Ah");
      await screenshot(page, "partial-summary-390");
    }
    expect(runtimeErrors).toEqual([]);
  });
}
