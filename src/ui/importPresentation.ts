import type { ParserWarning } from "../parsers/gg/diagnostics";

export type ImportNotice = Readonly<{
  severity: "info" | "warning";
  label: string;
  diagnostic: ParserWarning;
}>;

export function presentImportNotices(warnings: readonly ParserWarning[]): {
  info: ImportNotice[];
  warnings: ImportNotice[];
} {
  const result: { info: ImportNotice[]; warnings: ImportNotice[] } = {
    info: [],
    warnings: [],
  };
  for (const diagnostic of warnings) {
    const severity = diagnostic.type === "source_warning" ? "warning" : "info";
    let label: string;
    switch (diagnostic.type) {
      case "unknown_timezone":
        label = "Timezone not provided by GG";
        break;
      case "unresolved_currency":
        label = "Currency could not be determined from the source symbol";
        break;
      case "missing_metadata": {
        const field = diagnostic.field;
        label =
          field === "format" || field === "tournament.format"
            ? "Tournament format not specified"
            : field === "buyIn"
              ? "Buy-in not provided by GG"
              : `${field.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[._]/g, " ")} not provided by GG`;
        break;
      }
      case "source_warning":
        label =
          diagnostic.code === "SHORT_BLIND_POST"
            ? "Short blind post detected"
            : diagnostic.code === "ZERO_STACK_FOLD"
              ? "Zero-stack fold preserved from source"
              : "Unusual source detail preserved";
    }
    result[severity === "info" ? "info" : "warnings"].push({
      severity,
      label,
      diagnostic,
    });
  }
  return result;
}
