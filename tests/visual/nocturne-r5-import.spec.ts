import { expect, test, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fixtureHand, fixtureNames } from "../../src/parsers/gg/fixtureTestUtils";

const output = "docs/qa/nocturne-r5";
const fixture = resolve("tests/fixtures/gg", fixtureNames[0]!);

async function openImport(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/?route=tournaments");
  if (width >= 1180)
    await page.getByRole("button", { name: "Import", exact: true }).click();
  else await page.locator(".mobileNavSelect select").selectOption("upload");
  await expect(
    page.getByRole("dialog", { name: "Import hand histories" }),
  ).toBeVisible();
}

async function capture(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.screenshot({
    path: `${output}/${name}.png`,
    animations: "disabled",
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  ).toBe(true);
  const dialog = page.getByRole("dialog", { name: "Import hand histories" });
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
}

for (const width of [1440, 1280, 390]) {
  test(`Nocturne import empty and source-backed results at ${width}px`, async ({
    page,
  }) => {
    await openImport(page, width);
    await expect(page.getByRole("button", { name: "Choose files" })).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Drop GG hand histories" }),
    ).toBeVisible();
    await capture(page, `empty-${width}`);

    const picker = page.getByLabel("Hand history file");
    await picker.setInputFiles(fixture);
    const success = page.locator('.importResult[data-status="success"]');
    await expect(success).toHaveCount(1);
    await expect(success).toContainText("222 hands accepted");
    await expect(
      success.getByRole("button", { name: "Open tournament", exact: true }),
    ).toBeVisible();
    await capture(page, `success-${width}`);

    await picker.setInputFiles({
      name: "copy.txt",
      mimeType: "text/plain",
      buffer: await readFile(fixture),
    });
    const duplicate = page.locator('.importResult[data-status="duplicate"]');
    await expect(duplicate).toHaveCount(1);
    await expect(duplicate).toContainText("Nothing added.");
    await expect(
      duplicate.getByRole("button", { name: "Show existing" }),
    ).toBeVisible();
    if (width === 1440) await capture(page, "duplicate-1440");

    await picker.setInputFiles({
      name: "changed.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(fixtureHand(0, "TM6469820465")),
    });
    const conflict = page.locator('.importResult[data-status="conflict"]');
    await expect(conflict).toHaveCount(1);
    await expect(conflict).toContainText("nothing was merged or replaced");
    await expect(conflict.getByRole("button", { name: "Show existing" })).toBeVisible();
    await expect(
      conflict.getByRole("button", { name: /replace|merge|keep both/i }),
    ).toHaveCount(0);
    if (width === 1440) await capture(page, "conflict-1440");

    await picker.setInputFiles({
      name: "invalid.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not GG"),
    });
    const error = page.locator('.importResult[data-status="error"]');
    await expect(error).toHaveCount(1);
    await expect(error).toContainText("0 hands accepted");
    await expect(
      error.getByRole("button", { name: "Choose another file" }),
    ).toBeVisible();
    await expect(page.locator(".tournamentLibraryRow")).toHaveCount(1);
    await capture(page, `mixed-results-${width}`);
    await page
      .getByRole("dialog", { name: "Import hand histories" })
      .evaluate((dialog) => {
        dialog.scrollTop = dialog.scrollHeight;
      });
    await capture(page, `mixed-results-bottom-${width}`);
  });
}

test("processing is indeterminate and the batch keeps one row per file", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const read = FileReader.prototype.readAsText;
    FileReader.prototype.readAsText = function (
      this: FileReader,
      blob: Blob,
      encoding?: string,
    ) {
      window.setTimeout(() => read.call(this, blob, encoding), 1000);
    };
  });
  await openImport(page, 1440);
  const picker = page.getByLabel("Hand history file");
  await picker.setInputFiles([
    {
      name: "history.txt",
      mimeType: "text/plain",
      buffer: await readFile(fixture),
    },
    {
      name: "invalid.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not GG"),
    },
  ]);
  const processing = page.locator('.importResult[data-status="processing"]');
  await expect(processing).toContainText("Reading file…");
  await expect(processing).not.toContainText(/%|of \d+ hands/i);
  await expect(processing.getByRole("button", { name: "Cancel" })).toHaveCount(0);
  await capture(page, "processing-1440");
  await expect(page.locator(".importResult")).toHaveCount(2);
  await expect(page.locator('.importResult[data-status="success"]')).toHaveCount(1);
  await expect(page.locator('.importResult[data-status="error"]')).toHaveCount(1);
  await capture(page, "batch-1440");
});

test("opening an earlier result invalidates a pending file", async ({ page }) => {
  await page.addInitScript(() => {
    const read = FileReader.prototype.readAsText;
    let calls = 0;
    FileReader.prototype.readAsText = function (
      this: FileReader,
      blob: Blob,
      encoding?: string,
    ) {
      calls++;
      if (calls === 2) window.setTimeout(() => read.call(this, blob, encoding), 1500);
      else read.call(this, blob, encoding);
    };
  });
  await openImport(page, 1440);
  await page.getByLabel("Hand history file").setInputFiles([
    {
      name: "first.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(fixtureHand(0, "TM6469820465")),
    },
    {
      name: "second.txt",
      mimeType: "text/plain",
      buffer: await readFile(resolve("tests/fixtures/gg", fixtureNames[1]!)),
    },
  ]);
  await expect(page.locator('.importResult[data-status="success"]')).toHaveCount(1);
  await expect(page.locator('.importResult[data-status="processing"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Open tournament", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Import hand histories" })).toHaveCount(
    0,
  );
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Tournament Library" }).click();
  await expect(page.locator(".tournamentLibraryRow")).toHaveCount(1);
});
