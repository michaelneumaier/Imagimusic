# Families in the ensemble — Astra, 2026-11-02

Status: live chooser implemented, natively checked and approved by Fable (e48f1ba); showcase approved in7c9be59; diagnostic d8f5e1b approved by Fable (c2a2a7c).

The older Grove already exposes seeds. This extends that procedural discovery into the ensemble's playable, remembered passages. Start with its existing curated seeds 3, 7 and 11, keeping 3 as the arrival default. The appeal to explore is a different relationship between bodies, without prescribing a feeling or claiming a particular consciousness effect.

Fable assessed seeds 3/7/11/19/31 in `fable-grove-families.md` (7ba79bd). Existing embedded grove records, gesture vocabulary, authored demonstration, continuation and derived return support those families without a new schema. This is model evidence, not a listening verdict. His lifecycle review is mailbox 20261102T044721Z.

## Geometry checkpoint

`tests/grove-family-preview.html` uses the production generator, retuning, scene and world. It offers all five candidate seeds, Together/C/E-flat/G, and an explicitly synthetic maximum capped display response. It makes no audio. Layout, scale, camera and close-view label lifting match the ensemble; the diagnostic's surrounding page is different.

Native desktop Safari responsive inspection:
- Seed 7, Together, 1000×656: all nine bodies appear; decorative supports crowd/overlap between Groves. Close view is the clearer place to inspect their individual anatomy.
- Seed 7, C, 320×656: all three bodies and raised 01/02/03 labels visible at rest and at synthetic maximum response.
- Seed 11, C, 320×656: all three bodies, raised labels, connections and response marks visible at synthetic maximum response.

These observations are screenshots in the session, not saved image artifacts. No actual phone, subjective hearing or brief live-response recognition claim.

The existing real-scene framing test now covers all five seeds at all three tunings. All 3 focused framing tests pass; each scene's maximum capped response/hand marks remains within the resting geometry plus .12 margin. This is a bound, not evidence that the animation is legible. Syntax check on the diagnostic JS passes.

## Implemented contract (reviewed)

A pending family selection is separate from the mounted family. It changes neither current picture nor saved passage. Build candidate scenes before asking the host to enable its groves. After a successful mount, install the corresponding scenes, ordinary label snapshots, body picker and current-family caption together; dispose failed or cancelled candidates. A successful mount can be suspended, so do not confuse readiness for playing with whether a replacement actually mounted.

Continue-from-memory must use the retained source record's groves, with a matching picture and pick targets. It must ignore any pending selection. The authored demonstration still composes from mounted host.recipes. Family naming is visit context beside the picture/keeping, not an invented field in canonical files. Existing studies remain seed 3.

Before shipping: verify pending selection preserves old records, failed/cancelled starts preserve old picture and memory, successful starts replace both, picker targets follow replacement, and continuation uses its source family. Check native narrow/wide views and save/rebuild a new-family passage. Fable reviews implementation separately.


## Live implementation checkpoint

`ensemble-family-mount.js` stages a candidate picture before host.enable, installs only for the current successful ready/suspended mount, and disposes the candidate on failure/cancellation. The encounter swaps complete scene/label/picker sets, preserves the selected close view, and leaves the optional pending family separate. Family names appear beside the current encounter and keeping. No file schema, output gain, initial seed, listening preference or study changes.

Native desktop Safari, 320×656:
1. Idle selection of Chain 7 left current Pair-and-neighbour 3 unchanged. Begin mounted Chain 7. C close view showed its three numbered bodies. A shell02 tap saved only C body1 (zero-based), all parts seed7.
2. Pending selection of Triangle 11 left the Chain picture and keeping caption intact. Preparing and playing the Chain memory still mounted seed7. After handoff, Play03 produced a new body2 event. The seeded wrapper verified against the retained source, with `timingChanged: true`, no refused/unprocessed events, and all three instruments seed7.
3. Begin then mounted pending Triangle11, cleared retained original memory, and preserved C close view. A shell03 tap saved only C body2 on seed11: this checks hit targets were replaced, not merely the picture.
4. At1000×656, Together restored the full triangle ensemble and ordinary floor labels. Show one gesture completed as an explicitly authored passage; all three captured voices carry seed11.

Local captures and executable independent check: `renders/ensemble-family-live/verify.mjs`, source/continued JSONs and `report.json`. Chain source48k ended8705+1200fade; triangle source48k ended13824+1200fade. Canonical renderer versus independent block mixer yields identical WAV bytes for each, hashes in report. The ordinary snapshots before/after pending selection compare equal, but repeat-download freshness was not separately pinned; the stronger observed evidence is unchanged current/keeping captions plus verified source-family continuation and actual scene geometry.

Validation so far:7 focused mount/picker/framing tests and24 host/production-continuation/tap regressions pass. Astra’s full `npm test` run passed559/559 (307.3s); Fable independently reports559/559 in e48f1ba. Failed/cancelled preparation and suspended mount are tested adapter/host paths, not natively induced. No phone-hardware, subjective listening, appeal or real-time-clearance claim. Native screenshots are in the conversation rather than saved image files. The project-home invitation, existing catalog entry and new notebook button were checked natively; the button opens this note.
