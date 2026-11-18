import type { ImportedHand } from "../../domain/handHistory";
import { useEffect, useRef, type ReactNode } from "react";
import { positionLabel } from "./seatLayout";
import { PlayingCard } from "./PlayingCard";

export function ImportedHandNavigator({
  hands,
  selectedHandId,
  onSelectHand,
  variant,
  controls,
  emptyMessage,
}: {
  hands: readonly ImportedHand[];
  selectedHandId: string;
  onSelectHand(id: string): void;
  variant: "rail" | "list";
  controls?: ReactNode;
  emptyMessage?: string;
}) {
  const rows = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const selected = Array.from(
      rows.current?.querySelectorAll<HTMLButtonElement>(".importedHandRow") ?? [],
    ).find((row) => row.dataset.handId === selectedHandId);
    selected?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [selectedHandId]);
  return (
    <aside
      className={
        variant === "rail" ? "keyHandsRail importedHandRail" : "panel importedHandList"
      }
      aria-label="Imported hands"
    >
      <h2>
        Hands <span>({hands.length})</span>
      </h2>
      {controls}
      {hands.length === 0 && emptyMessage && (
        <p className="importedHandEmpty">{emptyMessage}</p>
      )}
      <div className="importedHandRows" ref={rows}>
        {hands.map((hand) => {
          const hero = hand.players.find((p) => p.isHero)!;
          return (
            <button
              className="importedHandRow"
              key={hand.id}
              type="button"
              data-hand-id={hand.id}
              aria-current={hand.id === selectedHandId ? "true" : undefined}
              onClick={() => onSelectHand(hand.id)}
            >
              <span className="importedHandIdentity">
                <span className="importedHeroCards" aria-label="Hero hole cards">
                  {hand.heroHoleCards.map((card) => (
                    <PlayingCard
                      key={card.rank + card.suit}
                      card={card}
                      variant="compact"
                    />
                  ))}
                </span>
                <strong>Hand #{hand.handNumber}</strong>
              </span>
              <small>
                {positionLabel(hero.position)} · {hand.occupiedSeatCount}/
                {hand.tableSize} players
              </small>
              <small className="importedHandId">{hand.id}</small>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
