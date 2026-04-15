import { GameState, OutcomeArchetype } from "./types";
import { getOutcomeByKey } from "@/data/outcomes";

// Deterministic mapping from final game state to outcome archetype.
// This runs client-side after Chapter 5. The LLM is then given the archetype
// key to write the portrait/vignettes/epithet specific to this playthrough.
export function mapStateToOutcome(state: GameState): OutcomeArchetype {
  const { stability, relevance } = state.meters;
  const { compute } = state.resources;
  const policies = state.activePolicies.map((p) => p.toLowerCase());

  const hasUBI = policies.some(
    (p) => p.includes("ubi") || p.includes("universal basic") || p.includes("basic income") || p.includes("dividend")
  );
  const hasMegacorpFriendly = policies.some(
    (p) =>
      p.includes("tax holiday") ||
      p.includes("light-touch") ||
      p.includes("hyperscaler") ||
      p.includes("platform exemption")
  );
  const hasInsulation = policies.some(
    (p) =>
      p.includes("moratorium") ||
      p.includes("quota") ||
      p.includes("tariff") ||
      p.includes("protection") ||
      p.includes("headcount")
  );

  // Count bold-bet / leapfrog decisions — very simple heuristic: count
  // decisions with meaningful positive meter movements and high resource spend
  const boldBetCount = state.decisionHistory.filter(
    (d) =>
      d.action === "approve" &&
      (Math.abs(d.effectsApplied.relevance ?? 0) >= 5 ||
        Math.abs(d.effectsApplied.stability ?? 0) >= 5)
  ).length;
  const boldBetPlaythrough = boldBetCount >= 4;

  // Hollowing signal: mid-high relevance, stagnant stability, high inequality
  // We approximate "high inequality" with a high gini via worldState
  const gini = state.worldState.economicIndicators.giniCoefficient;
  const hollowingSignal =
    relevance >= 55 &&
    stability >= 40 &&
    stability < 60 &&
    gini >= 42;

  // UBI overrides — but only if the policy actually worked (stability holding up)
  if (hasUBI && stability >= 55) {
    return getOutcomeByKey("THE_DIVIDEND");
  }

  // The Leap / The Gamble — bold-bet playthroughs
  if (boldBetPlaythrough && relevance >= 65 && stability >= 50) {
    return getOutcomeByKey("THE_LEAP");
  }
  if (boldBetPlaythrough && stability < 40 && relevance < 50) {
    return getOutcomeByKey("THE_GAMBLE");
  }

  // Hollowing
  if (hollowingSignal) {
    return getOutcomeByKey("THE_HOLLOWING");
  }

  // Main quadrant mapping
  if (stability >= 60 && relevance >= 60) {
    return getOutcomeByKey("THE_TRANSITION");
  }
  if (stability >= 55 && relevance < 40) {
    return hasInsulation
      ? getOutcomeByKey("THE_FORTRESS")
      : getOutcomeByKey("THE_GARDEN");
  }
  if (stability < 40 && relevance >= 60) {
    return hasMegacorpFriendly
      ? getOutcomeByKey("THE_PLATFORM")
      : getOutcomeByKey("THE_ENGINE");
  }
  if (stability < 40 && relevance < 40) {
    return compute < 25
      ? getOutcomeByKey("THE_DEPENDENCY")
      : getOutcomeByKey("THE_UNRAVELLING");
  }

  // Middle ground fallback — lean based on whichever meter is higher
  if (stability > relevance) {
    return getOutcomeByKey("THE_GARDEN");
  }
  return getOutcomeByKey("THE_ENGINE");
}
