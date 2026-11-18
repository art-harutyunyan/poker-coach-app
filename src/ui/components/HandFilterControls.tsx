import type { HandFilter, HandFilterResult } from "../../domain/handFilters";
import type { ReasonCode } from "../../domain/pokerMetricTypes";

export interface SourceReviewHand {
  handId: string;
  handNumber: number;
  reasons: readonly ReasonCode[];
  sourceLine?: number;
}

const REASON_TEXT: Readonly<Record<ReasonCode, string>> = {
  invalid_hand: "The hand does not pass the source-facts checks.",
  missing_hero: "The source does not identify one unambiguous Hero player.",
  incomplete_hand: "The hand or its street sequence is incomplete.",
  unsupported_source_warning: "A source warning has no defined classification rule.",
  zero_stack_fold:
    "A player folded after forced posts left them with no chips; source eligibility is unresolved.",
  forced_post_exhausted: "Hero had no chips left after forced posts.",
  missing_preflop_decision: "The source does not establish Hero's preflop decision.",
  missing_hero_reveal: "The source has no timed Hero reveal at a contested showdown.",
  incomplete_runout: "The source does not establish a complete river runout.",
  unsupported_muck: "A mucked hand has no supported source reveal evidence.",
  award_mismatch: "Recorded collections do not reconcile with the hand result.",
  short_open: "The opening raise was shorter than a full opening increment.",
  ambiguous_reopening: "The actions do not establish whether betting reopened.",
  unsupported_raise: "The raise does not meet the supported eligibility rules.",
};

const FILTERS: readonly { value: HandFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "played", label: "Played" },
  { value: "postflop", label: "Postflop" },
  { value: "showdown", label: "Showdown" },
];

export function HandFilterControls({
  result,
  filter,
  currentHandId,
  previousId,
  nextId,
  reviewHands,
  onFilterChange,
  onNavigate,
  onOpenHand,
}: {
  result: HandFilterResult;
  filter: HandFilter;
  currentHandId: string;
  previousId: string | null;
  nextId: string | null;
  reviewHands: readonly SourceReviewHand[];
  onFilterChange(filter: HandFilter): void;
  onNavigate(direction: "previous" | "next"): void;
  onOpenHand(handId: string): void;
}) {
  const position = result.ids.indexOf(currentHandId);
  const unknown = result.unknown[filter];
  const empty = result.ids.length === 0;
  const outside = !empty && position < 0;
  return (
    <div className="handFilterControls" aria-label="Filter imported hands">
      <div className="handFilterOptions">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className="handFilterOption"
            aria-pressed={filter === value}
            onClick={() => onFilterChange(value)}
          >
            <span className="handFilterLabel">{label}</span>{" "}
            <span className="handFilterCount">
              {result.counts[value]} / {result.total}
            </span>
          </button>
        ))}
      </div>
      <div className="handFilterUnknown">
        {unknown > 0 && (
          <details>
            <summary>
              {unknown} {unknown === 1 ? "hand" : "hands"} needs source review
            </summary>
            <div className="handFilterReviewPanel">
              {reviewHands.map((hand) => (
                <div className="handFilterReviewHand" key={hand.handId}>
                  <strong>
                    Hand #{hand.handNumber} · {hand.handId}
                  </strong>
                  {hand.reasons.map((reason) => (
                    <p key={reason}>
                      <code>{reason}</code>: {REASON_TEXT[reason]}
                    </p>
                  ))}
                  {hand.sourceLine !== undefined && (
                    <small>Source line {hand.sourceLine}</small>
                  )}
                  <button
                    type="button"
                    aria-label={`Open hand #${hand.handNumber} in Replayer`}
                    onClick={(event) => {
                      event.currentTarget.closest("details")?.removeAttribute("open");
                      onOpenHand(hand.handId);
                    }}
                  >
                    Open in Replayer
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
      <div className="handFilterNavigation">
        <button
          type="button"
          aria-label="Previous filtered hand"
          disabled={!previousId}
          onClick={() => onNavigate("previous")}
        >
          Previous
        </button>
        <span className="handFilterPosition">
          {empty || outside ? (
            <>
              <span>
                {empty
                  ? "No hands match this filter"
                  : "Current hand is outside this filter"}
              </span>
              <button type="button" onClick={() => onFilterChange("all")}>
                Show all hands
              </button>
            </>
          ) : (
            `${position + 1} of ${result.ids.length}`
          )}
        </span>
        <button
          type="button"
          aria-label="Next filtered hand"
          disabled={!nextId}
          onClick={() => onNavigate("next")}
        >
          Next
        </button>
      </div>
    </div>
  );
}
