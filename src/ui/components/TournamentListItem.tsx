import { NocturneUnavailable } from "../design/NocturnePrimitives";
import type { TournamentLibraryItem } from "../tournamentLibraryPresentation";
import type { TournamentTab } from "./TournamentTabs";

export function TournamentListItem({
  item,
  selected,
  onOpen,
}: {
  item: TournamentLibraryItem;
  selected: boolean;
  onOpen(tab: TournamentTab): void;
}) {
  return (
    <article
      className="tournamentLibraryRow"
      aria-label={`${item.name}, tournament ${item.tournamentId}`}
      aria-current={selected ? "true" : undefined}
      data-status={item.status}
      data-selected={selected}
    >
      <button
        className="tournamentLibraryRowOpen"
        type="button"
        aria-label={`Open Tournament ${item.name} #${item.tournamentId}`}
        aria-current={selected ? "true" : undefined}
        onClick={() => onOpen("overview")}
      />
      <div className="tournamentLibraryDetails">
        <div className="tournamentListLine tournamentListLine--name">
          <h3 title={item.name}>{item.name}</h3>
          {item.achievement && (
            <span className="tournamentAchievement" data-achievement={item.achievement}>
              {item.achievement === "winner"
                ? "Winner"
                : item.achievement === "final-table"
                  ? "Final table"
                  : "ITM"}
            </span>
          )}
        </div>
        <div className="tournamentListLine tournamentListLine--money">
          <div className="tournamentListMoney">
            <span>Buy-in</span>
            <strong>
              {item.buyIn ?? <NocturneUnavailable label="Buy-in unknown" />}
            </strong>
            <span aria-hidden="true">·</span>
            <span>Won</span>
            {item.won.state === "unknown" ? (
              <NocturneUnavailable label="Winnings unknown" />
            ) : (
              <strong data-won-state={item.won.state}>{item.won.amount}</strong>
            )}
          </div>
          <span className="tournamentListFinish">
            {item.finish ?? <NocturneUnavailable label="Finish unknown" />}
          </span>
        </div>
        <div className="tournamentListLine tournamentListLine--meta">
          <span>
            {item.dateLabel} · {item.format ?? "Format unknown"} · {item.handCount}{" "}
            {item.handCount === 1 ? "hand" : "hands"}
          </span>
          <span className="tournamentListId" title={item.tournamentId}>
            #{item.tournamentId}
          </span>
        </div>
        <div className="tournamentListLine tournamentListLine--status">
          <span className="tournamentListStatus">
            <span className="tournamentStatusDot" aria-hidden="true" />
            {item.statusLabel}
          </span>
          <span className="tournamentListCounts">
            {item.mistakes !== null && <span>{item.mistakes} mistakes</span>}
            {item.flagged !== null && <span>{item.flagged} flagged</span>}
          </span>
        </div>
      </div>
      <div className="tournamentLibraryActions" aria-label="Tournament shortcuts">
        <button
          type="button"
          aria-label={`Replayer ${item.name} #${item.tournamentId}`}
          onClick={() => onOpen("replayer")}
        >
          Replayer
        </button>
        <button
          type="button"
          aria-label={`Review Queue ${item.name} #${item.tournamentId}`}
          onClick={() => onOpen("review")}
        >
          Review Queue
        </button>
      </div>
    </article>
  );
}
