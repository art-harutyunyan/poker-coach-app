import type { Card } from "../../domain/schemas";

export type CardTheme = "public-domain" | "block52" | "letele";
export type ReplayerCardTheme = Exclude<CardTheme, "public-domain">;
export type TableTheme = "deep-emerald" | "graphite-emerald" | "felt-texture";
export type ChipTheme = "poker-coach" | "block52";
export type PreviewTableSize = 6 | 8 | 9;
export type CardDisplayContext = "hero" | "board" | "compact";

export interface VisualPreviewSelection {
  cardTheme: ReplayerCardTheme;
  tableTheme: TableTheme;
  chipTheme: ChipTheme;
  tableSize: PreviewTableSize;
}

export const defaultVisualPreview: VisualPreviewSelection = {
  cardTheme: "block52",
  chipTheme: "poker-coach",
  tableSize: 8,
  tableTheme: "deep-emerald",
};

export const visualPreviewStorageKey = "poker-coach.visual-preview.mockup-v1";

export const cardLabThemeOptions: Array<{ label: string; value: CardTheme }> = [
  { label: "Public Domain / OpenDecks", value: "public-domain" },
  { label: "Block52", value: "block52" },
  { label: "@letele/playing-cards", value: "letele" },
];

export const replayerCardThemeOptions: Array<{
  label: string;
  value: ReplayerCardTheme;
}> = [
  { label: "Classic", value: "block52" },
  { label: "Modern SVG", value: "letele" },
];

export const cardThemeCalibration: Record<
  CardTheme,
  Record<CardDisplayContext, { artScale: number }>
> = {
  "public-domain": {
    board: { artScale: 1.22 },
    compact: { artScale: 1.18 },
    hero: { artScale: 1.24 },
  },
  block52: {
    board: { artScale: 1.04 },
    compact: { artScale: 1.02 },
    hero: { artScale: 1.04 },
  },
  letele: {
    board: { artScale: 1.08 },
    compact: { artScale: 1.05 },
    hero: { artScale: 1.08 },
  },
};

export const tableThemeOptions: Array<{ label: string; value: TableTheme }> = [
  { label: "Emerald", value: "deep-emerald" },
  { label: "Graphite", value: "graphite-emerald" },
  { label: "Textured", value: "felt-texture" },
];

export const chipThemeOptions: Array<{ label: string; value: ChipTheme }> = [
  { label: "Study Chips", value: "poker-coach" },
  { label: "Block52", value: "block52" },
];

export const previewTableSizeOptions: Array<{
  label: string;
  value: PreviewTableSize;
}> = [
  { label: "6-max", value: 6 },
  { label: "8-max", value: 8 },
  { label: "9-max", value: 9 },
];

export const publicDomainBase =
  "https://raw.githubusercontent.com/AustinGabriel/The-Public-Domain-Deck-Public-Domain-and-CC0-Playing-Cards/main/svg%20cards";

export const block52Base = "https://raw.githubusercontent.com/block52/cards/main";

export function loadVisualPreviewSelection(): VisualPreviewSelection {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return defaultVisualPreview;
  }

  const urlPreview = previewFromUrl();

  try {
    const stored = window.localStorage.getItem(visualPreviewStorageKey);
    const parsed = stored ? JSON.parse(stored) : undefined;

    return {
      cardTheme:
        urlPreview.cardTheme ??
        (isReplayerCardTheme(parsed?.cardTheme)
          ? parsed.cardTheme
          : defaultVisualPreview.cardTheme),
      chipTheme:
        urlPreview.chipTheme ??
        (isChipTheme(parsed?.chipTheme)
          ? parsed.chipTheme
          : defaultVisualPreview.chipTheme),
      tableSize:
        urlPreview.tableSize ??
        (isPreviewTableSize(parsed?.tableSize)
          ? parsed.tableSize
          : defaultVisualPreview.tableSize),
      tableTheme:
        urlPreview.tableTheme ??
        (isTableTheme(parsed?.tableTheme)
          ? parsed.tableTheme
          : defaultVisualPreview.tableTheme),
    };
  } catch {
    return { ...defaultVisualPreview, ...urlPreview };
  }
}

export function saveVisualPreviewSelection(selection: VisualPreviewSelection): void {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(visualPreviewStorageKey, JSON.stringify(selection));
}

export function cardAssetUrl(card: Card | undefined, theme: CardTheme): string {
  if (!card) {
    return cardBackUrl(theme);
  }

  if (theme === "block52") {
    return `${block52Base}/${block52Code(card)}.svg`;
  }

  return publicDomainCardUrl(card);
}

export function cardBackUrl(theme: CardTheme): string {
  if (theme === "block52") {
    return `${block52Base}/Back.svg`;
  }

  return `${publicDomainBase}/card%20backs/card%20back%20blue.svg`;
}

export function block52ChipUrl(size: "sm" | "md" = "sm"): string {
  return `${block52Base}/${size === "sm" ? "chipsm" : "chipmd"}.svg`;
}

export function block52DealerUrl(): string {
  return `${block52Base}/dealer.svg`;
}

export function block52Code(card: Card): string {
  return `${rankCode(card.rank)}${card.suit.toUpperCase()}`;
}

function publicDomainCardUrl(card: Card): string {
  const suitFolder = {
    c: "clubs",
    d: "diamonds",
    h: "hearts",
    s: "spades",
  }[card.suit];

  return `${publicDomainBase}/card%20fronts/${suitFolder}/${rankName(
    card.rank,
  )}%20of%20${suitFolder}.svg`;
}

function rankCode(rank: Card["rank"]): string {
  return rank === "T" ? "T" : rank;
}

function rankName(rank: Card["rank"]): string {
  switch (rank) {
    case "A":
      return "ace";
    case "K":
      return "king";
    case "Q":
      return "queen";
    case "J":
      return "jack";
    case "T":
      return "10";
    default:
      return rank;
  }
}

function isReplayerCardTheme(value: unknown): value is ReplayerCardTheme {
  return value === "block52" || value === "letele";
}

function isTableTheme(value: unknown): value is TableTheme {
  return (
    value === "deep-emerald" || value === "graphite-emerald" || value === "felt-texture"
  );
}

function isChipTheme(value: unknown): value is ChipTheme {
  return value === "poker-coach" || value === "block52";
}

function isPreviewTableSize(value: unknown): value is PreviewTableSize {
  return value === 6 || value === 8 || value === 9;
}

function previewFromUrl(): Partial<VisualPreviewSelection> {
  const params = new URLSearchParams(window.location.search);
  const seats = Number(params.get("previewSeats"));
  const cardTheme = params.get("previewCards");
  const chipTheme = params.get("previewChips");
  const tableTheme = params.get("previewTable");

  return {
    ...(isReplayerCardTheme(cardTheme) ? { cardTheme } : {}),
    ...(isChipTheme(chipTheme) ? { chipTheme } : {}),
    ...(isPreviewTableSize(seats) ? { tableSize: seats } : {}),
    ...(isTableTheme(tableTheme) ? { tableTheme } : {}),
  };
}
