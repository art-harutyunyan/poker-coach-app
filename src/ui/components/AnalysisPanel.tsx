import * as Tabs from "@radix-ui/react-tabs";
import {
  AlertCircle,
  BarChart3,
  ClipboardList,
  Lightbulb,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Target,
} from "lucide-react";
import type { Action, Hand, HandAnalysis } from "../../domain/schemas";

const gradeLabels = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  INACCURATE: "Inaccurate",
  MISTAKE: "Mistake",
  MAJOR_MISTAKE: "Major Mistake",
};

type AnalysisPanelProps =
  | { analysis: HandAnalysis; decision?: Action; hand: Hand }
  | { analysis?: undefined; decision?: never; hand?: never };

export function AnalysisPanel(props: AnalysisPanelProps) {
  if (!props.analysis) {
    return (
      <aside
        className="analysisPanel nocAnalysisPanel nocAnalysisPanel--unavailable"
        aria-label="Hand analysis"
        tabIndex={0}
      >
        <header className="nocAnalysisPanel__header">
          <span>Decision analysis</span>
          <span className="nocAnalysisPanel__state">Unavailable</span>
        </header>
        <div className="nocAnalysisPanel__empty">
          <BarChart3 size={24} aria-hidden="true" />
          <h2>Analysis not available yet</h2>
          <p>
            This hand is ready for deterministic replay. Decision grades, EV,
            recommendations, and strategy explanations will appear when analysis results
            are available.
          </p>
        </div>
        <p className="nocAnalysisPanel__sourceNote">
          Opponent aliases are display labels. Exact GG source IDs are available on
          player nameplates.
        </p>
      </aside>
    );
  }

  const { analysis, decision, hand } = props;
  return (
    <aside
      className="analysisPanel nocAnalysisPanel nocAnalysisPanel--illustrative"
      aria-label="Hand analysis"
    >
      <div className="nocAnalysisPanel__header">
        <span>Decision analysis</span>
        <span className="nocAnalysisPanel__state">Illustrative analysis</span>
      </div>
      <Tabs.Root defaultValue="decision">
        <Tabs.List className="analysisTabs" aria-label="Hand analysis views">
          <Tabs.Trigger value="decision">Decision</Tabs.Trigger>
          <Tabs.Trigger value="context">Context</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="decision">
          <div className="analysisDecisionHeading">
            <span>Preflop · SB vs BTN</span>
            <span className="analysisGrade" data-grade={analysis.grade}>
              {gradeLabels[analysis.grade]}
            </span>
          </div>

          <section className="analysisSection">
            <h3 className="visuallyHidden">
              <Target size={17} aria-hidden="true" />
              Actual vs Recommended
            </h3>
            <div className="decisionCompare">
              <div>
                <span>Actual</span>
                <strong>{shortActionLabel(analysis.actualAction)}</strong>
                <small>{analysis.actualAction}</small>
              </div>
              <ArrowRight className="compareArrow" size={16} aria-hidden="true" />
              <div>
                <span>Recommended</span>
                <strong>{shortActionLabel(analysis.recommendedAction)}</strong>
                <small>{analysis.recommendedSizing}</small>
              </div>
            </div>
          </section>

          <div className="analysisStatusGrid">
            <section className="analysisStatusCard" data-grade={analysis.grade}>
              <h3>
                <AlertCircle size={18} aria-hidden="true" />
                Severity
              </h3>
              <strong>{gradeLabels[analysis.grade]}</strong>
              <span>{analysis.severity}</span>
            </section>
            <section className="analysisStatusCard" data-tone="confidence">
              <h3>
                <BarChart3 size={18} aria-hidden="true" />
                Confidence
              </h3>
              <strong>{capitalize(analysis.confidence)}</strong>
              <span>Mock reference</span>
            </section>
          </div>

          <section className="reasonBlock">
            <h3>
              <ClipboardList size={17} aria-hidden="true" />
              The idea behind the decision
            </h3>
            <p>{analysis.shortReason}</p>
          </section>

          <dl className="analysisFacts">
            <div>
              <dt>Preferred sizing</dt>
              <dd>{analysis.recommendedSizing}</dd>
            </div>
            <div>
              <dt>Strategy source</dt>
              <dd>Illustrative mock</dd>
            </div>
          </dl>

          <StrategyFrequencyBar analysis={analysis} />

          <section className="reasonBlock mutedBlock">
            <h3>
              <Lightbulb size={17} aria-hidden="true" />
              Alternative line
            </h3>
            <p>{analysis.alternativeLine}</p>
          </section>

          <button
            className="secondaryButton coachButton"
            type="button"
            disabled
            title="Coach conversations are unavailable in Phase 0"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Ask Coach about this decision
          </button>
          <p className="coachUnavailable">
            Coach conversations are not connected in Phase 0.
          </p>
        </Tabs.Content>
        <Tabs.Content value="context" className="analysisContext">
          <h3>Decision context</h3>
          <p>
            This mock assessment is for the SB decision facing a BTN open. Stepping
            through the hand does not re-analyze later actions.
          </p>
          <dl className="analysisFacts">
            <div>
              <dt>Hand</dt>
              <dd>#{hand.handNumber}</dd>
            </div>
            <div>
              <dt>Table</dt>
              <dd>{hand.tableSize}-max</dd>
            </div>
            <div>
              <dt>Blinds</dt>
              <dd>
                {hand.blindLevel.smallBlindChips.toLocaleString()} /{" "}
                {hand.blindLevel.bigBlindChips.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt>Ante per player</dt>
              <dd>{hand.blindLevel.anteChips.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Review decision</dt>
              <dd>{analysis.decisionId}</dd>
            </div>
            <div>
              <dt>Replay cursor</dt>
              <dd>
                {decision && decision.type !== "WIN"
                  ? `${decision.street.toLowerCase()} · action ${decision.sequence + 1} pending`
                  : "Hand complete"}
              </dd>
            </div>
          </dl>
          <h3>Reference assumptions</h3>
          <ul>
            {analysis.strategyReference.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </Tabs.Content>
      </Tabs.Root>

      <div className="provenanceCard">
        <ShieldCheck size={18} aria-hidden="true" />
        <div>
          <strong>{analysis.strategyReference.sourceName}</strong>
          <span>
            {analysis.strategyReference.sourceType.split("_").join(" ")} - v
            {analysis.strategyReference.version}
          </span>
          <p>{analysis.strategyReference.assumptions[0]}</p>
        </div>
      </div>

      <div className="resultNote">{analysis.resultIndependenceNote}</div>
    </aside>
  );
}

function StrategyFrequencyBar({ analysis }: { analysis: HandAnalysis }) {
  const hasExact = analysis.strategyReference.isExactReference;

  return (
    <div className="frequencyBlock">
      <div className="frequencyHeader">
        <h3>
          <ClipboardList size={17} aria-hidden="true" />
          Strategy Mix
        </h3>
        <span>{hasExact ? "Reference-backed" : "Mock / not solver truth"}</span>
      </div>
      <div className="frequencyRows">
        {analysis.strategyReference.actions.map((action) => (
          <div className="frequencyRow" key={action.action}>
            <span>{action.action}</span>
            <div className="frequencyTrack">
              <div
                className="frequencyFill"
                style={{ width: `${(action.frequency ?? 0) * 100}%` }}
              />
            </div>
            <strong>
              {action.frequency == null
                ? "No exact %"
                : `${Math.round(action.frequency * 100)}%`}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function shortActionLabel(action: string): string {
  const normalized = action.toLowerCase();

  if (normalized.includes("3-bet")) {
    return "3-bet";
  }

  if (normalized.includes("call")) {
    return "Call";
  }

  if (normalized.includes("fold")) {
    return "Fold";
  }

  if (normalized.includes("bet")) {
    return "Bet";
  }

  return action.split(" ")[0] ?? action;
}

function capitalize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
