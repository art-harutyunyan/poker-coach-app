import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";

/* global document */

// Compare the captured live reference with the current shell, not a new table design.
const output = "docs/qa/replayer-shell";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const width of [1440, 390]) {
    const app = await browser.newPage({ viewport: { width, height: 1000 } });
    await app.goto(
      "http://127.0.0.1:5180/?route=tournaments&tab=replayer&previewSeats=8&previewCards=letele",
    );
    await app.evaluate(() => document.fonts.ready);
    await app.locator(".is-hero .deckAssetCard svg").first().waitFor();
    const panelBounds = await app.locator(".analysisPanel").boundingBox();
    await app.screenshot({
      path: `${output}/comparison-app-${width}.png`,
      fullPage: true,
    });
    await app.close();
    const source = await readFile(`docs/qa/shell-source-replayer-${width}.png`);
    const implementation = await readFile(`${output}/comparison-app-${width}.png`);
    const pair = await browser.newPage({
      viewport: { width: width * 2 + 48, height: 1100 },
    });
    const images = [source, implementation].map(
      (data) => `data:image/png;base64,${data.toString("base64")}`,
    );
    await pair.setContent(`<body style="margin:0;padding:16px;display:flex;gap:16px;background:#101815;color:#efece2;font:14px Arial">
      <section><p>Approved live reference / ${width}px</p><img src="${images[0]}" width="${width}" /></section>
      <section><p>Poker Coach shell / ${width}px</p><img src="${images[1]}" width="${width}" /></section></body>`);
    await pair.screenshot({
      path: `${output}/comparison-${width}.png`,
      fullPage: true,
    });
    if (width === 1440) {
      // Source inspector bounds measured in the captured 1440px reference.
      await pair.setViewportSize({ width: 680, height: 1160 });
      await pair.setContent(`<body style="margin:0;padding:16px;display:flex;gap:16px;background:#101815;color:#efece2;font:14px Arial">
        ${[
          { x: 1115, y: 278, label: "Reference analysis" },
          { x: panelBounds.x, y: panelBounds.y, label: "Implementation analysis" },
        ]
          .map(
            (region, index) =>
              `<section><p>${region.label}</p><div style="position:relative;width:300px;height:1080px;overflow:hidden"><img src="${images[index]}" style="position:absolute;left:-${region.x}px;top:-${region.y}px" /></div></section>`,
          )
          .join("")}</body>`);
      await pair.screenshot({
        path: `${output}/comparison-analysis.png`,
        fullPage: true,
      });
    }
    await pair.close();
  }
} finally {
  await browser.close();
}
