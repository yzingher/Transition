import { GameState } from "./types";

export function createInitialState(): GameState {
  return {
    turn: 0,
    year: "2024",
    phase: 1,
    meters: {
      stability: 65,
      relevance: 55,
    },
    resources: {
      political_capital: 60,
      budget: 50,
      talent: 45,
    },
    decision_history: [],
    pending_consequences: [],
    active_policies: [],
    world_state: {
      ai_capability_level: "Strong narrow AI. LLMs producing majority of new code. Early autonomous agents.",
      key_events_occurred: [],
      geopolitical_notes: "US leads in AI development. China investing heavily. EU focused on regulation. Global talent competition intensifying.",
    },
  };
}
