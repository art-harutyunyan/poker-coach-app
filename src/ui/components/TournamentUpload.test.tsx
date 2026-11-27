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
  it("imports dropped files in selection order", async () => {
    const seen: string[] = [];
    const onImport = vi.fn(async (file: File) => {
      seen.push(file.name);
    });
    render(
      <TournamentUpload
        fileResults={[]}
        entries={[]}
        onImport={onImport}
        onOpenReview={vi.fn()}
      />,
    );

    fireEvent.drop(screen.getByRole("group", { name: "Drop GG hand histories" }), {
      dataTransfer: {
        files: [new File(["first"], "first.txt"), new File(["second"], "second.txt")],
      },
    });

    await vi.waitFor(() => expect(seen).toEqual(["first.txt", "second.txt"]));
    expect(onImport).toHaveBeenCalledTimes(2);
  });

  it("does not start the next file after the dialog unmounts", async () => {
    let releaseFirst: (() => void) | undefined;
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const onImport = vi.fn(() => firstPending);
    const { unmount } = render(
      <TournamentUpload
        fileResults={[]}
        entries={[]}
        onImport={onImport}
        onOpenReview={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Hand history file"), {
      target: {
        files: [new File(["first"], "first.txt"), new File(["second"], "second.txt")],
      },
    });
    expect(onImport).toHaveBeenCalledTimes(1);
    unmount();
    releaseFirst?.();
    await firstPending;
    await Promise.resolve();
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("explains that another drop must wait for the active selection", async () => {
    let releaseFirst: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const onImport = vi.fn(() => pending);
    render(
      <TournamentUpload
        fileResults={[]}
        entries={[]}
        onImport={onImport}
        onOpenReview={vi.fn()}
      />,
    );
    const dropArea = screen.getByRole("group", { name: "Drop GG hand histories" });

    fireEvent.drop(dropArea, {
      dataTransfer: { files: [new File(["first"], "first.txt")] },
    });
    expect(dropArea).toHaveAttribute("aria-disabled", "true");
    expect(dropArea).toHaveTextContent("Add more files after this selection finishes.");
    fireEvent.drop(dropArea, {
      dataTransfer: { files: [new File(["second"], "second.txt")] },
    });
    expect(onImport).toHaveBeenCalledTimes(1);
    releaseFirst?.();
    await vi.waitFor(() => expect(dropArea).toHaveAttribute("aria-disabled", "false"));
  });

  it("opens an exact duplicate without resetting its library entry", () => {
    const imported = entry();
    const onOpenReview = vi.fn();
    render(
      <TournamentUpload
        fileResults={[
          { id: 1, status: "duplicate", fileName: "copy.txt", key: imported.key },
        ]}
        entries={[imported]}
        onImport={vi.fn()}
        onOpenReview={onOpenReview}
      />,
    );
    expect(screen.getByRole("heading", { name: /already imported/ })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Nothing added.");
    fireEvent.click(screen.getByRole("button", { name: "Show existing" }));
    expect(onOpenReview).toHaveBeenCalledWith(imported.key);
  });

  it("explains a same-ID conflict without offering a destructive action", () => {
    const imported = entry();
    const onOpenReview = vi.fn();
    render(
      <TournamentUpload
        fileResults={[
          {
            id: 1,
            status: "conflict",
            fileName: "changed.txt",
            key: imported.key,
            tournamentId: imported.tournament.id,
          },
        ]}
        entries={[imported]}
        onImport={vi.fn()}
        onOpenReview={onOpenReview}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The existing tournament is unchanged — nothing was merged or replaced.",
    );
    expect(
      screen.queryByRole("button", { name: /replace|merge|keep both/i }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show existing" }));
    expect(onOpenReview).toHaveBeenCalledWith(imported.key);
  });
});
