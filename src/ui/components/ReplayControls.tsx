import * as Switch from "@radix-ui/react-switch";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import {
  currentNavigationTarget,
  findShowdownCursor,
  findStreetCursor,
} from "../../domain/replay";
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
      <nav className="streetNavigation" aria-label="Replay streets and showdown">
        {(["PREFLOP", "FLOP", "TURN", "RIVER", "SHOWDOWN"] as const).map((street) => {
          const target =
            street === "SHOWDOWN"
              ? findShowdownCursor(hand)
              : findStreetCursor(hand, street);
          return (
            <button
              key={street}
              type="button"
              aria-current={
                street === currentNavigationTarget(hand, cursor, currentStreet)
                  ? "step"
                  : undefined
              }
              disabled={target === null || target > totalActions}
              onClick={() => target !== null && onCursorChange(target)}
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
