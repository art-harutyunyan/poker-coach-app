import { GgParseError } from "./diagnostics";

export interface SourceLine {
  number: number;
  text: string;
}
export interface HandBlock {
  sourceHandNumber: number;
  startLine: number;
  endLine: number;
  rawText: string;
  lines: SourceLine[];
}

export function splitGgHands(text: string): HandBlock[] {
  const input = text.replace(/^\uFEFF/, "");
  const rawLines = input.split(/(?<=\n)/);
  const lines = rawLines.map((raw, index) => ({
    number: index + 1,
    text: raw.replace(/\r?\n$/, ""),
  }));
  const starts: number[] = [];
  for (const [index, line] of lines.entries()) {
    if (line.text.startsWith("Poker Hand #")) starts.push(index);
    else if (!starts.length && line.text.trim()) {
      throw new GgParseError(
        "unsupported_format",
        "Expected a GG Poker tournament hand header",
        line,
      );
    }
  }
  if (!starts.length)
    throw new GgParseError("unsupported_format", "No GG Poker hands found");
  return starts.map((start, index) => {
    const end = starts[index + 1] ?? lines.length;
    return {
      sourceHandNumber: index + 1,
      startLine: start + 1,
      endLine: end,
      rawText: rawLines.slice(start, end).join(""),
      lines: lines.slice(start, end),
    };
  });
}
