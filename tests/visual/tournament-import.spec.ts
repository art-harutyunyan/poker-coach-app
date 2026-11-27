import { expect, test, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fixtureNames, readFixture } from "../../src/parsers/gg/fixtureTestUtils";
import { parseGgTournament } from "../../src/parsers/gg";

const output = "docs/qa/phase-1b";
const widths = [1440, 1024, 768, 430, 390];
const counts = [222, 191, 28];
const runtimeErrors = new WeakMap<Page, string[]>();

test("all three real fixtures retain their pre-implementation bytes", async () => {
  const hashes = JSON.parse(
    await readFile(`${output}/fixture-hashes.json`, "utf8"),
  ) as Record<string, string>;
  expect(Object.keys(hashes)).toHaveLength(3);
  for (const [file, expected] of Object.entries(hashes))
    expect(
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex"),
      file,
    ).toBe(expected);
});

async function openUpload(page: Page) {
  if (await page.locator(".sidebarUpload").isVisible())
    await page.locator(".sidebarUpload").click();
  else await page.locator(".mobileNavSelect select").selectOption("upload");
  await expect(page.getByRole("dialog")).toBeVisible();
}
async function upload(page: Page, index: number, width: number) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(
    "/?route=tournaments&tab=overview&previewSeats=9&qaScenario=all-in&qaCursor=100",
  );
  await page.evaluate(() => document.fonts.ready);
  const before = await storage(page);
  const requests: string[] = [];
  page.on("request", (r) => {
    if (["fetch", "xhr"].includes(r.resourceType())) requests.push(r.url());
  });
  page.on("websocket", (socket) => requests.push(socket.url()));
  await openUpload(page);
  const start = Date.now();
  await page
    .getByLabel("Hand history file")
    .setInputFiles(resolve("tests/fixtures/gg", fixtureNames[index]!));
  await expect(
    page.getByRole("button", { name: "Open tournament", exact: true }),
  ).toBeVisible();
  const elapsedMs = Date.now() - start;
  await expect(page.getByRole("status")).toContainText(`${counts[index]} hands`);
  await expect(page.getByRole("status")).toContainText("NLHE");
  await expect(
    page.getByRole("button", { name: "Open tournament", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Hand history file")).toHaveValue("");
  expect(await storage(page)).toEqual(before);
  console.log(
    JSON.stringify({
      fixture: fixtureNames[index],
      width,
      selectionToSummaryMs: elapsedMs,
    }),
  );
  if (width === 1440 || index !== 0)
    await writeFile(
      `${output}/timing-${index}-${width}.json`,
      JSON.stringify(
        { fixture: fixtureNames[index], width, selectionToSummaryMs: elapsedMs },
        null,
        2,
      ) + "\n",
    );
  return requests;
}
async function storage(page: Page) {
  return page.evaluate(async () => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    databases: (await indexedDB.databases()).map((d) => d.name),
  }));
}
async function screenshot(page: Page, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${output}/${name}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
async function layout(page: Page) {
  expect(
    await page.evaluate(() => {
      const errors: string[] = [];
      if (document.documentElement.scrollWidth > innerWidth + 1)
        errors.push("page overflow");
      for (const el of document.querySelectorAll<HTMLElement>(
        ".importMetadataGrid,.importedEmpty,.tabList,.handStudyHeader,.pokerStage,.player-nameplate,.replayControls,.importWarnings,.prototypeDialog[open]",
      )) {
        const r = el.getBoundingClientRect();
        if (r.width && (r.left < -1 || r.right > innerWidth + 1))
          errors.push(`${el.className} clipped`);
      }
      const coordinates = [
        ...document.querySelectorAll<HTMLElement>(".player-seat"),
      ].map((seat) =>
        ["--seat-x", "--seat-y", "--seat-mx", "--seat-my"]
          .map((key) => seat.style.getPropertyValue(key))
          .join(":"),
      );
      if (new Set(coordinates).size !== coordinates.length)
        errors.push("duplicate seat coordinates");
      const hero = document.querySelector<HTMLElement>(".player-seat.is-hero");
      if (innerWidth <= 700) {
        const row = document.querySelector(".importedHandRail .importedHandRow");
        const title = row
          ?.querySelector(".importedHandIdentity")
          ?.getBoundingClientRect();
        const metadata = row?.querySelector(":scope > small")?.getBoundingClientRect();
        if (title && metadata && metadata.top < title.bottom - 1)
          errors.push("hand metadata squeezed beside cards");
      }
      if (
        hero &&
        (hero.style.getPropertyValue("--seat-x") !== "50%" ||
          hero.style.getPropertyValue("--seat-y") !== "88%")
      )
        errors.push("Hero anchor changed");
      const plates = [...document.querySelectorAll(".player-nameplate")].map((p) =>
        p.getBoundingClientRect(),
      );
      for (let i = 0; i < plates.length; i++)
        for (const b of plates.slice(i + 1)) {
          const a = plates[i]!;
          if (
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
          )
            errors.push("overlapping seats");
        }
      return errors;
    }),
  ).toEqual([]);
}
async function complete(page: Page) {
  if (await page.getByRole("switch").isChecked())
    await page.getByRole("switch").click();
  const forward = page.getByRole("button", { name: "Forward", exact: true });
  for (let i = 0; i < 100 && (await forward.isEnabled()); i++) await forward.click();
  await expect(forward).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Completed hand results" }),
  ).toBeVisible();
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.location().url.startsWith("https://fonts.googleapis.com/")
    )
      errors.push(message.text());
  });
  await mkdir(output, { recursive: true });
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
});
test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? []).toEqual([]);
});
for (const width of widths) {
  test(`representative real import at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const requests = await upload(page, 0, width);
    if (width === 1440) await screenshot(page, "upload-success-1440");
    await page.getByRole("button", { name: "Open tournament", exact: true }).click();
    await layout(page);
    await expect(
      page.getByText("Analysis not available for this tournament"),
    ).toBeVisible();
    await expect(page.locator(".mainSurface")).not.toContainText(
      "Mock heuristic review",
    );
    await expect(page.locator(".tournamentStats")).toContainText("VPIP");
    await expect(page.locator('[data-metric="wsd"]')).toContainText(
      "Outcome stat hidden",
    );
    if (width === 1440 || width === 390) await screenshot(page, `overview-${width}`);
    await page.getByRole("tab", { name: "Review Queue", exact: true }).click();
    await expect(page.locator("[data-hand-id]")).toHaveCount(222);
    const queueRows = page.locator(".importedHandList .importedHandRows");
    const queueSize = await queueRows.evaluate((el) => ({
      height: el.clientHeight,
      content: el.scrollHeight,
    }));
    expect(queueSize.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(queueSize.content).toBeGreaterThan(queueSize.height);
    await layout(page);
    if (width === 1440 || width === 390) await screenshot(page, `review-${width}`);
    if (width === 390) {
      await queueRows.locator("button").first().focus();
      for (let index = 1; index < 222; index++) await page.keyboard.press("Tab");
      await expect(queueRows.locator("button").last()).toBeFocused();
      await expect(queueRows.locator("button").last()).toBeInViewport();
      expect(await queueRows.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    }
    await page.locator('[data-hand-id="TM6469820465"]').click();
    await expect(page.locator(".decisionRibbon")).toContainText("Action 0 /");
    await expect(page.getByRole("switch")).toBeChecked();
    await expect(page.getByLabel("Table size preview")).toHaveCount(0);
    await layout(page);
    await page.locator(".pokerStage").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".decisionRibbon")).toContainText("Action 1 /");
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".decisionRibbon")).toContainText("Action 0 /");
    if (width === 1440 || width === 390) {
      await screenshot(page, `replayer-${width}`);
      for (const [name, count] of [
        ["Flop", 3],
        ["Turn", 4],
        ["River", 5],
      ] as const) {
        await page.getByRole("button", { name, exact: true }).click();
        await expect(page.locator(".table-board .playingCard")).toHaveCount(count);
      }
      await complete(page);
      await expect(page.locator(".importedResults")).toContainText("672,100");
      await page.getByRole("switch").click();
      await expect(page.locator(".importedResults")).toHaveCount(0);
      await page.locator('[data-hand-id="TM6469820465"]').click();
      await expect(page.locator(".decisionRibbon")).toContainText("Action 0 /");
      if (width === 1440) {
        await page.locator('[data-hand-id="TM6469819712"]').click();
        await complete(page);
        await expect(page.locator(".player-seat.is-folded")).not.toHaveCount(0);
        await expect(page.locator(".player-seat.is-folded .player-cards")).toHaveCount(
          0,
        );
        await page.getByRole("switch").click();
        await expect(
          page.locator(".player-seat:not(.is-hero) .playingCard:not(.cardBack)"),
        ).toHaveCount(0);
      }
      await page.getByText(/Info \(/).click();
      if (width === 390) await screenshot(page, "warnings-390");
    }
    expect(errors).toEqual([]);
    expect(requests).toEqual([]);
  });
}
test("Fifty refund, warnings, short-handed layout, preserved review and recovery", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const requests = await upload(page, 1, 1440);
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
  await page.getByRole("tab", { name: "Review Queue", exact: true }).click();
  await page.locator('[data-hand-id="TM6471062694"]').click();
  const forward = page.getByRole("button", { name: "Forward", exact: true });
  for (let i = 0; i < 100 && (await forward.isEnabled()); i++) await forward.click();
  await expect(page.locator('.timelineAction[title*="returned"]')).toHaveCount(1);
  await expect(page.locator('.timelineAction[title*="wins"]')).toHaveCount(0);
  await screenshot(page, "refund-1440");
  await complete(page);
  await expect(page.locator(".importedResults")).toContainText(
    "420450 chips collected",
  );
  await page.locator('[data-hand-id="TM6470156513"]').click();
  await complete(page);
  await expect(
    page.locator(".player-seat:not(.is-hero) .playingCard:not(.cardBack)"),
  ).toHaveCount(0);
  await expect(page.locator(".importedResults")).toContainText("Qh Ac");
  const parsed = parseGgTournament(readFixture(1));
  if (!parsed.ok) throw new Error("Fixture failed");
  const short = parsed.tournament.hands.find((h) => h.occupiedSeatCount === 4)!;
  expect(short).toBeDefined();
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.locator(`[data-hand-id="${short.id}"]`).click();
  await expect(page.locator(".player-seat")).toHaveCount(4);
  await layout(page);
  await openUpload(page);
  await page.getByLabel("Hand history file").setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not GG"),
  });
  await expect(page.getByRole("alert")).toContainText(
    "Expected a GG Poker tournament hand header",
  );
  await expect(
    page.getByRole("button", { name: "Open tournament", exact: true }),
  ).toHaveCount(0);
  await screenshot(page, "upload-error-390");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.getByRole("region", { name: "Replayer hand strip" })).toBeVisible();
  await openUpload(page);
  await page
    .getByLabel("Hand history file")
    .setInputFiles(resolve("tests/fixtures/gg", fixtureNames[1]));
  await expect(page.getByRole("button", { name: "Show existing" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});
test("GGMasters real import, all-in return and separate awards on mobile", async ({
  page,
}) => {
  const requests = await upload(page, 2, 390);
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
  await page.getByRole("tab", { name: "Review Queue", exact: true }).click();
  await page.locator('[data-hand-id="TM6524471450"]').click();
  await layout(page);
  await complete(page);
  await expect(page.locator('.timelineAction[title*="returned"]')).toHaveCount(1);
  await page.locator('[data-hand-id="TM6524470976"]').click();
  await complete(page);
  await expect(page.locator(".importedResults")).toContainText("628 chips collected");
  await expect(page.locator(".importedResults")).toContainText("629 chips collected");
  expect(requests).toEqual([]);
});
