import type { Page } from "@playwright/test";

export type VisualMask = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

/** Decode both frames identically; compare every channel outside tightly bounded changes. */
export async function compareUnmaskedPixels(
  page: Page,
  reference: Buffer,
  actual: Buffer,
  masks: readonly VisualMask[],
): Promise<{ sameSize: boolean; comparedPixels: number; mismatchedPixels: number }> {
  return page.evaluate(
    async ({ reference, actual, masks }) => {
      async function decode(base64: string) {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, 0, 0);
        return {
          width: image.width,
          height: image.height,
          data: ctx.getImageData(0, 0, image.width, image.height).data,
        };
      }
      const [a, b] = await Promise.all([decode(reference), decode(actual)]);
      if (a.width !== b.width || a.height !== b.height)
        return { sameSize: false, comparedPixels: 0, mismatchedPixels: 0 };
      const area = masks.reduce(
        (sum, r) => sum + Math.max(0, r.width) * Math.max(0, r.height),
        0,
      );
      if (area > a.width * a.height * 0.1)
        throw new Error("Authorized masks exceed 10% of frame");
      let comparedPixels = 0,
        mismatchedPixels = 0;
      for (let y = 0; y < a.height; y++)
        for (let x = 0; x < a.width; x++) {
          if (
            masks.some(
              (r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height,
            )
          )
            continue;
          comparedPixels++;
          const i = (y * a.width + x) * 4;
          if (
            a.data[i] !== b.data[i] ||
            a.data[i + 1] !== b.data[i + 1] ||
            a.data[i + 2] !== b.data[i + 2] ||
            a.data[i + 3] !== b.data[i + 3]
          )
            mismatchedPixels++;
        }
      return { sameSize: true, comparedPixels, mismatchedPixels };
    },
    {
      reference: reference.toString("base64"),
      actual: actual.toString("base64"),
      masks,
    },
  );
}

export async function approvedCardMasks(
  page: Page,
  includeNavigation = false,
): Promise<VisualMask[]> {
  return page
    .locator(
      includeNavigation
        ? ".pokerStage .playingCard,.streetNavigation"
        : ".pokerStage .playingCard",
    )
    .evaluateAll((elements) =>
      elements.map((el) => {
        const r = el.getBoundingClientRect(),
          pad = el.matches(".playingCard") ? 8 : 0;
        return {
          x: Math.floor(r.left + scrollX - pad),
          y: Math.floor(r.top + scrollY - pad),
          width: Math.ceil(r.width + pad * 2),
          height: Math.ceil(r.height + pad * 2),
        };
      }),
    );
}
