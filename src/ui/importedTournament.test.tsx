import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { App } from "./App";
import { fixtureHand, readFixture } from "../parsers/gg/fixtureTestUtils";
import * as table from "./components/PokerTable";

const dialogMethods = ["showModal", "close"] as const;
const original = dialogMethods.map((name) =>
  Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name),
);
beforeAll(() =>
  dialogMethods.forEach((name) =>
    Object.defineProperty(HTMLDialogElement.prototype, name, {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = name === "showModal";
      },
    }),
  ),
);
afterAll(() =>
  dialogMethods.forEach((name, i) => {
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
afterEach(() => vi.restoreAllMocks());
function tab(name: string) {
  const trigger = screen.getByRole("tab", { name });
  fireEvent.mouseDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.click(trigger);
}
function openUpload() {
  fireEvent.click(screen.getAllByRole("button", { name: /Upload tournament/i })[0]!);
}
async function upload(text: string) {
  fireEvent.change(screen.getByLabelText("Hand history file"), {
    target: { files: [new File([text], "history.txt", { type: "text/plain" })] },
  });
  return screen.findByRole("heading", { name: /Import complete|Already imported/ });
}
function openReview() {
  fireEvent.click(screen.getByRole("button", { name: "Open Tournament Review" }));
}

describe("real imported tournament app", () => {
  it("shows a source-backed Nocturne overview above the compact hand browser and stats", async () => {
    render(<App />);
    openUpload();
    await upload(fixtureHand(0, "TM6468725291"));
    openReview();
    const overview = screen.getByRole("region", { name: "Tournament overview" });
    expect(within(overview).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Daily Monster Stack",
    );
    expect(overview).toHaveTextContent("GGPoker");
    expect(overview).toHaveTextContent("#314729652");
    expect(overview).toHaveTextContent("Buy-in $2.50");
    expect(overview).toHaveTextContent("First hand 28 Sep 2026");
    expect(overview).toHaveTextContent("Hands imported");
    expect(overview).toHaveTextContent("No summary file imported");
    expect(overview).toHaveTextContent("Analysis not available for this tournament");
    expect(overview).not.toHaveTextContent(
      /Decisions graded|Decision quality|Won \$0\.00/,
    );
    expect(document.querySelector(".importMetadataGrid")).toBeNull();
    expect(
      screen.getByRole("region", { name: "Tournament hand browser" }),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "Tournament Stats" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Review Queue" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Replayer" })).toBeVisible();
  }, 15000);
  it("selects a hand on Overview without opening replay, then opens that real hand explicitly", async () => {
    render(<App />);
    openUpload();
    await upload(readFixture(0));
    openReview();
    const browser = screen.getByRole("region", { name: "Tournament hand browser" });
    const rows = browser.querySelectorAll<HTMLElement>("[data-hand-id]");
    expect(rows).toHaveLength(222);
    fireEvent.click(rows[1]!);
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(rows[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("region", { name: "Tournament Stats" })).toBeVisible();
    const search = within(browser).getByRole("searchbox", { name: "Search hands" });
    fireEvent.change(search, { target: { value: "47" } });
    const matching = [...browser.querySelectorAll<HTMLElement>("[data-hand-id]")].find(
      (row) => row.textContent?.includes("#47"),
    )!;
    const filteredHandId = matching.dataset.handId!;
    fireEvent.click(matching);
    expect(search).toHaveValue("47");
    expect(matching).toHaveAttribute("aria-selected", "true");
    fireEvent.click(within(browser).getByRole("button", { name: "Open in Replayer" }));
    expect(screen.getByRole("tab", { name: "Replayer" })).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(document.querySelector(".handStudyHeader")).toHaveTextContent(
      filteredHandId,
    );
  }, 30000);
  it("replaces presentation aliases with the new roster and preserves pre-SHOW privacy", async () => {
    render(<App />);
    openUpload();
    await upload(fixtureHand(0, "TM6468725291"));
    openReview();
    tab("Replayer");
    const opponent = () =>
      document.querySelector('[data-player-id="gg:314729652:ad116bad"]')!;
    expect(opponent().querySelector(".player-name")).toHaveTextContent("Ethan");
    fireEvent.click(screen.getByRole("button", { name: "Showdown" }));
    expect(screen.getByText(/Action 22 \//)).toBeVisible();
    expect(opponent().querySelectorAll(".cardBack")).toHaveLength(2);
    fireEvent.click(screen.getByRole("switch"));
    expect(opponent().querySelectorAll(".cardBack")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(opponent().querySelectorAll(".playingCard:not(.cardBack)")).toHaveLength(2);
    fireEvent.click(screen.getByRole("switch"));
    expect(opponent().querySelectorAll(".cardBack")).toHaveLength(2);
    openUpload();
    await upload(fixtureHand(1, "TM6471062694"));
    openReview();
    tab("Replayer");
    expect(
      document.querySelector('[data-player-id="gg:314806258:13ab0373"] .player-name'),
    ).toHaveTextContent("Alex");
    expect(opponent()).toBeNull();
    expect(screen.getByText(/Action 0 \//)).toBeVisible();
  }, 15000);
  it.each([0, 1, 2, 3])(
    "imports fixture %i through the UI with neutral metadata/navigation",
    async (index) => {
      render(<App />);
      openUpload();
      await upload(readFixture(index));
      expect(
        screen.getAllByText(new RegExp(`${[222, 191, 28, 233][index]} hands`))[0],
      ).toBeVisible();
      expect(screen.getByText(/Info \(/)).toBeInTheDocument();
      openReview();
      expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
        "data-state",
        "active",
      );
      const overview = screen.getByRole("region", { name: "Tournament overview" });
      expect(overview).toHaveTextContent("Analysis not available for this tournament");
      expect(overview).toHaveTextContent("No summary file imported");
      expect(
        screen.queryByText(/currency unknown|timezone unknown/),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Mock heuristic review")).not.toBeInTheDocument();
      expect(screen.getByText("VPIP")).toBeVisible();
      tab("Review Queue");
      expect(document.querySelectorAll("[data-hand-id]")).toHaveLength(
        [222, 191, 28, 233][index]!,
      );
      fireEvent.click(document.querySelector<HTMLButtonElement>("[data-hand-id]")!);
      expect(screen.getByRole("tab", { name: "Replayer" })).toHaveAttribute(
        "data-state",
        "active",
      );
      expect(screen.getByText(/Action 0 \/ /)).toBeVisible();
      expect(screen.getByRole("switch")).toBeChecked();
      fireEvent.click(screen.getByRole("button", { name: "Forward" }));
      fireEvent.click(document.querySelector<HTMLButtonElement>("[data-hand-id]")!);
      expect(screen.getByText(/Action 0 \/ /)).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: "Dashboard" }));
      expect(screen.getByText("Mock data only")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Tournaments" }));
      expect(screen.getByRole("heading", { name: "Tournament Library" })).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: /^Replayer .*#/ }));
      expect(screen.getByText(/Action 0 \/ /)).toBeVisible();
    },
    30000,
  );
  it("keeps import beside tournament context on every tab and shares the same hand-card pattern", async () => {
    render(<App />);
    openUpload();
    await upload(fixtureHand(0, "TM6468725291"));
    openReview();
    let rowMarkup: string | undefined;
    for (const name of ["Overview", "Review Queue", "Replayer"]) {
      tab(name);
      const context =
        name === "Overview"
          ? screen.getByRole("region", { name: "Tournament overview" })
          : screen.getByRole("banner", { name: "Imported tournament" });
      const button = context.querySelector("button.importedReimport")!;
      expect(button).toHaveTextContent("Import tournament");
      expect(
        document.querySelector(
          '.workspaceChrome button[aria-label="Upload tournament"]',
        ),
      ).toBeNull();
      expect(document.querySelector(".sidebarUpload")).toHaveAccessibleName(
        "Upload tournament",
      );
      expect(document.querySelector(".sidebarUpload")).toHaveTextContent("Import");
      if (name !== "Overview") {
        const row = document.querySelector(".importedHandRow")!;
        expect(row.querySelectorAll(".playingCard")).toHaveLength(2);
        if (rowMarkup) expect(row.innerHTML).toBe(rowMarkup);
        rowMarkup = row.innerHTML;
      }
      fireEvent.click(button);
      expect(screen.getByRole("dialog")).toHaveAttribute("open");
      fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    }
  });
  it("preserves old success on a typed error, retries same input, and never falls back to demos", async () => {
    render(<App />);
    openUpload();
    await upload(fixtureHand(1, "TM6471062694"));
    openReview();
    openUpload();
    fireEvent.change(screen.getByLabelText("Hand history file"), {
      target: { files: [new File([""], "history.txt")] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(/empty/i);
    expect(
      screen.queryByRole("button", { name: "Open Tournament Review" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(
      screen.getByText("Analysis not available for this tournament"),
    ).toBeVisible();
    expect(screen.queryByText("Performance profile")).not.toBeInTheDocument();
    openUpload();
    await upload(fixtureHand(1, "TM6471062694"));
    expect((screen.getByLabelText("Hand history file") as HTMLInputElement).value).toBe(
      "",
    );
    openReview();
    expect(
      screen.getByText("Analysis not available for this tournament"),
    ).toBeVisible();
  });
  it("ignores demo QA flags, supports completion/privacy, and gates summary-only cards", async () => {
    window.history.replaceState({}, "", "/?qaScenario=all-in&qaCursor=100&tableSize=9");
    render(<App />);
    openUpload();
    await upload(fixtureHand(1, "TM6470156513"));
    openReview();
    tab("Replayer");
    expect(screen.getByText(/Action 0 \/ /)).toBeVisible();
    expect(screen.queryByLabelText("Table size preview")).not.toBeInTheDocument();
    expect(document.querySelectorAll(".player-seat")).toHaveLength(8);
    expect(screen.queryByText("Completed hand results")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch"));
    const steps = Number(screen.getByText(/Action 0 \/ /).textContent?.split("/")[1]);
    for (let i = 0; i < steps; i++)
      fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(screen.getByText("Completed hand results")).toBeVisible();
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.queryByText("Completed hand results")).not.toBeInTheDocument();
  }, 30000);
  it("recovers from a rendering failure through the integration error path", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const preventExpected = (event: ErrorEvent) => {
      if (event.message.includes("private failure")) event.preventDefault();
    };
    window.addEventListener("error", preventExpected);
    render(<App />);
    openUpload();
    await upload(fixtureHand(1, "TM6471062694"));
    openReview();
    const renderTable = vi.spyOn(table, "PokerTable").mockImplementation(() => {
      throw new Error("private failure");
    });
    tab("Replayer");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not be displayed/i,
    );
    expect(document.body).not.toHaveTextContent("private failure");
    renderTable.mockRestore();
    openUpload();
    await upload(fixtureHand(1, "TM6471062694"));
    openReview();
    tab("Replayer");
    await waitFor(() => expect(screen.getByText(/Action 0 \/ /)).toBeVisible());
    error.mockRestore();
    window.removeEventListener("error", preventExpected);
  });
});
