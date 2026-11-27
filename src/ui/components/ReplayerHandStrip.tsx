import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, List } from "lucide-react";
import type { Card } from "../../domain/schemas";
import { PlayingCard } from "./PlayingCard";
import { cardAccessibilityLabel } from "./cardAccessibilityLabel";

export interface ReplayerStripHand {
  id: string;
  handNumber: number;
  spot: string;
  cards: readonly Card[];
}

export function ReplayerHandStrip({
  title,
  context,
  hands,
  selectedHandId,
  totalHands,
  onSelectHand,
  onBack,
  browseContent,
}: {
  title: string;
  context: string;
  hands: readonly ReplayerStripHand[];
  selectedHandId: string;
  totalHands: number;
  onSelectHand(id: string): void;
  onBack(): void;
  browseContent(close: () => void): ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const browse = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  function close() {
    setOpen(false);
    browse.current?.focus();
  }

  useEffect(() => {
    const row = scroll.current;
    const selected = Array.from(
      row?.querySelectorAll<HTMLButtonElement>("[data-hand-id]") ?? [],
    ).find((item) => item.dataset.handId === selectedHandId);
    if (!row || !selected) return;
    const viewport = row.getBoundingClientRect();
    const item = selected.getBoundingClientRect();
    if (item.left < viewport.left) row.scrollLeft += item.left - viewport.left;
    if (item.right > viewport.right) row.scrollLeft += item.right - viewport.right;
  }, [selectedHandId, hands]);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!shell.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <section className="noc-replayer-strip" aria-label="Replayer hand strip">
      <header className="noc-replayer-strip__header">
        <div>
          <button className="noc-replayer-strip__back" type="button" onClick={onBack}>
            <ChevronLeft size={14} aria-hidden="true" /> Tournament overview
          </button>
          <h1>{title}</h1>
          <p>{context}</p>
        </div>
        <span className="noc-replayer-strip__count">{totalHands} hands</span>
      </header>
      <div className="noc-replayer-strip__body" ref={shell}>
        <div className="noc-replayer-strip__scroll" ref={scroll} aria-label="Hands">
          {hands.map((hand) => {
            const selected = hand.id === selectedHandId;
            return (
              <button
                key={hand.id}
                type="button"
                className="noc-replayer-strip__item"
                data-hand-id={hand.id}
                aria-label={`Hand #${hand.handNumber}, ${hand.spot}, ${hand.cards.map(cardAccessibilityLabel).join(", ")}${selected ? ", selected" : ""}`}
                aria-current={selected ? "true" : undefined}
                onClick={() => onSelectHand(hand.id)}
              >
                <span className="noc-replayer-strip__item-top">
                  <strong>#{hand.handNumber}</strong>
                  <span>{hand.spot}</span>
                </span>
                <span className="noc-replayer-strip__item-bottom">
                  <span className="noc-replayer-strip__cards">
                    {hand.cards.map((card, index) => (
                      <PlayingCard
                        key={`${card.rank}${card.suit}-${index}`}
                        card={card}
                        variant="compact"
                      />
                    ))}
                  </span>
                  <span className="noc-replayer-strip__grade">Not analysed</span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          ref={browse}
          className="noc-replayer-strip__browse"
          type="button"
          aria-label={`Browse all ${totalHands} ${totalHands === 1 ? "hand" : "hands"}`}
          aria-expanded={open}
          aria-controls={popoverId}
          onClick={() => setOpen((value) => !value)}
        >
          <List size={20} aria-hidden="true" />
          <strong>Browse all</strong>
          <span>{totalHands}</span>
        </button>
        {open && (
          <div
            id={popoverId}
            className="noc-replayer-strip__popover"
            role="dialog"
            aria-label="Browse all hands"
          >
            <div className="noc-replayer-strip__popover-header">
              <h2>Browse all hands</h2>
              <button
                ref={closeButton}
                type="button"
                onClick={close}
                aria-label="Close hand browser"
              >
                Close
              </button>
            </div>
            {browseContent(close)}
          </div>
        )}
      </div>
    </section>
  );
}
