import * as Switch from "@radix-ui/react-switch";
import { RotateCcw, SkipBack, SkipForward } from "lucide-react";
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
          /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(event.target.tagName) ||
          event.target.closest('[role="dialog"], dialog, [role="menu"]'))
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
      <div className="replayTransport" role="group" aria-label="Replay actions">
        <button
          type="button"
          aria-label="Start of hand"
          title="Start of hand"
          disabled={cursor <= 0}
          onClick={() => onCursorChange(0)}
        >
          <RotateCcw size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Back"
          title="Previous action"
          disabled={cursor <= 0}
          onClick={() => onCursorChange(Math.max(0, cursor - 1))}
        >
          <SkipBack size={18} aria-hidden="true" />
        </button>
        <button
          className="replayTransportNext"
          type="button"
          aria-label="Forward"
          title="Next action"
          disabled={cursor >= totalActions}
          onClick={() => onCursorChange(Math.min(totalActions, cursor + 1))}
        >
          <SkipForward size={18} aria-hidden="true" />
        </button>
      </div>
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
      <label className="switchLabel">
        <Switch.Root
          checked={resultHidden}
          className="switchRoot"
          onCheckedChange={setResultHidden}
        >
          <Switch.Thumb className="switchThumb" />
        </Switch.Root>
        <span>Hide result</span>
      </label>
    </div>
  );
}
