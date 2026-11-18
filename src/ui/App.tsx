import * as Tabs from "@radix-ui/react-tabs";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { CSSProperties } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  Gauge,
  Layers3,
  ListChecks,
  Loader2,
  Menu,
  PlayCircle,
  SearchX,
  Upload,
  Check,
} from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  analyses,
  developmentMetrics,
  hands,
  reviewQueue,
  tournament,
} from "../data/mockTournament";
import { buildReplayState, findActionCursor, flattenActions } from "../domain/replay";
import { buildAllInPreviewHand, buildMultiSeatPreviewHand } from "../data/previewHands";
import type { Hand, HandAnalysis, ReviewQueueItem } from "../domain/schemas";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { DevelopmentChart } from "./components/DevelopmentChart";
import { PokerTable } from "./components/PokerTable";
import { ReplayControls } from "./components/ReplayControls";
import { KeyHandsRail } from "./components/KeyHandsRail";
import { PrototypeDialog } from "./components/PrototypeDialog";
import { TournamentTabs, type TournamentTab } from "./components/TournamentTabs";
import { TournamentUpload } from "./components/TournamentUpload";
import { ImportedTournamentWorkspace } from "./components/ImportedTournamentWorkspace";
import { presentTournamentOverview } from "./tournamentLibraryPresentation";
import { ImportedReplayBoundary } from "./components/ImportedReplayBoundary";
import { TournamentLibrary } from "./components/TournamentLibrary";
import { useTournamentImport } from "./useTournamentImport";
import { ReviewQueue } from "./components/ReviewQueue";
import { VisualPreviewControl } from "./design/VisualPreviewControl";
import { ApplicationShell, MainWorkspace, type AppRoute } from "./ApplicationShell";
import {
  loadVisualPreviewSelection,
  saveVisualPreviewSelection,
  type VisualPreviewSelection,
} from "./design/visualThemes";

const CardLab = import.meta.env.DEV
  ? lazy(() =>
      import("./design/CardLab").then((module) => ({ default: module.CardLab })),
    )
  : undefined;

export function App() {
  if (isCardLabRoute() && CardLab) {
    return (
      <Tooltip.Provider delayDuration={250}>
        <Suspense fallback={<main className="cardLab">Loading card lab...</main>}>
          <CardLab />
        </Suspense>
      </Tooltip.Provider>
    );
  }

  return <MainApp />;
}

function MainApp() {
  const imported = useTournamentImport();
  const [sourceHand] = useState(() =>
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("qaScenario") === "all-in"
      ? buildAllInPreviewHand(hands[0]!)
      : hands[0]!,
  );
  const [initialPreview] = useState(loadVisualPreviewSelection);
  const [route, setRoute] = useState<AppRoute>(initialRoute);
  const [tab, setTab] = useState<TournamentTab>(initialTournamentTab);
  const [demoOpen, setDemoOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return (
      import.meta.env.DEV &&
      params.get("route") === "tournaments" &&
      ["overview", "replayer", "review"].includes(params.get("tab") ?? "")
    );
  });
  const [cursor, setCursor] = useState(() => {
    const qaCursor = import.meta.env.DEV
      ? new URLSearchParams(window.location.search).get("qaCursor")
      : null;
    return qaCursor !== null && /^\d+$/.test(qaCursor)
      ? Number(qaCursor)
      : findActionCursor(
          import.meta.env.DEV && initialPreview.tableSize !== 6
            ? buildMultiSeatPreviewHand(sourceHand, initialPreview.tableSize)
            : sourceHand,
          "a-hero-call",
        );
  });
  const [resultHidden, setResultHidden] = useState(true);
  const [dialog, setDialog] = useState<"upload" | "profile" | null>(null);
  const [visualPreview, setVisualPreview] =
    useState<VisualPreviewSelection>(initialPreview);

  const hand = useMemo(
    () =>
      import.meta.env.DEV && visualPreview.tableSize !== 6
        ? buildMultiSeatPreviewHand(sourceHand, visualPreview.tableSize)
        : sourceHand,
    [sourceHand, visualPreview.tableSize],
  );
  const resultCursor = flattenActions(hand).findIndex(
    (action) => action.type === "WIN",
  );
  const visibleCursor =
    resultHidden && resultCursor >= 0 ? Math.min(cursor, resultCursor) : cursor;
  const replayState = useMemo(
    () => buildReplayState(hand, visibleCursor),
    [hand, visibleCursor],
  );
  const primaryAnalysis = analyses[0]!;
  const activeTournamentTab =
    imported.view.kind === "tournament"
      ? (imported.activeTab ?? "overview")
      : demoOpen
        ? tab
        : "overview";
  const replayerScreen =
    route === "tournaments" &&
    (imported.view.kind === "tournament" || demoOpen) &&
    activeTournamentTab === "replayer";
  const completedAttempt = imported.attempt;
  const completedEntry =
    completedAttempt.status === "complete"
      ? (imported.entries.find((entry) => entry.key === completedAttempt.key) ?? null)
      : null;

  function openUpload() {
    imported.resetImportAttempt();
    setDialog("upload");
  }
  function openDemo(nextTab: TournamentTab) {
    imported.showLibrary();
    setDemoOpen(true);
    setRoute("tournaments");
    setTab(nextTab);
  }
  function openLibrary() {
    imported.showLibrary();
    setDemoOpen(false);
    setRoute("tournaments");
  }

  useEffect(() => {
    saveVisualPreviewSelection(visualPreview);
  }, [visualPreview]);

  function openReviewItem(item: ReviewQueueItem) {
    openDemo("replayer");
    setCursor(findActionCursor(hand, item.actionId));
  }

  function handleVisualPreviewChange(nextPreview: VisualPreviewSelection) {
    if (nextPreview.tableSize !== visualPreview.tableSize && replayState.nextAction) {
      const nextHand =
        import.meta.env.DEV && nextPreview.tableSize !== 6
          ? buildMultiSeatPreviewHand(sourceHand, nextPreview.tableSize)
          : sourceHand;
      setCursor(findActionCursor(nextHand, replayState.nextAction.id));
    }

    setVisualPreview(nextPreview);
  }

  return (
    <Tooltip.Provider delayDuration={250}>
      <ApplicationShell
        route={route}
        replayerScreen={replayerScreen}
        onNavigate={(next) => (next === "tournaments" ? openLibrary() : setRoute(next))}
        onUpload={openUpload}
        onSettings={() => setDialog("profile")}
      >
        <MainWorkspace
          className={
            route === "tournaments" && !demoOpen ? "tournamentLibraryPage" : ""
          }
        >
          {replayerScreen && (
            <header className="workspaceChrome">
              <div>
                <strong>Tournament review</strong>
                <span>
                  / {imported.activeEntry?.tournament.name ?? tournament.name}
                </span>
              </div>
              <div>
                <span className="demoBadge">
                  {demoOpen ? "Illustrative prototype" : "Local hand history"}
                </span>
                {demoOpen && (
                  <button
                    className="iconButton"
                    type="button"
                    aria-label="Upload tournament"
                    onClick={openUpload}
                  >
                    <Upload size={18} />
                  </button>
                )}
              </div>
            </header>
          )}
          {!replayerScreen && (
            <header className="topBar">
              <button
                className="iconButton mobileOnly"
                type="button"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="eyebrow">
                  {route === "tournaments" && !demoOpen
                    ? "Imported GG hand history"
                    : "Serious poker software with AI inside it"}
                </p>
                <h1>{routeTitle(route)}</h1>
              </div>
              <div className="topBarStatus" aria-label="Prototype status">
                <span className="statusDot" />
                {route === "tournaments" && !demoOpen
                  ? "Local session"
                  : "Mock data only"}
              </div>
            </header>
          )}

          {route === "dashboard" && (
            <Dashboard
              onOpenTournament={() => openDemo("overview")}
              onOpenReview={() => openDemo("review")}
            />
          )}

          {route === "tournaments" && demoOpen && (
            <TournamentWorkspace
              activeTab={tab}
              analysis={primaryAnalysis}
              cursor={visibleCursor}
              onCursorChange={setCursor}
              onOpenReviewItem={openReviewItem}
              onResultHiddenChange={setResultHidden}
              onTabChange={setTab}
              replayState={replayState}
              resultHidden={resultHidden}
              visualPreview={visualPreview}
              onVisualPreviewChange={handleVisualPreviewChange}
              hand={hand}
            />
          )}

          {route === "tournaments" && !demoOpen && (
            <TournamentLibrary
              entries={imported.entries}
              selectedKey={
                imported.view.kind === "tournament" ? imported.view.key : null
              }
              onImport={openUpload}
              onOpen={(key, section) => {
                imported.openTournament(key, section);
              }}
            />
          )}

          {route === "tournaments" &&
            !demoOpen &&
            imported.selected &&
            imported.view.kind === "tournament" &&
            (imported.replayError?.key === imported.view.key ? (
              <section className="panel importedReplayError" role="alert">
                <p>{imported.replayError.message}</p>
                {imported.activeEntry &&
                  imported.activeEntry.tournament.hands.length > 1 && (
                    <label className="importedRecoveryPicker">
                      Choose another hand
                      <select
                        value={imported.selected.selectedHandId}
                        onChange={(event) =>
                          imported.selectHand(event.currentTarget.value)
                        }
                      >
                        {imported.activeEntry.tournament.hands.map((hand) => (
                          <option key={hand.id} value={hand.id}>
                            Hand #{hand.handNumber} · {hand.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                <button className="secondaryButton" type="button" onClick={openLibrary}>
                  Tournament Library
                </button>
              </section>
            ) : (
              <ImportedReplayBoundary
                key={imported.view.key}
                onError={imported.reportIntegrationError}
              >
                <ImportedTournamentWorkspace
                  state={imported.selected}
                  overview={presentTournamentOverview(imported.activeEntry!)}
                  facts={imported.activeEntry!.facts}
                  metrics={imported.activeEntry!.metrics}
                  outcomeStatsVisible={imported.outcomeStatsVisible ?? false}
                  onOutcomeStatsVisibleChange={imported.setOutcomeStatsVisible}
                  activeFilter={imported.activeFilter ?? "all"}
                  onFilterChange={imported.setHandFilter}
                  onFilteredNavigate={imported.navigateFilteredHand}
                  activeTab={imported.activeTab ?? "overview"}
                  onTabChange={imported.setTab}
                  onSelectHand={imported.selectHand}
                  onCursorChange={imported.setCursor}
                  onResultHiddenChange={imported.setResultHidden}
                  onImport={openUpload}
                  onReturnToLibrary={openLibrary}
                />
              </ImportedReplayBoundary>
            ))}
          {route === "tournaments" &&
            !demoOpen &&
            imported.view.kind === "library" &&
            import.meta.env.DEV && (
              <button
                className="secondaryButton"
                type="button"
                onClick={() => openDemo("overview")}
              >
                View demo tournament
              </button>
            )}

          {route === "development" && <Development />}
          {route === "training" && <PlaceholderSection kind="training" />}
          {route === "playbook" && <PlaceholderSection kind="playbook" />}
        </MainWorkspace>
        {dialog && (
          <PrototypeDialog
            kind={dialog}
            onClose={() => {
              imported.cancelPendingImport();
              setDialog(null);
            }}
          >
            {dialog === "upload" ? (
              <TournamentUpload
                attempt={imported.attempt}
                completedEntry={completedEntry}
                onImport={imported.importFile}
                onOpenReview={(key) => {
                  imported.openTournament(key);
                  setDemoOpen(false);
                  setDialog(null);
                  setRoute("tournaments");
                }}
              />
            ) : undefined}
          </PrototypeDialog>
        )}
      </ApplicationShell>
    </Tooltip.Provider>
  );
}

function Dashboard({
  onOpenReview,
  onOpenTournament,
}: {
  onOpenReview: () => void;
  onOpenTournament: () => void;
}) {
  return (
    <div className="pageGrid dashboardGrid">
      <section className="heroBand">
        <div className="heroPrimary">
          <div className="tournamentSummaryTop">
            <div>
              <p className="eyebrow">Current tournament</p>
              <h2>{tournament.name}</h2>
              <div className="tournamentMetaLine">
                <span>{tournament.handsPlayed} hands</span>
                <span>
                  {tournament.finish.position} / {tournament.finish.fieldSize}
                </span>
                <span>${tournament.finish.payout.toFixed(2)} result</span>
                <span>{new Date(tournament.playedAt).toLocaleDateString("en-US")}</span>
              </div>
            </div>
            <div
              className="scorePanel"
              aria-label="Overall tournament grade B, 81 of 100"
            >
              <span>Overall</span>
              <strong>B</strong>
              <small>81 / 100</small>
              <div className="scoreBar">
                <span style={{ width: "81%" }} />
              </div>
            </div>
          </div>
          <div className="priorityCallout">
            <span>Primary development target</span>
            <strong>{tournament.mainImprovementArea}</strong>
          </div>
          <div className="heroActions">
            <button className="primaryButton" type="button" onClick={onOpenTournament}>
              <PlayCircle size={18} aria-hidden="true" />
              Open review
            </button>
            <button className="secondaryButton" type="button" onClick={onOpenReview}>
              <ListChecks size={18} aria-hidden="true" />
              Review queue
            </button>
          </div>
        </div>
      </section>

      <TournamentOverview />
      <ReviewQueue items={reviewQueue.slice(0, 4)} onOpenItem={onOpenReview} compact />
      <Development />
    </div>
  );
}

function TournamentWorkspace({
  activeTab,
  analysis,
  cursor,
  hand,
  onCursorChange,
  onOpenReviewItem,
  onResultHiddenChange,
  onTabChange,
  replayState,
  resultHidden,
  visualPreview,
  onVisualPreviewChange,
}: {
  activeTab: TournamentTab;
  analysis: HandAnalysis;
  cursor: number;
  hand: Hand;
  onCursorChange: (cursor: number) => void;
  onOpenReviewItem: (item: ReviewQueueItem) => void;
  onResultHiddenChange: (hidden: boolean) => void;
  onTabChange: (tab: TournamentTab) => void;
  replayState: ReturnType<typeof buildReplayState>;
  resultHidden: boolean;
  visualPreview: VisualPreviewSelection;
  onVisualPreviewChange: (preview: VisualPreviewSelection) => void;
}) {
  const [reviewed, setReviewed] = useState(false);
  return (
    <TournamentTabs
      value={activeTab}
      onChange={onTabChange}
      header={
        activeTab === "replayer" && (
          <header className="replayerPageHeader">
            <div className="replayerTitleBlock">
              <button
                className="replayerBackLink"
                type="button"
                onClick={() => onTabChange("overview")}
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Tournament overview
              </button>
              <h1>{tournament.name}</h1>
              <div className="tournamentMetaLine replayerMetaLine">
                <span>Sep 4, 2026</span>
                <span>{tournament.handsPlayed} hands</span>
                <span>Regular MTT</span>
              </div>
            </div>
            <div className="tournamentReviewGrade">
              <strong>B</strong>
              <div>
                Decision quality<small>Mock heuristic review</small>
              </div>
            </div>
          </header>
        )
      }
    >
      <Tabs.Content value="overview">
        <div className="pageGrid">
          <TournamentOverview />
          <Development />
          <StatePatterns />
        </div>
      </Tabs.Content>

      <Tabs.Content value="replayer">
        <div className="tournamentReviewScreen">
          <div className="replayerLayout">
            <KeyHandsRail
              hand={hand}
              reviewed={reviewed}
              onSelect={() => onCursorChange(findActionCursor(hand, "a-hero-call"))}
            />
            <section className="tableSection">
              <div className="handStudyHeader">
                <div>
                  <h2>
                    A5s <span>SB vs BTN open</span>
                  </h2>
                  <p>
                    Hand #{hand.handNumber} · {hand.tableSize}-max · Mock review
                  </p>
                </div>
                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={() => onTabChange("review")}
                >
                  <ListChecks size={15} aria-hidden="true" />
                  Queue
                </button>
              </div>
              {import.meta.env.DEV && (
                <VisualPreviewControl
                  value={visualPreview}
                  onChange={onVisualPreviewChange}
                />
              )}
              <PokerTable
                hand={hand}
                replayState={replayState}
                resultHidden={resultHidden}
                visualPreview={import.meta.env.DEV ? visualPreview : undefined}
                controls={
                  <ReplayControls
                    hand={hand}
                    currentStreet={replayState.currentStreet}
                    cursor={cursor}
                    onCursorChange={onCursorChange}
                    resultHidden={resultHidden}
                    setResultHidden={onResultHiddenChange}
                    totalActions={
                      resultHidden &&
                      flattenActions(hand).some((action) => action.type === "WIN")
                        ? flattenActions(hand).findIndex(
                            (action) => action.type === "WIN",
                          )
                        : replayState.totalActions
                    }
                  />
                }
              />
              <div className="reviewFinish">
                <span>
                  {reviewed
                    ? "Sample hand reviewed"
                    : "1 sample hand in this tournament"}
                </span>
                <button
                  className="secondaryButton"
                  type="button"
                  aria-pressed={reviewed}
                  onClick={() => setReviewed(!reviewed)}
                >
                  <Check size={16} aria-hidden="true" />
                  {reviewed ? "Reviewed" : "Mark reviewed"}
                </button>
              </div>
            </section>
            <AnalysisPanel
              analysis={analysis}
              decision={replayState.nextAction}
              hand={hand}
            />
          </div>
          <footer className="studyFooter">
            <span>Poker Coach / Better decisions. A longer game.</span>
            <span>Mock data · Strategy sources shown in context</span>
          </footer>
        </div>
      </Tabs.Content>

      <Tabs.Content value="review">
        <div className="pageGrid">
          <ReviewQueue items={reviewQueue} onOpenItem={onOpenReviewItem} />
        </div>
      </Tabs.Content>
    </TournamentTabs>
  );
}

function TournamentOverview() {
  const metrics = [
    ["VPIP", `${Math.round(tournament.metrics.vpip * 100)}%`],
    ["PFR", `${Math.round(tournament.metrics.pfr * 100)}%`],
    ["3-Bet", `${(tournament.metrics.threeBet * 100).toFixed(1)}%`],
    ["Hands", `${tournament.handsPlayed}`],
  ];

  return (
    <section className="overviewBand">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Mock GGPoker tournament</p>
          <h2>Performance profile</h2>
        </div>
        <div className="pill">Low-stakes MTT sample</div>
      </div>

      <div className="metricsRail">
        {metrics.map(([label, value]) => (
          <div className="metricBlock" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="dimensionGrid">
        {tournament.scoreDimensions.map((dimension) => (
          <article className="dimensionRow" key={dimension.label}>
            <div>
              <h3>{dimension.label}</h3>
              <p>{dimension.note}</p>
            </div>
            <div className="dimensionScore">
              <strong>{dimension.score}</strong>
              <div className="dimensionTrack">
                <span style={{ "--score": `${dimension.score}%` } as CSSProperties} />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="insightStrip">
        <div>
          <span>Strength</span>
          <strong>{tournament.biggestStrength}</strong>
        </div>
        <div>
          <span>Priority</span>
          <strong>{tournament.mainImprovementArea}</strong>
        </div>
      </div>
    </section>
  );
}

function Development() {
  return (
    <section className="developmentBand">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Development signal</p>
          <h2>3-Bet Conversion Trend</h2>
        </div>
        <div className="pill">Target 24%</div>
      </div>
      <DevelopmentChart metric={developmentMetrics[0]!} />
    </section>
  );
}

function PlaceholderSection({ kind }: { kind: "training" | "playbook" }) {
  const isTraining = kind === "training";
  const Icon = isTraining ? Gauge : Layers3;
  return (
    <section className="placeholderBand">
      <Icon size={28} aria-hidden="true" />
      <div>
        <p className="eyebrow">{isTraining ? "Training" : "Playbook"}</p>
        <h2>
          {isTraining ? "Future drills placeholder" : "Future ranges placeholder"}
        </h2>
        <p>
          Polished placeholder only. Phase 0 establishes navigation and visual patterns
          without starting later-phase trainer, parser, or range database work.
        </p>
      </div>
    </section>
  );
}

function StatePatterns() {
  return (
    <section className="stateGrid" aria-label="Representative states">
      <div className="stateBlock">
        <Loader2 size={18} aria-hidden="true" className="spin" />
        <strong>Loading</strong>
        <span>Parsing and analysis queues will use this calm state language.</span>
      </div>
      <div className="stateBlock">
        <SearchX size={18} aria-hidden="true" />
        <strong>Empty</strong>
        <span>No imported tournaments yet will route to an upload action later.</span>
      </div>
      <div className="stateBlock warningState">
        <AlertTriangle size={18} aria-hidden="true" />
        <strong>Error</strong>
        <span>Parse failures will show actionable, hand-history-specific context.</span>
      </div>
    </section>
  );
}

function routeTitle(route: AppRoute): string {
  switch (route) {
    case "dashboard":
      return "Dashboard";
    case "tournaments":
      return "Tournament Review";
    case "development":
      return "Development";
    case "training":
      return "Training";
    case "playbook":
      return "Playbook";
  }
}

function initialRoute(): AppRoute {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  const route = new URLSearchParams(window.location.search).get("route");

  return isAppRoute(route) ? route : "dashboard";
}

function initialTournamentTab(): TournamentTab {
  if (typeof window === "undefined") {
    return "overview";
  }

  const tab = new URLSearchParams(window.location.search).get("tab");

  return isTournamentTab(tab) ? tab : "overview";
}

function isAppRoute(route: string | null): route is AppRoute {
  return (
    route === "dashboard" ||
    route === "tournaments" ||
    route === "development" ||
    route === "training" ||
    route === "playbook"
  );
}

function isTournamentTab(tab: string | null): tab is TournamentTab {
  return tab === "overview" || tab === "replayer" || tab === "review";
}

function isCardLabRoute(): boolean {
  return (
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    window.location.pathname === "/design/card-lab"
  );
}
