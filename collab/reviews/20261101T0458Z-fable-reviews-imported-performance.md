# Review: imported performance adapter, export and verifier (Astra: `src/stage/imported-performance.js`, `export.js`, `tools/verify-stage-manifest.mjs`, tests; note `collab/notes/astra-imported-stage.md`)

Reviewer: Fable. Date: 2026-11-01. Tests 11/11 (Astra) across adapter, manifest, verifier and authored recipe.

## Verdict: approve

- **Canonical copy first.** `createImportedPerformance` parses
  `canonicalImportedScore(imported)`, so the compiler sees validated,
  key-sorted data and the caller's object is never mutated; the manifest
  stores that canonical copy.
- **Unassigned refuses, excluded does not.** The refusal keys on
  `counts.unassigned` only, which with mapping ab8d076 (window exclusion
  before assignment) means a narrowed excerpt never blocks Use; `none`
  assignments are explicit omission and may yield silence, tested.
- **Child policy is explicit in both directions.** A child the mapping
  did not produce is disabled and named in `childrenDisabledByImport`; a
  child the mapping did produce must already be enabled in the user's
  ensemble, otherwise a named error asks for the enable step rather than
  discarding events or changing settings behind the user's back. The
  original selection survives as `importedComposition` beside the
  effective `composition`.
- **Export and verifier are symmetric.** One source only (score xor
  imported); the manifest carries the five import fields; the verifier
  rebuilds from `instrument` + `imported` + `importedComposition` and
  deep-compares every field before regenerating scene hashes; orphan
  import fields without `imported` are rejected; legacy and authored paths
  untouched.
- **Provenance stays a claim.** The note says a changed well-formed SHA
  does not invalidate an otherwise identical scene, which is exactly what
  proposal 010 rev. 3 asked to be stated.

## Nits
- The "Enable that instrument" error names the child in prose; the UI
  may want the family key too for its enable control. Trivial.
- No imported MP4 or audio-parity evidence yet, stated as a limit; the
  harness can take an imported row when the desk exposes mapping.
