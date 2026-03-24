// src/components/charts/DashboardCharts.tsx
// Reusable chart building blocks for the sentiment dashboard.
// All charts are Recharts-based, dark-themed, responsive.

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import type { GroupedStats } from "@/hooks/useReviewData";

// ── Colour palette ─────────────────────────────────────────────────────────

export const SENTIMENT_PALETTE = {
  Positive: "#22c55e",
  Neutral:  "#f59e0b",
  Negative: "#ef4444",
};

export const RATING_PALETTE = {
  "1★": "#ef4444",
  "2★": "#f97316",
  "3★": "#f59e0b",
  "4★": "#84cc16",
  "5★": "#22c55e",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 8,
    fontSize: 12,
    color: "#e2e8f0",
  },
  labelStyle: { color: "#94a3b8" },
};

const AXIS_TICK = { fontSize: 10, fill: "#64748b" };

// ── Volume bar ──────────────────────────────────────────────────────────────

interface VolumeBarProps {
  data: GroupedStats[];
  color: string;
  height?: number;
}

export function VolumeBar({ data, color, height = 190 }: VolumeBarProps) {
  const chartData = data.map(d => ({ name: d.name, Reviews: d.total }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 20, right: 8, left: -10, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={AXIS_TICK} angle={-40} textAnchor="end" interval={0} />
        <YAxis tick={AXIS_TICK} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="Reviews" radius={[3, 3, 0, 0]}>
          <LabelList dataKey="Reviews" position="top" style={{ fontSize: 9, fill: "#94a3b8" }} />
          {chartData.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Sentiment stacked bar ───────────────────────────────────────────────────

interface SentimentBarProps {
  data: GroupedStats[];
  height?: number;
}

export function SentimentStackedBar({ data, height = 230 }: SentimentBarProps) {
  const chartData = data.map(d => ({
    name: d.name,
    Negative: d.neg,
    Neutral:  d.neu,
    Positive: d.pos,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={AXIS_TICK} angle={-40} textAnchor="end" interval={0} />
        <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`]} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingBottom: 8 }} />
        <Bar dataKey="Negative" stackId="s" fill={SENTIMENT_PALETTE.Negative} />
        <Bar dataKey="Neutral"  stackId="s" fill={SENTIMENT_PALETTE.Neutral} />
        <Bar dataKey="Positive" stackId="s" fill={SENTIMENT_PALETTE.Positive} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Ratings stacked bar ─────────────────────────────────────────────────────

interface RatingBarProps {
  data: GroupedStats[];
  height?: number;
}

export function RatingStackedBar({ data, height = 230 }: RatingBarProps) {
  const chartData = data.map(d => ({
    name: d.name,
    "1★": d.r1, "2★": d.r2, "3★": d.r3, "4★": d.r4, "5★": d.r5,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={AXIS_TICK} angle={-40} textAnchor="end" interval={0} />
        <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`]} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingBottom: 8 }} />
        <Bar dataKey="1★" stackId="r" fill={RATING_PALETTE["1★"]} />
        <Bar dataKey="2★" stackId="r" fill={RATING_PALETTE["2★"]} />
        <Bar dataKey="3★" stackId="r" fill={RATING_PALETTE["3★"]} />
        <Bar dataKey="4★" stackId="r" fill={RATING_PALETTE["4★"]} />
        <Bar dataKey="5★" stackId="r" fill={RATING_PALETTE["5★"]} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Avg rating bar (colour-coded by value) ──────────────────────────────────

interface AvgRatingBarProps {
  data: GroupedStats[];
  height?: number;
}

export function AvgRatingBar({ data, height = 190 }: AvgRatingBarProps) {
  const chartData = data.map(d => ({ name: d.name, "Avg Rating": d.avgRating }));
  const getColor = (v: number) =>
    v >= 4 ? SENTIMENT_PALETTE.Positive : v >= 3 ? SENTIMENT_PALETTE.Neutral : SENTIMENT_PALETTE.Negative;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 20, right: 8, left: -10, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={AXIS_TICK} angle={-40} textAnchor="end" interval={0} />
        <YAxis tick={AXIS_TICK} domain={[0, 5]} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="Avg Rating" radius={[3, 3, 0, 0]}>
          <LabelList dataKey="Avg Rating" position="top" style={{ fontSize: 9, fill: "#94a3b8" }} />
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getColor(entry["Avg Rating"])} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Chart panel wrapper ─────────────────────────────────────────────────────

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ChartPanel({ title, subtitle, children }: ChartPanelProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
      <div className="mb-3">
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
