import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const output = "docs/qa/replayer-shell";
test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

for (const width of [1600, 1440, 1280, 1024, 768, 430, 390, 375]) {
  test(`study shell ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Local accepted deck keeps the shell QA independent of remote asset availability.
    await page.goto(
      "/?route=tournaments&tab=replayer&previewSeats=8&previewCards=letele",
    );
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".cardAssetLoading")).toHaveCount(0);
    await expect(page.locator(".is-hero .deckAssetCard svg")).toHaveCount(2);
    await expect(
      page.getByRole("tab", { name: "Replayer", exact: true }),
    ).toBeVisible();
    const geometry = await page.evaluate(() => {
      const table = document.querySelector(".pokerStage")!.getBoundingClientRect();
      const analysis = document
        .querySelector(".analysisPanel")!
        .getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        table: table.toJSON(),
        analysis: analysis.toJSON(),
        font: getComputedStyle(document.querySelector(".handStudyHeader")!).fontFamily,
        loaded: document.fonts.check('13px "Seat Inter"'),
      };
    });
    expect(geometry.overflow).toBe(false);
    expect(geometry.font).toContain("Seat Inter");
    expect(geometry.loaded).toBe(true);
    if (width > 1250)
      expect(geometry.analysis.left).toBeGreaterThan(geometry.table.right);
    else expect(geometry.analysis.top).toBeGreaterThan(geometry.table.bottom);
    for (const label of ["Back", "Forward", "Flop", "Turn", "Mark reviewed"]) {
      const box = await page
        .getByRole("button", { name: label, exact: true })
        .boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: `${output}/shell-${width}.png`, fullPage: true });

    await page.getByRole("button", { name: "Flop", exact: true }).click();
    await expect(page.locator(".table-board .playingCard")).toHaveCount(3);
    await expect(
      page.getByRole("button", { name: "Flop", exact: true }),
    ).toHaveAttribute("aria-current", "step");
    await page.getByRole("button", { name: "Forward", exact: true }).click();
    await expect(page.locator(".is-acting")).toHaveAttribute("data-position", "BTN");
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.locator(".is-acting")).toHaveAttribute("data-position", "SB");
    await page.getByRole("button", { name: "Turn", exact: true }).click();
    await expect(page.locator(".table-board .playingCard")).toHaveCount(4);
    await page.getByRole("tab", { name: "Context", exact: true }).click();
    await expect(page.getByText(/does not re-analyze later actions/)).toBeVisible();
    await expect(page.getByText("decision-a5s-sb-vs-btn-open")).toBeVisible();
    await page.getByRole("tab", { name: "Decision", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Ask Coach about this decision" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Mark reviewed", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Reviewed", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.locator(".actionHistory summary").click();
    await expect(page.locator(".actionTimeline")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBe(true);
    await page.locator(".visualPreviewDisclosure summary").click();
    await expect(page.getByLabel("Table size preview")).toBeVisible();
    await page.getByLabel("Table size preview").selectOption("9");
    await expect(page.locator(".player-seat")).toHaveCount(9);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: `${output}/shell-${width}-expanded.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}

test("shell navigation, local upload, and informational profile dialog remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?route=tournaments&tab=replayer&previewCards=letele");
  const upload = page
    .getByRole("button", { name: "Upload tournament", exact: true })
    .first();
  await upload.click();
  await expect(page.getByRole("dialog")).toContainText(
    "Processing stays on this device, in memory.",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(upload).toBeFocused();
  await page.getByRole("button", { name: "Settings & profile", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Demo profile");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Queue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tournament Review Queue" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /A5s SB vs BTN open/ }).click();
  await expect(page.locator(".pokerStage")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Primary mobile screen").selectOption("development");
  await expect(
    page.getByRole("heading", { name: "Development", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Primary mobile screen").selectOption("profile");
  await expect(page.getByRole("dialog")).toContainText("Demo profile");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByLabel("Primary mobile screen").selectOption("upload");
  await expect(page.getByRole("dialog")).toContainText(
    "Processing stays on this device, in memory.",
  );
  await page.keyboard.press("Escape");
  await page.getByLabel("Primary mobile screen").selectOption("profile");
  await expect(page.getByRole("dialog")).toContainText("Demo profile");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByLabel("Primary mobile screen").selectOption("upload");
  await expect(page.getByRole("dialog")).toContainText(
    "Processing stays on this device, in memory.",
  );
  await page.keyboard.press("Escape");
});
