import type { ImportAttempt } from "../useTournamentImport";
import type { LibraryEntry } from "../../services/tournamentLibrary";
import { ImportDiagnostics } from "./ImportDiagnostics";

export function TournamentUpload({
  attempt,
  completedEntry,
  onImport,
  onOpenReview,
}: {
  attempt: ImportAttempt;
  completedEntry: LibraryEntry | null;
  onImport(file: File): Promise<void>;
  onOpenReview(key: string): void;
}) {
  return (
    <div className="tournamentImport" aria-busy={attempt.status === "reading"}>
      <p>
        Select a GG Poker tournament hand history. Processing stays on this device, in
        memory.
      </p>
      <label className="importFileLabel">
        Hand history file
        <input
          type="file"
          accept=".txt"
          disabled={attempt.status === "reading"}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void onImport(file);
          }}
        />
      </label>
      {attempt.status === "reading" && <p role="status">Reading {attempt.fileName}…</p>}
      {attempt.status === "error" && (
        <ImportDiagnostics
          warnings={attempt.error.kind === "parser" ? attempt.error.warnings : []}
          error={attempt.error}
        />
      )}
      {attempt.status === "conflict" && (
        <p role="alert" className="importError">
          Tournament {attempt.tournamentId} is already imported with different contents.
          The existing tournament has been kept. Combining exports is not supported yet.
        </p>
      )}
      {attempt.status === "complete" && completedEntry && (
        <section className="importSummary" role="status">
          <h3>{attempt.duplicate ? "Already imported" : "Import complete"}</h3>
          <strong>{completedEntry.tournament.name}</strong>
          <p>
            Tournament {completedEntry.tournament.id} ·{" "}
            {completedEntry.tournament.handsPlayed} hands ·{" "}
            {completedEntry.tournament.game}
          </p>
          <p>
            Table capacity:{" "}
            {[...new Set(completedEntry.tournament.hands.map((h) => h.tableSize))].join(
              ", ",
            )}
            -max
          </p>
          <ImportDiagnostics warnings={completedEntry.warnings} />
          <button
            type="button"
            className="primaryButton"
            onClick={() => onOpenReview(completedEntry.key)}
          >
            Open Tournament Review
          </button>
        </section>
      )}
    </div>
  );
}
