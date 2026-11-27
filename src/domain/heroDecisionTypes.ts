import type { Card, Street } from "./schemas";
import type { Position } from "./handHistory";

export type HeroBettingAction = "FOLD" | "CHECK" | "CALL" | "BET" | "RAISE";
export type FacingAction =
  | "UNOPENED"
  | "LIMPED"
  | "CHECKED_TO"
  | "FACING_BET"
  | "FACING_RAISE"
  | "FACING_3BET"
  | "FACING_4BET"
  | "FACING_ALL_IN";
export type PotType =
  "UNOPENED" | "LIMPED" | "SINGLE_RAISED" | "THREE_BET" | "FOUR_BET_PLUS";
export type DecisionSourceConfidence = "confirmed" | "partial" | "unknown";

export interface DecisionDiagnostic {
  severity: "fatal" | "recoverable" | "warning";
  code: string;
  message: string;
  eventId?: string;
  lineNumber?: number;
  field?: string;
}

export interface DecisionUnknownReason {
  field: string;
  code: string;
}

export interface DecisionPlayerContext {
  playerId: string;
  seatNumber: number;
  position: Position | null;
  stackBeforeChips: number;
  streetCommitmentChips: number;
  state: "active" | "all-in";
}

export interface PreflopDecisionAction {
  eventId: string;
  playerId: string;
  position: Position | null;
  action: HeroBettingAction;
  isAllIn: boolean;
  amountAddedChips: number;
  raiseToChips: number | null;
}

export interface HeroDecisionContext {
  handId: string;
  eventId: string;
  sourceLine: number;
  decisionIndex: number;
  street: Street;
  heroPosition: Position | null;
  heroCards: [Card, Card] | null;
  board: Card[];
  playersDealt: number;
  playersInHand: number;
  playersRemaining: DecisionPlayerContext[];
  heroStackBeforeChips: number;
  heroStackBeforeBb: number | null;
  effectiveStackBeforeChips: number | null;
  effectiveStackBeforeBb: number | null;
  potBeforeActionChips: number;
  contributionsByPlayerChips: Record<string, number>;
  currentBetChips: number;
  facingAmountChips: number;
  amountToCallChips: number;
  facingAction: FacingAction;
  legalActions: HeroBettingAction[] | null;
  minimumRaiseToChips: number | null;
  actualAction: {
    kind: HeroBettingAction;
    isAllIn: boolean;
    amountAddedChips: number;
    raiseToChips: number | null;
    amountAddedBb: number | null;
    potFraction: number | null;
  };
  potType: PotType;
  preflopSequence: PreflopDecisionAction[];
  sourceConfidence: DecisionSourceConfidence;
  unknownReasons: DecisionUnknownReason[];
}

export type DecisionExtractionResult =
  | {
      status: "ok";
      decisions: HeroDecisionContext[];
      diagnostics: DecisionDiagnostic[];
    }
  | {
      status: "excluded";
      decisions: [];
      diagnostics: DecisionDiagnostic[];
    };
