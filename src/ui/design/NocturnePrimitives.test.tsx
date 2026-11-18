import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  NocturneBadge,
  NocturneButton,
  NocturneEmptyState,
  NocturneFilterChip,
  NocturneGradePill,
  NocturneIconButton,
  NocturneSearchInput,
  NocturneSegmentedControl,
  NocturneUnavailable,
} from "./NocturnePrimitives";

describe("Nocturne primitives", () => {
  it("keeps actions semantic and makes loading actions inert", () => {
    const onClick = vi.fn();
    render(
      <>
        <NocturneButton onClick={onClick}>Import hands</NocturneButton>
        <NocturneButton loading onClick={onClick}>
          Importing
        </NocturneButton>
      </>,
    );

    const action = screen.getByRole("button", { name: "Import hands" });
    expect(action).toHaveAttribute("type", "button");
    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledTimes(1);

    const loading = screen.getByRole("button", { name: "Importing" });
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute("aria-busy", "true");
    fireEvent.click(loading);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows readable grade and status names without relying on color", () => {
    render(
      <>
        <NocturneGradePill grade="major" label="Major mistake" />
        <NocturneBadge status="warning">Needs review</NocturneBadge>
        <NocturneUnavailable />
      </>,
    );

    expect(screen.getByText("Major mistake")).toHaveAttribute("data-grade", "major");
    expect(screen.getByText("Needs review")).toHaveAttribute("data-status", "warning");
    expect(screen.getByText("—")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });

  it("exposes selected filter state and permits disabled chips", () => {
    const onClick = vi.fn();
    render(
      <>
        <NocturneFilterChip selected onClick={onClick}>
          Played
        </NocturneFilterChip>
        <NocturneFilterChip disabled onClick={onClick}>
          Unavailable
        </NocturneFilterChip>
      </>,
    );

    const selected = screen.getByRole("button", { name: "Played" });
    expect(selected).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(selected);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });

  it("names search and icon controls accessibly", () => {
    render(
      <>
        <NocturneSearchInput
          label="Search tournaments"
          placeholder="Find a tournament"
        />
        <NocturneIconButton aria-label="Clear search">×</NocturneIconButton>
      </>,
    );

    expect(screen.getByRole("searchbox", { name: "Search tournaments" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeVisible();
  });

  it("reports the selected segment and dispatches another choice", () => {
    const onValueChange = vi.fn();
    render(
      <NocturneSegmentedControl
        label="View mode"
        value="grid"
        onValueChange={onValueChange}
        options={[
          { value: "grid", label: "Grid" },
          { value: "list", label: "List" },
        ]}
      />,
    );

    expect(screen.getByRole("group", { name: "View mode" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Grid" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "List" }));
    expect(onValueChange).toHaveBeenCalledWith("list");
  });

  it("uses a heading for empty-state titles at the chosen page level", () => {
    render(
      <NocturneEmptyState
        title="No tournaments yet"
        description="Import a hand history to begin."
        headingLevel={3}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "No tournaments yet" }),
    ).toBeVisible();
    expect(screen.getByText("Import a hand history to begin.")).toBeVisible();
  });
});
