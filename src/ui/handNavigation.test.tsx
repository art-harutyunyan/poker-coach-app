import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "./App";
import { readFixture } from "../parsers/gg/fixtureTestUtils";

const methods = ["showModal", "close"] as const;
const original = methods.map((name) =>
  Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name),
);
beforeAll(() =>
  methods.forEach((name) =>
    Object.defineProperty(HTMLDialogElement.prototype, name, {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = name === "showModal";
      },
    }),
  ),
);
afterAll(() =>
  methods.forEach((name, i) => {
    const descriptor = original[i];
    if (descriptor)
      Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }),
);
beforeEach(() => {
  window.history.replaceState({}, "", "/");
  window.localStorage.clear();
});

function tab(name: string) {
  const trigger = screen.getByRole("tab", { name });
  fireEvent.mouseDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.click(trigger);
}

describe("imported Replayer hand navigation", () => {
  it("filters only the navigator, keeps replay visible, and leaves Queue independent", async () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: /Upload tournament/i })[0]!);
    fireEvent.change(screen.getByLabelText("Hand history file"), {
      target: { files: [new File([readFixture(2)], "masters.txt")] },
    });
    await screen.findByRole("button", { name: "Open tournament" }, { timeout: 10000 });
    fireEvent.click(screen.getByRole("button", { name: "Open tournament" }));
    tab("Replayer");
    const strip = screen.getByRole("region", { name: "Replayer hand strip" });
    expect(strip.querySelectorAll(".noc-replayer-strip__item")).toHaveLength(28);
    fireEvent.click(within(strip).getByRole("button", { name: "Browse all 28 hands" }));
    const browser = screen.getByRole("dialog", { name: "Browse all hands" });
    let rail = within(browser).getByRole("complementary", { name: "Imported hands" });
    expect(within(rail).getByRole("button", { name: /All 28 \/ 28/ })).toBeVisible();
    expect(rail.querySelectorAll(".importedHandRow")).toHaveLength(28);
    fireEvent.click(
      rail.querySelector<HTMLButtonElement>('[data-hand-id="TM6522429068"]')!,
    );
    fireEvent.click(within(strip).getByRole("button", { name: "Browse all 28 hands" }));
    rail = screen.getByRole("complementary", { name: "Imported hands" });
    const current = document.querySelector(".handStudyHeader")!.textContent;
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    const action = screen.getByText(/Action 1 \/ /).textContent;
    fireEvent.click(within(rail).getByRole("button", { name: /Showdown 2 \/ 28/ }));
    expect(document.querySelector(".handStudyHeader")!.textContent).toBe(current);
    expect(screen.getByText(action!)).toBeVisible();
    expect(rail.querySelectorAll(".importedHandRow")).toHaveLength(2);
    expect(screen.getByText("Current hand is outside this filter")).toBeVisible();
    expect(strip).toHaveTextContent("Current hand outside filter");
    expect(strip.querySelectorAll(".noc-replayer-strip__item")).toHaveLength(2);
    fireEvent.click(within(rail).getByRole("button", { name: "Next filtered hand" }));
    expect(screen.getByText(/Action 0 \/ /)).toBeVisible();
    expect(screen.getByRole("switch")).toBeChecked();
    tab("Review Queue");
    expect(
      document.querySelectorAll(".importedHandList .importedHandRow"),
    ).toHaveLength(28);
    fireEvent.click(
      document.querySelector<HTMLButtonElement>(
        '.importedHandList [data-hand-id="TM6522429068"]',
      )!,
    );
    expect(screen.getByRole("tab", { name: "Replayer" })).toHaveAttribute(
      "data-state",
      "active",
    );
    const returnedStrip = screen.getByRole("region", { name: "Replayer hand strip" });
    fireEvent.click(
      within(returnedStrip).getByRole("button", { name: "Browse all 28 hands" }),
    );
    expect(
      within(screen.getByRole("complementary", { name: "Imported hands" })).getByRole(
        "button",
        { name: /Showdown 2 \/ 28/ },
      ),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Show all hands" }));
    expect(
      screen
        .getByRole("complementary", { name: "Imported hands" })
        .querySelectorAll(".importedHandRow"),
    ).toHaveLength(28);
  }, 60000);
});
