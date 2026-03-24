import { useNavigate } from "react-router-dom";
import { BarChart2, Star, ArrowRight } from "lucide-react";
import logoColor from "@/assets/netscribes-logo-color.png";
import logoWhite from "@/assets/netscribes-logo-white.png";
import { useTheme } from "next-themes";

const MODULES = [
  {
    id: "dashboard",
    path: "/login?redirect=/dashboard/assortment",
    icon: BarChart2,
    label: "Selection Gap Intelligence",
    tagline: "Track stockouts, fill rates and inventory gaps across platforms and cities.",
    color: "#6366f1",
    gradient: "from-indigo-950 to-slate-900",
    border: "border-indigo-500/30",
    badge: "Availability · SKU · Fill Rate",
  },
  {
    id: "sentiment",
    path: "/login?redirect=/sentiment",
    icon: Star,
    label: "Review & Sentiment Intelligence",
    tagline: "Analyse customer reviews, ratings and topic trends across platforms and brands.",
    color: "#f43f5e",
    gradient: "from-rose-950 to-slate-900",
    border: "border-rose-500/30",
    badge: "Reviews · Sentiment · Topics",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <img
          src={theme === "dark" ? logoWhite : logoColor}
          alt="Netscribes"
          className="h-8 w-auto object-contain brightness-0 invert"
        />
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">Intelligence Platform</p>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Retail Intelligence Hub
          </h1>
          <p className="text-slate-500 mt-3 text-sm max-w-md">
            Select a module to begin your analysis.
          </p>
        </div>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => navigate(m.path)}
              className={`group relative overflow-hidden rounded-2xl border ${m.border} bg-gradient-to-br ${m.gradient} p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className="p-3 rounded-xl"
                  style={{ background: `${m.color}22` }}
                >
                  <Icon className="w-6 h-6" style={{ color: m.color }} />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
              </div>

              <h2 className="text-xl font-bold text-slate-100 mb-2 leading-tight">{m.label}</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">{m.tagline}</p>

              <span
                className="inline-block text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: `${m.color}22`, color: m.color }}
              >
                {m.badge}
              </span>

              {/* Glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 30%, ${m.color}, transparent 70%)` }}
              />
            </button>
          );
        })}
      </div>

      <p className="mt-12 text-xs text-slate-600">
        Prepared for Flipkart. March 2026.
      </p>
    </div>
  );
}
