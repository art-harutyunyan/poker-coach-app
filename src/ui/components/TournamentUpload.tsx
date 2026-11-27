import { useEffect, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import type { LibraryEntry } from "../../services/tournamentLibrary";
import { presentImportResult } from "../importResultPresentation";
import type { FileImportResult } from "../useTournamentImport";
import { NocturneButton } from "../design/NocturnePrimitives";
import { ImportDiagnostics } from "./ImportDiagnostics";
import { ImportResult } from "./ImportResult";

export function TournamentUpload({
  fileResults,
  entries,
  onImport,
  onOpenReview,
}: {
  fileResults: readonly FileImportResult[];
  entries: readonly LibraryEntry[];
  onImport(file: File): Promise<void>;
  onOpenReview(key: string): void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const sequence = useRef(0);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  useEffect(
    () => () => {
      sequence.current++;
    },
    [],
  );

  async function submitFiles(files: FileList | readonly File[]) {
    if (running.current || files.length === 0) return;
    running.current = true;
    setBusy(true);
    const current = ++sequence.current;
    try {
      for (const file of Array.from(files)) {
        if (current !== sequence.current) break;
        await onImport(file);
      }
    } finally {
      running.current = false;
      if (current === sequence.current) setBusy(false);
    }
  }

  const imported = fileResults.filter((result) => result.status === "success").length;
  const warnings = fileResults.filter((result) => result.status === "warning").length;
  const duplicates = fileResults.filter(
    (result) => result.status === "duplicate",
  ).length;
  const rejected = fileResults.filter(
    (result) => result.status === "conflict" || result.status === "error",
  ).length;

  return (
    <section className="tournamentImport">
      <div className="tournamentImportIntro">
        <p>Bring GG tournament hand histories into this session for review.</p>
        <p>
          Files stay on this device and are cleared when you close or refresh the page.
        </p>
      </div>
      <div
        className="tournamentImportDrop"
        role="group"
        aria-label="Drop GG hand histories"
        aria-disabled={busy}
        data-dragging={dragging}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            setDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!busy) void submitFiles(event.dataTransfer.files);
        }}
      >
        <span className="tournamentImportDropIcon" aria-hidden="true">
          <FileText size={22} />
        </span>
        <strong>
          {busy ? "Processing selected files" : "Drop GG .txt files here"}
        </strong>
        <p>
          {busy
            ? "Add more files after this selection finishes."
            : "Choose one or more GGPoker tournament hand-history files."}
        </p>
        <NocturneButton
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
        >
          <Upload size={16} aria-hidden="true" /> Choose files
        </NocturneButton>
        <input
          ref={input}
          className="tournamentImportFileInput"
          aria-label="Hand history file"
          type="file"
          accept=".txt"
          multiple
          disabled={busy}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
            void submitFiles(files);
          }}
        />
      </div>

      {fileResults.length > 0 && (
        <section className="tournamentImportResults" aria-label="Import results">
          <div className="tournamentImportResultsHeader">
            <h3>File results</h3>
            <div className="tournamentImportCounts" aria-label="Import outcome counts">
              <span>{imported} imported</span>
              <span>{warnings} warnings</span>
              <span>
                {duplicates} duplicate{duplicates === 1 ? "" : "s"}
              </span>
              <span>{rejected} rejected/errors</span>
            </div>
          </div>
          <div className="tournamentImportResultList">
            {fileResults.map((result) => {
              const view = presentImportResult(result, entries);
              const entry = view.key
                ? entries.find((item) => item.key === view.key)
                : undefined;
              const openKey = view.key;
              const openLabel =
                result.status === "duplicate" || result.status === "conflict"
                  ? "Show existing"
                  : result.status === "warning"
                    ? "Open"
                    : "Open tournament";
              const actions =
                openKey &&
                result.status !== "processing" &&
                result.status !== "error" ? (
                  <NocturneButton
                    variant={
                      result.status === "success" || result.status === "warning"
                        ? "primary"
                        : "secondary"
                    }
                    onClick={() => onOpenReview(openKey)}
                  >
                    {openLabel}
                  </NocturneButton>
                ) : result.status === "error" ? (
                  <NocturneButton
                    variant="secondary"
                    onClick={() => input.current?.click()}
                    disabled={busy}
                  >
                    Choose another file
                  </NocturneButton>
                ) : undefined;
              return (
                <ImportResult
                  key={result.id}
                  view={view}
                  actions={actions}
                  details={
                    (result.status === "success" || result.status === "warning") &&
                    entry?.warnings.length ? (
                      <ImportDiagnostics warnings={entry.warnings} />
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
