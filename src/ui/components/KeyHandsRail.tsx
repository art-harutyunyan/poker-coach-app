import { Check } from "lucide-react";
import type { Hand } from "../../domain/schemas";

export function KeyHandsRail({
  hand,
  reviewed,
  onSelect,
}: {
  hand: Hand;
  reviewed: boolean;
  onSelect: () => void;
}) {
  const [first, second] = hand.heroHoleCards;
  const notation = `${first.rank}${second.rank}${first.rank === second.rank ? "" : first.suit === second.suit ? "s" : "o"}`;
  return (
    <nav className="keyHandsRail" aria-label="Key hands">
      <h2>Key hands</h2>
      <button
        type="button"
        aria-current="true"
        aria-label={`Hand ${hand.handNumber}, ${notation}${reviewed ? ", reviewed" : ""}`}
        onClick={onSelect}
      >
        <small>#{hand.handNumber}</small>
        <strong>{notation}</strong>
        {reviewed ? (
          <Check size={12} aria-label="Reviewed" />
        ) : (
          <span className="handGradeMark" />
        )}
      </button>
      <span className="railCount">1 hand</span>
    </nav>
  );
}
