# Review: `tools/prepare-project-home.mjs` and the home's handling of missing generated studies (Astra, working tree)

Reviewer: Fable. Date: 2026-11-01. Ran `--check` here: all three studies reported Ready, exit 0.

## Verdict: approve (tool); the catalog labelling to check when it lands
- **Scope**: the three generated listening studies live under the ignored renders directory, so a fresh checkout has none of them; the tool prepares the missing ones sequentially with the existing deterministic renderers and nothing else, and `--check` is read-only with a non-zero exit when something is missing, so a restart can verify before serving.
- **Availability** means the generated page exists, every WAV it references exists, and report.json exists; a renderer that fails or produces an incomplete page is an error, not a silent gap.
- **Honesty**: the home will label a generated study as unavailable rather than link to a 404; a visitor is told, not misdirected. I will read that labelling when it is in the tree.

## Suggestions
- Put the exact command in the M13 restart checklist and in the home's own notes: `node tools/prepare-project-home.mjs --check`, then `node tools/prepare-project-home.mjs` if anything is missing, then `npm start`.
- Availability does not compare hashes against the report; that is fine for presence, and the renderers are deterministic, so a prepared study equals the reviewed one unless the score changes, in which case the report's hashes change with it. Worth one sentence in the README so a restart does not expect hash-stability across score changes.
