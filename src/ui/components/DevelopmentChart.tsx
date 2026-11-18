import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DevelopmentMetric } from "../../domain/schemas";

export function DevelopmentChart({ metric }: { metric: DevelopmentMetric }) {
  return (
    <div className="chartShell" aria-label={metric.label}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart
          data={metric.points}
          margin={{ top: 18, right: 32, left: -12, bottom: 4 }}
        >
          <defs>
            <linearGradient id="conversionFill" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--study-green, #8ecf9c)"
                stopOpacity={0.22}
              />
              <stop
                offset="100%"
                stopColor="var(--study-green, #8ecf9c)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--study-line, rgba(245,238,220,0.055))"
            vertical={false}
          />
          <XAxis
            dataKey="tournamentLabel"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "var(--study-muted, #9c968c)",
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              fontWeight: 400,
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "var(--study-muted, #9c968c)",
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              fontWeight: 400,
            }}
            domain={[0, 35]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--study-surface, #151514)",
              border: "1px solid var(--study-line, rgba(245,238,220,0.1))",
              borderRadius: 6,
              color: "var(--study-text, #f3eadb)",
              boxShadow: "none",
              fontFamily: "var(--font-ui)",
              fontSize: 13,
            }}
            formatter={(value) => [`${Number(value ?? 0)}%`, "Conversion"]}
            labelStyle={{ color: "var(--study-muted, #bcb6aa)" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--study-green, #8ecf9c)"
            strokeWidth={2.4}
            fill="url(#conversionFill)"
            dot={{
              r: 2.5,
              fill: "var(--study-surface, #0d0d0c)",
              stroke: "var(--study-green, #8ecf9c)",
              strokeWidth: 1.8,
            }}
            activeDot={{
              r: 5,
              fill: "var(--study-text, #f3eadb)",
              stroke: "var(--study-green, #8ecf9c)",
              strokeWidth: 2,
            }}
          />
          <Area
            type="monotone"
            dataKey="target"
            stroke="var(--study-gold, #d8bd7a)"
            strokeDasharray="3 7"
            strokeWidth={1.6}
            fill="transparent"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
