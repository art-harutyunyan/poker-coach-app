import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { parseGgTournament } from "../../parsers/gg";
import { readFixture } from "../../parsers/gg/fixtureTestUtils";
import { ImportDiagnostics } from "./ImportDiagnostics";

it("separates source gaps from anomalies and retains expandable diagnostics", () => {
  const parsed = parseGgTournament(readFixture(3));
  if (!parsed.ok) throw new Error("fixture failed");
  render(<ImportDiagnostics warnings={parsed.warnings} />);
  expect(screen.getByRole("heading", { name: "Import status" })).toBeVisible();
  expect(screen.getByText("Info (3)")).toBeVisible();
  expect(screen.getByText("Warnings (4)")).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Warnings (4)"));
  const detail = screen.getAllByText("Technical details")[3]!;
  fireEvent.click(detail);
  expect(
    screen.getAllByText(/SHORT_BLIND_POST|ZERO_STACK_FOLD/).length,
  ).toBeGreaterThan(0);
});
it("shows neutral success without notices", () => {
  render(<ImportDiagnostics warnings={[]} />);
  expect(screen.getByText("No import notices.")).toBeVisible();
});
it("keeps failed imports as alerts without success text", () => {
  render(
    <ImportDiagnostics
      warnings={[]}
      error={{ kind: "file", code: "read_failed", message: "Unable to read file" }}
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Unable to read file");
  expect(screen.queryByText("No import notices.")).not.toBeInTheDocument();
});
