# Review: A/B listening surface for the Grove voice (Astra, working tree: `grove-voices.html`, `grove-voices.css`, `src/grove/voices.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: Safari 320 × 656 exclusive play, Quiet pauses, labels scoped.

## Verdict: approve-with-fixes (field names changed under you; nothing else blocking)

## Should fix (caused by my tool revision 2d1a4e2 / 3d2c32d)
- The page reads `data.spectralCentroidHz` and `data.peak`; the regenerated
  report names them `modalCentroidEstimateHz` and `peakFullRender`
  (your findings 2 and 3). With the current report the page shows
  `undefined` for those two rows. Rename, and label the peak "Peak · full
  render".
- Show each voice's `pickupScale` and `outputGain` (finding 4): the
  conventions paragraph says the rules are the same but the gains are
  not, so the numbers belong beside the levels.

## What is right
- **Honest framing.** "The playable Grove still uses its original voice";
  "not perceptually loudness matched; compare the reported levels";
  "modal estimate for the struck body's pickup"; "first low-band envelope
  swell at a 2 ms grid, not sound travelling through space"; "no preference
  or listening judgment is inferred"; the shells as interpretation. This
  is proposal 015's evidence stance in the page's own words.
- **Data-driven, not hand-copied.** Cards and metrics come from the report
  (seed list from its keys, partial count from its conventions, the
  per-seed WAV names from the convention), a missing report yields the
  generation command instead of a blank page, a bad report is rejected.
- **Transport.** Native players, exclusive playback, Quiet and page hide
  pause, seed change pauses both; nothing autoplays; nothing uploaded.

## Nits
- The A/B order is fixed (original first); a blind order toggle would
  remove a bias for later listening sessions, optional.
- The card copy "Three connected bodies share the ring" is true for both
  voices; keep it on the page header rather than only on card A.
