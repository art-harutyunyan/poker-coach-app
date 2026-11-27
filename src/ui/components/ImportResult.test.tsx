import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImportResult } from "./ImportResult";
import type { ImportResultView } from "../importResultPresentation";

const base: ImportResultView = {
  id: 1,
  status: "processing",
  title: "Reading file…",
  fileName: "history.txt",
  detail: "",
  message: null,
  key: null,
};

describe("Nocturne import result row", () => {
  it("announces processing without fake progress or a Cancel action", () => {
    render(<ImportResult view={base} />);
    const row = screen.getByRole("status");
    expect(row).toHaveTextContent("Processing");
    expect(row).toHaveTextContent("Reading file…");
    expect(row).toHaveTextContent("history.txt");
    expect(within(row).getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
    expect(row).not.toHaveTextContent(/%|of \d+ hands/i);
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("shows typed warning counts and a reachable supplied action", () => {
    const onOpen = vi.fn();
    render(
      <ImportResult
        view={{
          ...base,
          status: "warning",
          title: "Daily Classic",
          detail: "233 hands accepted · 2 hands skipped",
        }}
        actions={<button onClick={onOpen}>Open</button>}
      />,
    );
    const row = screen.getByRole("status");
    expect(within(row).getByText("Warning")).toBeVisible();
    expect(row).toHaveTextContent("2 hands skipped");
    fireEvent.click(within(row).getByRole("button", { name: "Open" }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("announces conflict in text without offering destructive actions", () => {
    render(
      <ImportResult
        view={{
          ...base,
          status: "conflict",
          title: "Daily Classic — rejected",
          detail: "Tournament #123 already has different contents",
          message:
            "File rejected. The existing tournament is unchanged — nothing was merged or replaced.",
        }}
        actions={<button>Show existing</button>}
      />,
    );
    const row = screen.getByRole("alert");
    expect(row).toHaveTextContent("Conflict");
    expect(within(row).getByRole("button", { name: "Show existing" })).toBeVisible();
    expect(
      within(row).queryByRole("button", { name: /replace|merge|keep both/i }),
    ).toBeNull();
  });
});
