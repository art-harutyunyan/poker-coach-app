import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cardRankSchema, cardSuitSchema } from "../../domain/schemas";
import { LeteleReplayerCard } from "./LeteleReplayerCard";

describe("complete accepted Letele deck", () => {
  for (const rank of cardRankSchema.options)
    for (const suit of cardSuitSchema.options) {
      it(`renders ${rank}${suit} as the correct face, never a hidden back`, () => {
        const { container } = render(<LeteleReplayerCard card={{ rank, suit }} />);
        const svg = container.querySelector("svg")!;
        expect(svg).toHaveAttribute("aria-label", `${rank}${suit}`);
        expect(svg.getAttribute("class")).toContain(
          `${suit.toUpperCase()}-${rank === "T" ? "10" : rank}_svg__card`,
        );
      });
    }
  it("uses a back only when cards are concealed", () => {
    const { container } = render(<LeteleReplayerCard />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-label", "Card back");
  });
});
