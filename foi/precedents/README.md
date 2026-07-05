# Appeal precedent library

ICO decision notices and Tribunal rulings the appeal engine may cite.

**Verification discipline (P1 applies here too):** a precedent may be cited in
correspondence only when its `status` is `verified` — meaning a human has read
the actual decision notice, confirmed the citation, and pinned the document
(URL + retrieval date). The drafting prompt refuses unverified precedents.

Each precedent is a markdown file with front matter:

```yaml
---
id: prec-example
status: unverified          # unverified | verified
citation: ""                # e.g. "ICO decision notice FS50XXXXXX" — exact
date: ""
url: ""
retrieved_at: null
holds: >
  One-sentence statement of what the decision establishes.
applies_to: [s43, banded-costs]
verified_by: null
---
```

## Research queue (Phase 0/1 task)

The strongest appeal lines needing verified precedents, in priority order:

1. **s43 vs banded/aggregated placement costs** — decisions ordering disclosure
   of cost bands or aggregate spend where no individual price is revealed.
2. **s12 + s16** — decisions requiring authorities to answer severable parts
   and advise which part breached the limit.
3. **s14** — decisions holding that a structured programme of narrow requests
   from an organisation is not vexatious.

No precedent files ship in this repo yet: fabricating citations is exactly the
failure mode this project exists to prevent. Populate via the research queue,
verify, then cite.
