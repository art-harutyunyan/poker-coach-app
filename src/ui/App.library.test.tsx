import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { App } from "./App";
import { fixtureHand } from "../parsers/gg/fixtureTestUtils";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
async function importHand(source: string) {
  fireEvent.click(screen.getAllByRole("button", { name: /Upload tournament/i })[0]!);
  fireEvent.change(screen.getByLabelText("Hand history file"), {
    target: { files: [new File([source], "history.txt", { type: "text/plain" })] },
  });
  await screen.findByRole("button", { name: "Open tournament" });
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
}
describe("session Library route", () => {
  it("opens metadata-only Library, retains A and B, and returns from selected review", async () => {
    window.history.replaceState({}, "", "/");
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Tournaments" }));
    expect(screen.getByRole("heading", { name: "Tournament Library" })).toBeVisible();
    await importHand(fixtureHand(0, "TM6469820465"));
    await importHand(fixtureHand(1, "TM6471062694"));
    expect(screen.getAllByRole("article", { name: /tournament \d+/i })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: /^Open Tournament / })[1]!);
    expect(screen.getByRole("button", { name: "Tournament Library" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Tournament Library" }));
    expect(screen.getAllByRole("article", { name: /tournament \d+/i })).toHaveLength(2);
    expect(screen.queryByText("VPIP")).not.toBeInTheDocument();
  }, 30000);
  it("updates the Nocturne overview with the selected library tournament", async () => {
    window.history.replaceState({}, "", "/?route=tournaments");
    render(<App />);
    await importHand(fixtureHand(0, "TM6469820465"));
    await importHand(fixtureHand(1, "TM6471062694"));
    const library = screen.getByRole("region", { name: "Tournament Library" });
    const firstRow = screen.getByRole("article", { name: /tournament 314729652/i });
    const secondRow = screen.getByRole("article", { name: /tournament 314806258/i });
    fireEvent.click(
      within(firstRow).getByRole("button", { name: /^Open Tournament / }),
    );
    expect(library).toBeVisible();
    expect(firstRow).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("region", { name: "Tournament overview" }),
    ).toHaveTextContent("Daily Monster Stack");
    fireEvent.click(
      within(secondRow).getByRole("button", { name: /^Open Tournament / }),
    );
    expect(secondRow).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("region", { name: "Tournament overview" }),
    ).toHaveTextContent("Fifty Stack");
  }, 30000);
});
