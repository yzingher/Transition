import {
  GameState,
  Effects,
  Consequence,
  ResolvedConsequence,
  RawConsequence,
} from "./types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function applyEffects(state: GameState, effects: Effects): GameState {
  return {
    ...state,
    meters: {
      stability: clamp(state.meters.stability + (effects.stability ?? 0)),
      relevance: clamp(state.meters.relevance + (effects.relevance ?? 0)),
    },
    resources: {
      budget: clamp(state.resources.budget + (effects.budget ?? 0)),
      talent: clamp(state.resources.talent + (effects.talent ?? 0)),
      compute: clamp(state.resources.compute + (effects.compute ?? 0)),
    },
  };
}

export function payCost(
  state: GameState,
  cost: Partial<{ budget: number; talent: number; compute: number }>
): GameState {
  return {
    ...state,
    resources: {
      budget: clamp(state.resources.budget - (cost.budget ?? 0)),
      talent: clamp(state.resources.talent - (cost.talent ?? 0)),
      compute: clamp(state.resources.compute - (cost.compute ?? 0)),
    },
  };
}

export function enqueueConsequences(
  state: GameState,
  raws: RawConsequence[],
  decisionSummary: string,
  sourceChapter: number
): GameState {
  if (!raws || raws.length === 0) return state;
  const newPending: Consequence[] = raws.map((r) => ({
    sourceChapter,
    resolvesAtChapter: r.resolvesAtChapter,
    decisionSummary,
    condition: r.condition,
    effectsIfTrue: r.effectsIfTrue,
    effectsIfFalse: r.effectsIfFalse,
    narrativeOnResolve: r.narrativeOnResolve,
  }));
  return {
    ...state,
    pendingConsequences: [...state.pendingConsequences, ...newPending],
  };
}

// Evaluate a simple condition string against the current state.
// Supports:
//   "talent >= 40"           — numeric compare on resources or meters
//   "stability < 30"
//   "compute == 50"
//   "decisionsInclude:cardId"
//   "policiesInclude:policyName"
// Unknown conditions default to true (fail-soft) so the game keeps moving.
function resolveFieldValue(state: GameState, key: string): number | undefined {
  switch (key) {
    case "stability":
      return state.meters.stability;
    case "relevance":
      return state.meters.relevance;
    case "budget":
      return state.resources.budget;
    case "talent":
      return state.resources.talent;
    case "compute":
      return state.resources.compute;
    default:
      return undefined;
  }
}

export function evaluateCondition(
  state: GameState,
  condition: string | undefined
): boolean {
  if (!condition) return true;
  const trimmed = condition.trim();

  if (trimmed.startsWith("decisionsInclude:")) {
    const needle = trimmed.slice("decisionsInclude:".length).trim();
    return state.decisionHistory.some(
      (d) => d.cardId === needle || d.cardText.toLowerCase().includes(needle.toLowerCase())
    );
  }
  if (trimmed.startsWith("policiesInclude:")) {
    const needle = trimmed.slice("policiesInclude:".length).trim();
    return state.activePolicies.some((p) =>
      p.toLowerCase().includes(needle.toLowerCase())
    );
  }

  // Numeric compare: "<key> <op> <number>"
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 3) return true; // unknown — fail soft
  const [key, op, rhs] = parts;
  const lhs = resolveFieldValue(state, key);
  const rhsNum = Number(rhs);
  if (lhs === undefined || Number.isNaN(rhsNum)) return true;

  switch (op) {
    case "<":
      return lhs < rhsNum;
    case "<=":
      return lhs <= rhsNum;
    case ">":
      return lhs > rhsNum;
    case ">=":
      return lhs >= rhsNum;
    case "==":
    case "=":
      return lhs === rhsNum;
    default:
      return true;
  }
}

// Resolve all consequences whose resolvesAtChapter === currentChapter.
// Returns a new state with effects applied, and the list of resolved narratives.
export function resolveConsequencesForChapter(
  state: GameState,
  chapter: number
): { state: GameState; resolved: ResolvedConsequence[] } {
  const toResolve = state.pendingConsequences.filter(
    (c) => c.resolvesAtChapter === chapter
  );
  if (toResolve.length === 0) {
    return { state, resolved: [] };
  }

  let nextState = state;
  const resolved: ResolvedConsequence[] = [];

  for (const c of toResolve) {
    const branchTrue = evaluateCondition(nextState, c.condition);
    const effects = branchTrue
      ? c.effectsIfTrue
      : c.effectsIfFalse ?? {};
    nextState = applyEffects(nextState, effects);
    resolved.push({
      narrative: c.narrativeOnResolve,
      effects,
    });
  }

  // Remove resolved consequences from pending
  nextState = {
    ...nextState,
    pendingConsequences: nextState.pendingConsequences.filter(
      (c) => c.resolvesAtChapter !== chapter
    ),
    resolvedConsequencesLog: [...nextState.resolvedConsequencesLog, ...resolved],
  };

  return { state: nextState, resolved };
}

export function checkCrisisFlags(state: GameState): GameState {
  const stabilityCrisis = state.meters.stability <= 15 || state.crisisFlags.stabilityCrisis;
  const relevanceCrisis = state.meters.relevance <= 15 || state.crisisFlags.relevanceCrisis;
  const divergence = Math.abs(state.meters.stability - state.meters.relevance) > 40;

  return {
    ...state,
    crisisFlags: {
      stabilityCrisis,
      relevanceCrisis,
      divergenceNoted: divergence || state.crisisFlags.divergenceNoted,
    },
  };
}
