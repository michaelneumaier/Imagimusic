# Review: conversation seed controls (Astra, working tree: `stage.html`, `src/stage/main.js`, `README.md`)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve

- Seed is a required uint32 number field validated by the browser before
  regeneration (`reportValidity`), matching `validateScore`'s
  0..4294967295 bound; "New variation" advances by one with `>>> 0`, so
  4294967295 wraps to 0 instead of failing validation.
- Both controls are disabled for the legacy passage (whose seed comes from
  the instrument patch) and during export, and re-enabled only when a
  score is active, consistent with the other score controls.
- Regeneration goes through `composeConversation` and the canonical link,
  preserving composition and instrument queries; nothing else changes.
- README states what the seed does to the conversation (velocity shading
  and the Loom's first body) and that character changes the motif, which
  is exactly what `composeConversation` implements; no overclaim.

## Nit
- A seed typed while the passage is "seeded study" is ignored until the
  passage switches; the disabled state makes that visible. Fine.
