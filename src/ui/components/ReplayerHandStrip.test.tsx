import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReplayerHandStrip } from "./ReplayerHandStrip";

const hands = [
  {
    id: "h52",
    handNumber: 52,
    spot: "BTN",
    cards: [
      { rank: "K" as const, suit: "d" as const },
      { rank: "Q" as const, suit: "d" as const },
    ],
  },
  {
    id: "h49",
    handNumber: 49,
    spot: "BB",
    cards: [
      { rank: "A" as const, suit: "s" as const },
      { rank: "5" as const, suit: "s" as const },
    ],
  },
];

describe("Nocturne Replayer hand strip", () => {
  it("keeps supplied order, real compact cards, selected state and neutral grades", () => {
    const select = vi.fn();
    render(
      <ReplayerHandStrip
        title="GGMasters"
        context="Imported hand history"
        hands={hands}
        selectedHandId="h49"
        totalHands={222}
        onSelectHand={select}
        onBack={vi.fn()}
        browseContent={() => <p>Existing browser</p>}
      />,
    );
    const strip = screen.getByRole("region", { name: "Replayer hand strip" });
    const items = within(strip).getAllByRole("button", { name: /^Hand #/ });
    expect(items.map((item) => item.getAttribute("data-hand-id"))).toEqual([
      "h52",
      "h49",
    ]);
    expect(items[1]).toHaveAttribute("aria-current", "true");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[0]).toHaveAccessibleName(/King of diamonds, Queen of diamonds/);
    expect(within(items[0]!).getByLabelText("King of diamonds")).toBeVisible();
    expect(items[0]!.querySelectorAll('[data-card-variant="compact"]')).toHaveLength(2);
    expect(strip).toHaveTextContent("Not analysed");
    expect(strip).not.toHaveTextContent(/Best|Mistake|EV loss/i);
    fireEvent.click(items[0]!);
    expect(select).toHaveBeenCalledWith("h52");
  });

  it("pins Browse all, opens the existing browser and returns focus on Escape", () => {
    render(
      <ReplayerHandStrip
        title="GGMasters"
        context="Imported hand history"
        hands={hands}
        selectedHandId="h52"
        totalHands={222}
        onSelectHand={vi.fn()}
        onBack={vi.fn()}
        browseContent={() => <p>Existing browser</p>}
      />,
    );
    const browse = screen.getByRole("button", { name: "Browse all 222 hands" });
    expect(browse).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(browse);
    expect(browse).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Browse all hands" })).toHaveTextContent(
      "Existing browser",
    );
    expect(screen.getByRole("button", { name: "Close hand browser" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Browse all hands" })).toBeNull();
    expect(browse).toHaveFocus();
  });
});
