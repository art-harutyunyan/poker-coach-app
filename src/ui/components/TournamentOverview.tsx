import type { TournamentOverviewItem } from "../tournamentLibraryPresentation";
import {
  NocturneBadge,
  NocturneButton,
  NocturneUnavailable,
} from "../design/NocturnePrimitives";

export function TournamentOverview({
  item,
  onImport,
  onReturnToLibrary,
}: {
  item: TournamentOverviewItem;
  onImport(): void;
  onReturnToLibrary(): void;
}) {
  return (
    <section className="noc-tournament-overview" aria-label="Tournament overview">
      <header
        className="noc-tournament-overview__header importedTournamentContext"
        aria-label="Imported tournament"
      >
        <div className="noc-tournament-overview__identity">
          <div className="noc-tournament-overview__title">
            <h2 title={item.name}>{item.name}</h2>
            {item.achievement && (
              <span
                className="tournamentAchievement"
                data-achievement={item.achievement}
              >
                {item.achievement === "winner"
                  ? "Winner"
                  : item.achievement === "final-table"
                    ? "Final table"
                    : "ITM"}
              </span>
            )}
            <NocturneBadge status={item.status === "ready" ? "success" : "unavailable"}>
              {item.overviewStatusLabel}
            </NocturneBadge>
          </div>
          <p className="noc-tournament-overview__meta">
            <span>{item.source}</span>
            <span>#{item.tournamentId}</span>
            <span>
              Buy-in {item.buyIn ?? <NocturneUnavailable label="Buy-in unknown" />}
            </span>
            <span>First hand {item.dateTime}</span>
            {item.format && <span>{item.format}</span>}
          </p>
        </div>
        <div className="noc-tournament-overview__actions">
          <NocturneButton variant="secondary" onClick={onReturnToLibrary}>
            Tournament Library
          </NocturneButton>
          <NocturneButton
            variant="secondary"
            className="importedReimport"
            onClick={onImport}
          >
            Import tournament
          </NocturneButton>
        </div>
      </header>
      <div className="noc-tournament-overview__stats">
        <div className="noc-tournament-overview__stat">
          <span>Hands imported</span>
          <strong>{item.handCount}</strong>
        </div>
        <div className="noc-tournament-overview__stat">
          <span>Finish</span>
          <strong>
            {item.finish ?? <NocturneUnavailable label="Finish unknown" />}
          </strong>
          {item.finish ? (
            item.won.state !== "unknown" && <small>Won {item.won.amount}</small>
          ) : (
            <small>No summary file imported</small>
          )}
        </div>
        <div className="noc-tournament-overview__unavailable">
          <h3>Analysis not available for this tournament</h3>
          <p>
            Grades and decision quality require analysis results. Browse and replay
            imported hands now.
          </p>
        </div>
      </div>
    </section>
  );
}
