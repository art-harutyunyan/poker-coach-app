import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("phase 0 app prototype", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
    window.localStorage.clear();
  });

  it("opens the mocked replayer and advances with keyboard controls", async () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Tournaments" }));
    fireEvent.click(screen.getByRole("button", { name: "View demo tournament" }));
    activateTab("Replayer");

    expect(screen.getAllByLabelText("Face-down card")).toHaveLength(4);
    expect(screen.queryByText(/^To act$/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll(".player-position-badge")).toHaveLength(8);
    expect(container.querySelectorAll(".seatIdentity .seatPosition")).toHaveLength(0);
    expect(
      container.querySelector('.player-nameplate[aria-current="true"]'),
    ).toBeInTheDocument();
    expect(container.querySelector(".is-acting .player-action-text")).toBeNull();
    expect(container.querySelector(".action-raise")).toHaveTextContent(
      "Raise to 2.3 BB",
    );

    expect(screen.getByText(/Hero to act · SB · 30.8 BB/i)).toBeInTheDocument();
    expect(screen.getByText(/Facing BTN raises to 2.3 BB/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(screen.getByText(/Next to act: BB · 19.7 BB/i)).toBeInTheDocument();
    expect(screen.getByText(/Facing SB calls 1.8 BB/i)).toBeInTheDocument();
  });

  it("links a review queue item to the relevant replay action state", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Tournaments" }));
    fireEvent.click(screen.getByRole("button", { name: "View demo tournament" }));
    activateTab("Review Queue");
    fireEvent.click(screen.getByRole("button", { name: /A5s SB vs BTN open/i }));

    expect(screen.getByRole("tab", { name: "Replayer" })).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByText(/Hero to act · SB · 30.8 BB/i)).toBeInTheDocument();
  });

  it("renders the development-only card lab route", async () => {
    window.history.pushState({}, "", "/design/card-lab");

    render(<App />);

    expect(
      await screen.findByRole(
        "heading",
        { name: /Card \/ Chip \/ Table Asset Lab/i },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("The Public Domain Deck")).toBeInTheDocument();
    expect(screen.getByText("Block52 Cards")).toBeInTheDocument();
    expect(screen.getByText("@letele/playing-cards")).toBeInTheDocument();
  });

  it("switches visual preview themes without resetting replay state", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Tournaments" }));
    fireEvent.click(screen.getByRole("button", { name: "View demo tournament" }));
    activateTab("Replayer");
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(screen.getByText(/Next to act: BB · 19.7 BB/i)).toBeInTheDocument();

    expect(screen.getByLabelText("Card deck preview")).not.toHaveTextContent(
      "Public Domain",
    );

    fireEvent.change(screen.getByLabelText("Card deck preview"), {
      target: { value: "letele" },
    });
    fireEvent.change(screen.getByLabelText("Table skin preview"), {
      target: { value: "graphite-emerald" },
    });
    fireEvent.change(screen.getByLabelText("Chip style preview"), {
      target: { value: "block52" },
    });

    expect(screen.getByText(/Next to act: BB · 19.7 BB/i)).toBeInTheDocument();
    expect(screen.getByText(/Facing SB calls 1.8 BB/i)).toBeInTheDocument();
  });
  it("previews an 8-max table size without resetting the current action", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Tournaments" }));
    fireEvent.click(screen.getByRole("button", { name: "View demo tournament" }));
    activateTab("Replayer");
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(screen.getByText(/Next to act: BB/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Table size preview"), {
      target: { value: "8" },
    });

    expect(screen.getByText("Aster")).toBeInTheDocument();
    expect(screen.getByText("LumaRaise")).toBeInTheDocument();
    expect(screen.getByText(/Next to act: BB/i)).toBeInTheDocument();
    expect(screen.getByText(/Facing SB calls 1.8 BB/i)).toBeInTheDocument();
  });

  it("previews a 9-max table size through the same PlayerSeat system", () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Tournaments" }));
    fireEvent.click(screen.getByRole("button", { name: "View demo tournament" }));
    activateTab("Replayer");

    fireEvent.change(screen.getByLabelText("Table size preview"), {
      target: { value: "9" },
    });

    expect(screen.getByText("NineLine")).toBeInTheDocument();
    expect(
      container.querySelector('.pokerStage[data-table-size="9"]'),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".player-position-badge")).toHaveLength(9);
    expect(screen.queryByText(/^To act$/i)).not.toBeInTheDocument();
  });

  it("provides an accessible compact mobile navigation control", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Primary mobile screen"), {
      target: { value: "development" },
    });

    expect(screen.getByRole("heading", { name: "Development" })).toBeInTheDocument();
  });

  it("keeps the sample hand strip truthful and marks the sample reviewed locally", () => {
    window.history.pushState({}, "", "/?route=tournaments&tab=replayer");
    render(<App />);
    const strip = screen.getByRole("region", { name: "Replayer hand strip" });
    expect(strip.querySelectorAll(".noc-replayer-strip__item")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Mark reviewed" }));
    expect(screen.getByRole("button", { name: "Reviewed" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(strip).toHaveTextContent("Not analysed");
    fireEvent.click(within(strip).getByRole("button", { name: "Browse all 1 hand" }));
    expect(screen.getByRole("dialog", { name: "Browse all hands" })).toHaveTextContent(
      "A5s",
    );
  });

  it("keeps fixed mock analysis explicit while exposing replay context", () => {
    window.history.pushState({}, "", "/?route=tournaments&tab=replayer");
    render(<App />);
    expect(
      screen.getByRole("complementary", { name: "Hand analysis" }),
    ).toHaveTextContent("Illustrative analysis");
    activateTab("Context");
    expect(screen.getByText(/does not re-analyze later actions/)).toBeInTheDocument();
    expect(screen.getByText("decision-a5s-sb-vs-btn-open")).toBeInTheDocument();
    activateTab("Decision");
    expect(
      screen.getByRole("button", { name: "Ask Coach about this decision" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Prototype percentages are illustrative and not solver output."),
    ).toBeInTheDocument();
  });
});

function activateTab(name: string) {
  const tab = screen.getByRole("tab", { name });
  fireEvent.pointerDown(tab, { button: 0, ctrlKey: false });
  fireEvent.pointerUp(tab);
  fireEvent.click(tab);
  fireEvent.keyDown(tab, { key: "Enter" });
}
