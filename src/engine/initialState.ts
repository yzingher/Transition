import { GameState } from "./types";

export function createInitialState(): GameState {
  return {
    chapter: 1,
    phase: "title",
    meters: {
      stability: 65,
      relevance: 50,
    },
    resources: {
      budget: 50,
      talent: 45,
      compute: 30,
    },
    talentAllocations: {},
    activePolicies: [],
    decisionHistory: [],
    pendingConsequences: [],
    deferredCards: [],
    worldState: {
      aiCapabilityLevel:
        "Strong narrow AI. LLMs generate majority of new code. Autonomous agents handle routine tasks. AI assists professionals but has not yet replaced them.",
      keyEvents: [],
      geopoliticalContext:
        "US leads commercial AI. China investing heavily in state-directed AI. EU pursuing regulation-first approach. Gulf states funding compute infrastructure. UK and mid-sized advanced economies navigating between blocs.",
      safetyIncidents: [],
      economicIndicators: {
        unemploymentRate: 4.2,
        gdpGrowth: 1.8,
        giniCoefficient: 34.8,
        aiAdoptionRate: 12,
        netTalentFlow: -0.5,
        publicTrustIndex: 52,
      },
    },
    strategicDirection: null,
    currentCards: [],
    cardIndex: 0,
    crisisFlags: {
      stabilityCrisis: false,
      relevanceCrisis: false,
      divergenceNoted: false,
    },
    resolvedConsequencesLog: [],
    lastChapterBriefing: "",
  };
}
