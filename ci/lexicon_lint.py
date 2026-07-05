#!/usr/bin/env python3
"""P4 — Language discipline. The defamation defence, in code.

Never "scam", "fraud", "profiteering" (etc.) applied to a named entity. Always
"unexplained cost delta" until an explanation is sought and the response (or
non-response) is published alongside.

Rules, applied to /published/**/*.md and /web content files:

- ERROR: a banned term in the same paragraph as a named entity (from
  /data/entities.json, plus anything shaped like "Something Ltd/Limited/PLC/
  Group/Holdings").
- WARNING: a banned term anywhere else (visible, but does not block).
- Exemptions: the literal classification label "fraud/error", references to the
  Public Sector Fraud Authority, and quoted right-of-reply text (blockquotes) —
  a provider's own words publish verbatim.

Dependencies: stdlib only.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

BANNED = [
    "scam",
    "fraud",
    "fraudulent",
    "fraudster",
    "profiteer",
    "profiteering",
    "racket",
    "racketeering",
    "grift",
    "grifter",
    "rip-off",
    "ripoff",
    "price-gouging",
    "price gouging",
    "gouging",
    "swindle",
    "swindler",
    "crook",
    "crooked",
    "looting",
    "extortion",
    "extortionate",
]

EXEMPT_SPANS = [
    re.compile(r"fraud/error", re.IGNORECASE),
    re.compile(r"fraud and error", re.IGNORECASE),
    re.compile(r"Public Sector Fraud Authority", re.IGNORECASE),
    re.compile(r"PSFA", re.IGNORECASE),
]

CORPORATE_RE = re.compile(r"\b[A-Z][\w&'’.-]*(?:\s+[A-Z][\w&'’.-]*)*\s+(?:Ltd|Limited|PLC|plc|LLP|Group|Holdings)\b")
BANNED_RE = re.compile(r"\b(" + "|".join(re.escape(t) for t in BANNED) + r")\b", re.IGNORECASE)

LINT_GLOBS = ["published/**/*.md", "web/src/**/*.tsx", "web/src/**/*.ts", "web/src/**/*.mdx"]


def entity_names() -> list[str]:
    entities = json.loads((REPO / "data/entities.json").read_text())["entities"]
    names: list[str] = []
    for e in entities:
        names.append(e["name"])
        names.extend(e.get("aliases", []))
    return [n for n in names if n]


def mask_exempt(paragraph: str) -> str:
    for pattern in EXEMPT_SPANS:
        paragraph = pattern.sub(" ", paragraph)
    # Blockquotes carry right-of-reply text verbatim; strip quoted lines.
    return "\n".join(line for line in paragraph.splitlines() if not line.lstrip().startswith(">"))


def main() -> int:
    names = entity_names()
    name_res = [re.compile(re.escape(n)) for n in names]
    errors: list[str] = []
    warnings: list[str] = []

    files: list[Path] = []
    for pattern in LINT_GLOBS:
        files.extend(REPO.glob(pattern))
    for path in sorted(set(files)):
        rel = path.relative_to(REPO)
        if path.name == "README.md":
            continue
        text = path.read_text(encoding="utf-8")
        for i, paragraph in enumerate(re.split(r"\n\s*\n", text), start=1):
            visible = mask_exempt(paragraph)
            hits = BANNED_RE.findall(visible)
            if not hits:
                continue
            named = [r.pattern for r in name_res if r.search(visible)]
            corporate = CORPORATE_RE.findall(visible)
            if named or corporate:
                errors.append(
                    f"{rel} (para {i}): banned term(s) {sorted(set(h.lower() for h in hits))} in the same "
                    f"paragraph as named entit{'y' if len(named) + len(corporate) == 1 else 'ies'} "
                    f"{named + corporate} — use 'unexplained cost delta' (P4)"
                )
            else:
                warnings.append(f"{rel} (para {i}): banned term(s) {sorted(set(h.lower() for h in hits))} — allowed only because no entity is named in the paragraph")

    for w in warnings:
        print(f"warn: {w}")
    if errors:
        for e in errors:
            print(f"LEXICON VIOLATION: {e}")
        print(f"\n{len(errors)} lexicon violation(s). England is the most claimant-friendly libel jurisdiction on earth (P4).")
        return 1
    print(f"lexicon lint ok: {len(names)} entity names guarded")
    return 0


if __name__ == "__main__":
    sys.exit(main())
