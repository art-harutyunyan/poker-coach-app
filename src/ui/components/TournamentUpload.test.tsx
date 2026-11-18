import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { parseGgTournament } from "../../parsers/gg";
import { fixtureHand } from "../../parsers/gg/fixtureTestUtils";
import { prepareLibraryInsert } from "../../services/tournamentLibrary";
import { TournamentUpload } from "./TournamentUpload";

function entry() {
  const parsed = parseGgTournament(fixtureHand(0, "TM6469820465"));
  if (!parsed.ok) throw new Error("Fixture failed");
  const result = prepareLibraryInsert([], parsed.tournament, parsed.warnings);
  if (result.status !== "added") throw new Error("Preparation failed");
  return result.entry;
}

describe("tournament upload status", () => {
  it("opens an exact duplicate without resetting its library entry", () => {
    const imported = entry();
    const onOpenReview = vi.fn();
    render(
      <TournamentUpload
        attempt={{ status: "complete", key: imported.key, duplicate: true }}
        completedEntry={imported}
        onImport={vi.fn()}
        onOpenReview={onOpenReview}
      />,
    );
    expect(screen.getByRole("heading", { name: "Already imported" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Open Tournament Review" }));
    expect(onOpenReview).toHaveBeenCalledWith(imported.key);
  });
  it("explains the same-ID content conflict without replacing the current review", () => {
    render(
      <TournamentUpload
        attempt={{ status: "conflict", tournamentId: "314729652" }}
        completedEntry={null}
        onImport={vi.fn()}
        onOpenReview={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tournament 314729652 is already imported with different contents. The existing tournament has been kept. Combining exports is not supported yet.",
    );
    expect(
      screen.queryByRole("button", { name: "Open Tournament Review" }),
    ).not.toBeInTheDocument();
  });
});
