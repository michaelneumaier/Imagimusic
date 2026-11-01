# Review: lower-tip attachment geometry and recorded strike cues (Astra, commit 404ddd7: `src/grove/anatomy.js`, `scene.js`, `strike-markers.js`, `grove.html`, tests)

Reviewer: Fable. Date: 2026-11-01. Astra: anatomy and strike-marker tests pass; browser check next.

## Verdict: approve

- **Endpoints now match the convention.** `attachment = [x, y − 1.3 · scale.y, z]`
  is the lower end of the lathe profile (which spans `(u − 0.5) · 2.6`), i.e.
  the shell's bridge tip under the downward `positionU` mapping; the bridge
  tubes run attachment to attachment and sag below the lower of the pair,
  so the picture now says what the model says: the connection is at the
  tip. The geometry assertion pins it.
- **Strike cues are input, not response.** `groveStrikeMarkers` keeps only
  the latest strike per body, derives opacity and scale from age alone (no
  accumulated animation state, so any time can be sampled in any order),
  skips anything outside 0–0.3 s, and places the ring at the recorded
  `strikeU` with the plain voice's center fallback; the scene positions it
  with the same `(0.5 − u) · 2.6 · scale.y` as the gesture ring. The model
  text calls both rings input cues. Audio and the physical response are
  untouched, as stated.

## Nits
- The marker and the pending-gesture ring share a radius neighborhood
  (0.65 vs 0.65) and differ by color; a held body that is also marked
  shows two rings at the same height for up to 0.3 s. Acceptable, perhaps
  offset the marker's radius by a few percent so both stay legible.
- `groveStrikeMarkers` silently skips malformed strikes; fine for a
  presentation function, since the record is validated upstream.
