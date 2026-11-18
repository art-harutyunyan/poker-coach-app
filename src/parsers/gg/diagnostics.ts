export type ParseErrorType =
  | "unsupported_format"
  | "malformed_hand"
  | "unsupported_game"
  | "incomplete_hand"
  | "invalid_action"
  | "invalid_card"
  | "inconsistent_seats";

export interface ParserIssue {
  type: ParseErrorType;
  message: string;
  handId?: string;
  sourceHandNumber?: number;
  lineNumber?: number;
  rawLine?: string;
  sourceName?: string;
}

export interface ParserWarning {
  type:
    "unresolved_currency" | "unknown_timezone" | "missing_metadata" | "source_warning";
  message: string;
  field: string;
  handId?: string;
  lineNumber?: number;
  code?: string;
  rawLine?: string;
}

export class GgParseError extends Error implements ParserIssue {
  readonly type: ParseErrorType;
  readonly lineNumber?: number;
  readonly rawLine?: string;
  constructor(
    type: ParseErrorType,
    message: string,
    source?: { number: number; text: string },
  ) {
    super(message);
    this.name = "GgParseError";
    this.type = type;
    this.lineNumber = source?.number;
    this.rawLine = source?.text;
  }
}
