import { Suspense, lazy } from "react";
import type { Card } from "../../domain/schemas";
import type { CSSProperties } from "react";
import type { CardDisplayContext, CardTheme } from "../design/visualThemes";
import {
  cardAssetUrl,
  cardBackUrl,
  cardThemeCalibration,
} from "../design/visualThemes";

const LeteleReplayerCard = import.meta.env.DEV
  ? lazy(() =>
      import("../design/LeteleReplayerCard").then((module) => ({
        default: module.LeteleReplayerCard,
      })),
    )
  : undefined;

export function PlayingCard({
  card,
  concealed,
  context = "compact",
  theme,
}: {
  card?: Card;
  concealed?: boolean;
  context?: CardDisplayContext;
  theme?: CardTheme;
}) {
  if (theme && import.meta.env.DEV) {
    return (
      <ThemedPlayingCard
        card={card}
        concealed={concealed}
        context={context}
        theme={theme}
      />
    );
  }

  if (!card || concealed) {
    return (
      <span className="playingCard cardBack" aria-label="Hidden card">
        <span />
      </span>
    );
  }

  const isRed = card.suit === "h" || card.suit === "d";
  const suitSymbol = {
    s: "\u2660",
    h: "\u2665",
    d: "\u2666",
    c: "\u2663",
  }[card.suit];

  return (
    <span
      className="playingCard"
      data-red={isRed}
      aria-label={`${card.rank}${suitSymbol}`}
    >
      <span className="cardCorner">
        <strong>{card.rank}</strong>
        <small>{suitSymbol}</small>
      </span>
      <span className="cardSuit">{suitSymbol}</span>
    </span>
  );
}

function ThemedPlayingCard({
  card,
  concealed,
  context,
  theme,
}: {
  card?: Card;
  concealed?: boolean;
  context: CardDisplayContext;
  theme: CardTheme;
}) {
  const visibleCard = concealed ? undefined : card;
  const calibration = cardThemeCalibration[theme][context];
  const calibrationStyle = {
    "--card-art-scale": calibration.artScale,
  } as CSSProperties;

  if (theme === "letele" && LeteleReplayerCard) {
    return (
      <span
        aria-label={
          visibleCard ? `${visibleCard.rank}${visibleCard.suit}` : "Hidden card"
        }
        className="playingCard deckAssetCard"
        data-card-context={context}
        data-card-theme={theme}
        style={calibrationStyle}
      >
        <Suspense fallback={<span className="cardAssetLoading" />}>
          <LeteleReplayerCard card={visibleCard} />
        </Suspense>
      </span>
    );
  }

  return (
    <span
      aria-label={
        visibleCard ? `${visibleCard.rank}${visibleCard.suit}` : "Hidden card"
      }
      className="playingCard deckAssetCard"
      data-card-context={context}
      data-card-theme={theme}
      style={calibrationStyle}
    >
      <img
        alt=""
        src={visibleCard ? cardAssetUrl(visibleCard, theme) : cardBackUrl(theme)}
      />
    </span>
  );
}
