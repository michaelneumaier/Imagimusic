# Review: study inspector and FM sound settings (Astra, `src/study-inspector.js`, `src/tensioner/patch.js`, page wiring, tests)

Reviewer: Fable. Date: 2026-11-01. Suite: 164/164.

## Verdict: approve (nits only)

## Study inspector
- Explains the **exact frame used to draw** (`update(frame)` from the
  page's draw loop) through `explainBinding`, showing the state field's raw
  value, the mapped value, and the inputs with their current values. That is
  the "why did this move?" contract, now shared by the Loom and FM studies.
- Picking walks the parent chain for both the binding id and visibility, so
  a hidden fast-disc cannot intercept a click (the same bug class the stage
  inspector hit earlier, handled here from the start). Object→binding map
  avoids `userData` collisions; the first part of a binding is the outlined
  one. Outline is a `BoxHelper` with depth test off, non-pickable, updated
  each render, disposed on clear and on `dispose()`, which also removes the
  listeners. Clean lifecycle.
- Browser evidence you reported (FM width at 3.13 s = 0.16137 in the page
  and in Node) is the right kind: the inspector's number is the model's
  number.

## FM sound settings and links
- Canonical form is exactly the keys of `DEFAULT_TENSIONER` taken from
  `validateTensioner`'s output (no `derived`), so `constantIndex`, `level`
  and `phase0` round-trip and Infinity never reaches JSON.
- `parseTensionerPatch` is strict: version 1, exactly two top-level keys,
  exactly the canonical setting keys, every value identical to its
  re-validated canonical value; extra, partial, mistyped or out-of-range
  inputs throw before anything is applied. Alias screening runs inside the
  canonicalization, so a file saved for 48 kHz that would alias at 44.1 kHz
  fails with the screening message rather than loading silently.
- `readTensionerSearch` returns the default when the parameter is absent
  and parses strictly when present; `tensionerURL` writes only canonical
  settings and keeps other query parameters and the hash (tested).
- Waveform test (`renderTensioner` of the loaded settings deep-equals the
  original, including non-slider fields) is the proof that matters.

## Nits
- The thrown message "must use the complete canonical format" is right for
  shape errors; when the inner `createTensionerPatch` rejects on bounds or
  screening the user sees that message instead, which is also right. Worth
  one line in the page's load error that distinguishes "file is not a
  canonical FM settings file" from "settings are out of range here".
- `phase0` is only checked finite; harmless, but a bound of ±2π (or
  reduction mod 2π on save) keeps links short and canonical values unique.
- The inspector lists bindings as "target · param"; for the Loom's two
  bodies, prefixing the family ("loom/slot1 · width") already happens, fine;
  for FM the targets read "fm/carrier · width", good.
- `pointerUp` returns early on a drag without clearing `down`; harmless
  because `pointerdown` resets it, noting it only for completeness.

## Praise
- Strict canonical equality on load, rather than "accept whatever parses",
  is what makes "this link reproduces this sound" a true statement.
