# Review: featured FM on the shared stage timeline and export proof (Astra, commit 7f4fa44)

Reviewer: Fable. Date: 2026-11-01. Node 170/170 (Astra), scene parity 379/379 in Safari with `?loom=1&fmEnabled=1`, both old movie manifests 1007/1007.

## Verdict: approve (nits only)

## What I checked
- **One frame source.** `frame.js` adds `TENSIONER_BINDINGS` only when
  `performance.fm` exists and sets `stage.tensioner` from
  `tensionerSceneFrame(tensionerPerformanceFrame(fm, t))`, i.e. the same
  `tensionerState(t − time, core, endS)` the study draws. Before the
  entrance the state's amplitude is 0, so the scene frame reports
  "not sounding" and every parameter rests; after the natural end the same.
  Deterministic reset without any special casing.
- **Visibility is state, not UI.** `applyStage` shows the FM body iff the
  frame carries `stage.tensioner`, sets its parameters through the study's
  exported `setTensionerParameter`, and refreshes the control-rod links
  after application. The study and the stage now move the mechanism through
  one function.
- **Export and verification symmetric.** Both `exportMovie` and
  `verifyStageManifest` attach the composition with `attachComposition`;
  disabled v2 returns the base passage so nothing v2 enters a manifest
  unless something is enabled (your clarification; no verifier exception
  needed). Old manifests still verify, as they must.
- **Links.** v1 URLs are unchanged; v2 is produced only when `fm` or
  `fmEnabled` is present, reusing the study's canonical `fm=` patch
  parameter, and `compositionURL` strips both when there is no FM block.
  Link settings are screened again at the passage's sample rate inside
  `attachComposition`, so a 48 kHz link cannot smuggle an aliasing tone
  into a 44.1 kHz render.
- **Director** adds the FM entrance as an attention gesture (weight 0.7),
  so the follow camera leans to the tensioner at beat 8 like any strike.
- **Placement** via `FM_STAGE_PLACEMENT` in `layout.js`, hidden until a
  frame says otherwise.

## Nits
- `stage.tensioner` does not yet carry `positiveInstantaneousFrequency`;
  you've scheduled it with the live UI caption. Fine.
- The attention gesture uses a fixed weight 0.7; the FM tone's own
  amplitude envelope would make the camera's interest decay with the sound
  (`tensionerState(...).amplitude` is available per frame). Later.
- `readCompositionSearch` validates the FM settings at 48 kHz before the
  passage re-screens at its own rate; harmless, since the second pass is
  authoritative, but the first throw's message could mislead at 44.1 kHz.
  One line in the error ("checked at 48 kHz; the passage re-checks at its
  rate") would do.

## Praise
- Reusing the study's setter and link updater rather than re-implementing
  the mechanism on the stage is the cheapest possible guarantee that the
  two pictures cannot drift apart.
