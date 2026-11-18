import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { parseGgTournament } from "../../parsers/gg";
import { fixtureHand } from "../../parsers/gg/fixtureTestUtils";
import { prepareLibraryInsert, tournamentKey } from "../../services/tournamentLibrary";
import { TournamentLibrary } from "./TournamentLibrary";

function entry() {
  const parsed = parseGgTournament(fixtureHand(0, "TM6469820465"));
  if (!parsed.ok) throw new Error("Fixture failed");
  const result = prepareLibraryInsert([], parsed.tournament, parsed.warnings);
  if (result.status !== "added") throw new Error("Preparation failed");
  return result.entry;
}

describe("Tournament Library", () => {
  it("shows the empty state and a session-only import action", () => {
    const onImport = vi.fn();
    render(<TournamentLibrary entries={[]} onOpen={vi.fn()} onImport={onImport} />);
    expect(screen.getByRole("heading", { name: "Tournament Library" })).toBeVisible();
    expect(
      screen.getByText(/Closing or refreshing this page clears imports/),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    expect(onImport).toHaveBeenCalledOnce();
  });
  it("shows source metadata without invented grades or statistics and offers three actions", () => {
    const item = entry();
    const onOpen = vi.fn();
    render(<TournamentLibrary entries={[item]} onOpen={onOpen} onImport={vi.fn()} />);
    const row = screen.getByRole("article", { name: new RegExp(item.tournament.id) });
    expect(row).toHaveTextContent(item.tournament.name);
    expect(row).toHaveTextContent(item.tournament.id);
    expect(row).toHaveTextContent("1 hand");
    expect(row).toHaveTextContent("Format unknown");
    expect(row).toHaveTextContent("28 Sep 2026");
    expect(row).not.toHaveTextContent(/VPIP|PFR|profit|grade/i);
    for (const [label, tab] of [
      ["Open Tournament", "overview"],
      ["Replayer", "replayer"],
      ["Review Queue", "review"],
    ] as const) {
      fireEvent.click(
        within(row).getByRole("button", {
          name: `${label} ${item.tournament.name} #${item.tournament.id}`,
        }),
      );
      expect(onOpen).toHaveBeenLastCalledWith(item.key, tab);
    }
  });
  it("disambiguates equal names by source ID and states when buy-in is unknown", () => {
    const first = entry();
    const secondTournament = {
      ...first.tournament,
      id: "different-source-id",
      buyIn: null,
    };
    const second = {
      ...first,
      key: tournamentKey(secondTournament),
      tournament: secondTournament,
    };
    render(
      <TournamentLibrary
        entries={[first, second]}
        onOpen={vi.fn()}
        onImport={vi.fn()}
      />,
    );
    expect(
      screen.getAllByRole("heading", { name: first.tournament.name }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("article", { name: /different-source-id/ }),
    ).toHaveTextContent("Buy-in—");
    expect(
      screen.getByRole("article", { name: new RegExp(first.tournament.id) }),
    ).toHaveTextContent(`#${first.tournament.id}`);
  });
  it("offers deterministic search, date sort, and only supported segments", () => {
    const first = entry();
    const secondTournament = {
      ...first.tournament,
      id: "newer-id",
      name: "Sunday Special",
      timestampRange: {
        first: { local: "2026-10-11T21:00:00", timezone: null },
        last: { local: "2026-10-11T22:00:00", timezone: null },
      },
    };
    const second = {
      ...first,
      key: tournamentKey(secondTournament),
      tournament: secondTournament,
    };
    render(
      <TournamentLibrary
        entries={[first, second]}
        onOpen={vi.fn()}
        onImport={vi.fn()}
      />,
    );
    const rows = () => screen.getAllByRole("article", { name: /tournament/i });
    expect(rows().map((row) => row.getAttribute("aria-label"))).toEqual([
      expect.stringContaining("newer-id"),
      expect.stringContaining(first.tournament.id),
    ]);
    expect(screen.getByRole("button", { name: "Analysed" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Needs action" })).toBeDisabled();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search tournaments" }), {
      target: { value: "314729652" },
    });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent(first.tournament.name);
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    fireEvent.click(screen.getByRole("button", { name: "Date: newest first" }));
    expect(rows()[0]).toHaveTextContent(first.tournament.name);
  });

  it("shows the selected tournament with unknown Won and no invented achievement", () => {
    const item = entry();
    render(
      <TournamentLibrary
        entries={[item]}
        selectedKey={item.key}
        onOpen={vi.fn()}
        onImport={vi.fn()}
      />,
    );
    const row = screen.getByRole("article", { name: new RegExp(item.tournament.id) });
    expect(row).toHaveAttribute("aria-current", "true");
    expect(
      within(row).getByRole("button", {
        name: `Open Tournament ${item.tournament.name} #${item.tournament.id}`,
      }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      within(row).getByRole("button", {
        name: `Replayer ${item.tournament.name} #${item.tournament.id}`,
      }),
    ).toBeInTheDocument();
    expect(within(row).getByText("Winnings unknown")).toBeInTheDocument();
    expect(row).toHaveTextContent("Analysis not available");
    expect(row).not.toHaveTextContent("$0.00");
    expect(row).not.toHaveTextContent(/Winner|Final table|ITM|mistakes|flagged/i);
  });

  it("finds a tournament when its displayed ID is pasted into search", () => {
    const item = entry();
    render(<TournamentLibrary entries={[item]} onOpen={vi.fn()} onImport={vi.fn()} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search tournaments" }), {
      target: { value: `#${item.tournament.id}` },
    });
    expect(
      screen.getByRole("article", { name: new RegExp(item.tournament.id) }),
    ).toBeVisible();
  });
});
