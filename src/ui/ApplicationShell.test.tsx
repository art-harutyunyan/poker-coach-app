import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApplicationShell, MainWorkspace } from "./ApplicationShell";

describe("Nocturne application shell", () => {
  it("renders the existing destinations with an accessible current page", () => {
    render(
      <ApplicationShell
        route="tournaments"
        onNavigate={vi.fn()}
        onUpload={vi.fn()}
        onSettings={vi.fn()}
      >
        <MainWorkspace>
          <h1>Tournament Library</h1>
        </MainWorkspace>
      </ApplicationShell>,
    );

    const rail = screen.getByRole("navigation", { name: "Primary navigation" });
    expect(within(rail).getByRole("button", { name: "Tournaments" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const name of ["Dashboard", "Development", "Training", "Playbook"]) {
      expect(within(rail).getByRole("button", { name })).not.toHaveAttribute(
        "aria-current",
      );
    }
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { name: "Tournament Library" }),
    );
  });

  it("passes rail and mobile navigation actions through to the app", () => {
    const onNavigate = vi.fn();
    const onUpload = vi.fn();
    const onSettings = vi.fn();
    render(
      <ApplicationShell
        route="dashboard"
        onNavigate={onNavigate}
        onUpload={onUpload}
        onSettings={onSettings}
      >
        <MainWorkspace>Dashboard content</MainWorkspace>
      </ApplicationShell>,
    );

    fireEvent.click(
      screen
        .getByRole("navigation", { name: "Primary navigation" })
        .querySelector('button[title="Tournaments"]')!,
    );
    expect(onNavigate).toHaveBeenCalledWith("tournaments");
    fireEvent.click(screen.getByRole("button", { name: "Upload tournament" }));
    fireEvent.click(screen.getByRole("button", { name: "Settings & profile" }));
    expect(onUpload).toHaveBeenCalledOnce();
    expect(onSettings).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByRole("combobox", { name: "Primary mobile screen" }), {
      target: { value: "development" },
    });
    expect(onNavigate).toHaveBeenCalledWith("development");
  });
});
