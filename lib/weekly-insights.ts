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

export type TradeOutcome = {
  date: string;
  pnl: number | null;
  result: "win" | "loss" | "breakeven" | null;
  followed_plan: boolean;
  respected_stop: boolean;
  mistake_type: string | null;
  setup_type: string | null;
};

export type PreTradeEntry = {
  submitted_at: string;
  risk_percent: number;
  economic_calendar_checked: boolean;
  market_conditions_aligned: boolean;
  has_clear_invalidation: boolean;
  risk_reward_acceptable: boolean;
  emotional_state_acceptable: boolean;
  trade_matches_plan: boolean;
  recommendation: "proceed" | "wait" | "reduce_size" | "avoid";
};

type Pattern = { label: string; rate: number; days: number };
type Breakdown = { label: string; value: number; colour: string };

export type WeeklyAnalytics = {
  overview: {
    tradingDays: number;
    netPositiveDays: number;
    averageDiscipline: number;
    checklistCount: number;
  };
  preTrade: {
    total: number;
    proceedRate: number;
    planAlignment: number;
    calendarCompliance: number;
    averageRisk: number;
    decisionBreakdown: Breakdown[];
    mostCommonBlocker: string;
  };
  trades: {
    total: number;
    winRate: number;
    netPnl: number;
    planAdherence: number;
    stopDiscipline: number;
    commonMistake: string;
    resultBreakdown: Breakdown[];
  };
  behaviour: {
    mostCommonNegative: string;
    positiveAssociations: Pattern[];
    negativeAssociations: Pattern[];
    dailyDiscipline: Array<{ date: string; score: number }>;
  };
  recommendations: string[];
};

type BehaviourRule = {
  key: keyof BehaviourEntry;
  positiveLabel: string;
  negativeLabel: string;
  isGood: (value: boolean) => boolean;
};

const behaviourRules: BehaviourRule[] = [
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

const percentage = (count: number, total: number) => total ? Math.round((count / total) * 100) : 0;
const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function disciplineScore(entry: BehaviourEntry) {
  return percentage(behaviourRules.filter((rule) => rule.isGood(entry[rule.key] as boolean)).length, behaviourRules.length);
}

function association(entries: BehaviourEntry[], rule: BehaviourRule, outcome: boolean, goodState: boolean): Pattern {
  const group = entries.filter((entry) => rule.isGood(entry[rule.key] as boolean) === goodState);
  const matching = group.filter((entry) => entry.net_positive === outcome);
  return { label: goodState ? rule.positiveLabel : rule.negativeLabel, rate: percentage(matching.length, group.length), days: group.length };
}

export function analyseWeek(entries: BehaviourEntry[], trades: TradeOutcome[], checklists: PreTradeEntry[]): WeeklyAnalytics {
  const tradingDays = new Set([...entries.map((entry) => entry.entry_date), ...trades.map((trade) => trade.date)]).size;
  const journalDates = new Set(entries.map((entry) => entry.entry_date));
  const positiveDates = new Set(entries.filter((entry) => entry.net_positive === true).map((entry) => entry.entry_date));
  const pnlByDate = new Map<string, number>();
  trades.forEach((trade) => pnlByDate.set(trade.date, (pnlByDate.get(trade.date) ?? 0) + Number(trade.pnl ?? 0)));
  for (const [date, pnl] of pnlByDate) if (!journalDates.has(date) && pnl > 0) positiveDates.add(date);

  const discipline = entries.map((entry) => disciplineScore(entry));
  const averageDiscipline = discipline.length ? Math.round(discipline.reduce((sum, score) => sum + score, 0) / discipline.length) : 0;
  const negativeCounts = behaviourRules.map((rule) => ({
    label: rule.negativeLabel,
    count: entries.filter((entry) => !rule.isGood(entry[rule.key] as boolean)).length,
  })).sort((a, b) => b.count - a.count);

  const checklistBlockers = [
    { label: "Trading plan mismatch", count: checklists.filter((item) => !item.trade_matches_plan).length },
    { label: "No clear invalidation", count: checklists.filter((item) => !item.has_clear_invalidation).length },
    { label: "Economic calendar unchecked", count: checklists.filter((item) => !item.economic_calendar_checked).length },
    { label: "Emotional state not acceptable", count: checklists.filter((item) => !item.emotional_state_acceptable).length },
    { label: "Market conditions not aligned", count: checklists.filter((item) => !item.market_conditions_aligned).length },
    { label: "Risk/reward not acceptable", count: checklists.filter((item) => !item.risk_reward_acceptable).length },
  ].sort((a, b) => b.count - a.count);

  const mistakeCounts = new Map<string, number>();
  trades.forEach((trade) => {
    if (trade.mistake_type) mistakeCounts.set(trade.mistake_type, (mistakeCounts.get(trade.mistake_type) ?? 0) + 1);
  });
  const commonMistake = [...mistakeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const decisionCount = (decision: PreTradeEntry["recommendation"]) => checklists.filter((item) => item.recommendation === decision).length;
  const resultCount = (result: TradeOutcome["result"]) => trades.filter((trade) => trade.result === result).length;

  const planAlignment = percentage(checklists.filter((item) => item.trade_matches_plan).length, checklists.length);
  const calendarCompliance = percentage(checklists.filter((item) => item.economic_calendar_checked).length, checklists.length);
  const planAdherence = percentage(trades.filter((trade) => trade.followed_plan).length, trades.length);
  const stopDiscipline = percentage(trades.filter((trade) => trade.respected_stop).length, trades.length);
  const proceedRate = percentage(decisionCount("proceed"), checklists.length);
  const winRate = percentage(resultCount("win"), trades.length);
  const averageRisk = checklists.length
    ? Math.round((checklists.reduce((sum, item) => sum + Number(item.risk_percent), 0) / checklists.length) * 100) / 100
    : 0;

  const positiveAssociations = behaviourRules
    .map((rule) => association(entries, rule, true, true))
    .filter((pattern) => pattern.days > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);
  const negativeAssociations = behaviourRules
    .map((rule) => association(entries, rule, false, false))
    .filter((pattern) => pattern.days > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);

  const recommendations: string[] = [];
  if (checklistBlockers[0]?.count) recommendations.push(`Pre-trade: address ${checklistBlockers[0].label.toLowerCase()} before increasing activity.`);
  if (planAdherence < 80) recommendations.push("Trade journal: narrow next week to setups you can execute exactly according to plan.");
  if (stopDiscipline < 100) recommendations.push("Trade journal: treat stop placement and stop compliance as a non-negotiable risk control.");
  if (negativeCounts[0]?.count) recommendations.push(`Behaviour: create one visible guardrail for ${negativeCounts[0].label.toLowerCase()}.`);
  if (!recommendations.length) recommendations.push("Maintain the same process next week and prioritise consistency over additional trade frequency.");

  return {
    overview: {
      tradingDays,
      netPositiveDays: positiveDates.size,
      averageDiscipline,
      checklistCount: checklists.length,
    },
    preTrade: {
      total: checklists.length,
      proceedRate,
      planAlignment,
      calendarCompliance,
      averageRisk,
      mostCommonBlocker: checklistBlockers[0]?.count ? checklistBlockers[0].label : "No recurring blockers",
      decisionBreakdown: [
        { label: "Proceed", value: decisionCount("proceed"), colour: "#34d399" },
        { label: "Wait", value: decisionCount("wait"), colour: "#fbbf24" },
        { label: "Reduce Size", value: decisionCount("reduce_size"), colour: "#fb923c" },
        { label: "Avoid", value: decisionCount("avoid"), colour: "#fb7185" },
      ],
    },
    trades: {
      total: trades.length,
      winRate,
      netPnl: Math.round(trades.reduce((sum, trade) => sum + Number(trade.pnl ?? 0), 0) * 100) / 100,
      planAdherence,
      stopDiscipline,
      commonMistake: commonMistake ? titleCase(commonMistake) : "No mistakes categorised",
      resultBreakdown: [
        { label: "Wins", value: resultCount("win"), colour: "#34d399" },
        { label: "Losses", value: resultCount("loss"), colour: "#fb7185" },
        { label: "Breakeven", value: resultCount("breakeven"), colour: "#94a3b8" },
      ],
    },
    behaviour: {
      mostCommonNegative: negativeCounts[0]?.count ? negativeCounts[0].label : "No negative behaviours logged",
      positiveAssociations,
      negativeAssociations,
      dailyDiscipline: entries.map((entry) => ({ date: entry.entry_date.slice(5), score: disciplineScore(entry) })),
    },
    recommendations: recommendations.slice(0, 4),
  };
}

export const demoBehaviourEntries: BehaviourEntry[] = [
  { entry_date: "2026-07-20", slept_well: true, felt_calm_before_trading: true, felt_pressure_to_make_money: false, traded_after_a_loss: false, overtraded: false, revenge_traded: false, respected_stop: true, followed_plan: true, traded_during_news: false, net_positive: true },
  { entry_date: "2026-07-21", slept_well: false, felt_calm_before_trading: false, felt_pressure_to_make_money: true, traded_after_a_loss: true, overtraded: true, revenge_traded: false, respected_stop: true, followed_plan: false, traded_during_news: false, net_positive: false },
  { entry_date: "2026-07-22", slept_well: true, felt_calm_before_trading: true, felt_pressure_to_make_money: false, traded_after_a_loss: false, overtraded: false, revenge_traded: false, respected_stop: true, followed_plan: true, traded_during_news: false, net_positive: true },
  { entry_date: "2026-07-23", slept_well: true, felt_calm_before_trading: true, felt_pressure_to_make_money: false, traded_after_a_loss: false, overtraded: false, revenge_traded: false, respected_stop: true, followed_plan: true, traded_during_news: true, net_positive: false },
  { entry_date: "2026-07-24", slept_well: true, felt_calm_before_trading: true, felt_pressure_to_make_money: false, traded_after_a_loss: false, overtraded: false, revenge_traded: false, respected_stop: true, followed_plan: true, traded_during_news: false, net_positive: true },
];

export const demoTrades: TradeOutcome[] = [
  { date: "2026-07-20", pnl: 210, result: "win", followed_plan: true, respected_stop: true, mistake_type: null, setup_type: "Break and retest" },
  { date: "2026-07-21", pnl: -145, result: "loss", followed_plan: false, respected_stop: true, mistake_type: "entry_timing", setup_type: "Risk entry" },
  { date: "2026-07-22", pnl: 95, result: "win", followed_plan: true, respected_stop: true, mistake_type: null, setup_type: "Liquidity sweep" },
  { date: "2026-07-23", pnl: -60, result: "loss", followed_plan: true, respected_stop: true, mistake_type: "news_exposure", setup_type: "Breakout" },
  { date: "2026-07-24", pnl: 180, result: "win", followed_plan: true, respected_stop: true, mistake_type: null, setup_type: "Break and retest" },
];

export const demoChecklists: PreTradeEntry[] = [
  { submitted_at: "2026-07-20T08:00:00Z", risk_percent: 1, economic_calendar_checked: true, market_conditions_aligned: true, has_clear_invalidation: true, risk_reward_acceptable: true, emotional_state_acceptable: true, trade_matches_plan: true, recommendation: "proceed" },
  { submitted_at: "2026-07-21T08:00:00Z", risk_percent: 0.5, economic_calendar_checked: true, market_conditions_aligned: true, has_clear_invalidation: true, risk_reward_acceptable: true, emotional_state_acceptable: false, trade_matches_plan: true, recommendation: "reduce_size" },
  { submitted_at: "2026-07-22T08:00:00Z", risk_percent: 1, economic_calendar_checked: true, market_conditions_aligned: true, has_clear_invalidation: true, risk_reward_acceptable: true, emotional_state_acceptable: true, trade_matches_plan: true, recommendation: "proceed" },
  { submitted_at: "2026-07-23T08:00:00Z", risk_percent: 1, economic_calendar_checked: false, market_conditions_aligned: true, has_clear_invalidation: true, risk_reward_acceptable: true, emotional_state_acceptable: true, trade_matches_plan: true, recommendation: "wait" },
  { submitted_at: "2026-07-24T08:00:00Z", risk_percent: 1, economic_calendar_checked: true, market_conditions_aligned: true, has_clear_invalidation: true, risk_reward_acceptable: true, emotional_state_acceptable: true, trade_matches_plan: true, recommendation: "proceed" },
];
