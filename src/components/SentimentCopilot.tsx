// src/components/SentimentCopilot.tsx
// Hardcoded copilot for the Review & Sentiment Intelligence page.

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, RefreshCw, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Which brand has the worst sentiment?",
  "What are the most common issues in reviews?",
  "Flipkart vs Amazon — which platform rates higher?",
  "Which brand has the highest avg rating?",
  "How are delivery complaints distributed?",
  "Which brand performs best on fit & comfort?",
];

// ── Hardcoded response map ──────────────────────────────────────────────────
const HARDCODED: Array<{ patterns: string[]; response: string }> = [
  {
    patterns: ["worst sentiment", "lowest sentiment", "most negative brand", "bad brand"],
    response: `**Fact**
- Zudio has the lowest positive sentiment rate across all platforms (~52%).
- Manyavar shows high negative spike on Myntra (+18% vs platform avg).

**Impact**
- Low sentiment brands drag category-level scores and search rank.

**Recommendation**
- Prioritise Zudio & Manyavar for quality/packaging review immediately.
- Check Category Lens → Ethnic Wear for related drop-off signals.`,
  },
  {
    patterns: ["negative review", "top complaint", "most complaints", "common issue", "biggest problem"],
    response: `**Fact**
- "Fake/Defective" (T04) is the top negative topic on Flipkart (~31% neg).
- "Image vs Reality" (T07) ranks #2 on Amazon and Myntra.

**Impact**
- Product quality and misrepresentation hurt repurchase and ratings.

**Recommendation**
- Escalate T04/T07 issues to sourcing and catalogue teams.
- Review product listing images for high-return SKUs immediately.`,
  },
  {
    patterns: ["flipkart vs amazon", "compare flipkart amazon", "flipkart amazon", "platform comparison"],
    response: `**Fact**
- Amazon avg rating: **4.1★** vs Flipkart: **3.8★** across all brands.
- Flipkart has 28% higher volume but 14% more negative reviews.

**Impact**
- Amazon skews premium; buyers expect and receive better quality signal.

**Recommendation**
- Address delivery and defect topics on Flipkart to close the 0.3★ gap.
- Monitor "Delivery" (T06) sentiment on Flipkart weekly.`,
  },
  {
    patterns: ["highest avg rating", "best category", "top category", "best rated category"],
    response: `**Fact**
- "Ethnic Wear" (category_3) holds the highest avg rating at **4.3★**.
- "T-Shirts" and "Activewear" trail at 3.7★ and 3.6★ respectively.

**Impact**
- Ethnic Wear buyers are more forgiving; fast-fashion basics face higher scrutiny.

**Recommendation**
- Use Ethnic Wear positive reviews as content for brand marketing.
- Focus improvement on Activewear "Fit/Comfort" (T05) issues.`,
  },
  {
    patterns: ["myntra complaint", "myntra issue", "myntra negative", "top complaint myntra"],
    response: `**Fact**
- "Design/Pattern" (T03) is Myntra's top negative topic (~24% neg rate).
- "Return/Warranty" (T12) follows closely at 21% negative on Myntra.

**Impact**
- Fashion-forward buyers on Myntra have higher design expectations.

**Recommendation**
- Align catalogue images with actual received product on Myntra.
- Review return policy clarity for top-complaint brands (H&M, Biba).`,
  },
  {
    patterns: ["fit", "comfort", "fit and comfort", "fit & comfort", "best fit"],
    response: `**Fact**
- Puma leads "Fit/Comfort" (T05) with **68% positive** sentiment.
- Levis and Uniqlo also above 60% positive on fit across platforms.

**Impact**
- Strong fit scores correlate with higher repeat purchase and brand loyalty.

**Recommendation**
- Highlight Puma/Levis fit sentiment in sponsored content and PDP copy.
- Use Puma's sizing guides as a template for weaker brands.`,
  },
  {
    patterns: ["fabric", "material", "quality"],
    response: `**Fact**
- "Material/Fabric" (T08) is #1 topic by volume across all platforms (~18% of all reviews).
- FabIndia leads fabric sentiment at 71% positive; Zudio lags at 44% positive.

**Impact**
- Fabric is the most discussed and influential topic on purchase decisions.

**Recommendation**
- FabIndia's material sourcing practices are a benchmark — share internally.
- Zudio fabric complaints require immediate supplier quality check.`,
  },
  {
    patterns: ["best brand", "top brand", "highest rated brand", "best performing brand"],
    response: `**Fact**
- FabIndia holds the highest avg rating: **4.2★** across all platforms.
- Puma follows at **4.1★**, driven by strong Fit/Comfort and Delivery scores.

**Impact**
- Heritage and craftsmanship narrative drives FabIndia's sustained sentiment lead.

**Recommendation**
- FabIndia and Puma are reference brands — analyse their review patterns for benchmarks.
- Other brands should address their bottom-2 topics to close the gap.`,
  },
  {
    patterns: ["delivery", "shipping", "late delivery", "delivery complaint"],
    response: `**Fact**
- "Delivery" (T06) has 29% negative sentiment on Flipkart, 19% on Amazon.
- Flipkart's delivery negatives peak in reviews from Nov–Dec 2025.

**Impact**
- Seasonal delivery failures compound negative brand association during peak sales.

**Recommendation**
- Coordinate with fulfilment teams before Q4 sales events.
- Flag high-delivery-complaint brands for SLA review with logistics partners.`,
  },
  {
    patterns: ["value", "price", "worth", "value for money"],
    response: `**Fact**
- "Value for Money" (T14) positive rate: Zudio **74%**, Puma **58%**, H&M **52%**.
- Budget brands (Zudio) outperform on value perception despite lower quality scores.

**Impact**
- Price-value alignment is a key retention driver for mass-market platforms.

**Recommendation**
- Zudio's value positioning is a competitive moat — protect pricing on Flipkart/Amazon.
- H&M should reconsider premium pricing vs. quality delivery to improve T14 sentiment.`,
  },
  {
    patterns: ["ajio", "ajio sentiment", "ajio review", "how is ajio"],
    response: `**Fact**
- Ajio shows the highest "Design/Pattern" (T03) positive rate at 67%.
- Avg rating on Ajio: **3.9★**, with Manyavar and Biba as top performers.

**Impact**
- Ajio buyers value curation and aesthetics; they are less price-sensitive.

**Recommendation**
- Double down on ethnic and festive wear listings on Ajio for higher engagement.
- Address "Return/Warranty" (T12) issues which weaken repeat purchase on Ajio.`,
  },
];

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const entry of HARDCODED) {
    if (entry.patterns.some(p => lower.includes(p))) {
      return entry.response;
    }
  }
  return `**Fact**
- This specific query isn't covered by the current hardcoded dataset.

**Recommendation**
- Try asking about brands, topics, platforms, or specific complaints.
- Examples: "Which brand has worst sentiment?" or "Top complaints on Myntra"`;
}

/** Renders markdown-style bullet lists and bold text */
function formatMessage(content: string) {
  const lines = content.split("\n").filter((l, i, arr) => {
    if (l.trim() === "" && arr[i - 1]?.trim() === "") return false;
    return true;
  });

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <p key={i} className="text-[11px] font-bold text-primary/80 uppercase tracking-wider mt-2 mb-0.5 first:mt-0">
              {trimmed.slice(2, -2)}
            </p>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          const text = trimmed.slice(2);
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-primary/60 mt-[3px] shrink-0 text-[10px]">▸</span>
              <span className="text-[12.5px] leading-snug">{renderInline(text)}</span>
            </div>
          );
        }

        return <p key={i} className="text-[12.5px] leading-snug">{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, j) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    ) : (
      <span key={j}>{part}</span>
    )
  );
}

interface SentimentCopilotProps {
  platformColor: string;
  platformId: string;
}

export function SentimentCopilot({ platformColor, platformId }: SentimentCopilotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setSuggestionsOpen(false);

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Simulate slight delay for feel
    setTimeout(() => {
      const reply = getResponse(text);
      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: reply };
      setMessages(prev => [...prev, assistantMsg]);
    }, 320);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestionsOpen(true);
  };

  const explainPage = () => {
    sendMessage(`Give me 3 key insights about ${platformId} review data`);
  };

  const showWelcome = messages.length === 0;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300",
          "text-white hover:opacity-90 active:scale-95",
          open && "opacity-0 pointer-events-none"
        )}
        style={{ background: platformColor }}
        aria-label="Open Sentiment Copilot"
      >
        <Bot className="h-5 w-5" />
        <span className="text-sm font-semibold tracking-tight">Copilot</span>
        <span className="flex h-2 w-2 rounded-full bg-white/70 animate-pulse" />
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-50 flex flex-col transition-all duration-300 ease-in-out",
          "w-[420px] max-w-[100vw]",
          open
            ? "h-[640px] max-h-[92vh] opacity-100 translate-y-0"
            : "h-0 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full m-4 rounded-xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-900 shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: `${platformColor}22` }}>
              <Bot className="h-4 w-4" style={{ color: platformColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100 leading-tight">Sentiment Copilot</p>
              <p className="text-[11px] text-slate-500 truncate">{platformId} · Review & Sentiment Intelligence</p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                  title="Clear chat"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Explain Page button */}
          <div className="px-4 py-2 border-b border-white/10 shrink-0 bg-slate-900/60">
            <button
              onClick={explainPage}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border border-dashed hover:opacity-90"
              style={{ borderColor: `${platformColor}55`, color: platformColor, background: `${platformColor}11` }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Explain This Platform's Data
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div ref={scrollRef} className="flex flex-col gap-3 px-4 py-3">

                {showWelcome && (
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: `${platformColor}22` }}>
                      <MessageSquare className="h-5 w-5" style={{ color: platformColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">Ask me about {platformId} reviews</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Grounded in sentiment & rating data</p>
                    </div>
                  </div>
                )}

                {/* Suggested questions */}
                {showWelcome && suggestionsOpen && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium px-1">Suggested questions</p>
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="text-left px-3 py-2 rounded-lg text-[12px] text-slate-400 hover:text-slate-200 border border-white/8 hover:border-white/20 bg-slate-800/50 hover:bg-slate-800 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat messages */}
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full mr-2 mt-0.5 shrink-0" style={{ background: `${platformColor}22` }}>
                        <Bot className="h-3 w-3" style={{ color: platformColor }} />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[84%] rounded-xl px-3 py-2.5",
                        msg.role === "user"
                          ? "text-white rounded-tr-sm text-[12.5px] leading-relaxed"
                          : "bg-slate-800 text-slate-200 rounded-tl-sm"
                      )}
                      style={msg.role === "user" ? { background: platformColor } : {}}
                    >
                      {msg.role === "assistant" ? formatMessage(msg.content) : (
                        <span className="text-[12.5px] leading-relaxed">{msg.content}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-white/10 bg-slate-900 p-3">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about brands, topics, or platforms…"
                rows={1}
                className="flex-1 resize-none rounded-lg bg-slate-800 border border-white/10 text-slate-200 placeholder:text-slate-600 text-[13px] px-3 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
                style={{ maxHeight: 96 }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 shrink-0"
                style={{ background: platformColor }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-700 text-center mt-1.5">Press Enter to send · Shift+Enter for newline</p>
          </div>
        </div>
      </div>
    </>
  );
}
