export type BehaviourReadinessInput = {
  slept_well: boolean | null;
  felt_calm_before_trading: boolean | null;
  felt_pressure_to_make_money: boolean | null;
  traded_after_a_loss: boolean | null;
  overtraded: boolean | null;
  revenge_traded: boolean | null;
  respected_stop: boolean | null;
  followed_plan: boolean | null;
  traded_during_news: boolean | null;
  net_positive?: boolean | null;
};

export type ReadinessRecommendation = "proceed" | "wait" | "reduce_size" | "avoid" | "incomplete";

export type TraderReadiness = {
  score: number | null;
  recommendation: ReadinessRecommendation;
  summary: string;
  factors: string[];
};

const requiredFields: Array<keyof Omit<BehaviourReadinessInput, "net_positive">> = [
  "slept_well",
  "felt_calm_before_trading",
  "felt_pressure_to_make_money",
  "traded_after_a_loss",
  "overtraded",
  "revenge_traded",
  "respected_stop",
  "followed_plan",
  "traded_during_news",
];

/**
 * Converts an honest daily behaviour check-in into a conservative risk posture.
 * `net_positive` is intentionally excluded: a realised result should not be used
 * as a signal that the next trade deserves more risk.
 */
export function scoreTraderReadiness(input: BehaviourReadinessInput): TraderReadiness {
  if (requiredFields.some((field) => input[field] === null)) {
    return { score: null, recommendation: "incomplete", summary: "Complete the behaviour check-in to see your readiness score.", factors: [] };
  }

  let score = 70;
  const factors: string[] = [];
  const add = (points: number, factor: string) => { score += points; factors.push(factor); };

  input.slept_well ? add(8, "Rest supports better decisions") : add(-12, "Poor sleep reduces decision quality");
  input.felt_calm_before_trading ? add(10, "You reported a calm baseline") : add(-16, "Lack of calm is a meaningful risk signal");
  if (input.felt_pressure_to_make_money) add(-18, "Pressure to make money raises impulsivity risk");
  if (input.traded_after_a_loss) add(-10, "Trading after a loss needs extra discipline");
  if (input.overtraded) add(-14, "Overtrading suggests lower selectivity");
  if (input.revenge_traded) add(-25, "Revenge trading is a hard risk warning");
  input.respected_stop ? add(8, "You respected your risk limit") : add(-18, "A broken stop is a hard risk warning");
  input.followed_plan ? add(12, "You followed your stated plan") : add(-22, "Not following the plan is a hard risk warning");
  if (input.traded_during_news) add(-8, "News-time execution adds volatility risk");

  score = Math.max(0, Math.min(100, score));
  const hardBlocker = input.revenge_traded || !input.followed_plan || !input.respected_stop;

  if (hardBlocker || score < 45) {
    return { score, recommendation: "avoid", summary: "Avoid new discretionary trades. Reset, review your plan, and protect capital.", factors };
  }
  if (score < 65) {
    return { score, recommendation: "reduce_size", summary: "Reduce size materially and only take your clearest planned setup.", factors };
  }
  if (score < 78 || input.felt_pressure_to_make_money || input.traded_after_a_loss) {
    return { score, recommendation: "wait", summary: "Wait for an A+ setup and a clear market trigger before committing risk.", factors };
  }
  return { score, recommendation: "proceed", summary: "You are clear to trade your plan, with normal risk limits still in place.", factors };
}
