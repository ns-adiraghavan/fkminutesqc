// src/components/dashboard/DashboardPages.tsx
// The four named pages that appear as sub-tabs inside each platform tab:
//
//  1. Topic Pulse        — topic-level spread, sentiments, ratings, avg rating
//  2. Brand Scorecard    — same four charts grouped by brand
//  3. Category Lens      — same four charts grouped by minor category
//  4. Review Intelligence— static insights panel (6 tabs × 6 questions)
//
// All pages receive already-aggregated stats from the useReviewData hook.

import type { GroupedStats, ReviewRecord } from "@/hooks/useReviewData";
import {
  VolumeBar, SentimentStackedBar, RatingStackedBar, AvgRatingBar, ChartPanel,
} from "@/components/charts/DashboardCharts";
import { useState } from "react";

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

export function TopicPulsePage({ topicStats, platformColor }: {
  topicStats: GroupedStats[];
  platformColor: string;
}) {
  return (
    <FourChartGrid
      volumeTitle="Topic Volume"
      data={topicStats}
      platformColor={platformColor}
    />
  );
}

// ── Page 2: Brand Scorecard ────────────────────────────────────────────────

export function BrandScorecardPage({ brandStats, platformColor }: {
  brandStats: GroupedStats[];
  platformColor: string;
}) {
  return (
    <FourChartGrid
      volumeTitle="Brand Volume"
      data={brandStats}
      platformColor={platformColor}
    />
  );
}

// ── Page 3: Category Lens ──────────────────────────────────────────────────

export function CategoryLensPage({ categoryStats, platformColor }: {
  categoryStats: GroupedStats[];
  platformColor: string;
}) {
  return (
    <FourChartGrid
      volumeTitle="Category Volume"
      data={categoryStats}
      platformColor={platformColor}
    />
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

// Static pre-generated answers keyed by [tabId][questionIndex]
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
      {/* Sub-tab bar */}
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

      {/* Question grid */}
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
