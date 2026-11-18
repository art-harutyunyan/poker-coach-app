import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { App } from "./App";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";

const showModal = HTMLDialogElement.prototype.showModal;
const close = HTMLDialogElement.prototype.close;

it("shows source-backed Overview stats while keeping W$SD masked and Library metadata-only", async () => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  try {
    window.history.replaceState({}, "", "/?route=tournaments");
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Upload tournament/i }));
    fireEvent.change(screen.getByLabelText("Hand history file"), {
      target: { files: [new File([fixtureHand(0, "TM6468725291")], "one.txt")] },
    });
    await screen.findByRole("heading", { name: "Import complete" });
    expect(screen.queryByText("VPIP")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Tournament Review" }));
    const stats = screen.getByRole("region", { name: "Tournament Stats" });
    expect(within(stats).getByText("VPIP")).toBeVisible();
    expect(within(stats).getByText("Single-tournament sample")).toBeVisible();
    const wsd = stats.querySelector('[data-metric="wsd"]')!;
    expect(wsd.textContent).toContain("Outcome stat hidden");
    expect(wsd.textContent).not.toMatch(/\d+\.\d+%/);
    fireEvent.click(
      within(wsd as HTMLElement).getByRole("button", { name: "Show outcome stat" }),
    );
    expect(wsd.textContent).toMatch(/\d+\.\d+%/);
    fireEvent.click(screen.getByRole("button", { name: "Tournament Library" }));
    expect(screen.getByRole("heading", { name: "Tournament Library" })).toBeVisible();
    expect(screen.queryByText("VPIP")).not.toBeInTheDocument();
  } finally {
    HTMLDialogElement.prototype.showModal = showModal;
    HTMLDialogElement.prototype.close = close;
  }
});
