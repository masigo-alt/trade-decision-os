import { describe, expect, it } from "vitest";
import { analyseWeek, buildWeeklyInsightDraft, demoBehaviourEntries, demoChecklists, demoTrades, tradeInsightDate, tradeOpeningDate } from "@/lib/weekly-insights";

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

  it("keeps open trades out of realised outcome metrics", () => {
    const withOpenTrade = analyseWeek(demoBehaviourEntries, [
      ...demoTrades,
      {
        ...demoTrades[0],
        date: "2026-07-25",
        status: "open" as const,
        result: null,
        pnl: null,
        realised_r_multiple: null,
        followed_plan: false,
        respected_stop: false,
        checklist_id: "demo-open",
      },
    ], demoChecklists);

    expect(withOpenTrade.trades).toMatchObject({ total: 5, open: 1, winRate: 60, netPnl: 280 });
    expect(withOpenTrade.trades.gateOutcomes.reduce((sum, group) => sum + group.trades, 0)).toBe(5);
  });

  it("allocates a completed trade to the week its outcome was recorded", () => {
    const completedTrade = {
      ...demoTrades[0],
      date: "2026-07-31",
      opened_at: "2026-08-03T11:28:39Z",
      closed_at: "2026-08-04T08:07:51Z",
    };

    expect(tradeInsightDate(completedTrade)).toBe("2026-08-04");
    expect(analyseWeek([], [completedTrade], []).overview.tradingDays).toBe(1);
  });

  it("allocates an open trade to its opening date and supports legacy records", () => {
    const openTrade = {
      ...demoTrades[0],
      date: "2026-07-31",
      opened_at: "2026-08-03T22:30:00Z",
      status: "open" as const,
    };

    expect(tradeInsightDate(openTrade)).toBe("2026-08-04");
    expect(tradeInsightDate(demoTrades[0])).toBe(demoTrades[0].date);
  });

  it("associates a pre-market check-in with trades opened on that day", () => {
    const entry = { ...demoBehaviourEntries[0], entry_date: "2026-08-03", net_positive: null };
    const trade = {
      ...demoTrades[0],
      date: "2026-07-31",
      opened_at: "2026-08-03T08:00:00Z",
      closed_at: "2026-08-04T08:00:00Z",
      pnl: -100,
      result: "loss" as const,
    };
    const result = analyseWeek([entry], [trade], []);

    expect(tradeOpeningDate(trade)).toBe("2026-08-03");
    expect(result.behaviour.negativeAssociations.some((pattern) => pattern.rate === 100)).toBe(false);
    expect(result.behaviour.positiveAssociations.every((pattern) => pattern.rate === 0)).toBe(true);
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
