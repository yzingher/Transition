import { GameState, Effects, PendingConsequence, ResolvedConsequence } from "./types";

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
      political_capital: clamp(
        state.resources.political_capital + (effects.political_capital ?? 0)
      ),
      budget: clamp(state.resources.budget + (effects.budget ?? 0)),
      talent: clamp(state.resources.talent + (effects.talent ?? 0)),
    },
  };
}

export function resolveConsequences(
  state: GameState,
  resolvedFromLLM: ResolvedConsequence[]
): GameState {
  let newState = { ...state };

  for (const resolved of resolvedFromLLM) {
    newState = applyEffects(newState, resolved.effects);
  }

  // Remove resolved consequences from pending
  newState = {
    ...newState,
    pending_consequences: newState.pending_consequences.filter(
      (c) => c.resolves_at_turn !== state.turn
    ),
  };

  return newState;
}

export function addPendingConsequences(
  state: GameState,
  consequences: {
    resolves_at_turn: number;
    preview_hint: string;
    effects: Effects;
    narrative_on_resolve: string;
  }[],
  decisionSummary: string,
  sourceTurn: number
): GameState {
  const newPending: PendingConsequence[] = consequences.map((c) => ({
    source_turn: sourceTurn,
    resolves_at_turn: c.resolves_at_turn,
    decision_summary: decisionSummary,
    effects: c.effects,
    narrative_on_resolve: c.narrative_on_resolve,
  }));

  return {
    ...state,
    pending_consequences: [...state.pending_consequences, ...newPending],
  };
}

export function checkGameOver(state: GameState): "stability" | "relevance" | null {
  if (state.meters.stability <= 15) return "stability";
  if (state.meters.relevance <= 10) return "relevance";
  return null;
}

export function applyPoliticalCapitalRegen(
  state: GameState,
  regen: number
): GameState {
  return {
    ...state,
    resources: {
      ...state.resources,
      political_capital: clamp(state.resources.political_capital + regen),
    },
  };
}
