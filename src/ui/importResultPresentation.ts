import type { LibraryEntry } from "../services/tournamentLibrary";
import type { ImportFailure } from "../services/tournamentImport";
import type { FileImportResult, ImportStatus } from "./useTournamentImport";

export interface ImportResultView {
  id: number;
  status: ImportStatus;
  title: string;
  fileName: string;
  detail: string;
  message: string | null;
  key: string | null;
}

function safeFileName(value: string): string {
  return value.split(/[\\/]/).at(-1)?.trim() || "Unnamed file";
}

function handCount(count: number, noun: string): string {
  return `${count} ${count === 1 ? "hand" : "hands"} ${noun}`;
}

function failureTitle(error: ImportFailure): string {
  if (error.kind === "file") {
    if (error.code === "invalid_type") return "Unrecognised file";
    if (error.code === "empty_file") return "Empty file";
    return "Couldn't read this file";
  }
  if (
    error.kind === "parser" &&
    error.issues.some((issue) => issue.type === "unsupported_format")
  )
    return "Unrecognised file";
  return "Hand history could not be imported";
}

function failureMessage(error: ImportFailure): string {
  return error.kind === "parser"
    ? (error.issues[0]?.message ?? "The hand history could not be parsed.")
    : error.message;
}

export function presentImportResult(
  result: FileImportResult,
  entries: readonly LibraryEntry[],
): ImportResultView {
  const common = {
    id: result.id,
    status: result.status,
    fileName: safeFileName(result.fileName),
  };
  if (result.status === "processing")
    return {
      ...common,
      title: "Reading file…",
      detail: "",
      message: null,
      key: null,
    };
  if (result.status === "error")
    return {
      ...common,
      title: failureTitle(result.error),
      detail: "0 hands accepted",
      message: failureMessage(result.error),
      key: null,
    };

  const entry = entries.find((item) => item.key === result.key);
  const tournament = entry?.tournament;
  if (result.status === "conflict")
    return {
      ...common,
      title: `${tournament?.name ?? `Tournament #${result.tournamentId}`} — rejected`,
      detail: `Same tournament ID #${result.tournamentId} with different contents`,
      message:
        "File rejected. The existing tournament is unchanged — nothing was merged or replaced.",
      key: entry?.key ?? null,
    };
  if (!tournament)
    return {
      ...common,
      status: "error",
      title: "Import result unavailable",
      detail: "",
      message: "The tournament could not be found in this session.",
      key: null,
    };
  if (result.status === "duplicate")
    return {
      ...common,
      title: `${tournament.name} — already imported`,
      detail: `Identical to tournament #${tournament.id} · existing tournament reused`,
      message: "Nothing added.",
      key: entry.key,
    };
  const details = [
    `#${tournament.id}`,
    handCount(tournament.hands.length, "accepted"),
    ...(result.status === "warning" ? [handCount(result.skippedHands, "skipped")] : []),
    tournament.game,
    ...(tournament.format ? [tournament.format] : []),
  ];
  return {
    ...common,
    title: tournament.name,
    detail: details.join(" · "),
    message: null,
    key: entry.key,
  };
}
