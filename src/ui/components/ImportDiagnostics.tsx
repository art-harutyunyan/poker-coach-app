import type { ParserWarning } from "../../parsers/gg/diagnostics";
import type { ImportFailure } from "../../services/tournamentImport";
import { presentImportNotices } from "../importPresentation";

export function ImportDiagnostics({
  warnings,
  error,
}: {
  warnings: readonly ParserWarning[];
  error?: ImportFailure;
}) {
  const notices = presentImportNotices(warnings);
  return (
    <>
      {error && (
        <div role="alert" className="importError">
          {error.kind === "parser" ? (
            <>
              <strong>Hand history could not be imported.</strong>
              <ul>
                {error.issues.map((issue, i) => (
                  <li key={i}>
                    {issue.type}: {issue.message}
                    {issue.handId && ` · Hand ${issue.handId}`}
                    {issue.lineNumber && ` · Line ${issue.lineNumber}`}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>{error.message}</p>
          )}
        </div>
      )}
      {(!error || warnings.length > 0) && (
        <section className="importStatus" aria-label="Import status">
          <h3>Import status</h3>
          {!warnings.length && <p>No import notices.</p>}
          {(
            [
              ["Info", notices.info],
              ["Warnings", notices.warnings],
            ] as const
          ).map(
            ([name, group]) =>
              group.length > 0 && (
                <details
                  key={name}
                  className={name === "Info" ? "importInfo" : "importWarnings"}
                >
                  <summary>
                    {name} ({group.length})
                  </summary>
                  <ul>
                    {group.map(({ label, diagnostic: warning }, i) => (
                      <li key={i}>
                        <span>{label}</span>
                        <details className="importTechnical">
                          <summary>Technical details</summary>
                          <p>
                            <strong>{warning.code ?? warning.type}</strong>:{" "}
                            {warning.message}
                          </p>
                          {warning.handId && <p>Hand {warning.handId}</p>}
                          {warning.lineNumber && <p>Line {warning.lineNumber}</p>}
                          {warning.rawLine && <pre>{warning.rawLine}</pre>}
                        </details>
                      </li>
                    ))}
                  </ul>
                </details>
              ),
          )}
        </section>
      )}
    </>
  );
}
