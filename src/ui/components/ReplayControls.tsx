import * as Switch from "@radix-ui/react-switch";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { flattenActions } from "../../domain/replay";
import type { Hand, Street } from "../../domain/schemas";

export function ReplayControls({
  cursor,
  onCursorChange,
  resultHidden,
  setResultHidden,
  totalActions,
  hand,
  currentStreet,
}: {
  cursor: number;
  onCursorChange: (cursor: number) => void;
  resultHidden: boolean;
  setResultHidden: (hidden: boolean) => void;
  totalActions: number;
  hand: Hand;
  currentStreet: Street;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(event.target.tagName))
      )
        return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onCursorChange(Math.max(0, cursor - 1));
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onCursorChange(Math.min(totalActions, cursor + 1));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cursor, onCursorChange, totalActions]);

  return (
    <div className="replayControls">
      <button
        className="secondaryButton"
        type="button"
        disabled={cursor <= 0}
        onClick={() => onCursorChange(Math.max(0, cursor - 1))}
      >
        <ChevronLeft size={18} aria-hidden="true" />
        Back
      </button>
      <nav className="streetNavigation" aria-label="Betting streets">
        {(["PREFLOP", "FLOP", "TURN", "RIVER"] as const).map((street) => {
          const target = flattenActions(hand).find(
            (action) => action.street === street && action.type !== "WIN",
          );
          return (
            <button
              key={street}
              type="button"
              aria-current={street === currentStreet ? "step" : undefined}
              disabled={!target || target.sequence > totalActions}
              onClick={() => target && onCursorChange(target.sequence)}
            >
              {street.charAt(0) + street.slice(1).toLowerCase()}
            </button>
          );
        })}
      </nav>
      <button
        className="primaryButton"
        type="button"
        disabled={cursor >= totalActions}
        onClick={() => onCursorChange(Math.min(totalActions, cursor + 1))}
      >
        Forward
        <ChevronRight size={18} aria-hidden="true" />
      </button>
      <label className="switchLabel">
        Hide result
        <Switch.Root
          checked={resultHidden}
          className="switchRoot"
          onCheckedChange={setResultHidden}
        >
          <Switch.Thumb className="switchThumb" />
        </Switch.Root>
      </label>
    </div>
  );
}
