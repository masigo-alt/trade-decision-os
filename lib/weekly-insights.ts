export type BehaviourEntry = {
  entry_date: string;
  slept_well: boolean;
  felt_calm_before_trading: boolean;
  felt_pressure_to_make_money: boolean;
  traded_after_a_loss: boolean;
  overtraded: boolean;
  revenge_traded: boolean;
  respected_stop: boolean;
  followed_plan: boolean;
  traded_during_news: boolean;
  net_positive: boolean | null;
};

export type TradeOutcome = { date: string; pnl: number | null; result: "win" | "loss" | "breakeven" | null };

type Pattern = { label: string; rate: number; days: number };

export type WeeklyAnalytics = {
  tradingDays: number;
  netPositiveDays: number;
  averageDiscipline: number;
  mostCommonNegative: string;
  positiveAssociations: Pattern[];
  negativeAssociations: Pattern[];
  recommendations: string[];
  dailyDiscipline: Array<{ date: string; score: number }>;
};

type Rule = { key: keyof BehaviourEntry; positiveLabel: string; negativeLabel: string; isGood: (value: boolean) => boolean };

const rules: Rule[] = [
  { key: "slept_well", positiveLabel: "Sleeping well", negativeLabel: "Poor sleep", isGood: (value) => value },
  { key: "felt_calm_before_trading", positiveLabel: "Feeling calm", negativeLabel: "Not feeling calm", isGood: (value) => value },
  { key: "felt_pressure_to_make_money", positiveLabel: "No money pressure", negativeLabel: "Feeling pressure to make money", isGood: (value) => !value },
  { key: "traded_after_a_loss", positiveLabel: "Not trading after a loss", negativeLabel: "Trading after a loss", isGood: (value) => !value },
  { key: "overtraded", positiveLabel: "Maintaining trade selectivity", negativeLabel: "Overtrading", isGood: (value) => !value },
  { key: "revenge_traded", positiveLabel: "Avoiding revenge trading", negativeLabel: "Revenge trading", isGood: (value) => !value },
  { key: "respected_stop", positiveLabel: "Respecting stops", negativeLabel: "Not respecting stops", isGood: (value) => value },
  { key: "followed_plan", positiveLabel: "Following the plan", negativeLabel: "Not following the plan", isGood: (value) => value },
  { key: "traded_during_news", positiveLabel: "Avoiding news-time execution", negativeLabel: "Trading during news", isGood: (value) => !value },
];

export function disciplineScore(entry: BehaviourEntry) {
  return Math.round((rules.filter((rule) => rule.isGood(entry[rule.key] as boolean)).length / rules.length) * 100);
}

function patternRate(entries: BehaviourEntry[], rule: Rule, outcome: boolean, goodState: boolean): Pattern {
  const matching = entries.filter((entry) => entry.net_positive === outcome && rule.isGood(entry[rule.key] as boolean) === goodState);
  const group = entries.filter((entry) => rule.isGood(entry[rule.key] as boolean) === goodState);
  return { label: goodState ? rule.positiveLabel : rule.negativeLabel, rate: group.length ? Math.round((matching.length / group.length) * 100) : 0, days: group.length };
}

export function analyseWeek(entries: BehaviourEntry[], trades: TradeOutcome[]): WeeklyAnalytics {
  const tradeDays = new Set(trades.map((trade) => trade.date));
  const journalDates = new Set(entries.map((entry) => entry.entry_date));
  const tradingDays = new Set([...tradeDays, ...journalDates]).size;
  const scored = entries.map((entry) => ({ ...entry, score: disciplineScore(entry) }));
  const averageDiscipline = scored.length ? Math.round(scored.reduce((total, entry) => total + entry.score, 0) / scored.length) : 0;

  const outcomeByTradeDay = new Map<string, number>();
  trades.forEach((trade) => outcomeByTradeDay.set(trade.date, (outcomeByTradeDay.get(trade.date) ?? 0) + (trade.pnl ?? 0)));
  const positiveDates = new Set(entries.filter((entry) => entry.net_positive === true).map((entry) => entry.entry_date));
  for (const [date, pnl] of outcomeByTradeDay) if (!journalDates.has(date) && pnl > 0) positiveDates.add(date);
  const netPositiveDays = positiveDates.size;

  const negatives = rules.map((rule) => ({ label: rule.negativeLabel, count: entries.filter((entry) => !rule.isGood(entry[rule.key] as boolean)).length })).sort((a, b) => b.count - a.count);
  const positiveAssociations = rules.map((rule) => patternRate(entries, rule, true, true)).filter((pattern) => pattern.days > 0).sort((a, b) => b.rate - a.rate).slice(0, 3);
  const negativeAssociations = rules.map((rule) => patternRate(entries, rule, false, false)).filter((pattern) => pattern.days > 0).sort((a, b) => b.rate - a.rate).slice(0, 3);

  const recommendations: string[] = [];
  if (averageDiscipline < 70) recommendations.push("Reduce trading complexity next week: take fewer, fully planned setups and complete the checklist before each one.");
  if (negatives[0]?.count > 0) recommendations.push(`Create one visible guardrail for ${negatives[0].label.toLowerCase()} before the next session.`);
  if (negativeAssociations[0]) recommendations.push(`Treat ${negativeAssociations[0].label.toLowerCase()} as a pause signal until the pattern is reviewed.`);
  if (recommendations.length === 0) recommendations.push("Keep the same process next week and prioritise consistency over increasing activity.");

  return {
    tradingDays,
    netPositiveDays,
    averageDiscipline,
    mostCommonNegative: negatives[0]?.count ? negatives[0].label : "No negative behaviours logged",
    positiveAssociations,
    negativeAssociations,
    recommendations: recommendations.slice(0, 3),
    dailyDiscipline: scored.map((entry) => ({ date: entry.entry_date.slice(5), score: entry.score })),
  };
}

export const demoBehaviourEntries: BehaviourEntry[] = [
  { entry_date: "2026-07-20", slept_well: true, felt_calm_before_trading: true, felt_pressure_to_make_money: false, traded_after_a_loss: false, overtraded: false, revenge_traded: false, respected_stop: true, followed_plan: true, traded_during_news: false, net_positive: true },
  { entry_date: "2026-07-21", slept_well: false, felt_calm_before_trading: false, felt_pressure_to_make_money: true, traded_after_a_loss: true, overtraded: true, revenge_traded: false, respected_stop: true, followed_plan: false, traded_during_news: false, net_positive: false },
  { entry_date: "2026-07-22", slept_well: true, felt_calm_before_trading: true, felt_pressure_to_make_money: false, traded_after_a_loss: false, overtraded: false, revenge_traded: false, respected_stop: true, followed_plan: true, traded_during_news: false, net_positive: true },
  { entry_date: "2026-07-23", slept_well: true, felt_calm_before_trading: true, felt_pressure_to_make_money: false, traded_after_a_loss: false, overtraded: false, revenge_traded: false, respected_stop: true, followed_plan: true, traded_during_news: true, net_positive: false },
  { entry_date: "2026-07-24", slept_well: true, felt_calm_before_trading: true, felt_pressure_to_make_money: false, traded_after_a_loss: false, overtraded: false, revenge_traded: false, respected_stop: true, followed_plan: true, traded_during_news: false, net_positive: true },
];

export const demoTrades: TradeOutcome[] = [{ date: "2026-07-20", pnl: 210, result: "win" }, { date: "2026-07-21", pnl: -145, result: "loss" }, { date: "2026-07-22", pnl: 95, result: "win" }, { date: "2026-07-23", pnl: -60, result: "loss" }, { date: "2026-07-24", pnl: 180, result: "win" }];
