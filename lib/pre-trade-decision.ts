export type PreTradeDecisionInput = {
  plannedRiskPercentage: number;
  economicCalendarChecked: boolean;
  marketConditionsSupportIdea: boolean;
  hasClearInvalidation: boolean;
  riskRewardAcceptable: boolean;
  matchesTradingPlan: boolean;
  emotionalStateAcceptable: boolean;
};

export type PreTradeDecision = {
  recommendation: "proceed" | "wait" | "reduce_size" | "avoid";
  label: "Proceed" | "Wait" | "Reduce Size" | "Avoid";
  reason: string;
};

/** Applies the MVP's stated decision gate in a conservative order. */
export function decidePreTrade(input: PreTradeDecisionInput): PreTradeDecision {
  if (!input.matchesTradingPlan) return { recommendation: "avoid", label: "Avoid", reason: "The planned trade does not match your trading plan." };
  if (!input.hasClearInvalidation) return { recommendation: "avoid", label: "Avoid", reason: "A clear invalidation point is required before taking risk." };
  if (!input.economicCalendarChecked) return { recommendation: "wait", label: "Wait", reason: "Check the high-impact economic calendar before committing risk." };
  if (!input.emotionalStateAcceptable) {
    if (!input.marketConditionsSupportIdea || !input.riskRewardAcceptable) return { recommendation: "avoid", label: "Avoid", reason: "Emotional state and setup quality are not sufficiently aligned." };
    return { recommendation: "reduce_size", label: "Reduce Size", reason: "The setup is aligned, but reduce exposure until your emotional state improves." };
  }
  if (input.marketConditionsSupportIdea && input.riskRewardAcceptable) return { recommendation: "proceed", label: "Proceed", reason: "The key market, risk, plan, and emotional checks are aligned." };
  return { recommendation: "wait", label: "Wait", reason: "Wait for the remaining market or risk/reward conditions to align." };
}
