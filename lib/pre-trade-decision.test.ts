import { describe, it, expect } from "vitest";
import { decidePreTrade, type PreTradeDecisionInput } from "@/lib/pre-trade-decision";

const base: PreTradeDecisionInput = {
  plannedRiskPercentage: 1,
  economicCalendarChecked: true,
  marketConditionsSupportIdea: true,
  hasClearInvalidation: true,
  riskRewardAcceptable: true,
  matchesTradingPlan: true,
  emotionalStateAcceptable: true,
};

describe("decidePreTrade", () => {
  it("blocks when the trade does not match the trading plan", () => {
    expect(decidePreTrade({ ...base, matchesTradingPlan: false }).recommendation).toBe("avoid");
  });

  it("blocks when there is no clear invalidation", () => {
    expect(decidePreTrade({ ...base, hasClearInvalidation: false }).recommendation).toBe("avoid");
  });

  it("asks to wait when the economic calendar has not been checked", () => {
    expect(decidePreTrade({ ...base, economicCalendarChecked: false }).recommendation).toBe("wait");
  });

  it("blocks when emotional state is off and the market/risk-reward setup is weak", () => {
    expect(decidePreTrade({ ...base, emotionalStateAcceptable: false, marketConditionsSupportIdea: false }).recommendation).toBe("avoid");
  });

  it("reduces size when emotional state is off but the setup is good", () => {
    expect(decidePreTrade({ ...base, emotionalStateAcceptable: false }).recommendation).toBe("reduce_size");
  });

  it("proceeds when everything is aligned at 1% planned risk", () => {
    expect(decidePreTrade({ ...base, plannedRiskPercentage: 1 }).recommendation).toBe("proceed");
  });

  it("proceeds at the 2% elevated-risk boundary", () => {
    expect(decidePreTrade({ ...base, plannedRiskPercentage: 2 }).recommendation).toBe("proceed");
  });

  it("reduces size when risk is above 2% but within the 5% ceiling", () => {
    expect(decidePreTrade({ ...base, plannedRiskPercentage: 3 }).recommendation).toBe("reduce_size");
  });

  it("blocks when planned risk exceeds the 5% ceiling", () => {
    const result = decidePreTrade({ ...base, plannedRiskPercentage: 6 });
    expect(result.recommendation).toBe("avoid");
    expect(result.reason).toContain("6%");
  });

  it("blocks on the risk ceiling ahead of the other hard blockers", () => {
    const result = decidePreTrade({ ...base, plannedRiskPercentage: 6, matchesTradingPlan: false });
    expect(result.recommendation).toBe("avoid");
    expect(result.reason).toContain("ceiling");
  });
});
