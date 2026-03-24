// src/hooks/useReviewData.ts

// Loads all brand files for a given platform from public/data/sentiment data
// Files expected: public/data/sentiment data/{platform}_{brand}.json.gz
// Each file = array of review records (see schema below)
//
// Schema per record:
//   asin, review_title, review_body, review_sentence, brand, product_title,
//   rating (1-5), date (ISO), size, color, topic, topic_id (T01-T14),
//   sentiment ("Positive"|"Neutral"|"Negative"),
//   category_1, category_2 (Men/Women/Unisex), category_3 (minor cat), platform

import { useState, useEffect } from "react";

export type Sentiment = "Positive" | "Neutral" | "Negative";

export interface ReviewRecord {
  asin: string;
  review_title: string;
  review_body: string;
  review_sentence: string;
  brand: string;
  product_title: string;
  rating: number;
  date: string;
  size: string;
  color: string;
  topic: string;
  topic_id: string;
  sentiment: Sentiment;
  category_1: string;
  category_2: string;
  category_3: string;
  platform: string;
}

export type GroupedStats = {
  name: string;
  total: number;
  pos: number;   // % positive (0-100)
  neu: number;   // % neutral
  neg: number;   // % negative
  r1: number; r2: number; r3: number; r4: number; r5: number; // % of each rating
  avgRating: number;
};

export interface PlatformData {
  records: ReviewRecord[];
  topicStats: GroupedStats[];
  brandStats: GroupedStats[];
  categoryStats: GroupedStats[];
  loaded: boolean;
  error: string | null;
}

const BRANDS = ["Zudio", "H&M", "Biba", "FabIndia", "Manyavar", "Puma", "Uniqlo", "Levis"];

const TOPIC_NAMES: Record<string, string> = {
  T01: "Colour", T02: "Customer Service", T03: "Design/Pattern",
  T04: "Fake/Defective", T05: "Fit/Comfort", T06: "Delivery",
  T07: "Image vs Reality", T08: "Material/Fabric", T09: "Packaging",
  T10: "Peripherals", T11: "Product", T12: "Return/Warranty",
  T13: "Stitching", T14: "Value for Money",
};

function slugBrand(b: string) {
  return b.toLowerCase().replace(/'/g, "").replace(/\s+/g, "_").replace(/&/g, "and");
}

function slugPlatform(p: string) {
  return p.toLowerCase();
}

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

async function fetchGzip(url: string): Promise<ReviewRecord[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  writer.write(buf);
  writer.close();
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { merged.set(c, offset); offset += c.length; }
  return JSON.parse(new TextDecoder().decode(merged));
}

export function useReviewData(platform: string): PlatformData {
  const [state, setState] = useState<PlatformData>({
    records: [], topicStats: [], brandStats: [], categoryStats: [],
    loaded: false, error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ records: [], topicStats: [], brandStats: [], categoryStats: [], loaded: false, error: null });

    const load = async () => {
      try {
        const pSlug = slugPlatform(platform);
        const promises = BRANDS.map(b =>
          fetchGzip(`/data/sentiments%20data/${pSlug}_${slugBrand(b)}.json.gz`)
        );
        const results = await Promise.all(promises);
        if (cancelled) return;

        const allRecords: ReviewRecord[] = results.flat();

        // Map topic_id to readable name for grouping
        const topicRecords = allRecords.map(r => ({
          ...r,
          topic_label: TOPIC_NAMES[r.topic_id] ?? r.topic,
        }));

        const topicStats = computeStats(allRecords as ReviewRecord[], "topic_id").map(s => ({
          ...s,
          name: TOPIC_NAMES[s.name] ?? s.name,
        }));

        const brandStats  = computeStats(allRecords, "brand");
        const categoryStats = computeStats(allRecords, "category_3");

        setState({ records: allRecords, topicStats, brandStats, categoryStats, loaded: true, error: null });

      } catch (e: unknown) {
        if (!cancelled) setState(prev => ({ ...prev, loaded: true, error: String(e) }));
      }
    };

    load();
    return () => { cancelled = true; };
  }, [platform]);

  return state;
}
