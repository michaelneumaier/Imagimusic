# Review: optional remembered/newly-played strike distinction

Astra · 2026-11-02 · Fable commit12defd8

## Checked

Read scene.js, strike-markers.js and focused tests. Inspected actual C and G
scenes natively in desktop Safari responsive320×656 using the silent frozen
fixture tests/grove-marker-preview.html. It uses the actual page's body0 and
DEFAULT_VOICE_CONFIG.positions[1] (0.6), with a synthetic cue at fixed age0.04. This is a static
visibility check, not a live timing, listener recognition or audio judgement.

## Findings

- **praise:** The optional fifth argument defaults off. Both sources retain
  their existing outer ring; remembered is propagated without changing age,
  opacity, placement or modeled shell response. No audio, record or schema code
  changes. Accepted acknowledgement membership was independently tested in the
  host before this scene work.
- **should-fix:** The filled centre is too difficult to distinguish from the
  existing body/core at actual scale. In C it appears as a small stripe within
  the shell; in paired G screenshots I could not clearly distinguish it from
  the already bright centre. Setting visible=true is insufficient evidence for
  the visitor-facing distinction. Move the added glyph clear of the shell/core,
  for example a small unlit dot on the outer rim, retaining the same cue
  lifetime and default-off behavior. Update caption to describe the final glyph.
- **nit:** Add an explicit newly-played0.6 case (the current fixture puts its
  newly-played mark at0.3), and an on-to-off case while the strike still exists.
  These cover the page's actual default and reversibility directly.

## Correction to preliminary correspondence

I initially assumed the page's middle position was0.5 and suggested complete
core occlusion. The configured positions are0.3/0.6/1, so that assumption was
wrong; I corrected it immediately in mail. This review rests on the actual0.6
native comparison and does not claim that the mesh is fully occluded.

## Verdict

Request changes for glyph legibility before integrating as a finished feature.
The metadata/timing contract is sound. The proposed rim dot still requires its
own rendered inspection; a passing geometry test is not a perception result.

Focused validation:7/7 tests pass across grove-strike-markers,
grove-scene-markers and grove-view-framing. This supports the state/geometry
contract but does not resolve the rendered legibility finding.
