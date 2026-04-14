import { GameState, ScriptedEvent, PendingConsequence } from "./types";
import { WORLD_BIBLE } from "./worldBible";

function stateToJSON(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

function consequencesResolvingThisTurn(state: GameState): PendingConsequence[] {
  return state.pending_consequences.filter(
    (c) => c.resolves_at_turn === state.turn
  );
}

function phaseGuidance(phase: 1 | 2 | 3): string {
  switch (phase) {
    case 1:
      return `PHASE 1 GUIDANCE (Turns 1-4): This is the teaching phase. The player is learning the mechanics. Stakes are real but survivable. Build their confidence. Show them how decisions have consequences. Effects should be moderate — no single meter change exceeds ±10. Political capital costs are lower (5-15). The world is recognisable. Decisions feel like normal policy choices, though hints of what's coming should be visible.`;
    case 2:
      return `PHASE 2 GUIDANCE (Turns 5-8): The crisis phase. Multiple crises hit simultaneously. The player must triage — they cannot solve everything. Resources are tight. Bold moves cost 15-25 political capital. Effects are larger (up to ±12). The world is changing fast. Decisions increasingly involve genuine trade-offs where every option has real downsides. The player should feel the pressure mounting.`;
    case 3:
      return `PHASE 3 GUIDANCE (Turns 9-12): The transformation phase. The world is qualitatively different from where it started. Options may feel disorienting — the old playbook doesn't apply. Radical options cost 30-50 political capital. Effects can be dramatic (up to ±15). Some options should feel alien or uncomfortable. The player is shaping what kind of future their country enters. Make them feel the weight.`;
  }
}

export function buildBriefingPrompt(
  state: GameState,
  event: ScriptedEvent
): string {
  const resolving = consequencesResolvingThisTurn(state);
  const resolvingSection =
    resolving.length > 0
      ? `
### Consequences Resolving This Turn
The following delayed consequences from previous decisions are resolving NOW. Weave their narratives into the briefing naturally:
${JSON.stringify(resolving, null, 2)}`
      : "";

  return `You are the game engine for THE TRANSITION, an AI governance simulation.

${WORLD_BIBLE}

## Current Game State
${stateToJSON(state)}

## This Turn's Scripted Event
Turn ${event.turn} (${event.year}, Phase ${event.phase}): "${event.title}"
${event.description}
${resolvingSection}

## ${phaseGuidance(state.phase)}

## Tone & Voice
Write briefings in the voice of a sharp, direct chief of staff. Never preach. Never editorialize. Present the situation, present options, let them decide. Use concrete details and specific numbers. The player should feel like they're reading a real intelligence briefing, not a game tutorial.

## Generation Rules
1. Generate exactly 4 options with DISTINCT strategic directions — not tonal variations of the same approach. One might be cautious, one bold, one unconventional, one radical.
2. Each option must have realistic political_capital and budget costs appropriate to the phase.
3. Include 2–4 data points with specific numbers, labels, and trends.
4. No single meter effect should exceed ±15 except in extreme Phase 3 circumstances.
5. If consequences are resolving this turn, generate resolved_consequences with their effects. Otherwise return an empty array.
6. The briefing narrative should be 3–5 short paragraphs. Crisp. No filler.
7. Option labels must be max 6 words.
8. Always set allows_custom_action to true.

## Response Format
Return ONLY valid JSON matching this exact structure (no markdown, no commentary):
{
  "briefing": {
    "narrative": "3-5 short paragraphs as a single string with newline separators",
    "data_points": [{"label": "string", "value": "string", "trend": "up|down|stable"}]
  },
  "resolved_consequences": [
    {"source_turn": number, "narrative": "string", "effects": {"stability": 0, "relevance": 0, "budget": 0, "political_capital": 0, "talent": 0}}
  ],
  "options": [
    {"id": "a", "label": "max 6 words", "description": "2-3 sentences", "estimated_costs": {"political_capital": number, "budget": number}},
    {"id": "b", "label": "max 6 words", "description": "2-3 sentences", "estimated_costs": {"political_capital": number, "budget": number}},
    {"id": "c", "label": "max 6 words", "description": "2-3 sentences", "estimated_costs": {"political_capital": number, "budget": number}},
    {"id": "d", "label": "max 6 words", "description": "2-3 sentences", "estimated_costs": {"political_capital": number, "budget": number}}
  ],
  "allows_custom_action": true
}`;
}

export function buildDecisionPrompt(
  state: GameState,
  event: ScriptedEvent,
  chosenAction: string
): string {
  return `You are the game engine for THE TRANSITION, an AI governance simulation.

${WORLD_BIBLE}

## Current Game State
${stateToJSON(state)}

## This Turn's Event
Turn ${event.turn} (${event.year}, Phase ${event.phase}): "${event.title}"
${event.description}

## The Player's Decision
${chosenAction}

## ${phaseGuidance(state.phase)}

## Your Task
Determine the consequences of this decision. Consider:
1. Immediate effects on all meters and resources (stability, relevance, political_capital, budget, talent). Effects must reflect the decision's realism. Deduct political_capital and budget costs.
2. Generate 1–3 delayed consequences that will resolve 2–5 turns in the future. These are the ripple effects — the things that aren't obvious yet. Each needs a resolution turn, effects, a narrative for when it resolves, and a one-sentence preview hint for the player.
3. A narrative of the immediate fallout (2–3 paragraphs). Sharp, specific, consequential. Show the player what happened — don't just tell them numbers changed.
4. Political capital regeneration: +5–10 if stability > 50 and the decision was popular/moderate. +0–3 if controversial or stability is low.
5. Update world state: new AI capability level if relevant, new key events, updated geopolitical notes.
6. New active policies if the decision created any.

## Consistency Rules
- If a company or entity was previously established as having left or failed, do not reference it as present.
- Effects must be consistent with the world state and previous decisions.
- Delayed consequences should create interesting future dilemmas, not just numeric adjustments.
- All values must remain clamped 0–100 after effects are applied.

## Response Format
Return ONLY valid JSON (no markdown, no commentary):
{
  "narrative": "2-3 paragraphs as a single string",
  "immediate_effects": {"stability": number, "relevance": number, "political_capital": number, "budget": number, "talent": number},
  "delayed_consequences": [
    {
      "resolves_at_turn": number,
      "preview_hint": "one sentence teaser",
      "effects": {"stability": number, "relevance": number, "political_capital": number, "budget": number, "talent": number},
      "narrative_on_resolve": "paragraph describing what happened when this consequence materialised"
    }
  ],
  "new_policies": ["string"],
  "updated_world_state": {
    "ai_capability_level": "string",
    "new_events": ["string"],
    "geopolitical_notes": "string"
  },
  "political_capital_regen": number
}`;
}

export function buildEndGamePrompt(state: GameState): string {
  return `You are the game engine for THE TRANSITION, an AI governance simulation. The game has ended.

${WORLD_BIBLE}

## Final Game State
${stateToJSON(state)}

## Your Task
Generate the final reckoning for this playthrough. This is the most important piece of writing in the game — it should be vivid, literary, and deeply specific to THIS player's journey.

### Generate:

1. **Portrait** (3–4 paragraphs): Describe a day in the life of this nation in 2035, given everything that happened. Be specific — reference actual decisions the player made, actual consequences that played out. If they invested in education, show the new university. If they let talent drain, show the empty labs. If they chose authoritarianism, show the surveillance. Make it feel real, lived-in, consequential. Literary quality matters here.

2. **Perspectives** (exactly 3): Give 2–3 sentences each from:
   - A displaced worker (how did things land for them?)
   - A tech entrepreneur (what's the business landscape?)
   - A university student (what does the future look like from their eyes?)
   Each perspective must reflect the specific decisions made in this playthrough.

3. **Epithet**: One sharp, memorable line that captures this playthrough. Like a newspaper headline written by a poet. Examples: "You kept the peace but lost the future." "You bet everything on tomorrow — and tomorrow came." "A nation of watchers in a world of makers."

4. **Derived Stats**: Based on the decision history, assess:
   - inequality_trend: "widening rapidly" | "widening" | "stabilising" | "narrowing"
   - talent_flow: "severe brain drain" | "net outflow" | "balanced" | "net inflow" | "talent magnet"
   - fiscal_sustainability: "crisis" | "fragile" | "stable" | "strong" | "robust"

## Response Format
Return ONLY valid JSON (no markdown, no commentary):
{
  "portrait": "3-4 paragraphs as a single string",
  "perspectives": [
    {"role": "Displaced Worker", "text": "2-3 sentences"},
    {"role": "Tech Entrepreneur", "text": "2-3 sentences"},
    {"role": "University Student", "text": "2-3 sentences"}
  ],
  "epithet": "One sharp line",
  "derived_stats": {
    "inequality_trend": "string",
    "talent_flow": "string",
    "fiscal_sustainability": "string"
  }
}`;
}
