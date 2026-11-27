import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { hands, reviewQueue, tournament } from "../../src/data/mockTournament";
import { buildMultiSeatPreviewHand } from "../../src/data/previewHands";
import { findActionCursor } from "../../src/domain/replay";

const output = "docs/qa/nocturne-r1/tournament-subpages";
const legacy = "docs/qa/tournament-subpages";
const widths = [1440, 1024, 768, 430, 390];
const tabs = ["overview", "replayer", "review"] as const;
const url = (tab: string) =>
  `/?route=tournaments&tab=${tab}&previewCards=study&previewSeats=8`;
type TabStyles = Record<string, Record<string, string>>;

async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.getByRole("tablist", { name: "Tournament sections" }),
  ).toBeVisible();
  if (await page.locator(".chartShell").count()) {
    await expect(page.locator(".recharts-area-curve").first()).toBeVisible();
    await page.waitForTimeout(1600);
  }
}

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
});

for (const width of widths) {
  for (const tab of tabs) {
    test(`${tab} retains its content in the R1 shell at ${width}px`, async ({
      page,
    }) => {
      await mkdir(output, { recursive: true });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(url(tab));
      await ready(page);
      const references = JSON.parse(
        await readFile(`${legacy}/tab-styles.json`, "utf8"),
      ) as Record<number, TabStyles>;
      const problems = await page.evaluate(
        ({ reference, tab }) => {
          const errors: string[] = [];
          const replayerTabStyles: Record<string, Record<string, string>> = {
            '.tabTrigger[data-state="active"]': {
              color: "rgb(236, 237, 239)",
              border: "0px none rgb(236, 237, 239)",
              fontFamily: "Geist, Manrope, ui-sans-serif, system-ui, sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
            },
            '.tabTrigger:not([data-state="active"])': {
              color: "rgb(169, 174, 184)",
              border: "0px none rgb(169, 174, 184)",
              fontFamily: "Geist, Manrope, ui-sans-serif, system-ui, sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
            },
          };
          for (const [selector, expected] of Object.entries(reference)) {
            const style = getComputedStyle(document.querySelector(selector)!);
            for (const [property, value] of Object.entries(expected)) {
              // The R1 rail changes workspace width, so tab widths can grow.
              if (property === "width") continue;
              const approvedR6 =
                tab === "replayer" && selector === ".tabList"
                  ? ((
                      { padding: "0px 4px", margin: "0px 0px 8px" } as Record<
                        string,
                        string
                      >
                    )[property] ?? value)
                  : value;
              const approved =
                tab === "replayer"
                  ? (replayerTabStyles[selector]?.[property] ?? approvedR6)
                  : approvedR6;
              if (style[property as keyof CSSStyleDeclaration] !== approved)
                errors.push(
                  `${selector}.${property}: ${style[property as keyof CSSStyleDeclaration]} instead of ${approved}`,
                );
            }
          }
          if (document.documentElement.scrollWidth > innerWidth + 1)
            errors.push("page overflow");
          const shell = getComputedStyle(document.querySelector(".appShell")!);
          if (
            shell.backgroundColor !== "rgb(14, 15, 18)" ||
            shell.backgroundImage !== "none"
          )
            errors.push("old page background");
          if (
            !getComputedStyle(
              document.querySelector(".mainSurface")!,
            ).fontFamily.includes("Seat Inter")
          )
            errors.push("old typography");
          for (const element of document.querySelectorAll<HTMLElement>(
            ".topBar h1,.tabList,.tabTrigger,.overviewBand,.developmentBand,.stateBlock,.reviewQueue,.reviewItem,.reviewMain,.reviewMeta,.reviewItem > svg",
          )) {
            const rect = element.getBoundingClientRect();
            if (rect.width && (rect.left < -1 || rect.right > innerWidth + 1))
              errors.push(`${element.className || element.tagName} clipped`);
          }
          for (const element of document.querySelectorAll<HTMLElement>(
            ".reviewMain small,.reviewMeta b,.dimensionRow p,.stateBlock span",
          )) {
            if (element.scrollWidth > element.clientWidth + 1)
              errors.push(`${element.className} text clipped`);
          }
          for (const panel of document.querySelectorAll(
            ".overviewBand,.developmentBand,.stateBlock,.reviewQueue",
          )) {
            const style = getComputedStyle(panel);
            if (
              style.backgroundColor !== "rgb(25, 35, 30)" ||
              style.backgroundImage !== "none" ||
              style.boxShadow !== "none" ||
              style.borderRadius !== "6px"
            )
              errors.push("old panel treatment");
          }
          for (const tick of document.querySelectorAll(
            ".recharts-cartesian-axis-tick-value",
          )) {
            const rect = tick.getBoundingClientRect(),
              svg = tick.closest("svg")!.getBoundingClientRect();
            if (rect.left < svg.left - 1 || rect.right > svg.right + 1)
              errors.push("chart label clipped");
          }
          return errors;
        },
        { reference: references[width]!, tab },
      );
      expect(problems).toEqual([]);

      if (tab === "replayer") {
        await expect(page.locator(".pokerStage")).toBeVisible();
        await expect(page.locator(".analysisPanel")).toBeVisible();
      }
      await page.screenshot({
        path: `${output}/${tab}-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });

      if (tab === "overview") {
        for (const value of ["24%", "18%", "6.4%", `${tournament.handsPlayed}`])
          await expect(page.locator(".metricsRail")).toContainText(value);
        await expect(page.locator(".dimensionRow")).toHaveCount(
          tournament.scoreDimensions.length,
        );
        for (const dimension of tournament.scoreDimensions)
          await expect(
            page.locator(".dimensionRow").filter({ hasText: dimension.label }),
          ).toContainText(`${dimension.score}`);
        await expect(page.locator(".recharts-area-dot")).toHaveCount(5);
        await expect(page.locator(".stateBlock")).toHaveCount(3);
      }

      if (tab === "review") {
        await expect(page.locator(".reviewItem")).toHaveCount(reviewQueue.length);
        for (const item of reviewQueue) {
          const row = page.locator(".reviewItem").filter({ hasText: item.title });
          await expect(row).toHaveAttribute("data-grade", item.grade);
          for (const text of [
            item.title,
            item.description,
            item.category,
            `${item.severity} / ${item.confidence}`,
          ])
            await expect(row).toContainText(text);
        }
        // Every original queue target still opens the same action in the same hand.
        const hand = buildMultiSeatPreviewHand(hands[0]!, 8);
        for (const item of reviewQueue) {
          await page.locator(".reviewItem").filter({ hasText: item.title }).click();
          await expect(
            page.getByRole("tab", { name: "Replayer", exact: true }),
          ).toHaveAttribute("data-state", "active");
          await expect(page.locator(".decisionRibbon")).toContainText(
            `Action ${findActionCursor(hand, item.actionId)} /`,
          );
          await expect(page.locator(".pokerStage")).toHaveAccessibleName(
            `Poker table state for hand ${hand.handNumber}`,
          );
          await page.getByRole("tab", { name: "Review Queue", exact: true }).click();
        }
      }
      expect(errors).toEqual([]);
    });
  }
}

for (const width of [1440, 390]) {
  test(`tournament keyboard tabs and queue states work at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(url("overview"));
    const overview = page.getByRole("tab", { name: "Overview", exact: true });
    await overview.focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("tab", { name: "Replayer", exact: true }),
    ).toHaveAttribute("data-state", "active");
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("tab", { name: "Review Queue", exact: true }),
    ).toHaveAttribute("data-state", "active");
    const row = page.locator(".reviewItem").first();
    await row.hover();
    await expect(row).toHaveCSS("background-color", "rgb(32, 44, 36)");
    await row.focus();
    await expect(row).toHaveCSS("outline-color", "rgb(213, 191, 144)");
    await page.keyboard.press("Enter");
    await expect(page.locator(".is-acting")).toHaveAttribute("data-position", "SB");
    await page.getByRole("button", { name: "Forward", exact: true }).click();
    await expect(page.locator(".is-acting")).toHaveAttribute("data-position", "BB");
  });
}

test("protected queue targets, chart data, assets, and mocks retain their hashes", async () => {
  const files = JSON.parse(
    await readFile(`${legacy}/protected-files.json`, "utf8"),
  ) as Record<string, string>;
  for (const [file, hash] of Object.entries(files)) {
    // Scoped Phase 1B functional extensions; keep every other original hash and
    // all unaffected approved Replayer pixels guarded.
    if (
      [
        // Approved card-system replacement; all other hashes remain protected.
        "src/ui/components/PlayingCard.tsx",
        "src/ui/components/PokerTable.tsx",
        "src/ui/components/PlayerSeat.tsx",
        "src/ui/components/seatLayout.ts",
        "src/ui/components/ReplayControls.tsx",
        "src/domain/replay.ts",
        "src/domain/schemas.ts",
        "src/styles/poker-seats.css",
        // R9 approved the analysis panel's unavailable and illustrative states.
        "src/ui/components/AnalysisPanel.tsx",
      ].includes(file)
    )
      continue;
    expect(
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex"),
      file,
    ).toBe(hash);
  }
});
