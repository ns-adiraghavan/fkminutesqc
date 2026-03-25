// src/pages/SentimentDashboard.tsx
// Main page for Review & Sentiment Intelligence.
// Four platform tabs (Flipkart / Amazon / Myntra / Ajio), each with four
// sub-page tabs: Topic Pulse | Brand Scorecard | Category Lens | Review Intelligence

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReviewData } from "@/hooks/useReviewData";
import {
  TopicPulsePage,
  BrandScorecardPage,
  CategoryLensPage,
  ReviewIntelligencePage,
} from "@/components/dashboard/DashboardPages";
import { Loader2, AlertCircle, LogOut } from "lucide-react";
import logoWhite from "@/assets/netscribes-logo-white.png";
import { SentimentCopilot } from "@/components/SentimentCopilot";
import { supabase } from "@/integrations/supabase/client";

// ── Platform config ────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "Flipkart", label: "Flipkart",  color: "#2874F0", accent: "#FFB900", tagline: "Value-driven · High delivery sensitivity" },
  { id: "Amazon",   label: "Amazon",    color: "#FF9900", accent: "#232F3E", tagline: "Premium brands · Fabric & fit focus" },
  { id: "Myntra",   label: "Myntra",    color: "#FF3F6C", accent: "#FF7BAC", tagline: "Fashion-forward · Design & colour driven" },
  { id: "Ajio",     label: "Ajio",      color: "#E94560", accent: "#1A1A2E", tagline: "Curated ethnic/western · Fabric accuracy" },
];

const SUB_PAGES = [
  { id: "topic",    label: "Topic Pulse" },
  { id: "brand",    label: "Brand Scorecard" },
  { id: "category", label: "Category Lens" },
  { id: "insights", label: "Review Intelligence" },
];

// ── Platform tab content (loads data for the selected platform) ────────────

function PlatformContent({ platformId, platformColor }: { platformId: string; platformColor: string }) {
  const [subPage, setSubPage] = useState("topic");
  const { topicStats, brandStats, categoryStats, records, loaded, error } = useReviewData(platformId);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-slate-500" />
        <p className="text-slate-500 text-sm">Loading {platformId} review data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-red-400 text-sm">Failed to load data: {error}</p>
        <p className="text-slate-500 text-xs">Make sure the .json.gz files are in <code>public/data/sentiments-data/</code></p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI Summary strip — above the tabs */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2 font-medium">Platform Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Reviews", value: records.length.toLocaleString() },
            { label: "Avg Rating", value: (records.reduce((s, r) => s + r.rating, 0) / records.length).toFixed(1) + " ★" },
            { label: "% Positive", value: Math.round(records.filter(r => r.sentiment === "Positive").length / records.length * 100) + "%" },
            { label: "Brands Tracked", value: new Set(records.map(r => r.brand)).size.toString() },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">{kpi.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: platformColor }}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-page tab bar */}
      <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl w-fit border border-white/10">
        {SUB_PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => setSubPage(p.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              subPage === p.id
                ? "text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
            style={subPage === p.id ? { background: platformColor } : {}}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Page content */}
      {subPage === "topic"    && <TopicPulsePage    topicStats={topicStats}       platformColor={platformColor} records={records} />}
      {subPage === "brand"    && <BrandScorecardPage brandStats={brandStats}      platformColor={platformColor} records={records} />}
      {subPage === "category" && <CategoryLensPage  categoryStats={categoryStats} platformColor={platformColor} records={records} />}
      {subPage === "insights" && (
        <ReviewIntelligencePage
          platform={platformId}
          topicStats={topicStats}
          brandStats={brandStats}
          categoryStats={categoryStats}
          records={records}
        />
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function SentimentDashboard() {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState("Flipkart");
  const current = PLATFORMS.find(p => p.id === activePlatform)!;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="shrink-0 hover:opacity-75 transition-opacity">
              <img src={logoWhite} alt="Netscribes" className="h-7 w-auto object-contain" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Review & Sentiment Intelligence</h1>
              <p className="text-xs text-slate-500 mt-0.5">Apparel · Jan 2025 – Jan 2026 · 8 Brands</p>
            </div>
          </div>
          {/* Platform tabs */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePlatform(p.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activePlatform === p.id ? "text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
                style={activePlatform === p.id ? { background: p.color } : {}}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {/* Platform tagline */}
        <div className="max-w-screen-xl mx-auto px-6 pb-2">
          <p className="text-xs text-slate-500">{current.tagline}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <PlatformContent key={activePlatform} platformId={activePlatform} platformColor={current.color} />
      </div>

      {/* Sentiment Copilot */}
      <SentimentCopilot platformColor={current.color} platformId={activePlatform} />
    </div>
  );
}
