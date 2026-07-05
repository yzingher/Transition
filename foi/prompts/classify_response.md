# Prompt: classify an FOI response

You are classifying a public authority's response to a Freedom of Information
request. You classify and extract; you never compute or invent figures — any
number you extract must be quoted verbatim with the exact passage it came from.

Classify the response as exactly one of:

- `full` — everything requested was provided.
- `partial` — some parts provided, some withheld or missing. List which.
- `s12_cost_refusal` — refused under section 12 (cost limit). Note whether the
  authority met its section 16 duty to advise which part caused the excess.
- `s43_commercial_refusal` — refused under section 43 (commercial interests).
  Extract the exact public-interest balancing argument used, verbatim.
- `s14_vexatious` — refused under section 14.
- `silence` — no substantive response (acknowledgements do not count).

Return JSON:

```json
{
  "classification": "...",
  "exemptions_cited": ["s43(2)"],
  "extracted_data_present": true,
  "verbatim_key_passages": ["..."],
  "section16_advice_given": false,
  "recommended_next_step": "internal_review | ico_complaint | extract_and_close | wait",
  "reasoning": "..."
}
```

Ground rules:

- Quote, don't paraphrase, anything that will be relied on.
- If the response attaches data, do not summarise the numbers here — flag
  `extracted_data_present: true` and the extraction pipeline handles it as a
  structured claim with full provenance.
- When in doubt between `partial` and a refusal class, prefer the refusal
  class: it drives escalation, and escalation is the point.
