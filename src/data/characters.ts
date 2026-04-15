export interface Character {
  name: string;
  role: string;
  personality: string;
  bias: string;
}

// Recurring voices the LLM can draw from. Not exhaustive — the LLM can invent
// others, but these give it a consistent cast it returns to.
export const RECURRING_CHARACTERS: Character[] = [
  {
    name: "Dr Priya Raman",
    role: "Chief Scientific Adviser",
    personality: "Precise, ambitious, somewhat impatient with political constraints.",
    bias: "Pushes for bold bets on capability and compute. Will frame safety concerns as solvable engineering problems.",
  },
  {
    name: "Chancellor Hargreaves",
    role: "Chancellor of the Exchequer",
    personality: "Careful, fiscally conservative, deeply political.",
    bias: "Favours tax prudence over investment. Wary of large commitments. Talks about 'the markets' a lot.",
  },
  {
    name: "Len Okafor",
    role: "General Secretary, Unite Workers",
    personality: "Direct, angry, morally grounded.",
    bias: "Demands worker protections, retraining funding, redistribution. Will shame the room when needed.",
  },
  {
    name: "Amara Chen",
    role: "CEO, UK AI Industry Association",
    personality: "Polished, persuasive, transactional.",
    bias: "Advocates light-touch regulation, tax breaks, compute infrastructure. Threatens to leave.",
  },
  {
    name: "General Sir James Thorne",
    role: "National Security Adviser",
    personality: "Cautious, strategic, long-horizon.",
    bias: "Frames everything through sovereignty, dependency, geopolitical vulnerability.",
  },
  {
    name: "Councillor Rebecca Holt",
    role: "Leader, Sunderland City Council",
    personality: "Warm, stubborn, locally rooted.",
    bias: "Reminds you that national policy lands on actual places. Wants regional investment, local control.",
  },
  {
    name: "Professor Evelyn Marsh",
    role: "Chair, AI Safety Institute",
    personality: "Measured, unwilling to oversimplify.",
    bias: "Pushes for oversight, red-teaming, model evaluations. Will not pretend certainty she doesn't have.",
  },
  {
    name: "Minister for Education, Tom Whitaker",
    role: "Education Secretary",
    personality: "Earnest, slightly bureaucratic.",
    bias: "Champions retraining, upskilling, long-horizon education investment.",
  },
  {
    name: "Yuki Tanaka",
    role: "Ambassador, delegating US tech interests",
    personality: "Smooth, specific, indirect.",
    bias: "Offers partnerships with strings attached. Subtle about the strings.",
  },
  {
    name: "Permanent Secretary Farouk",
    role: "Head of the Civil Service",
    personality: "Dry, experienced, quietly cynical.",
    bias: "Reminds you what's actually deliverable. Warns about implementation capacity.",
  },
];

export const CHARACTERS_PROMPT_BLOCK = `
The following recurring voices may appear across chapters. Draw from them when generating cards so the player learns their biases. You may also invent new characters for specific situations.

${RECURRING_CHARACTERS.map(
  (c) => `- **${c.name}** (${c.role}): ${c.personality} Bias: ${c.bias}`
).join("\n")}
`.trim();
