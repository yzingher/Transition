import { GameState, Resources, Meters } from "./types";

export interface ResourceFlow {
  label: string;
  value: number; // positive = inflow, negative = outflow
}

export interface ResourceProjection {
  budget: { current: number; projected: number; flows: ResourceFlow[] };
  talent: { current: number; projected: number; flows: ResourceFlow[] };
  compute: { current: number; projected: number; flows: ResourceFlow[] };
}

// Rough client-side projections surfaced in the Resource Dashboard.
// These are heuristic estimates — the authoritative numbers come from the LLM
// at each chapter break. But players want a sense of direction *during* triage.
export function projectNextChapter(state: GameState): ResourceProjection {
  const policies = state.activePolicies.map((p) => p.toLowerCase());
  const hasTaxReform = policies.some(
    (p) => p.includes("tax") || p.includes("productivity capture") || p.includes("levy")
  );
  const hasEducation = policies.some(
    (p) => p.includes("education") || p.includes("retrain") || p.includes("upskill")
  );
  const hasImmigration = policies.some(
    (p) => p.includes("immigration") || p.includes("visa") || p.includes("talent attraction")
  );
  const hasDataCentre = policies.some(
    (p) => p.includes("data centre") || p.includes("compute") || p.includes("sovereign ai")
  );
  const runningCosts = Math.min(state.activePolicies.length * 0.8, 10);

  // Budget flows
  const budgetFlows: ResourceFlow[] = [
    { label: "Tax revenue", value: 6 + (state.meters.relevance > 50 ? 2 : 0) },
    {
      label: "AI productivity capture",
      value: hasTaxReform ? 4 : 0,
    },
    { label: "Running costs", value: -runningCosts },
  ];
  if (state.meters.stability < 30) {
    budgetFlows.push({ label: "Emergency response", value: -3 });
  }
  const budgetNet = budgetFlows.reduce((a, f) => a + f.value, 0);

  // Talent flows
  const talentFlows: ResourceFlow[] = [];
  if (hasEducation) {
    talentFlows.push({ label: "Education pipeline", value: 3 });
  } else {
    talentFlows.push({ label: "Education pipeline", value: 1 });
  }
  if (hasImmigration) {
    talentFlows.push({ label: "Immigration intake", value: 2 });
  }
  // Brain drain scales with low relevance
  const relevanceDeficit = Math.max(0, 50 - state.meters.relevance);
  if (relevanceDeficit > 0) {
    talentFlows.push({
      label: "Brain drain",
      value: -Math.ceil(relevanceDeficit / 10),
    });
  }
  // Private sector siphon worse when compute is low (can't offer interesting work)
  if (state.resources.compute < 40) {
    talentFlows.push({ label: "Private sector siphon", value: -2 });
  }
  const talentNet = talentFlows.reduce((a, f) => a + f.value, 0);

  // Compute flows
  const computeFlows: ResourceFlow[] = [
    { label: "Depreciation", value: -2 },
  ];
  if (hasDataCentre) {
    computeFlows.push({ label: "Capacity coming online", value: 4 });
  }
  computeFlows.push({
    label: "Programme consumption",
    value: -Math.min(state.activePolicies.length * 0.5, 4),
  });
  const computeNet = computeFlows.reduce((a, f) => a + f.value, 0);

  return {
    budget: {
      current: state.resources.budget,
      projected: clamp(state.resources.budget + budgetNet),
      flows: budgetFlows,
    },
    talent: {
      current: state.resources.talent,
      projected: clamp(state.resources.talent + talentNet),
      flows: talentFlows,
    },
    compute: {
      current: state.resources.compute,
      projected: clamp(state.resources.compute + computeNet),
      flows: computeFlows,
    },
  };
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

export function canAfford(
  resources: Resources,
  cost: Partial<Resources>
): boolean {
  if ((cost.budget ?? 0) > resources.budget) return false;
  if ((cost.talent ?? 0) > resources.talent) return false;
  if ((cost.compute ?? 0) > resources.compute) return false;
  return true;
}

export function cardPassesGate(
  resources: Resources,
  gate: { resource: keyof Resources; minimum: number } | undefined
): boolean {
  if (!gate) return true;
  return resources[gate.resource] >= gate.minimum;
}

// Colour helpers reused across components
export function meterColour(value: number, dangerAt = 15, warningAt = 30): string {
  if (value <= dangerAt) return "#c45c5c";
  if (value <= warningAt) return "#e8a84c";
  return "#4a9e8e";
}

export function resourceColour(
  key: keyof Resources
): { base: string; muted: string } {
  if (key === "budget") return { base: "#c4a95c", muted: "#8a7a46" };
  if (key === "talent") return { base: "#6b9e6b", muted: "#4d7a4d" };
  return { base: "#8e9eb4", muted: "#5f6e82" };
}

export function metersDiverging(meters: Meters): boolean {
  return Math.abs(meters.stability - meters.relevance) > 40;
}
