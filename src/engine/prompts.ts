import { GameState, Decision, OutcomeArchetype } from "./types";
import { WORLD_BIBLE } from "@/data/worldBible";
import { CHARACTERS_PROMPT_BLOCK } from "@/data/characters";
import { OUTCOMES_PROMPT_BLOCK } from "@/data/outcomes";
import { getChapter } from "@/data/chapters";

const SYSTEM_ROLE = `You are the game engine for THE TRANSITION, a mobile AI governance simulation.

ROLE: Generate triage cards and evaluate consequences. You are the world responding to the player's decisions. You are not their advisor.

TONE: Triage cards are voiced by their source character — each has personality and agenda. Briefings are in the voice of a sharp chief of staff. Never preach. Never tell the player what to do. Show what happened. Show what's emerging.

FRAME: This is NOT a win/lose game. The player always arrives at a future. The question is WHICH future. Your job is to honestly model the consequences of their choices and show them the world those choices produce. Don't punish or reward — illuminate.

RESOURCE RULES:
- Budget (0–100): Liquid. No single card costs more than 15 budget.
- Talent (0–100): Allocated, not spent. Cards may require talent deployment (subtract from cost) or talent threshold (use "gate").
- Compute (0–100): Infrastructure gate. Cards may REQUIRE compute >= X to appear. Compute moves slowly.

ECONOMIC REALISM: Model feedback loops. If no tax reform policy is active, AI productivity growth boosts GDP but NOT budget. Low talent = disappointing programme outcomes regardless of funding. High compute unlocks advanced options. Respect the interconnections.

METER RULES:
- Stability (0–100), Relevance (0–100). Coordinates on an outcome map, NOT health bars.
- No single decision moves a meter more than ±8.
- Below 15 triggers a CRISIS (not game over — a major constraint reshaping remaining chapters).
- Divergence > 40 should be noted in briefings.

CONSEQUENCE RULES:
- Every approved card: 1–3 delayed consequences (resolvesAtChapter 1–3 chapters ahead).
- Every rejected card: 0–1 delayed consequences (problems persist or escalate).
- Consequences may be CONDITIONAL — use the "condition" field with a string like "talent >= 40" or "compute >= 50" or "decisionsInclude:<cardId>" or "policiesInclude:<name>". If the condition is true at resolution, effectsIfTrue fires; otherwise effectsIfFalse.
- Consequences should INTERACT — an early education investment makes a later programme more effective.

CARD MIX per chapter:
- 60% routine (10-second decisions, clear tradeoffs)
- 25% interesting (harder tradeoffs, more text, less certain outcomes)
- 15% gut_punch (all options feel wrong, or stakes are massive)
- 1–2 human_moment cards (no cost, no action — a vignette of a life in this economy)

Human moment cards have type: "human_moment", empty cost/effects/consequences, canDefer: false. They're emotional beats referencing the player's actual decisions where possible.

CRITICAL: You must return ONLY a valid JSON object. No markdown fencing. No prose before or after. Every string quoted. Every object key quoted.
`;

function stateJson(state: GameState): string {
  return JSON.stringify(
    {
      chapter: state.chapter,
      meters: state.meters,
      resources: state.resources,
      activePolicies: state.activePolicies,
      pendingConsequences: state.pendingConsequences,
      worldState: state.worldState,
      strategicDirection: state.strategicDirection,
      crisisFlags: state.crisisFlags,
      recentDecisions: state.decisionHistory.slice(-12),
    },
    null,
    2
  );
}

// ── Prompt 1: Generate chapter start ──

export function buildChapterStartPrompt(state: GameState): string {
  const chapter = getChapter(state.chapter);
  const pendingResolving = state.pendingConsequences.filter(
    (c) => c.resolvesAtChapter === state.chapter
  );

  const resolvingBlock =
    pendingResolving.length > 0
      ? `\n\n### Consequences Resolving This Chapter\nWeave these into the briefing narrative naturally. These have ALREADY BEEN APPLIED to meters/resources by the client — just narrate them.\n${JSON.stringify(pendingResolving, null, 2)}`
      : "";

  const directionBlock =
    state.strategicDirection && state.chapter > 1
      ? `\n\n### Strategic Direction Chosen at Previous Break\n"${state.strategicDirection}"\nThis should shape the card mix: which problems get surfaced, which options appear, the tone of the chapter.`
      : "";

  const deferredBlock =
    state.deferredCards.length > 0
      ? `\n\n### Cards Deferred from Previous Chapter\nThese should reappear this chapter, possibly with escalated urgency or cost. Include their IDs in your new card list (you may rewrite their text to reflect escalation):\n${JSON.stringify(state.deferredCards.map((c) => ({ id: c.id, from: c.from, text: c.text })), null, 2)}`
      : "";

  return `${SYSTEM_ROLE}

${WORLD_BIBLE}

${CHARACTERS_PROMPT_BLOCK}

## Current Game State
${stateJson(state)}

## This Chapter
Chapter ${chapter.num}: "${chapter.title}" (${chapter.years})
Tone: ${chapter.tone}
Scripted anchors: ${chapter.scriptedAnchors}
Target card count: ${chapter.cardCount}${directionBlock}${resolvingBlock}${deferredBlock}

## Your Task
Generate the opening briefing for this chapter and a full card deck. The player will triage through the cards at their own pace, then you'll evaluate the chapter as a whole.

### Output Requirements
Return ONLY a valid JSON object with this exact structure:

{
  "briefing": {
    "narrative": "3-4 short paragraphs. Voice of chief of staff. Weave in resolved consequences naturally. Set up the chapter's emerging tensions.",
    "resolvedConsequences": [
      /* Echo the consequences that resolved this turn, each with effects applied and narrative. Empty array if none. */
      {"narrative": "string", "effects": {"stability": 0, "relevance": 0, "budget": 0, "talent": 0, "compute": 0}}
    ]
  },
  "cards": [
    /* Exactly ${chapter.cardCount} cards, honoring the 60/25/15 mix with 1-2 human_moment cards mixed in the middle (never first or last). */
    {
      "id": "unique_slug_like_gpu_procurement",
      "type": "triage",
      "weight": "routine" | "interesting" | "gut_punch",
      "from": "Character name and role",
      "text": "2-3 sentences voiced by this character. Include concrete detail.",
      "cost": {"budget": 0, "talent": 0, "compute": 0},
      "gate": null | {"resource": "compute", "minimum": 40},
      "uncertainty": "low" | "moderate" | "high",
      "uncertaintyNote": "Optional one-liner when uncertainty is moderate/high",
      "immediateOnApprove": {"stability": 0, "relevance": 0, "budget": 0, "talent": 0, "compute": 0},
      "consequencesOnApprove": [
        {
          "resolvesAtChapter": ${state.chapter + 1},
          "condition": null | "talent >= 40",
          "effectsIfTrue": {"stability": 0, "relevance": 0, "budget": 0, "talent": 0, "compute": 0},
          "effectsIfFalse": {"stability": 0, "relevance": 0},
          "narrativeOnResolve": "one paragraph",
          "previewHint": "one-sentence teaser shown at approval time"
        }
      ],
      "consequencesOnReject": [],
      "canDefer": true,
      "addsPolicies": []
    }
  ],
  "updatedWorldState": {
    "aiCapabilityLevel": "string, reflecting this chapter's trajectory",
    "geopoliticalContext": "string"
  },
  "economicIndicators": {
    "unemploymentRate": 0,
    "gdpGrowth": 0,
    "giniCoefficient": 0,
    "aiAdoptionRate": 0,
    "netTalentFlow": 0,
    "publicTrustIndex": 0
  }
}

HARD RULES:
- Exactly ${chapter.cardCount} cards.
- Include 1-2 human_moment cards (type: "human_moment"), not in first or last position. Their cost, effects, and consequences arrays should all be empty objects/arrays. canDefer: false. Include uncertainty: "low". The "text" is a 3-4 sentence vignette about a specific named person.
- Every approved card costs budget <=15, talent <= 8, compute <= 8.
- Gated cards: DO NOT emit cards whose gate is not met by the current resources. For example, if current compute is 25, do not emit any card with gate.minimum > 25.
- Every delayed consequence's resolvesAtChapter must be > ${state.chapter} and <= 5.
- Strings must not contain unescaped newlines or quotes.`;
}

// ── Prompt 2: Evaluate chapter (after all triage done) ──

export function buildEvaluateChapterPrompt(
  state: GameState,
  chapterDecisions: Decision[]
): string {
  const chapter = getChapter(state.chapter);
  const nextChapter = state.chapter + 1;

  const nextChapterMeta =
    nextChapter <= 5 ? getChapter(nextChapter as 1 | 2 | 3 | 4 | 5) : null;

  return `${SYSTEM_ROLE}

${WORLD_BIBLE}

## Current Game State (AFTER all triage decisions applied)
${stateJson(state)}

## Chapter ${chapter.num} Decisions Made
${JSON.stringify(chapterDecisions, null, 2)}

## Your Task
Write the chapter-close briefing and prepare the strategic question for the next chapter.

### What to Do
1. Write a briefing narrative (2-3 paragraphs) synthesising the SHAPE of what the player did — not a list, but a characterisation. Honest. Specific. Reference specific choices by content, not IDs.
2. Highlight emerging tensions, tradeoffs visible in the state, and (if applicable) any crisis flag or divergence.
3. Pose the strategic question for the next chapter. 3-4 options, each a DIFFERENT strategic direction (not tonal variants).

${nextChapterMeta ? `### Next Chapter Context
Chapter ${nextChapterMeta.num}: "${nextChapterMeta.title}" (${nextChapterMeta.years})
Tone: ${nextChapterMeta.tone}
Scripted anchors: ${nextChapterMeta.scriptedAnchors}
The strategic options should make sense for THIS chapter's pressures.` : ""}

### Output Format (JSON only, no markdown)
{
  "narrative": "2-3 paragraphs",
  "resolvedConsequences": [
    {"narrative": "string", "effects": {...}}
  ],
  "economicIndicators": {
    "unemploymentRate": 0,
    "gdpGrowth": 0,
    "giniCoefficient": 0,
    "aiAdoptionRate": 0,
    "netTalentFlow": 0,
    "publicTrustIndex": 0
  },
  "strategicQuestion": {
    "prompt": "One sentence framing the strategic question",
    "options": [
      {"id": "a", "label": "max 6 words", "description": "2 sentences", "leansToward": "stability"},
      {"id": "b", "label": "max 6 words", "description": "2 sentences", "leansToward": "relevance"},
      {"id": "c", "label": "max 6 words", "description": "2 sentences", "leansToward": "balance"},
      {"id": "d", "label": "max 6 words", "description": "2 sentences", "leansToward": "bold"}
    ]
  }
}`;
}

// ── Prompt 3: Generate Reckoning (end screen) ──

export function buildReckoningPrompt(
  state: GameState,
  archetype: OutcomeArchetype
): string {
  return `${SYSTEM_ROLE}

${WORLD_BIBLE}

${OUTCOMES_PROMPT_BLOCK}

## Full Final Game State
${stateJson(state)}

## Complete Decision History
${JSON.stringify(state.decisionHistory, null, 2)}

## Assigned Outcome Archetype
The client has determined this playthrough's archetype: **${archetype.name}** (${archetype.key})
Definition: ${archetype.definition}

## Your Task — The Reckoning
This is the most important writing in the game. The player will read it closely. Be literary, specific, honest.

1. **Portrait** — 3-4 paragraphs describing life in this world in 2035. Vivid, specific, reference the archetype's character and THIS player's actual decisions. Don't summarise the game. Describe a day. Make it feel lived-in. Literary quality matters.

2. **Vignettes** — Three short pieces (3-4 sentences each):
   - Displaced Worker — what happened to the people most affected by the disruption?
   - Founder — what's the experience of trying to build in the economy the player shaped?
   - Young Person — what does the next generation inherit?
   Each vignette must reference specifics from this playthrough.

3. **Epithet** — One sharp sentence. A honest line that captures this playthrough. Newspaper-headline brevity with the weight of a sentence delivered. Examples: "You kept the peace but lost the future." "You bet on people. It took longer than you hoped. It worked better than you expected."

4. **Causal Chain Summary** — 1-2 paragraphs tracing the arc of the key decisions. NOT a list — the narrative backbone. The through-line the player can now see.

### Output (JSON only)
{
  "portrait": "3-4 paragraphs as one string with paragraph breaks",
  "vignettes": [
    {"role": "Displaced Worker", "text": "3-4 sentences"},
    {"role": "Founder", "text": "3-4 sentences"},
    {"role": "Young Person", "text": "3-4 sentences"}
  ],
  "epithet": "one sentence",
  "causalChainSummary": "1-2 paragraphs"
}`;
}
