import type { ImportedTournament } from "../domain/handHistory";
import type { ReplayDiagnostic } from "../domain/replayAdapter";
import type { ParserIssue, ParserWarning } from "../parsers/gg/diagnostics";
import { parseGgTournament } from "../parsers/gg";

export type ImportFailure =
  | {
      kind: "file";
      code: "invalid_type" | "empty_file" | "read_failed";
      message: string;
    }
  | { kind: "parser"; issues: ParserIssue[]; warnings: ParserWarning[] }
  | {
      kind: "integration";
      message: string;
      handId?: string;
      diagnostics?: ReplayDiagnostic[];
    };
export type ImportOutcome =
  | { ok: true; tournament: ImportedTournament; warnings: ParserWarning[] }
  | { ok: false; error: ImportFailure };

export async function importTournamentFile(file: File): Promise<ImportOutcome> {
  const failure = (
    code: "invalid_type" | "empty_file" | "read_failed",
    message: string,
  ): ImportOutcome => ({ ok: false, error: { kind: "file", code, message } });
  if (
    !/\.txt$/i.test(file.name) ||
    (file.type &&
      !file.type.startsWith("text/") &&
      file.type !== "application/octet-stream")
  )
    return failure("invalid_type", "Select a GG hand-history .txt file.");
  if (!file.size) return failure("empty_file", "The selected file is empty.");
  let text: string;
  try {
    text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === "string" ? resolve(reader.result) : reject();
      reader.onerror = reader.onabort = () => reject();
      reader.readAsText(file, "UTF-8");
    });
  } catch {
    return failure(
      "read_failed",
      "Unable to read this file. Select it again or choose another file.",
    );
  }
  if (!text.trim()) return failure("empty_file", "The selected file is empty.");
  const result = parseGgTournament(text, { sourceName: file.name });
  return result.ok
    ? result
    : {
        ok: false,
        error: { kind: "parser", issues: result.errors, warnings: result.warnings },
      };
}
