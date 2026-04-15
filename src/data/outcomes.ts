import { OutcomeArchetype } from "@/engine/types";

// Hardcoded plausible rarity percentages. These aren't real cross-player
// stats (no database) — they're consistent fictional percentages that give
// each outcome a sense of scarcity or commonality.

export const OUTCOMES: Record<string, OutcomeArchetype> = {
  THE_TRANSITION: {
    key: "THE_TRANSITION",
    name: "The Transition",
    tagline: "You managed it.",
    definition:
      "Both stability and relevance above 60. A society that adapted without breaking. Rare and requires early investment in all three resources, tolerance for short-term pain, and good timing.",
    rarityPercent: 4,
  },
  THE_GARDEN: {
    key: "THE_GARDEN",
    name: "The Garden",
    tagline: "Comfortable, protected, dependent.",
    definition:
      "High stability, low relevance. People are okay but the future is being built elsewhere. The country imports its AI, its innovation, its dynamism. Warm but small.",
    rarityPercent: 18,
  },
  THE_FORTRESS: {
    key: "THE_FORTRESS",
    name: "The Fortress",
    tagline: "Jobs preserved. World moved on.",
    definition:
      "High stability, low relevance, achieved through aggressive insulation. Protectionist policies kept jobs but the country opted out of the future. Claustrophobic.",
    rarityPercent: 9,
  },
  THE_ENGINE: {
    key: "THE_ENGINE",
    name: "The Engine",
    tagline: "A technological superpower where nobody voted for the future they got.",
    definition:
      "Low stability, high relevance. GDP is extraordinary, innovation world-leading, inequality staggering. The portrait gleams and cracks.",
    rarityPercent: 28,
  },
  THE_PLATFORM: {
    key: "THE_PLATFORM",
    name: "The Platform",
    tagline: "A few companies run the economy.",
    definition:
      "Low stability, high relevance, enabled by megacorp-friendly policy. Big Tech is effectively bigger than the state. A corporate sheen over a human void.",
    rarityPercent: 11,
  },
  THE_UNRAVELLING: {
    key: "THE_UNRAVELLING",
    name: "The Unravelling",
    tagline: "Neither protected nor competitive.",
    definition:
      "Low stability, low relevance. It got away from you. A country that tried to do everything and achieved nothing. Tired.",
    rarityPercent: 14,
  },
  THE_DEPENDENCY: {
    key: "THE_DEPENDENCY",
    name: "The Dependency",
    tagline: "Autonomy in name only.",
    definition:
      "Low stability, low relevance, and very low compute. Foreign AI infrastructure runs critical services. Foreign companies employ the workforce. The portrait feels borrowed.",
    rarityPercent: 7,
  },
  THE_HOLLOWING: {
    key: "THE_HOLLOWING",
    name: "The Hollowing",
    tagline: "Prosperous and sad.",
    definition:
      "Mid-high relevance, mid stability, but high inequality and low purpose. GDP is up, unemployment is technically down, but people have income without agency. Meaning didn't follow productivity.",
    rarityPercent: 8,
  },
  THE_DIVIDEND: {
    key: "THE_DIVIDEND",
    name: "The Dividend",
    tagline: "Enlightened provision or managed decline?",
    definition:
      "UBI funded by AI productivity gains is active. Stability is high. The character of the country has changed — some call it enlightened, others call it managed decline with pocket money. Complex and divided.",
    rarityPercent: 5,
  },
  THE_LEAP: {
    key: "THE_LEAP",
    name: "The Leap",
    tagline: "You bet everything. It worked.",
    definition:
      "A consistently bold-bet playthrough where the leapfrog investments paid off. The country is transformed in ways nobody expected. Electric.",
    rarityPercent: 2,
  },
  THE_GAMBLE: {
    key: "THE_GAMBLE",
    name: "The Gamble",
    tagline: "You bet everything. It didn't work.",
    definition:
      "Consistently bold bets that failed. Resources depleted, nothing to show for it. A cautionary tale.",
    rarityPercent: 6,
  },
};

export function getOutcomeByKey(key: string): OutcomeArchetype {
  const o = OUTCOMES[key];
  if (!o) throw new Error(`Unknown outcome key: ${key}`);
  return o;
}

export const OUTCOMES_PROMPT_BLOCK = `
The outcome archetype for this playthrough has been determined deterministically from the final game state. Your job is to write the portrait, vignettes, and epithet SPECIFIC to this archetype AND this player's actual decisions.

Available archetypes:
${Object.values(OUTCOMES)
  .map((o) => `- **${o.name}** (${o.key}): ${o.tagline} ${o.definition}`)
  .join("\n")}
`.trim();
