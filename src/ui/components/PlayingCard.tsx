import { Suspense, lazy } from "react";
import type { Card } from "../../domain/schemas";
import type { CSSProperties } from "react";
import spade from "../../assets/playing-cards/spade.svg?raw";
import heart from "../../assets/playing-cards/heart.svg?raw";
import diamond from "../../assets/playing-cards/diamond.svg?raw";
import club from "../../assets/playing-cards/club.svg?raw";
import approvedBack from "../../assets/playing-cards/card-back.svg?raw";
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

const suitArt = { s: spade, h: heart, d: diamond, c: club };
const suitNames = { s: "spades", h: "hearts", d: "diamonds", c: "clubs" };
const rankNames: Record<Card["rank"], string> = {
  A: "Ace",
  K: "King",
  Q: "Queen",
  J: "Jack",
  T: "Ten",
  "9": "Nine",
  "8": "Eight",
  "7": "Seven",
  "6": "Six",
  "5": "Five",
  "4": "Four",
  "3": "Three",
  "2": "Two",
};
export type CardVariant = "compact" | "table" | "board";

export function PlayingCard({
  card,
  rank = card?.rank,
  suit = card?.suit,
  concealed,
  context = "compact",
  variant = context === "hero" ? "table" : context,
  theme,
  "aria-hidden": ariaHidden,
}: {
  card?: Card;
  rank?: Card["rank"];
  suit?: Card["suit"];
  concealed?: boolean;
  context?: CardDisplayContext;
  variant?: CardVariant;
  theme?: CardTheme | "study";
  "aria-hidden"?: boolean;
}) {
  if (theme && theme !== "study" && import.meta.env.DEV) {
    return (
      <ThemedPlayingCard
        card={rank && suit ? { rank, suit } : undefined}
        concealed={concealed}
        context={context}
        theme={theme}
      />
    );
  }

  if (!rank || !suit || concealed) {
    return (
      <span
        className="playingCard cardBack"
        data-card-variant={variant}
        role="img"
        aria-hidden={ariaHidden}
        aria-label={ariaHidden ? undefined : "Face-down card"}
      >
        <span
          className="cardBackArtwork"
          aria-hidden="true"
          // The supplied asset supports explicit variants for inline use.
          // Only its root gains a variant; all approved geometry is retained.
          dangerouslySetInnerHTML={{
            __html: approvedBack.replace("<svg ", `<svg data-variant="${variant}" `),
          }}
        />
      </span>
    );
  }

  const isRed = suit === "h" || suit === "d";

  return (
    <span
      className="playingCard"
      data-card-variant={variant}
      data-red={isRed}
      role="img"
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : `${rankNames[rank]} of ${suitNames[suit]}`}
    >
      <span className="cardCorner" aria-hidden="true">
        <strong>{rank === "T" ? "10" : rank}</strong>
      </span>
      {/* Only the four checked-in, approved SVGs can reach this markup sink. */}
      <span
        className="cardSuit"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: suitArt[suit] }}
      />
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
