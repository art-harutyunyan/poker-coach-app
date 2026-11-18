import {
  HandHistoryValidationError,
  importedTournamentSchema,
  type ImportedHand,
  type ImportedTournament,
} from "../../domain/handHistory";
import { GgParseError, type ParserIssue, type ParserWarning } from "./diagnostics";
import { splitGgHands, type HandBlock } from "./split";
import { parseRawGgHand, type RawGgHand } from "./rawHand";
import { normalizeGgHand } from "./normalize";

export type { ParserIssue, ParserWarning } from "./diagnostics";
export type ParseResult =
  | { ok: true; tournament: ImportedTournament; warnings: ParserWarning[] }
  | { ok: false; errors: ParserIssue[]; warnings: ParserWarning[] };

function issue(error: unknown, block?: HandBlock, sourceName?: string): ParserIssue {
  const typed =
    error instanceof GgParseError || error instanceof HandHistoryValidationError;
  const header = block?.lines[0];
  const handId = header?.text.match(/^Poker Hand #([^:]+):/)?.[1];
  return {
    type: typed ? error.type : "malformed_hand",
    message: typed ? error.message : "Unable to normalize GG hand history",
    ...(handId ? { handId } : {}),
    ...(block ? { sourceHandNumber: block.sourceHandNumber } : {}),
    ...(typed && error.lineNumber !== undefined
      ? { lineNumber: error.lineNumber, rawLine: error.rawLine }
      : header
        ? { lineNumber: header.number, rawLine: header.text }
        : {}),
    ...(sourceName ? { sourceName } : {}),
  };
}

function metadataWarnings(raw: RawGgHand): ParserWarning[] {
  const warnings: ParserWarning[] = [
    {
      type: "unknown_timezone",
      field: "timestamp.timezone",
      message: "GG timestamps have no timezone; local wall time is preserved",
      lineNumber: raw.header.source.number,
    },
  ];
  if (!raw.header.buyIn)
    warnings.push({
      type: "missing_metadata",
      field: "buyIn",
      message: "Buy-in is missing or uses unsupported title syntax",
      lineNumber: raw.header.source.number,
    });
  else
    warnings.push({
      type: "unresolved_currency",
      field: "buyIn.currency",
      message:
        "The $ symbol does not specify an ISO currency; no currency was inferred",
      lineNumber: raw.header.source.number,
    });
  warnings.push({
    type: "missing_metadata",
    field: "format",
    message:
      "Tournament format classification is unavailable; title annotations are preserved",
  });
  return warnings;
}

function compatibleMetadata(first: RawGgHand, next: RawGgHand): void {
  if (
    first.header.tournamentId !== next.header.tournamentId ||
    first.header.name !== next.header.name ||
    first.header.game !== next.header.game ||
    JSON.stringify(first.header.buyIn) !== JSON.stringify(next.header.buyIn)
  ) {
    throw new GgParseError(
      "malformed_hand",
      "A single import must contain one consistent tournament",
      next.header.source,
    );
  }
}

/** Pure deterministic import boundary. Failures never expose a partial tournament. */
export function parseGgTournament(
  text: string,
  options: { sourceName?: string } = {},
): ParseResult {
  const warnings: ParserWarning[] = [];
  let active: HandBlock | undefined;
  try {
    const blocks = splitGgHands(text);
    const hands: ImportedHand[] = [];
    const ids = new Set<string>();
    const tables = new Map<string, ImportedHand["table"]>();
    const levels = new Map<number, ImportedTournament["blindLevels"][number]>();
    let first: RawGgHand | undefined;
    for (const block of blocks) {
      active = block;
      const raw = parseRawGgHand(block);
      if (!first) {
        first = raw;
        warnings.push(...metadataWarnings(raw));
      } else compatibleMetadata(first, raw);
      if (ids.has(raw.header.handId))
        throw new GgParseError(
          "malformed_hand",
          "Duplicate hand ID in import",
          raw.header.source,
        );
      ids.add(raw.header.handId);
      const previousTable = tables.get(raw.table.id);
      if (previousTable && previousTable.capacity !== raw.table.capacity)
        throw new GgParseError(
          "inconsistent_seats",
          "Table capacity changes within one table identity",
          raw.table.source,
        );
      const hand = normalizeGgHand(raw);
      warnings.push(
        ...hand.warnings.map((warning): ParserWarning => ({
          type: "source_warning",
          code: warning.code,
          message: warning.message,
          field: "events",
          handId: hand.id,
          lineNumber: warning.source.lineNumber,
          rawLine: warning.source.rawLine,
        })),
      );
      tables.set(hand.table.id, hand.table);
      const level = { levelNumber: hand.levelNumber, ...hand.blindLevel };
      const previousLevel = levels.get(level.levelNumber);
      if (previousLevel && JSON.stringify(previousLevel) !== JSON.stringify(level))
        throw new GgParseError(
          "malformed_hand",
          "Conflicting blind amounts for the same level",
          raw.header.source,
        );
      levels.set(level.levelNumber, level);
      hands.push(hand);
    }
    hands.sort(
      (a, b) =>
        a.timestamp.local.localeCompare(b.timestamp.local) ||
        a.source.sourceHandNumber - b.source.sourceHandNumber,
    );
    hands.forEach((hand, index) => {
      hand.handNumber = index + 1;
    });
    const earliest = hands[0]!;
    const latest = hands.at(-1)!;
    const parsed = importedTournamentSchema.safeParse({
      id: first!.header.tournamentId,
      room: "GGPoker",
      name: first!.header.name,
      buyIn: first!.header.buyIn,
      heroPlayerId: earliest.heroPlayerId,
      handsPlayed: hands.length,
      game: "NLHE",
      format: null,
      formatAnnotations: [...first!.header.name.matchAll(/\[([^\]]+)\]/g)].map(
        (m) => m[1]!,
      ),
      timestampRange: { first: earliest.timestamp, last: latest.timestamp },
      tables: [...tables.values()].sort((a, b) => a.id.localeCompare(b.id)),
      blindLevels: [...levels.values()].sort((a, b) => a.levelNumber - b.levelNumber),
      hands,
    });
    if (!parsed.success)
      throw new GgParseError(
        "malformed_hand",
        `Tournament validation failed: ${parsed.error.issues[0]?.message}`,
        first!.header.source,
      );
    return { ok: true, tournament: parsed.data, warnings };
  } catch (error) {
    return { ok: false, errors: [issue(error, active, options.sourceName)], warnings };
  }
}
