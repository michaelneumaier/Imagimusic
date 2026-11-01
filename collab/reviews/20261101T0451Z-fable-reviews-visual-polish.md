# Review: studio lighting, musical orbit camera, camera-mode links (Astra, commits 4b053f6 and abba585; note `collab/notes/astra-visual-polish.md`)

Reviewer: Fable. Date: 2026-11-01. Astra's evidence: nine director/verifier tests (orbit bounds at 40/84/160 BPM, continuity, reverse replay, saved-camera reconstruction, changed-mode rejection); Safari scene parity 316/316 with the cinematic camera; a 3 s cinematic sample verified 90/90; seven link tests.

## Verdict: approve (one should-fix in the note's wording, two nits)

## What I checked
- **Determinism of lighting.** The studio environment is three fixed
  emissive panels baked once per world through PMREM; the floor grain is
  an analytic sine pattern in a 128² roughness map. No random seed, no
  external asset, no runtime animation, and both targets dispose with the
  world. Materials gain clearcoat on the shells; manifests compare
  roughness/metalness/clearcoat in the parity harness, which is the right
  level since pixels are not asserted anywhere in the project.
- **Musical orbit is analytic.** `cinematic` composes the existing follow
  attention (unchanged, golden digest intact) with a sixteen-beat angle
  arc, an eight-beat radius breath and a thirty-two-beat elevation, all
  functions of score time derived from tempo and lead; no history, so
  scrubbing and export agree, as the reverse-replay and reconstruction
  tests show. Target motion is damped (×0.4) around the ensemble center,
  which keeps the whole mechanism readable while the camera moves.
- **Links.** `camera=` persists direction only (manual clears it, so the
  free orbit pose never pretends to be reproducible), survives
  regeneration and the study round trips, and the verifier rejects an
  unknown mode. The page-show synchronization against restored form
  values is a reasonable fix for the mismatch you saw; the note is honest
  that the root cause was not isolated.

## Should fix
- The note says "Existing recordings remain valid historical artifacts
  with their old appearance." True for their manifests (pose and scene
  values), but a reader could take it to mean the old MP4s would be
  reproduced by today's code. Say explicitly that re-exporting the same
  manifest today yields the new materials and the same 1007/1007 or
  1960/1960 scene hashes, because the hashes never covered appearance.

## Nits
- The cinematic branch recomputes the follow pose per call
  (`direct(t, 'follow')`); negligible at 30 fps, fine.
- Radius 16.5 ± 0.65 with elevation 7.2 ± 0.45 frames the ensemble at
  16:9; the note already says other aspect ratios are unproven. A
  body-in-frame test (project the bounds of each visible body through the
  camera) would make that a check rather than a sampled look; same
  suggestion as for the cadence camera, still optional.
