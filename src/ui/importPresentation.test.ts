import { describe, expect, it } from "vitest";
import type { ParserWarning } from "../parsers/gg/diagnostics";
import { presentImportNotices } from "./importPresentation";

describe("import notice presentation", () => {
  it.each([
    [
      "unknown_timezone",
      "timestamp.timezone",
      undefined,
      "info",
      "Timezone not provided by GG",
    ],
    [
      "unresolved_currency",
      "buyIn.currency",
      undefined,
      "info",
      "Currency could not be determined from the source symbol",
    ],
    [
      "missing_metadata",
      "format",
      undefined,
      "info",
      "Tournament format not specified",
    ],
    ["missing_metadata", "buyIn", undefined, "info", "Buy-in not provided by GG"],
    [
      "source_warning",
      "actions",
      "SHORT_BLIND_POST",
      "warnings",
      "Short blind post detected",
    ],
    [
      "source_warning",
      "actions",
      "ZERO_STACK_FOLD",
      "warnings",
      "Zero-stack fold preserved from source",
    ],
    [
      "source_warning",
      "actions",
      "NEW_CODE",
      "warnings",
      "Unusual source detail preserved",
    ],
  ] as const)(
    "classifies %s %s %s without changing source",
    (type, field, code, group, label) => {
      const diagnostic: ParserWarning = Object.freeze({
        type,
        field,
        code,
        message: "source message",
        handId: "TM1",
        lineNumber: 3,
        rawLine: "source",
      });
      const result = presentImportNotices(Object.freeze([diagnostic]));
      expect(result[group]).toHaveLength(1);
      expect(result[group][0]?.label).toBe(label);
      expect(result[group][0]?.diagnostic).toBe(diagnostic);
      expect(result[group === "info" ? "warnings" : "info"]).toEqual([]);
    },
  );
  it("omits empty groups", () =>
    expect(presentImportNotices([])).toEqual({ info: [], warnings: [] }));
});
