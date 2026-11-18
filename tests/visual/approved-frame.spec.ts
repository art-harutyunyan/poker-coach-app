import { expect, test } from "@playwright/test";
import { compareUnmaskedPixels } from "./approvedFrame";

test("allows only bounded authorized pixels and catches unmasked changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 100, height: 100 });
  await page.setContent(
    "<style>body{margin:0;background:white}div{position:absolute;width:10px;height:10px;left:10px;top:10px;background:black}</style><div></div>",
  );
  const before = await page.screenshot();
  await page.locator("div").evaluate((el) => (el.style.background = "red"));
  const changed = await page.screenshot();
  expect(
    await compareUnmaskedPixels(page, before, changed, [
      { x: 10, y: 10, width: 10, height: 10 },
    ]),
  ).toEqual({ sameSize: true, comparedPixels: 9900, mismatchedPixels: 0 });
  await page.evaluate(() => {
    const el = document.createElement("div");
    el.style.cssText = "left:60px;top:60px;width:1px;height:1px";
    document.body.append(el);
  });
  expect(
    (
      await compareUnmaskedPixels(page, before, await page.screenshot(), [
        { x: 10, y: 10, width: 10, height: 10 },
      ])
    ).mismatchedPixels,
  ).toBe(1);
  await expect(
    compareUnmaskedPixels(page, before, changed, [
      { x: 0, y: 0, width: 100, height: 100 },
    ]),
  ).rejects.toThrow(/10%/);
  await page.setViewportSize({ width: 101, height: 100 });
  expect(
    (await compareUnmaskedPixels(page, before, await page.screenshot(), [])).sameSize,
  ).toBe(false);
});
