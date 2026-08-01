import { describe, expect, it } from "vitest";
import { analyseWeek, buildWeeklyInsightDraft, demoBehaviourEntries, demoChecklists, demoTrades } from "@/lib/weekly-insights";

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

  it("links demo trade outcomes back to every pre-trade decision", () => {
    expect(insights.trades.checklistLinkRate).toBe(100);
    expect(insights.trades.gateOutcomes.reduce((sum, group) => sum + group.trades, 0)).toBe(demoTrades.length);
  });

  it("separates proceed-aligned trades from overridden guardrails", () => {
    const proceed = insights.trades.gateOutcomes.find((group) => group.label === "Proceed-aligned");
    const overridden = insights.trades.gateOutcomes.find((group) => group.label === "Wait / Avoid overridden");

    expect(proceed).toMatchObject({ trades: 3, winRate: 100, netPnl: 485, netR: 5.1 });
    expect(overridden).toMatchObject({ trades: 1, winRate: 0, netPnl: -60, netR: -1 });
  });

  it("builds a deterministic record that can be persisted for the week", () => {
    const report = buildWeeklyInsightDraft(insights, "2026-07-20", "2026-07-26");

    expect(report).toMatchObject({
      week_start: "2026-07-20",
      week_end: "2026-07-26",
      trades_taken: 5,
      win_rate: 60,
      net_pnl: 280,
      net_r_multiple: 3.1,
    });
    expect(report.summary).toContain("5 recorded trades");
    expect(report.correlations.decision_to_outcome).toHaveLength(4);
  });
});
