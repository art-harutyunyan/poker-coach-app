import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import process from "node:process";

/* global document */

const output = "docs/qa/approved-seat-system";
const reference = process.env.PROTOTYPE_URL ?? "http://127.0.0.1:5181";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      deviceScaleFactor: 1,
    });
    await page.goto(`${reference}/#Tournament`);
    await page
      .getByRole("tab", { name: "Replayer", exact: true })
      .or(page.getByRole("button", { name: "Replayer", exact: true }))
      .click();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/source-${width}.png`, fullPage: true });
    await page
      .locator(".poker-stage")
      .screenshot({ path: `${output}/source-table-${width}.png` });
    await page.goto(
      "http://127.0.0.1:5180/?route=tournaments&tab=replayer&previewSeats=8",
      { waitUntil: "networkidle" },
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/${width}-8max.png`, fullPage: true });
    await page
      .locator(".pokerStage")
      .screenshot({ path: `${output}/table-${width}.png` });
    await page.close();
    for (const focused of [true, false]) {
      const source = await readFile(
        `${output}/${focused ? "source-table" : "source"}-${width}.png`,
      );
      const implementation = await readFile(
        `${output}/${focused ? `table-${width}` : `${width}-8max`}.png`,
      );
      const pair = await browser.newPage({
        viewport: {
          width: focused && width > 700 ? 1800 : width * 2 + 48,
          height: 1100,
        },
      });
      await pair.setContent(`<html><body style="margin:0;background:#101815;color:#efece2;font:16px Arial;display:flex;align-items:flex-start;gap:16px;padding:16px">
        <section style="flex:1;min-width:0"><p>Approved source: ${width}px</p><img style="max-width:100%" src="data:image/png;base64,${source.toString("base64")}"/></section>
        <section style="flex:1;min-width:0"><p>Implementation: ${width}px</p><img style="max-width:100%" src="data:image/png;base64,${implementation.toString("base64")}"/></section>
        </body></html>`);
      await pair.screenshot({
        path: `${output}/comparison-${focused ? "table" : "screen"}-${width}.png`,
        fullPage: true,
      });
      await pair.close();
    }
  }
} finally {
  await browser.close();
}
