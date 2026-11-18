// @vitest-environment node
import { describe, expect, it } from "vitest";
import { splitGgHands } from "./split";
import { readFixture } from "./fixtureTestUtils";

describe("GG source splitting", () => {
  it.each([
    [0, 222],
    [1, 191],
    [2, 28],
  ])("retains every hand in real file %i", (index, count) => {
    const blocks = splitGgHands(readFixture(index!));
    expect(blocks).toHaveLength(count!);
    expect(blocks[0]).toMatchObject({ sourceHandNumber: 1, startLine: 1 });
    expect(blocks.at(-1)?.sourceHandNumber).toBe(count);
    expect(blocks[0]?.rawText).toContain("*** SUMMARY ***");
  });

  it("retains absolute line numbers for source diagnostics", () => {
    const blocks = splitGgHands(readFixture(0));
    expect(blocks[1]).toMatchObject({ sourceHandNumber: 2, startLine: 60 });
    expect(blocks[1]?.lines[0]).toEqual({
      number: 60,
      text: expect.stringContaining("#TM6469820411:"),
    });
  });

  it("accepts BOM and either line ending without shifting source locations", () => {
    const lf = readFixture(2).replace(/\r\n/g, "\n");
    const original = splitGgHands(lf);
    const windows = splitGgHands(`\uFEFF${lf.replace(/\n/g, "\r\n")}`);
    expect(windows.map((h) => h.startLine)).toEqual(original.map((h) => h.startLine));
    expect(windows[0]?.lines[0]?.text).toBe(original[0]?.lines[0]?.text);
  });

  it.each(["", "  \n", "Not a poker export", `preamble\n${readFixture(2)}`])(
    "rejects unrecognized input",
    (text) => {
      expect(() => splitGgHands(text)).toThrow(
        expect.objectContaining({ type: "unsupported_format" }),
      );
    },
  );
});
