import { describe, expect, it } from "vitest";
import { scoreTraderReadiness, type BehaviourReadinessInput } from "@/lib/trader-readiness";

const allPositive: BehaviourReadinessInput = {
  slept_well: true,
  felt_calm_before_trading: true,
  felt_pressure_to_make_money: false,
  traded_after_a_loss: false,
  overtraded: false,
  revenge_traded: false,
  respected_stop: true,
  followed_plan: true,
  traded_during_news: false,
};

describe("scoreTraderReadiness", () => {
  it("returns incomplete with a null score when a required field is unanswered", () => {
    const result = scoreTraderReadiness({ ...allPositive, traded_during_news: null });
    expect(result.recommendation).toBe("incomplete");
    expect(result.score).toBeNull();
  });

  it("recommends proceed with a high score on an all-positive day", () => {
    const result = scoreTraderReadiness(allPositive);
    expect(result.recommendation).toBe("proceed");
    expect(result.score).not.toBeNull();
    expect(result.score as number).toBeGreaterThanOrEqual(78);
  });

  it("blocks to avoid when the trader revenge traded, even with a decent score", () => {
    const result = scoreTraderReadiness({ ...allPositive, revenge_traded: true });
    expect(result.recommendation).toBe("avoid");
  });

  it("blocks to avoid when the plan was not followed", () => {
    const result = scoreTraderReadiness({ ...allPositive, followed_plan: false });
    expect(result.recommendation).toBe("avoid");
  });

  it("blocks to avoid when the stop was not respected", () => {
    const result = scoreTraderReadiness({ ...allPositive, respected_stop: false });
    expect(result.recommendation).toBe("avoid");
  });

  it("recommends wait or reduce_size on a mild-negative day", () => {
    const result = scoreTraderReadiness({ ...allPositive, slept_well: false, traded_after_a_loss: true });
    expect(["wait", "reduce_size"]).toContain(result.recommendation);
  });

  it("recommends wait when money pressure overrides an otherwise high score", () => {
    const result = scoreTraderReadiness({ ...allPositive, felt_pressure_to_make_money: true });
    expect(result.score as number).toBeGreaterThanOrEqual(78);
    expect(result.recommendation).toBe("wait");
  });

  it("floors the score at 0 and blocks to avoid on an all-negative day", () => {
    const result = scoreTraderReadiness({
      slept_well: false,
      felt_calm_before_trading: false,
      felt_pressure_to_make_money: true,
      traded_after_a_loss: true,
      overtraded: true,
      revenge_traded: true,
      respected_stop: false,
      followed_plan: false,
      traded_during_news: true,
    });
    expect(result.score).toBe(0);
    expect(result.recommendation).toBe("avoid");
  });
});
