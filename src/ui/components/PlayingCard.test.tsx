import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PlayingCard } from "./PlayingCard";

it.each(["compact", "table", "board"] as const)(
  "renders domain Ten as 10 without mutating identity in %s",
  (variant) => {
    const card = Object.freeze({ rank: "T", suit: "d" } as const);
    render(<PlayingCard card={card} variant={variant} />);
    const face = screen.getByRole("img", { name: "Ten of diamonds" });
    expect(face).toHaveTextContent(/^10$/);
    expect(face).toHaveAttribute("data-card-variant", variant);
    expect(card).toEqual({ rank: "T", suit: "d" });
  },
);
it.each([
  ["s", "spades", "spade", false],
  ["h", "hearts", "heart", true],
  ["d", "diamonds", "diamond", true],
  ["c", "clubs", "club", false],
] as const)("uses the approved %s geometry and ink", (suit, name, asset, red) => {
  render(<PlayingCard rank="A" suit={suit} />);
  const card = screen.getByRole("img", { name: `Ace of ${name}` });
  const source = readFileSync(`src/assets/playing-cards/${asset}.svg`, "utf8");
  expect(card.querySelector("path")).toHaveAttribute(
    "d",
    source.match(/ d="([^"]+)"/)![1],
  );
  expect(card.querySelector("path")).toHaveAttribute("fill", "currentColor");
  expect(card.querySelector("svg")).toHaveAttribute("viewBox", "0 0 24 24");
  expect(card.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  expect(card.querySelector("svg")).toHaveAttribute("focusable", "false");
  expect(card).toHaveAttribute("data-red", String(red));
});
it("renders identical approved backs regardless of concealed identity", () => {
  const { container, rerender } = render(<PlayingCard concealed rank="A" suit="s" />);
  const back = screen.getByRole("img", { name: "Face-down card" });
  expect(back.querySelector(".cardCorner,.cardSuit,text,title")).toBeNull();
  expect(back.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  expect(back.querySelector("svg")).toHaveAttribute("focusable", "false");
  const source = readFileSync("src/assets/playing-cards/card-back.svg", "utf8");
  expect(source).toContain('<circle class="back-motif"');
  expect(back.querySelector("circle.back-motif")).toBeInTheDocument();
  expect(back).not.toHaveAttribute("data-red");
  const html = container.innerHTML;
  rerender(<PlayingCard concealed rank="T" suit="h" />);
  expect(container.innerHTML).toBe(html);
  rerender(<PlayingCard />);
  expect(container.innerHTML).toBe(html);
  rerender(<PlayingCard rank="K" />);
  expect(container.innerHTML).toBe(html);
  rerender(<PlayingCard suit="c" />);
  expect(container.innerHTML).toBe(html);
});
it("uses the Nocturne navy back with an ivory border and centered ring", () => {
  const { container } = render(<PlayingCard concealed variant="table" />);
  const outer = container.querySelector(".back-outer");
  expect(outer).toHaveAttribute("fill", "#1A2238");
  expect(outer).toHaveAttribute("stroke", "#F1EDE4");
  expect(outer).toHaveAttribute("stroke-width", "2");
  expect(container.querySelector("circle.back-motif")).toBeInTheDocument();
});
it("supports a parent that already announces the full hand", () => {
  const { container } = render(<PlayingCard rank="Q" suit="h" aria-hidden />);
  expect(screen.queryByRole("img")).toBeNull();
  expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  expect(container.firstChild).not.toHaveAttribute("aria-label");
});
it("maps legacy hero context to table and prefers explicit variant", () => {
  const { rerender } = render(
    <PlayingCard card={{ rank: "J", suit: "c" }} context="hero" />,
  );
  expect(screen.getByRole("img")).toHaveAttribute("data-card-variant", "table");
  rerender(<PlayingCard rank="2" suit="c" context="hero" variant="board" />);
  expect(screen.getByRole("img", { name: "Two of clubs" })).toHaveAttribute(
    "data-card-variant",
    "board",
  );
});

it.each(["compact", "table", "board"] as const)(
  "pins the approved back geometry to %s even in a narrow shell",
  (variant) => {
    const { container } = render(<PlayingCard concealed variant={variant} />);
    expect(container.querySelector("svg.study-card-back")).toHaveAttribute(
      "data-variant",
      variant,
    );
  },
);
