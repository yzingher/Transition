export interface ChapterMeta {
  num: 1 | 2 | 3 | 4 | 5;
  title: string;
  years: string;
  tone: string;
  scriptedAnchors: string;
  cardCount: number;
}

export const CHAPTERS: ChapterMeta[] = [
  {
    num: 1,
    title: "New Mandate",
    years: "2024–2025",
    tone: "The world you recognise. Calm before the storm. The false sense that you have time. Manageable triage. Every card contains subtle signals about what's coming.",
    scriptedAnchors:
      "AI coding agents launch commercially. EU AI Act enforcement begins. First talent-poaching waves. China $200B compute announcement. Early debates about retraining, investment, regulation. Foundations matter.",
    cardCount: 10,
  },
  {
    num: 2,
    title: "Early Tremors",
    years: "2026–2027",
    tone: "The first shocks. Urgency. The clock is real. A major capability jump. First real white-collar unemployment spike. Chapter 1 investments still in progress.",
    scriptedAnchors:
      "Autonomous coding agents displace junior knowledge workers faster than predicted. First AI safety incident of political consequence. Professional services layoffs begin. International AI defence pacts start forming. First budget squeeze.",
    cardCount: 10,
  },
  {
    num: 3,
    title: "The Reckoning",
    years: "2028–2029",
    tone: "Your past catches up. Chapter 1 consequences arrive in force. Multiple problems, not enough resources for all of them. Triage in the truest sense.",
    scriptedAnchors:
      "Professional services mass displacement (accounting, law, consulting). Unemployment jumps. Largest protests in a generation. Reasoning parity announcements from major labs. First real AI-driven information-operation crisis. Foreign AI influence in elections.",
    cardCount: 11,
  },
  {
    num: 4,
    title: "New Rules",
    years: "2030–2032",
    tone: "The world stops making sense. AI capabilities cross a qualitative threshold. Systems do things no one forecast. Old frameworks break down. Disorientation.",
    scriptedAnchors:
      "Autonomous scientific discovery — breakthroughs the AI systems cannot fully explain. Autonomous factories become price-competitive. Developing nations face collapse. Refugee pressures. AGI-capable systems appear in sandboxes. International governance efforts stall.",
    cardCount: 11,
  },
  {
    num: 5,
    title: "Arrival",
    years: "2033–2035",
    tone: "What have you built? Shorter chapter — each card is significant. All remaining lag consequences resolve. The world has changed fundamentally. The shape of the society you've built is visible.",
    scriptedAnchors:
      "Near-AGI or AGI is operational reality. Economic value fundamentally shifted. The question is no longer 'how do we manage the transition' but 'what kind of society have we become?' Cards reflect the specific world the player has created.",
    cardCount: 6,
  },
];

export function getChapter(n: number): ChapterMeta {
  const c = CHAPTERS.find((ch) => ch.num === n);
  if (!c) throw new Error(`Unknown chapter ${n}`);
  return c;
}
