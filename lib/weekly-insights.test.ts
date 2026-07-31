import { describe, expect, it } from "vitest";
import { analyseWeek, demoBehaviourEntries, demoChecklists, demoTrades } from "@/lib/weekly-insights";

describe("analyseWeek", () => {
  const insights = analyseWeek(demoBehaviourEntries, demoTrades, demoChecklists);

  it("counts every demo trade", () => {
    expect(insights.trades.total).toBe(5);
  });

  it("finds at least one trading day in the demo week", () => {
    expect(insights.overview.tradingDays).toBeGreaterThan(0);
  });

  it("keeps the win rate within a valid percentage range", () => {
    expect(insights.trades.winRate).toBeGreaterThanOrEqual(0);
    expect(insights.trades.winRate).toBeLessThanOrEqual(100);
  });

  it("always produces at least one recommendation", () => {
    expect(insights.recommendations.length).toBeGreaterThan(0);
  });

  it("splits every checklist into exactly one decision bucket", () => {
    const total = insights.preTrade.decisionBreakdown.reduce((sum, item) => sum + item.value, 0);
    expect(total).toBe(demoChecklists.length);
  });
});
