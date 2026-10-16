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
          margin={{ top: 18, right: 18, left: -12, bottom: 4 }}
        >
          <defs>
            <linearGradient id="conversionFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8ecf9c" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#8ecf9c" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(245,238,220,0.055)" vertical={false} />
          <XAxis
            dataKey="tournamentLabel"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#9c968c",
              fontFamily: "Manrope, sans-serif",
              fontSize: 12,
              fontWeight: 400,
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#9c968c",
              fontFamily: "Manrope, sans-serif",
              fontSize: 12,
              fontWeight: 400,
            }}
            domain={[0, 35]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#151514",
              border: "1px solid rgba(245,238,220,0.1)",
              borderRadius: 8,
              color: "#f3eadb",
              boxShadow: "0 18px 48px rgba(0,0,0,0.34)",
              fontFamily: "Manrope, sans-serif",
              fontSize: 13,
            }}
            formatter={(value) => [`${Number(value ?? 0)}%`, "Conversion"]}
            labelStyle={{ color: "#bcb6aa" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8ecf9c"
            strokeWidth={2.4}
            fill="url(#conversionFill)"
            dot={{ r: 2.5, fill: "#0d0d0c", stroke: "#8ecf9c", strokeWidth: 1.8 }}
            activeDot={{ r: 5, fill: "#f3eadb", stroke: "#8ecf9c", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="target"
            stroke="#d8bd7a"
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
