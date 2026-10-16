import * as Deck from "@letele/playing-cards";
import { Fragment, type ComponentType, type ReactNode, type SVGProps } from "react";
import type { Card } from "../../domain/schemas";
import {
  block52DealerUrl,
  block52ChipUrl,
  cardAssetUrl,
  cardBackUrl,
} from "./visualThemes";

type CardCode =
  "AS" | "AH" | "KD" | "QC" | "JS" | "TH" | "7C" | "2D" | "5S" | "KS" | "9H";
type DisplaySize = "hero" | "board" | "compact";

const sampleCards: Array<{ code: CardCode; label: string }> = [
  { code: "AS", label: "A\u2660" },
  { code: "AH", label: "A\u2665" },
  { code: "KD", label: "K\u2666" },
  { code: "QC", label: "Q\u2663" },
  { code: "JS", label: "J\u2660" },
  { code: "TH", label: "10\u2665" },
  { code: "7C", label: "7\u2663" },
  { code: "2D", label: "2\u2666" },
];

const leteleCards: Record<CardCode | "BACK", ComponentType<SVGProps<SVGSVGElement>>> = {
  "2D": Deck.D2,
  "5S": Deck.S5,
  "7C": Deck.C7,
  "9H": Deck.H9,
  AH: Deck.Ha,
  AS: Deck.Sa,
  BACK: Deck.B1,
  JS: Deck.Sj,
  KD: Deck.Dk,
  KS: Deck.Sk,
  QC: Deck.Cq,
  TH: Deck.H10,
};

const heroHand: CardCode[] = ["AS", "5S"];
const flop: CardCode[] = ["AH", "7C", "2D"];
const board: CardCode[] = ["AH", "7C", "2D", "KS", "9H"];

const deckCandidates = [
  {
    bestFor: "Ornate, public-domain baseline",
    license: "CC0-1.0",
    name: "The Public Domain Deck",
    render: (code: CardCode | "BACK", size: DisplaySize) => (
      <AssetCardImage
        label={code}
        size={size}
        src={
          code === "BACK"
            ? cardBackUrl("public-domain")
            : cardAssetUrl(toCard(code), "public-domain")
        }
      />
    ),
    source: "OpenDecks / public-domain SVG deck",
    status: "Verified public-domain/CC0 repository with SVG and PNG files.",
    verdict:
      "Strong license posture and real face-card artwork, but the court style may feel more classic than analytical.",
  },
  {
    bestFor: "Poker-specific SVG/CDN workflow",
    license: "MIT",
    name: "Block52 Cards",
    render: (code: CardCode | "BACK", size: DisplaySize) => (
      <AssetCardImage
        label={code}
        size={size}
        src={
          code === "BACK"
            ? cardBackUrl("block52")
            : cardAssetUrl(toCard(code), "block52")
        }
      />
    ),
    source: "block52/cards",
    status: "Poker-oriented SVG repository with card backs, chips, and dealer assets.",
    verdict:
      "Best fit to evaluate first for Poker Coach because the asset set includes poker-adjacent chips/dealer pieces.",
  },
  {
    bestFor: "React/SVG component integration",
    license: "CC0-1.0",
    name: "@letele/playing-cards",
    render: (code: CardCode | "BACK", size: DisplaySize) => (
      <LeteleCard code={code} size={size} />
    ),
    source: "npm package and GitHub repo",
    status: "Installed only for the visual lab route; production cards are unchanged.",
    verdict:
      "Technically convenient and permissive, though visuals are traditional and package activity is modest.",
  },
] as const;

const chipSamples = [
  { amount: "0.5 BB", tone: "blind" },
  { amount: "1 BB", tone: "blind" },
  { amount: "2.3 BB", tone: "raise" },
  { amount: "7.5 BB", tone: "pressure" },
  { amount: "All-in", tone: "allin" },
];

export function CardLab() {
  return (
    <main className="cardLab">
      <header className="cardLabHeader">
        <div>
          <p className="eyebrow">Development-only route</p>
          <h1>Card / Chip / Table Asset Lab</h1>
        </div>
        <a className="secondaryButton" href="/">
          Back to app
        </a>
      </header>

      <section className="labIntro">
        <p>
          Temporary visual evaluation only. These assets are not integrated into the
          production Hand Replayer yet.
        </p>
      </section>

      <section className="labDeckGrid" aria-label="Card deck candidates">
        {deckCandidates.map((candidate) => (
          <article className="labPanel deckCandidate" key={candidate.name}>
            <div className="labPanelHeader">
              <div>
                <p className="eyebrow">{candidate.source}</p>
                <h2>{candidate.name}</h2>
              </div>
              <span className="labLicense">{candidate.license}</span>
            </div>
            <p>{candidate.status}</p>

            <LabCardGroup title="Representative faces">
              <div className="labCardRun">
                {sampleCards.map((card) => (
                  <div className="labCardWithLabel" key={card.code}>
                    {candidate.render(card.code, "hero")}
                    <span>{card.label}</span>
                  </div>
                ))}
              </div>
            </LabCardGroup>

            <LabCardGroup title="Card back">
              <div className="labCardRun">{candidate.render("BACK", "hero")}</div>
            </LabCardGroup>

            <LabCardGroup title="Hero hand size">
              <div className="labCardRun">
                {heroHand.map((code) => (
                  <Fragment key={`${candidate.name}-hero-${code}`}>
                    {candidate.render(code, "hero")}
                  </Fragment>
                ))}
              </div>
            </LabCardGroup>

            <LabCardGroup title="Community card size">
              <div className="labCardRun">
                {flop.map((code) => (
                  <Fragment key={`${candidate.name}-flop-${code}`}>
                    {candidate.render(code, "board")}
                  </Fragment>
                ))}
              </div>
            </LabCardGroup>

            <LabCardGroup title="Compact / training size">
              <div className="labCardRun">
                {sampleCards.slice(0, 5).map((card) => (
                  <Fragment key={`${candidate.name}-compact-${card.code}`}>
                    {candidate.render(card.code, "compact")}
                  </Fragment>
                ))}
              </div>
            </LabCardGroup>

            <LabCardGroup title="Full board example">
              <div className="labCardRun">
                {board.map((code) => (
                  <Fragment key={`${candidate.name}-board-${code}`}>
                    {candidate.render(code, "board")}
                  </Fragment>
                ))}
              </div>
            </LabCardGroup>

            <p className="labVerdict">{candidate.verdict}</p>
          </article>
        ))}
      </section>

      <section className="labSplit">
        <article className="labPanel">
          <div className="labPanelHeader">
            <div>
              <p className="eyebrow">Chip / dealer evaluation</p>
              <h2>Committed-bet assets</h2>
            </div>
          </div>
          <div className="chipAssetRows">
            <div>
              <h3>Block52 SVG assets</h3>
              <div className="externalChipRow">
                <img alt="Block52 chip" src={block52ChipUrl("sm")} />
                <img alt="Block52 chip medium" src={block52ChipUrl("md")} />
                <img alt="Block52 dealer button" src={block52DealerUrl()} />
              </div>
            </div>
            <div>
              <h3>Programmable Poker Coach markers</h3>
              <div className="labChipGrid">
                {chipSamples.map((sample) => (
                  <div
                    className="labBetMarker"
                    data-tone={sample.tone}
                    key={sample.amount}
                  >
                    <span className="labChipStack" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <strong>{sample.amount}</strong>
                  </div>
                ))}
              </div>
              <div className="dealerLabButton">D</div>
            </div>
          </div>
        </article>

        <article className="labPanel">
          <div className="labPanelHeader">
            <div>
              <p className="eyebrow">Programmable table skins</p>
              <h2>Table visual experiments</h2>
            </div>
          </div>
          <div className="tableSkinGrid">
            <TableSkin name="Deep emerald felt" skin="emerald" />
            <TableSkin name="Graphite emerald" skin="graphite" />
            <TableSkin name="Subtle felt texture" skin="texture" />
          </div>
        </article>
      </section>

      <section className="labPanel labRecommendation">
        <p className="eyebrow">Recommendation</p>
        <h2>Recommended direction for review</h2>
        <p>
          Start from Block52 for the first integration trial because it is
          poker-specific, MIT licensed, and includes matching cards, card backs, chips,
          and dealer assets. Pair it with programmable Poker Coach bet markers and the
          subtle felt-texture table skin so the replayer remains analytical, responsive,
          and not casino-themed.
        </p>
        <ul>
          <li>Card deck: Block52 first; Public Domain Deck is the safest fallback.</li>
          <li>
            Chip/dealer: evaluate Block52 dealer icon, but keep bet amounts
            programmable.
          </li>
          <li>
            Table: keep HTML/CSS/SVG geometry; use the subtle felt texture direction.
          </li>
          <li>
            License caveat: preserve MIT notice if Block52 assets ship in production.
          </li>
          <li>Expected effort: one card adapter plus one chip/dealer asset wrapper.</li>
        </ul>
      </section>
    </main>
  );
}

function toCard(code: CardCode): Card {
  const rank = code.slice(0, -1) === "T" ? "T" : code.slice(0, -1);
  const suit = code.slice(-1).toLowerCase();

  return {
    rank: rank as Card["rank"],
    suit: suit as Card["suit"],
  };
}

function LabCardGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="labCardGroup">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function AssetCardImage({
  label,
  size,
  src,
}: {
  label: string;
  size: DisplaySize;
  src: string;
}) {
  return (
    <span className="assetCard" data-size={size}>
      <img alt={label} src={src} />
    </span>
  );
}

function LeteleCard({ code, size }: { code: CardCode | "BACK"; size: DisplaySize }) {
  const Card = leteleCards[code];

  return (
    <span className="assetCard componentCard" data-size={size}>
      <Card aria-label={code} />
    </span>
  );
}

function TableSkin({ name, skin }: { name: string; skin: string }) {
  return (
    <div className="tableSkin" data-skin={skin}>
      <div className="tableSkinRail">
        <div className="tableSkinCenter">
          <span>POT</span>
          <strong>4.5 BB</strong>
          <div className="tableSkinBoard">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
      <span>{name}</span>
    </div>
  );
}
