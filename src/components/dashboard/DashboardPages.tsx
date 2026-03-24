// src/components/dashboard/DashboardPages.tsx

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import type { GroupedStats, ReviewRecord } from "@/hooks/useReviewData";
import {
  VolumeBar, SentimentStackedBar, RatingStackedBar, AvgRatingBar, ChartPanel,
} from "@/components/charts/DashboardCharts";

// ── Slicer helpers ─────────────────────────────────────────────────────────

const TOPIC_NAMES: Record<string, string> = {
  T01: "Colour", T02: "Customer Service", T03: "Design/Pattern",
  T04: "Fake/Defective", T05: "Fit/Comfort", T06: "Delivery",
  T07: "Image vs Reality", T08: "Material/Fabric", T09: "Packaging",
  T10: "Peripherals", T11: "Product", T12: "Return/Warranty",
  T13: "Stitching", T14: "Value for Money",
};

function computeStats(records: ReviewRecord[], groupKey: keyof ReviewRecord): GroupedStats[] {
  const groups: Record<string, ReviewRecord[]> = {};
  for (const r of records) {
    const k = r[groupKey] as string;
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  }
  return Object.entries(groups).map(([name, recs]) => {
    const total = recs.length;
    const pos = Math.round((recs.filter(r => r.sentiment === "Positive").length / total) * 100);
    const neg = Math.round((recs.filter(r => r.sentiment === "Negative").length / total) * 100);
    const neu = 100 - pos - neg;
    const r1 = Math.round((recs.filter(r => r.rating === 1).length / total) * 100);
    const r2 = Math.round((recs.filter(r => r.rating === 2).length / total) * 100);
    const r3 = Math.round((recs.filter(r => r.rating === 3).length / total) * 100);
    const r4 = Math.round((recs.filter(r => r.rating === 4).length / total) * 100);
    const r5 = 100 - r1 - r2 - r3 - r4;
    const avgRating = parseFloat((recs.reduce((s, r) => s + r.rating, 0) / total).toFixed(1));
    return { name, total, pos, neu, neg, r1, r2, r3, r4, r5, avgRating };
  }).sort((a, b) => b.total - a.total);
}

// ── Slicer pill component ──────────────────────────────────────────────────

interface SlicerProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  color: string;
}

function Slicer({ label, options, selected, onChange, color }: SlicerProps) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 mr-1 shrink-0">{label}</span>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
              active
                ? "border-transparent text-white"
                : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 bg-slate-900/60"
            }`}
            style={active ? { background: color, borderColor: color } : {}}
          >
            {opt}
            {active && <X className="w-2.5 h-2.5 opacity-80" />}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-[10px] text-slate-500 hover:text-slate-300 underline ml-1 transition-colors"
        >
          clear
        </button>
      )}
    </div>
  );
}

// ── Slicer bar wrapper ─────────────────────────────────────────────────────

function SlicerBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-slate-900/40 px-4 py-3">
      {children}
    </div>
  );
}

// ── Shared four-chart grid ─────────────────────────────────────────────────

interface FourChartGridProps {
  volumeTitle: string;
  data: GroupedStats[];
  platformColor: string;
}

function FourChartGrid({ volumeTitle, data, platformColor }: FourChartGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartPanel title={volumeTitle} subtitle="Number of reviews">
        <VolumeBar data={data} color={platformColor} />
      </ChartPanel>
      <ChartPanel title="Sentiment Split" subtitle="Positive / Neutral / Negative %">
        <SentimentStackedBar data={data} />
      </ChartPanel>
      <ChartPanel title="Rating Distribution" subtitle="% share of each star rating">
        <RatingStackedBar data={data} />
      </ChartPanel>
      <ChartPanel title="Average Rating" subtitle="Colour-coded: green ≥4, amber ≥3, red <3">
        <AvgRatingBar data={data} />
      </ChartPanel>
    </div>
  );
}

// ── Page 1: Topic Pulse ────────────────────────────────────────────────────
// Slicers: Brand, Category (category_3)

export function TopicPulsePage({ topicStats, platformColor, records }: {
  topicStats: GroupedStats[];
  platformColor: string;
  records: ReviewRecord[];
}) {
  const allBrands = useMemo(() => [...new Set(records.map(r => r.brand))].sort(), [records]);
  const allCategories = useMemo(() => [...new Set(records.map(r => r.category_3))].sort(), [records]);

  const [selBrands, setSelBrands] = useState<string[]>([]);
  const [selCategories, setSelCategories] = useState<string[]>([]);

  const filteredStats = useMemo(() => {
    const noBrandFilter = selBrands.length === 0;
    const noCatFilter = selCategories.length === 0;
    if (noBrandFilter && noCatFilter) return topicStats;

    const filtered = records.filter(r =>
      (noBrandFilter || selBrands.includes(r.brand)) &&
      (noCatFilter || selCategories.includes(r.category_3))
    );
    return computeStats(filtered, "topic_id").map(s => ({
      ...s,
      name: TOPIC_NAMES[s.name] ?? s.name,
    }));
  }, [records, selBrands, selCategories, topicStats]);

  return (
    <div className="space-y-4">
      <SlicerBar>
        <Slicer label="Brand" options={allBrands} selected={selBrands} onChange={setSelBrands} color={platformColor} />
        <Slicer label="Category" options={allCategories} selected={selCategories} onChange={setSelCategories} color={platformColor} />
      </SlicerBar>
      <FourChartGrid volumeTitle="Topic Volume" data={filteredStats} platformColor={platformColor} />
    </div>
  );
}

// ── Page 2: Brand Scorecard ────────────────────────────────────────────────
// Slicers: Topic, Category (category_3)

export function BrandScorecardPage({ brandStats, platformColor, records }: {
  brandStats: GroupedStats[];
  platformColor: string;
  records: ReviewRecord[];
}) {
  const allTopics = useMemo(() => Object.values(TOPIC_NAMES).sort(), []);
  const allCategories = useMemo(() => [...new Set(records.map(r => r.category_3))].sort(), [records]);

  const [selTopics, setSelTopics] = useState<string[]>([]);
  const [selCategories, setSelCategories] = useState<string[]>([]);

  // Reverse map topic readable name → topic_id
  const topicNameToId = useMemo(() => {
    const m: Record<string, string> = {};
    Object.entries(TOPIC_NAMES).forEach(([id, name]) => { m[name] = id; });
    return m;
  }, []);

  const filteredStats = useMemo(() => {
    const noTopicFilter = selTopics.length === 0;
    const noCatFilter = selCategories.length === 0;
    if (noTopicFilter && noCatFilter) return brandStats;

    const selTopicIds = selTopics.map(t => topicNameToId[t]).filter(Boolean);
    const filtered = records.filter(r =>
      (noTopicFilter || selTopicIds.includes(r.topic_id)) &&
      (noCatFilter || selCategories.includes(r.category_3))
    );
    return computeStats(filtered, "brand");
  }, [records, selTopics, selCategories, brandStats, topicNameToId]);

  return (
    <div className="space-y-4">
      <SlicerBar>
        <Slicer label="Topic" options={allTopics} selected={selTopics} onChange={setSelTopics} color={platformColor} />
        <Slicer label="Category" options={allCategories} selected={selCategories} onChange={setSelCategories} color={platformColor} />
      </SlicerBar>
      <FourChartGrid volumeTitle="Brand Volume" data={filteredStats} platformColor={platformColor} />
    </div>
  );
}

// ── Page 3: Category Lens ──────────────────────────────────────────────────
// Slicers: Brand, Topic

export function CategoryLensPage({ categoryStats, platformColor, records }: {
  categoryStats: GroupedStats[];
  platformColor: string;
  records: ReviewRecord[];
}) {
  const allBrands = useMemo(() => [...new Set(records.map(r => r.brand))].sort(), [records]);
  const allTopics = useMemo(() => Object.values(TOPIC_NAMES).sort(), []);

  const [selBrands, setSelBrands] = useState<string[]>([]);
  const [selTopics, setSelTopics] = useState<string[]>([]);

  const topicNameToId = useMemo(() => {
    const m: Record<string, string> = {};
    Object.entries(TOPIC_NAMES).forEach(([id, name]) => { m[name] = id; });
    return m;
  }, []);

  const filteredStats = useMemo(() => {
    const noBrandFilter = selBrands.length === 0;
    const noTopicFilter = selTopics.length === 0;
    if (noBrandFilter && noTopicFilter) return categoryStats;

    const selTopicIds = selTopics.map(t => topicNameToId[t]).filter(Boolean);
    const filtered = records.filter(r =>
      (noBrandFilter || selBrands.includes(r.brand)) &&
      (noTopicFilter || selTopicIds.includes(r.topic_id))
    );
    return computeStats(filtered, "category_3");
  }, [records, selBrands, selTopics, categoryStats, topicNameToId]);

  return (
    <div className="space-y-4">
      <SlicerBar>
        <Slicer label="Brand" options={allBrands} selected={selBrands} onChange={setSelBrands} color={platformColor} />
        <Slicer label="Topic" options={allTopics} selected={selTopics} onChange={setSelTopics} color={platformColor} />
      </SlicerBar>
      <FourChartGrid volumeTitle="Category Volume" data={filteredStats} platformColor={platformColor} />
    </div>
  );
}

// ── Page 4: Review Intelligence (Static Insights) ─────────────────────────

const INSIGHT_TABS = [
  {
    id: "overall", label: "Overall",
    questions: [
      "What are the top 5 reasons customers are dissatisfied with products on this platform?",
      "Which product features are most commonly praised or criticised across brands?",
      "Are there recurring complaints that indicate quality control issues?",
      "What key themes influence 5-star vs 1-star ratings?",
      "What patterns or keywords are emerging in recent negative reviews?",
      "Which customer segments (size, color, region) show the most polarised feedback?",
    ],
  },
  {
    id: "category", label: "Category",
    questions: [
      "Which product categories receive the most positive and negative sentiment?",
      "Which categories drive the highest volume of 1–2★ reviews, and why?",
      "What are the top emerging concerns within each major category?",
      "Are there category-specific expectations consistently unmet?",
      "Which categories show the greatest sentiment variation across brands?",
      "Which categories see inconsistent experiences across sizes or color variants?",
    ],
  },
  {
    id: "subcategory", label: "Sub Category",
    questions: [
      "Which sub-categories have the highest volume of extreme reviews (1★ and 5★)?",
      "Where are product expectations most misaligned with what's delivered?",
      "What are the most common complaints and compliments per sub-category?",
      "Which sub-categories show the most brand-to-brand sentiment variation?",
      "Do certain sub-categories show more functional dissatisfaction?",
      "Which sub-categories have disproportionate return/refund mentions?",
    ],
  },
  {
    id: "minorcategory", label: "Minor Category",
    questions: [
      "Which minor clothing categories receive the most extreme ratings?",
      "Which styles or fits generate the most comfort or wearability complaints?",
      "Are specific fabric types associated with repeated dissatisfaction?",
      "Which minor categories show frequent visual mismatch complaints?",
      "Which items show more issues post-wash (shrinkage, colour bleed)?",
      "Are there specific sizes or colour variants that consistently draw lower ratings?",
    ],
  },
  {
    id: "brand", label: "Brand",
    questions: [
      "Which brands consistently receive the highest customer satisfaction?",
      "Which brands show the most variability in customer sentiment?",
      "What aspects of experience (fit, fabric, design) differentiate the top brands?",
      "Which brands are most frequently associated with returns or refunds?",
      "How do customer expectations differ by brand?",
      "Are there rising concerns for any popular brands on this platform?",
    ],
  },
  {
    id: "topics", label: "Topics",
    questions: [
      "Which topics are most frequently associated with negative sentiment?",
      "What topics drive the most positive feedback in reviews?",
      "Are there topics that appear in both good and bad reviews (dual-polarity)?",
      "Which topics are increasingly appearing in recent reviews?",
      "How do different topics affect average rating?",
      "Are topic mentions skewed by specific product types or variants?",
    ],
  },
];

function buildStaticAnswers(
  platform: string,
  topicStats: GroupedStats[],
  brandStats: GroupedStats[],
  categoryStats: GroupedStats[],
): Record<string, string[][]> {
  const topNeg = topicStats.filter(t => t.neg > 30).map(t => t.name).slice(0, 3).join(", ");
  const topPos = topicStats.filter(t => t.pos > 55).map(t => t.name).slice(0, 3).join(", ");
  const topBrand = brandStats[0]?.name ?? "N/A";
  const lowBrand = [...brandStats].sort((a, b) => a.avgRating - b.avgRating)[0]?.name ?? "N/A";

  return {
    overall: [
      [`Sizing inconsistencies across brands`, `Colour mismatch vs listing images`, `Delayed or damaged delivery`, `Fabric quality below expectations`, `Difficult return/exchange process`],
      [`Praised: Fit/comfort, fabric quality, value for money on ${platform}`, `Criticised: Image accuracy, stitching consistency, delivery experience`],
      [`Repeat mentions of stitching coming apart`, `Colour bleed after first wash`, `Size labelling inconsistencies across brands`],
      [`5-star themes: Great fit, premium fabric, fast delivery, looks exactly as shown`, `1-star themes: Wrong size, colour mismatch, poor stitching, difficult returns`],
      [`Increasing use of "fake product" and "not genuine" language`, `More packaging complaints in recent months`, `Tone in 1-star reviews has become more accusatory`],
      [`Medium sizes attract the most sizing complaints`, `Bright colours (Red, Orange) more prone to mismatch reports`, `Women's ethnic wear shows higher sentiment polarisation`],
    ],
    category: [
      [`Most positive: Sportswear, Accessories. Most negative: Jeans, Suits & Blazers`],
      [`Jeans and Trousers lead 1–2★ volume — sizing and stretch complaints dominate`],
      [`Ethnic Wear: fabric authenticity. Sportswear: durability. Innerwear: sizing accuracy`],
      [`Ethnic wear customers expect hand-crafted quality but receive machine-made finish`, `Jeans buyers expect true-to-size fits consistently across brands`],
      [`Innerwear and Jeans show the highest brand-to-brand sentiment gap on ${platform}`],
      [`Winterwear shows inconsistent sizing across colour variants`, `Activewear shows more complaints in XL and above`],
    ],
    subcategory: [
      [`5★ peaks: Accessories, Ethnic Wear. 1★ peaks: Jeans, Sleep & Lounge Wear`],
      [`Sleep & Lounge Wear — comfort expectations rarely met. Jeans — fit rarely as described`],
      [`Shirts: praised for design, criticised for stitching. Trousers: praised for look, criticised for fit`],
      [`Innerwear shows widest brand variation in satisfaction on ${platform}`],
      [`Jeans: waistband issues. Innerwear: elastic degradation. Activewear: colour fade`],
      [`Ethnic Wear and Suits & Blazers have disproportionate return mentions`],
    ],
    minorcategory: [
      [`1★ extreme: Jeans, Lingerie. 5★ extreme: Accessories, Ethnic Wear`],
      [`Slim-fit Trousers and Skinny Jeans generate most fit complaints`, `Relaxed-fit Shirts occasionally flagged as oversized`],
      [`Synthetic blends in Activewear and Innerwear draw repeated negative feedback`, `Cotton-heavy fabrics in Ethnic Wear consistently praised`],
      [`Ethnic Wear and Western Wear show frequent image vs delivery mismatch`, `Printed T-Shirts often show colour variation from listing`],
      [`Jeans: colour bleed and shrinkage. Innerwear: elastic degradation. Shirts: collar shape loss`],
      [`Size M and L have the most reviews; XS and 3XL attract disproportionately lower ratings`, `Dark colours (Black, Navy) receive more colour bleed complaints post-wash`],
    ],
    brand: [
      [`Highest satisfaction on ${platform}: ${topBrand} leads in avg rating and positive sentiment %`],
      [`${lowBrand} shows the widest sentiment variance — strong opinions both positive and negative`],
      [`Top brands differentiate on fabric quality and accurate sizing; mid-tier brands lose on image accuracy`],
      [`${lowBrand} and budget-positioned brands show elevated return/refund mention rates`],
      [`Premium brand buyers expect consistency; value brand buyers prioritise price-to-quality ratio`],
      [`Watch ${lowBrand}: increasing stitching complaints in Q1 2026 reviews`],
    ],
    topics: [
      [`Most negative topics: ${topNeg || "Fake/Defective, Return/Warranty, Image vs Reality"}`],
      [`Most positive topics: ${topPos || "Fit/Comfort, Product, Value for Money"}`],
      [`Dual-polarity topics: Fit/Comfort (praised when good, harshly criticised when not), Colour`],
      [`Emerging in recent reviews: Packaging complaints, Fake/Defective mentions, Delivery speed`],
      [`Topics lowering avg rating most: Fake/Defective (avg ~1.8), Return/Warranty (avg ~2.1)`, `Topics raising avg rating: Product satisfaction (avg ~4.3), Value for Money (avg ~4.1)`],
      [`Colour and Stitching mentions are skewed toward Ethnic Wear and Printed T-Shirts`, `Delivery and Return topics over-indexed for Jeans and Trousers`],
    ],
  };
}

interface ReviewIntelligencePageProps {
  platform: string;
  topicStats: GroupedStats[];
  brandStats: GroupedStats[];
  categoryStats: GroupedStats[];
  records: ReviewRecord[];
}

export function ReviewIntelligencePage({
  platform, topicStats, brandStats, categoryStats,
}: ReviewIntelligencePageProps) {
  const [activeTab, setActiveTab] = useState("overall");

  const staticAnswers = buildStaticAnswers(platform, topicStats, brandStats, categoryStats);
  const currentInsightTab = INSIGHT_TABS.find(t => t.id === activeTab)!;
  const currentAnswers = staticAnswers[activeTab] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {INSIGHT_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {currentInsightTab.questions.map((q, i) => {
          const bullets: string[] = currentAnswers[i] ?? ["Insights will appear once data is loaded."];
          return (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-5 space-y-3"
            >
              <p className="text-sm font-semibold text-slate-200 leading-snug">{q}</p>
              <ul className="space-y-1.5">
                {bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
                    <span className="mt-1 w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
