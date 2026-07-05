# /published — findings

Merges into this directory are the publication act. The gates (enforced by
`/ci/chain_check.py`, `/ci/lexicon_lint.py`, and branch protection requiring
human review on this path — P6):

1. **Every figure carries a chain marker.** A money or percent figure may only
   appear as `{{displayed|ref}}`, where `ref` is a claim id
   (`clm-…`, optionally `:low`/`:mid`/`:high`) or a calc reference
   (`calc:<model-id>@<version>/<output>/<p10|p50|p90>`). CI re-runs the
   deterministic engine and fails if the displayed number does not equal the
   recomputed value at the displayed precision. Naked figures fail CI.
2. **Findings are markdown with YAML front matter**: `id`, `title`, `status`
   (`draft` → `review` → `published`), `models`, `claims`, `reviewed_by`,
   `right_of_reply`.
3. **`status: published` requires**: all cited claims `verified`, all their
   sources `verified` (hashed + dated), `reviewed_by` set, and a
   `right_of_reply` record if any real provider or council is named.
4. **Language discipline** per the P4 lexicon linter. Quoted right-of-reply
   text (blockquotes) is exempt — their words publish verbatim.

Drafts may cite unverified claims; that is what drafts are for. The machine
makes it impossible to *publish* them.
