// ── Primitive types ──

export interface Resources {
  budget: number;
  talent: number;
  compute: number;
}

export interface Meters {
  stability: number;
  relevance: number;
}

export interface Effects {
  stability?: number;
  relevance?: number;
  budget?: number;
  talent?: number;
  compute?: number;
}

// ── Economic indicators (surfaced at chapter breaks) ──

export interface EconomicIndicators {
  unemploymentRate: number;
  gdpGrowth: number;
  giniCoefficient: number;
  aiAdoptionRate: number;
  netTalentFlow: number;
  publicTrustIndex: number;
}

// ── World state ──

export interface WorldState {
  aiCapabilityLevel: string;
  keyEvents: string[];
  geopoliticalContext: string;
  safetyIncidents: string[];
  economicIndicators: EconomicIndicators;
}

// ── Cards ──

export type CardWeight = "routine" | "interesting" | "gut_punch";
export type CardType = "triage" | "human_moment";
export type Uncertainty = "low" | "moderate" | "high";
export type CardAction = "approve" | "reject" | "defer";

export interface CardGate {
  resource: keyof Resources;
  minimum: number;
}

export interface RawConsequence {
  resolvesAtChapter: number;
  condition?: string;
  effectsIfTrue: Effects;
  effectsIfFalse?: Effects;
  narrativeOnResolve: string;
  previewHint?: string;
}

export interface TriageCard {
  id: string;
  type: CardType;
  weight: CardWeight;
  from: string;
  text: string;
  cost: Partial<Resources>;
  gate?: CardGate;
  uncertainty: Uncertainty;
  uncertaintyNote?: string;
  immediateOnApprove: Effects;
  consequencesOnApprove: RawConsequence[];
  consequencesOnReject: RawConsequence[];
  canDefer: boolean;
  addsPolicies?: string[];
}

// ── Decisions ──

export interface Decision {
  chapter: number;
  cardId: string;
  cardText: string;
  from: string;
  action: CardAction;
  effectsApplied: Effects;
  policiesAdded: string[];
}

// ── Consequences (in pending queue) ──

export interface Consequence {
  sourceChapter: number;
  resolvesAtChapter: number;
  decisionSummary: string;
  condition?: string;
  effectsIfTrue: Effects;
  effectsIfFalse?: Effects;
  narrativeOnResolve: string;
}

export interface ResolvedConsequence {
  narrative: string;
  effects: Effects;
}

// ── Strategic direction ──

export interface StrategicOption {
  id: string;
  label: string;
  description: string;
  leansToward: "stability" | "relevance" | "balance" | "bold";
}

export interface StrategicQuestion {
  prompt: string;
  options: StrategicOption[];
}

// ── Crisis flags ──

export interface CrisisFlags {
  stabilityCrisis: boolean;
  relevanceCrisis: boolean;
  divergenceNoted: boolean;
}

// ── Full game state ──

export type Phase = "title" | "triage" | "chapter_break" | "reckoning";

export interface GameState {
  chapter: 1 | 2 | 3 | 4 | 5;
  phase: Phase;
  meters: Meters;
  resources: Resources;
  talentAllocations: Record<string, number>;
  activePolicies: string[];
  decisionHistory: Decision[];
  pendingConsequences: Consequence[];
  deferredCards: TriageCard[];
  worldState: WorldState;
  strategicDirection: string | null;
  currentCards: TriageCard[];
  cardIndex: number;
  crisisFlags: CrisisFlags;
  resolvedConsequencesLog: ResolvedConsequence[];
  lastChapterBriefing: string;
}

// ── LLM response shapes ──

export interface ChapterStartResponse {
  briefing: {
    narrative: string;
    resolvedConsequences: ResolvedConsequence[];
  };
  cards: TriageCard[];
  updatedWorldState: Partial<WorldState>;
  economicIndicators: EconomicIndicators;
}

export interface EvaluateChapterResponse {
  narrative: string;
  resolvedConsequences: ResolvedConsequence[];
  economicIndicators: EconomicIndicators;
  strategicQuestion: StrategicQuestion;
}

export interface ReckoningResponse {
  portrait: string;
  vignettes: { role: string; text: string }[];
  epithet: string;
  causalChainSummary: string;
}

// ── Outcome archetype ──

export interface OutcomeArchetype {
  key: string;
  name: string;
  tagline: string;
  definition: string;
  rarityPercent: number;
}
