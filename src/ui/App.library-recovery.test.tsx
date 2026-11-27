import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { readFixture } from "../parsers/gg/fixtureTestUtils";
import { parseGgTournament } from "../parsers/gg";
import { App } from "./App";

const failing = vi.hoisted(() => ({ handId: "" }));
vi.mock("./components/ImportedTournamentWorkspace", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("./components/ImportedTournamentWorkspace")>();
  return {
    ImportedTournamentWorkspace: (
      props: Parameters<typeof original.ImportedTournamentWorkspace>[0],
    ) => {
      if (props.state.selectedHandId === failing.handId) {
        throw new Error("Deliberate hand render failure");
      }
      return <original.ImportedTournamentWorkspace {...props} />;
    },
  };
});

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
afterEach(() => vi.restoreAllMocks());

it("lets a user choose another hand after a selected hand fails to render", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  window.history.replaceState({}, "", "/?route=tournaments");
  const source = readFixture(2);
  const parsed = parseGgTournament(source);
  if (!parsed.ok) throw new Error("Expected the GGMasters fixture to parse");
  failing.handId = parsed.tournament.hands[0]!.id;
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Import" }));
  fireEvent.change(screen.getByLabelText("Hand history file"), {
    target: {
      files: [new File([source], "ggmasters.txt", { type: "text/plain" })],
    },
  });
  await screen.findByRole("button", { name: "Open tournament" });
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  fireEvent.click(screen.getByRole("button", { name: /^Open Tournament / }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This hand could not be displayed",
  );
  const choices = screen.getByLabelText("Choose another hand") as HTMLSelectElement;
  const nextId = choices.options[1]!.value;
  fireEvent.change(choices, { target: { value: nextId } });
  expect(screen.getAllByRole("heading", { name: /GGMasters/ })[0]).toBeVisible();
  expect(screen.getByRole("button", { name: "Tournament Library" })).toBeVisible();
}, 15000);
