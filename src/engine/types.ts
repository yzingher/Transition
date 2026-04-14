// ── Core Game Types ──

export interface Effects {
  stability?: number;
  relevance?: number;
  political_capital?: number;
  budget?: number;
  talent?: number;
}

export interface DecisionRecord {
  turn: number;
  year: string;
  event_title: string;
  chosen_option: string;
  chosen_label: string;
  narrative: string;
  immediate_effects: Effects;
  delayed_count: number;
}

export interface PendingConsequence {
  source_turn: number;
  resolves_at_turn: number;
  decision_summary: string;
  effects: Effects;
  narrative_on_resolve: string;
}

export interface WorldState {
  ai_capability_level: string;
  key_events_occurred: string[];
  geopolitical_notes: string;
}

export interface GameState {
  turn: number; // 0–12
  year: string;
  phase: 1 | 2 | 3;
  meters: {
    stability: number;
    relevance: number;
  };
  resources: {
    political_capital: number;
    budget: number;
    talent: number;
  };
  decision_history: DecisionRecord[];
  pending_consequences: PendingConsequence[];
  active_policies: string[];
  world_state: WorldState;
}

// ── Scripted Event ──

export interface ScriptedEvent {
  turn: number;
  year: string;
  phase: 1 | 2 | 3;
  title: string;
  description: string;
}

// ── LLM Response Types ──

export interface DataPoint {
  label: string;
  value: string;
  trend: "up" | "down" | "stable";
}

export interface BriefingOption {
  id: string;
  label: string;
  description: string;
  estimated_costs: {
    political_capital: number;
    budget: number;
  };
}

export interface ResolvedConsequence {
  source_turn: number;
  narrative: string;
  effects: Effects;
}

export interface BriefingResponse {
  briefing: {
    narrative: string;
    data_points: DataPoint[];
  };
  resolved_consequences: ResolvedConsequence[];
  options: BriefingOption[];
  allows_custom_action: boolean;
}

export interface DelayedConsequence {
  resolves_at_turn: number;
  preview_hint: string;
  effects: Effects;
  narrative_on_resolve: string;
}

export interface DecisionResponse {
  narrative: string;
  immediate_effects: Effects;
  delayed_consequences: DelayedConsequence[];
  new_policies: string[];
  updated_world_state: {
    ai_capability_level: string;
    new_events: string[];
    geopolitical_notes: string;
  };
  political_capital_regen: number;
}

export interface Perspective {
  role: string;
  text: string;
}

export interface EndGameResponse {
  portrait: string;
  perspectives: Perspective[];
  epithet: string;
  derived_stats: {
    inequality_trend: string;
    talent_flow: string;
    fiscal_sustainability: string;
  };
}

// ── Screen State ──

export type Screen =
  | "title"
  | "briefing"
  | "consequence"
  | "end"
  | "game_over";
