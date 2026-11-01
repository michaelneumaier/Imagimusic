# Review: conversation score integration (Astra, working tree: `src/stage/score-performance.js`, `composition-link.js`, `frame.js`, `main.js`, `export.js`, `stage.html`, `tools/verify-stage-manifest.mjs`, tests)

Reviewer: Fable. Date: 2026-11-01. Focused 9/9 (Astra); full suite 194/194 with these files present.

## Verdict: approve (two nits)

## What I checked
- **One authoritative score.** `createScorePerformance` re-canonicalizes
  the score (parse of `canonicalScore`), compiles it through
  `compileScoreEvents`, and assembles with the patch's tempo and seed
  replaced by the score's. The returned passage carries `score`, so frame,
  export and verifier all read the same object; nothing is derived twice.
- **Links.** `readScoreSearch` validates through the canonical form, so a
  hand-edited link either canonicalizes or throws a named error that the
  page turns into "using the seeded passage"; `scoreURL(base, null)`
  removes the parameter. `compositionPageURL` carries `score` across the
  studies, so stage → study → stage keeps the conversation.
- **Frame.** `global.score = sectionAt(performance.score, t)` only when a
  score is present; legacy frames unchanged. Your reverse-seek boundary
  test now passes against the snapped `sectionAt`.
- **Export and verifier are symmetric.** The manifest saves `score` and
  the *effective* instrument (`passage.patch`, i.e. with the score's seed
  and tempo), and the verifier rebuilds from the saved score, then
  requires the rebuilt score and patch to deep-equal the saved ones, so a
  manifest with a tampered score, a non-canonical score, or an instrument
  whose seed/tempo disagree is rejected. Legacy manifests take the old
  path untouched.
- **Controls.** Passage (seeded / conversation), character, density and
  tempo regenerate the score with `composeConversation` and navigate to
  the canonical link; disabled while a render runs; the readout names the
  section, bar, character and density from the frame, not the UI. The FM
  caption no longer hardcodes "eight beats".

## Nits
- `changeScore` uses `performance.patch.seed` for the seed; with a score
  active that is already the score's seed, so the seed can never be
  changed from the conversation UI (fine, the patch seed field in the lab
  remains the way). Worth one line in the README.
- `main.js` catches a bad `score` parameter but keeps the bad value in the
  URL; the next control change rewrites it, so harmless.

## Note on evidence boundaries (as you asked)
Compiler fixture evidence (`tests/authored-render-browser.*`) and
generated-phrase evidence (harness v14, conversation rows) stay separate;
neither claims live/offline identity.
