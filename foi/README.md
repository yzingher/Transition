# FOI subsystem

Layer 2 of the evidence pipeline: fills the gaps that published data leaves.
The core value is not sending requests — it is the **response parser + appeal
engine**: classify, escalate, never lose the clock. Authorities fold under
competent persistence; no human volunteer has the stamina. The agent does.

## Hard rules (PRD §3.2, encoded here and in code)

1. **Draft-only until a human flips the flag.** `config.yaml` ships with
   `send_enabled: false`. Sending requires a named human approving a specific
   batch — the flag flip is a reviewed commit, part of the provenance chain.
2. **Never bulk-blast.** Requests are scheduled per authority, rate-limited
   (`config.yaml`), in human-approved batches. Narrow requests, structured to
   individually clear the s12 cost limit (£450 local / £600 central).
3. **Public by default.** Requests route through WhatDoTheyKnow, so all
   correspondence is public. Good faith must be demonstrable — it is our
   defence against s14 "vexatious" classification of the programme.
4. **Refusals are findings.** A s43 refusal of unit prices publishes as part
   of the finding: "they won't tell you what they pay — here's the letter."
   The system degrades gracefully to implied unit costs (aggregate spend ÷
   known volumes), flagged lower-confidence.

## Layout

| Path | Contents |
|------|----------|
| `config.yaml` | Send flag, rate limits, batch registry |
| `templates/` | Request templates, parameterised per authority |
| `prompts/` | Agent prompts (public, P5): drafting, classification, appeals |
| `precedents/` | Appeal precedent library — ICO decisions to cite |
| `bank-holidays-england.json` | Working-day calendar for the s10 clock |

The deadline clock and lifecycle live in `pipelines/src/pipelines/foi/`, and
the request lifecycle schema in `supabase/migrations/0001_core_schema.sql`
(`foi_requests`).
