import * as Tabs from "@radix-ui/react-tabs";
import { useMemo } from "react";
import {
  adjacentFilteredHandId,
  filterHandIds,
  type HandFilter,
} from "../../domain/handFilters";
import {
  METRIC_IDS,
  type MetricAuditRow,
  type MetricId,
  type MetricInput,
  type PokerMetrics,
} from "../../domain/pokerMetricTypes";
import { buildMetricAudit } from "../../domain/pokerMetrics";
import { buildOpponentAliases } from "../opponentAliases";
import type { ReadyImportState } from "../useTournamentImport";
import { findCollectionCursor } from "../../domain/replay";
import { TournamentTabs, type TournamentTab } from "./TournamentTabs";
import { ImportedHandNavigator } from "./ImportedHandNavigator";
import { HandFilterControls, type SourceReviewHand } from "./HandFilterControls";
import { ImportDiagnostics } from "./ImportDiagnostics";
import { PokerTable } from "./PokerTable";
import { ReplayControls } from "./ReplayControls";
import { positionLabel } from "./seatLayout";
import { playerDisplayName } from "../format";
import { TournamentStats } from "./TournamentStats";
import { TournamentOverview } from "./TournamentOverview";
import type { TournamentOverviewItem } from "../tournamentLibraryPresentation";
import { TournamentHandBrowser } from "./TournamentHandBrowser";
import { ReplayerHandStrip } from "./ReplayerHandStrip";
import { AnalysisPanel } from "./AnalysisPanel";

export function ImportedTournamentWorkspace({
  state,
  overview,
  activeTab,
  onTabChange,
  onSelectHand,
  onCursorChange,
  onResultHiddenChange,
  onImport,
  onReturnToLibrary,
  facts,
  metrics,
  outcomeStatsVisible,
  onOutcomeStatsVisibleChange,
  activeFilter,
  onFilterChange,
  onFilteredNavigate,
}: {
  state: ReadyImportState;
  overview: TournamentOverviewItem;
  activeTab: TournamentTab;
  onTabChange(tab: TournamentTab): void;
  onSelectHand(id: string): void;
  onCursorChange(cursor: number): void;
  onResultHiddenChange(hidden: boolean): void;
  onImport(): void;
  onReturnToLibrary(): void;
  facts: readonly MetricInput[];
  metrics: PokerMetrics;
  outcomeStatsVisible: boolean;
  onOutcomeStatsVisibleChange(visible: boolean): void;
  activeFilter: HandFilter;
  onFilterChange(filter: HandFilter): void;
  onFilteredNavigate(direction: "previous" | "next"): void;
}) {
  const { tournament, replay, frame, resultHidden } = state;
  const opponentAliases = useMemo(
    () => buildOpponentAliases(tournament.hands),
    [tournament],
  );
  const source = tournament.hands.find((h) => h.id === state.selectedHandId)!;
  const orderedFacts = useMemo(() => facts.map((input) => input.facts), [facts]);
  const filtered = useMemo(
    () => filterHandIds(orderedFacts, activeFilter),
    [orderedFacts, activeFilter],
  );
  const reviewHands = useMemo<SourceReviewHand[]>(() => {
    if (activeFilter === "all") return [];
    const factKey =
      activeFilter === "played"
        ? "played"
        : activeFilter === "postflop"
          ? "sawFlop"
          : "heroShowdown";
    return orderedFacts.flatMap((hand) => {
      const fact = hand[factKey];
      if (fact.status !== "unknown") return [];
      const sourceLine = fact.evidence.find(
        (item) => item.lineNumber !== undefined,
      )?.lineNumber;
      return [
        {
          handId: hand.handId,
          handNumber: hand.handNumber,
          reasons: fact.reasons,
          ...(sourceLine !== undefined ? { sourceLine } : {}),
        },
      ];
    });
  }, [orderedFacts, activeFilter]);
  const filteredIds = useMemo(() => new Set(filtered.ids), [filtered.ids]);
  const filteredHands = useMemo(
    () => tournament.hands.filter((hand) => filteredIds.has(hand.id)),
    [tournament, filteredIds],
  );
  const stripHands = useMemo(
    () =>
      filteredHands.map((hand) => ({
        id: hand.id,
        handNumber: hand.handNumber,
        spot: positionLabel(hand.players.find((player) => player.isHero)!.position),
        cards: hand.heroHoleCards,
      })),
    [filteredHands],
  );
  const filterLabel =
    activeFilter === "showdown"
      ? "Showdown"
      : activeFilter === "postflop"
        ? "Postflop"
        : "Played";
  const stripContext =
    activeFilter === "all"
      ? `All hands · ID ${tournament.id} · ${tournament.game}`
      : `${filterLabel} filter · ${filteredHands.length} of ${tournament.hands.length}${filteredIds.has(source.id) ? "" : " · Current hand outside filter"} · ID ${tournament.id}`;
  const auditRows = useMemo(() => {
    const rows: Partial<Record<MetricId, readonly MetricAuditRow[]>> = {};
    for (const metric of METRIC_IDS) {
      if (metric !== "wsd" || outcomeStatsVisible)
        rows[metric] = buildMetricAudit(facts, metric);
    }
    return rows;
  }, [facts, outcomeStatsVisible]);
  const [previousId, nextId] = useMemo(
    () => [
      adjacentFilteredHandId(orderedFacts, activeFilter, source.id, "previous"),
      adjacentFilteredHandId(orderedFacts, activeFilter, source.id, "next"),
    ],
    [orderedFacts, activeFilter, source.id],
  );
  const select = (id: string) => {
    onSelectHand(id);
    onTabChange("replayer");
  };
  return (
    <div className="importedTournament">
      <TournamentTabs
        value={activeTab}
        onChange={onTabChange}
        header={
          activeTab === "overview" ? (
            <TournamentOverview
              item={overview}
              onImport={onImport}
              onReturnToLibrary={onReturnToLibrary}
            />
          ) : activeTab === "replayer" ? null : (
            <header
              className="importedTournamentContext"
              aria-label="Imported tournament"
            >
              <div className="replayerTitleBlock">
                <h2>{tournament.name}</h2>
                <div className="tournamentMetaLine replayerMetaLine">
                  <span>ID {tournament.id}</span>
                  <span>{tournament.handsPlayed} hands</span>
                  <span>{tournament.game}</span>
                  <span>Imported hand history</span>
                </div>
              </div>
              <div className="tournamentContextActions">
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={onReturnToLibrary}
                >
                  Tournament Library
                </button>
                <button
                  className="secondaryButton importedReimport"
                  type="button"
                  onClick={onImport}
                >
                  Import tournament
                </button>
              </div>
            </header>
          )
        }
      >
        <Tabs.Content value="overview">
          <div className="noc-tournament-overview__below">
            <TournamentHandBrowser
              key={tournament.id}
              hands={tournament.hands}
              selectedHandId={source.id}
              onSelectHand={onSelectHand}
              onOpenHand={select}
            />
            <TournamentStats
              metrics={metrics}
              outcomeVisible={outcomeStatsVisible}
              onOutcomeVisibleChange={onOutcomeStatsVisibleChange}
              auditRows={auditRows}
              onOpenHand={select}
            />
          </div>
        </Tabs.Content>
        <Tabs.Content value="review">
          <ImportedHandNavigator
            hands={tournament.hands}
            selectedHandId={source.id}
            onSelectHand={select}
            variant="list"
          />
        </Tabs.Content>
        <Tabs.Content value="replayer">
          <div className="tournamentReviewScreen">
            <ReplayerHandStrip
              title={tournament.name}
              context={stripContext}
              hands={stripHands}
              selectedHandId={source.id}
              totalHands={tournament.hands.length}
              onSelectHand={select}
              onBack={() => onTabChange("overview")}
              browseContent={(close) => (
                <>
                  {activeFilter !== "all" && (
                    <p className="noc-replayer-strip__filter-context">
                      Showing {filteredHands.length} of {tournament.hands.length} hands.
                      Choose All to browse the full set.
                    </p>
                  )}
                  <ImportedHandNavigator
                    hands={filteredHands}
                    selectedHandId={source.id}
                    onSelectHand={(id) => {
                      close();
                      select(id);
                    }}
                    variant="rail"
                    showHeading={false}
                    controls={
                      <HandFilterControls
                        result={filtered}
                        filter={activeFilter}
                        currentHandId={source.id}
                        previousId={previousId}
                        nextId={nextId}
                        reviewHands={reviewHands}
                        onFilterChange={onFilterChange}
                        onNavigate={onFilteredNavigate}
                        onOpenHand={(id) => {
                          close();
                          select(id);
                        }}
                      />
                    }
                  />
                </>
              )}
            />
            <div className="replayerLayout">
              <section className="tableSection">
                <div className="handStudyHeader">
                  <div>
                    <h2>
                      Hand #{source.handNumber}{" "}
                      <span>
                        of {tournament.hands.length} · {source.id}
                      </span>
                    </h2>
                    <p>
                      {positionLabel(source.players.find((p) => p.isHero)!.position)} ·{" "}
                      {source.occupiedSeatCount}/{source.tableSize} players
                    </p>
                  </div>
                </div>
                <PokerTable
                  key={source.id}
                  hand={replay.hand}
                  replayState={frame}
                  resultHidden={resultHidden}
                  opponentAliases={opponentAliases}
                  controls={
                    <ReplayControls
                      hand={replay.hand}
                      cursor={frame.cursor}
                      currentStreet={frame.currentStreet}
                      onCursorChange={onCursorChange}
                      resultHidden={resultHidden}
                      setResultHidden={onResultHiddenChange}
                      totalActions={
                        resultHidden
                          ? findCollectionCursor(replay.hand)
                          : frame.totalActions
                      }
                    />
                  }
                />
                {!resultHidden && frame.cursor === frame.totalActions && (
                  <section className="panel importedResults">
                    <h3>Completed hand results</h3>
                    <p>
                      Recorded pot:{" "}
                      {source.summary.totalPotChips.toLocaleString("en-US")} chips
                    </p>
                    <ul>
                      {source.summary.players.map((p) => (
                        <li key={p.playerId}>
                          {playerDisplayName(
                            source.players.find((seat) => seat.id === p.playerId)!,
                            true,
                            opponentAliases,
                          )}
                          {!source.players.find((seat) => seat.id === p.playerId)!
                            .isHero && (
                            <small className="muted">
                              {" "}
                              (
                              {
                                source.players.find((seat) => seat.id === p.playerId)!
                                  .name
                              }
                              )
                            </small>
                          )}
                          : {p.outcome.toLowerCase()}
                          {p.collectedChips
                            ? ` · ${p.collectedChips} chips collected`
                            : ""}
                          {p.cards
                            ? ` · ${p.cards.map((c) => c.rank + c.suit).join(" ")}`
                            : ""}
                          {p.description ? ` · ${p.description}` : ""}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </section>
              <AnalysisPanel />
            </div>
            <footer className="studyFooter">
              <span>Poker Coach / Better decisions. A longer game.</span>
              <span>Imported GG hand history · Local session</span>
            </footer>
          </div>
        </Tabs.Content>
      </TournamentTabs>
      <ImportDiagnostics warnings={state.warnings} />
    </div>
  );
}
