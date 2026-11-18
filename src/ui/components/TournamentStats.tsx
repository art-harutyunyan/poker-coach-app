import type {
  MetricAuditRow,
  MetricId,
  PokerMetrics,
  ReasonCode,
} from "../../domain/pokerMetricTypes";
import { METRIC_IDS } from "../../domain/pokerMetricTypes";
import {
  formatMetricPercentage,
  metricDefinition,
  metricReasonLabel,
} from "../metricPresentation";

export function TournamentStats({
  metrics,
  outcomeVisible,
  onOutcomeVisibleChange,
  auditRows,
  onOpenHand,
}: {
  metrics: PokerMetrics;
  outcomeVisible: boolean;
  onOutcomeVisibleChange(visible: boolean): void;
  auditRows: Readonly<Partial<Record<MetricId, readonly MetricAuditRow[]>>>;
  onOpenHand(handId: string): void;
}) {
  const eligible = metrics.metrics.vpip.denominator;
  return (
    <section
      className="panel tournamentStats"
      aria-labelledby="tournament-stats-heading"
    >
      <div className="tournamentStatsHeader">
        <div>
          <p className="eyebrow">Single-tournament sample</p>
          <h2 id="tournament-stats-heading">Tournament Stats</h2>
          <p className="tournamentStatsContext">
            <span>{metrics.importedHands} imported hands</span>
            {eligible !== metrics.importedHands && (
              <>
                {" · "}
                <span>{eligible} eligible for VPIP/PFR</span>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="tournamentStatsGrid">
        {METRIC_IDS.map((id) => {
          const definition = metricDefinition(id);
          const summary = metrics.metrics[id];
          const masked = id === "wsd" && !outcomeVisible;
          const rows = masked ? [] : (auditRows[id] ?? []);
          const reasonEntries = Object.entries(summary.reasons) as [
            ReasonCode,
            number,
          ][];
          return (
            <article
              className="tournamentMetric"
              data-testid="metric-card"
              data-metric={id}
              key={id}
            >
              <h3>{definition.label}</h3>
              {masked ? (
                <>
                  <p className="tournamentMetricMasked">Outcome stat hidden</p>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => onOutcomeVisibleChange(true)}
                  >
                    Show outcome stat
                  </button>
                </>
              ) : (
                <>
                  <p className="tournamentMetricValue">
                    {formatMetricPercentage(summary.percentage)}
                  </p>
                  <p className="tournamentMetricCount">
                    {summary.numerator} / {summary.denominator}{" "}
                    {definition.denominatorLabel}
                  </p>
                  {summary.denominator === 0 && (
                    <p className="tournamentMetricUnavailable">
                      No eligible opportunities
                    </p>
                  )}
                  {id === "wsd" && (
                    <button
                      className="tournamentMetricHide"
                      type="button"
                      onClick={() => onOutcomeVisibleChange(false)}
                    >
                      Hide outcome stat
                    </button>
                  )}
                </>
              )}
              <details className="tournamentMetricDefinition">
                <summary aria-label={`${definition.label} definition`}>
                  Definition
                </summary>
                <p>{definition.definition}</p>
              </details>
              {!masked && (
                <details className="tournamentMetricCoverage">
                  <summary aria-label={`${definition.label} coverage`}>
                    Coverage
                  </summary>
                  <p>
                    {summary.excluded} excluded · {summary.notOpportunity} not
                    opportunities
                  </p>
                  {reasonEntries.length > 0 && (
                    <ul>
                      {reasonEntries.map(([reason, count]) => (
                        <li key={reason}>
                          {metricReasonLabel(reason)}: {count}
                        </li>
                      ))}
                    </ul>
                  )}
                  {rows.length > 0 && (
                    <ul className="tournamentMetricAudit">
                      {rows
                        .filter(
                          (row) =>
                            row.contribution.status === "excluded" ||
                            (id === "wsd" &&
                              row.contribution.status === "eligible" &&
                              row.contribution.numerator === 1),
                        )
                        .map((row) => (
                          <li key={row.key}>
                            <button
                              type="button"
                              onClick={() => onOpenHand(row.handId)}
                            >
                              Hand #{row.handNumber} · {row.handId}
                            </button>
                            {row.contribution.status === "excluded" &&
                              ` · ${row.contribution.reasons.map(metricReasonLabel).join(", ")}`}
                          </li>
                        ))}
                    </ul>
                  )}
                </details>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
