import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { parseGgTournament } from "../../parsers/gg";
import { fixtureHand } from "../../parsers/gg/fixtureTestUtils";
import { ImportedHandNavigator } from "./ImportedHandNavigator";

describe("shared imported hand cards", () => {
  it("keeps source numbering for filtered rows and shows controls within the rail", () => {
    const parsed = parseGgTournament(fixtureHand(0, "TM6468725291"));
    if (!parsed.ok) throw new Error("Invalid real fixture");
    const hand = parsed.tournament.hands[0]!;
    render(
      <ImportedHandNavigator
        hands={[{ ...hand, handNumber: 42 }]}
        selectedHandId="outside"
        onSelectHand={vi.fn()}
        variant="rail"
        controls={<button type="button">Played 1 / 2</button>}
      />,
    );
    const aside = screen.getByRole("complementary", { name: "Imported hands" });
    expect(within(aside).getByRole("button", { name: "Played 1 / 2" })).toBeVisible();
    expect(within(aside).getByText("Hand #42")).toBeVisible();
    expect(within(aside).getByRole("button", { name: /Hand #42/ })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("shows a zero-match state without changing the current hand", () => {
    render(
      <ImportedHandNavigator
        hands={[]}
        selectedHandId="retained"
        onSelectHand={vi.fn()}
        variant="rail"
        emptyMessage="No hands match this filter"
      />,
    );
    expect(screen.getByText("No hands match this filter")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each(["rail", "list"] as const)(
    "renders real Hero cards and neutral metadata in the %s",
    (variant) => {
      const parsed = parseGgTournament(fixtureHand(0, "TM6468725291"));
      if (!parsed.ok) throw new Error("Invalid real fixture");
      const hand = parsed.tournament.hands[0]!;
      const onSelect = vi.fn();
      const original = structuredClone(hand);
      render(
        <ImportedHandNavigator
          hands={[hand]}
          selectedHandId={hand.id}
          onSelectHand={onSelect}
          variant={variant}
        />,
      );
      const row = screen.getByRole("button");
      expect(within(row).getByLabelText("King of diamonds")).toBeVisible();
      expect(within(row).getByLabelText("King of clubs")).toBeVisible();
      expect(
        row.querySelectorAll(".playingCard[data-card-variant=" + '"compact"]'),
      ).toHaveLength(2);
      expect(row).toHaveTextContent("Hand #1");
      expect(row).toHaveTextContent("BB");
      expect(row).toHaveTextContent("8/8 players");
      expect(row).toHaveTextContent("TM6468725291");
      expect(row).toHaveAttribute("aria-current", "true");
      expect(row).not.toHaveTextContent(
        /Excellent|Mistake|Inaccurate|recommend|missed opportunity/i,
      );
      fireEvent.click(row);
      expect(onSelect).toHaveBeenCalledWith("TM6468725291");
      expect(hand).toEqual(original);
    },
  );
});
