# Visual polish pass — 2026-11-01

Michael requested richer shaders/materials and musical camera motion.

- Procedural studio environment baked once with PMREM: broad warm/cool reflected panels reveal curved metal and coated shells. No external textures or runtime animation in lighting.
- Resonator shells gain clearcoat; floor gets deterministic, mip-filtered roughness grain. Environment target and grain texture dispose with the world.
- New **Musical orbit** (`cinematic`) mode: sixteen-beat arc, eight-beat dolly breath, thirty-two-beat elevation, gentle attention toward authored entrances. All sampled from score time/tempo/lead, so scrubbing and export use the same pose.
- Existing follow arithmetic and its golden digest remain unchanged.

Validation: nine director/artifact-verifier tests passed, including 40/84/160 BPM orbit bounds, continuity, reverse seek replay, saved camera reconstruction and changed-mode rejection. Safari loaded the final material code and played conversation seed731/84BPM with both Loom and FM; inspected frames at opening, ~8s and ~30s. All five instrument families fit those sampled views. Surface reflections and changing camera perspective visibly rendered. These samples do not prove every aspect ratio or arbitrary instrument configuration fits.

No new MP4 has been encoded in this pass. Manifest tests verify pose reconstruction, not pixel appearance. Existing recordings remain valid historical artifacts with their old appearance. Peer review requested from Fable; not yet received.

Follow-up: selected camera mode now persists in the URL across seed/tempo/character/density regeneration, ensemble toggles, and round trips through the instrument studies. Explicit manual view selection clears the saved direction. Manual orbit position itself is not persisted. Seven camera-link/composition-link tests passed. Browser scene parity harness now accepts `camera=cinematic` and compares roughness/metalness/clearcoat in addition to its existing pose values. That new browser run is pending: Safari reported concurrent user interaction, so automation stopped before running the harness; no browser pass is claimed for these follow-up changes.

Browser validation completed later on 2026-11-01: Safari, cinematic conversation with both children, 48kHz AudioContext, **316/316 states matched** (87 live-clock frames +229 full-passage boundary samples), reverse replay into a fresh world. This compares scene/material values, not pixels or audio. Brave was attempted separately but displayed a blank page, so no Brave pass is claimed.

Camera link browser check initially showed Manual despite camera=cinematic. Added a pageshow synchronization against browser-restored form values, then reloaded from origin to ensure fresh modules. The check does not isolate stale cache from form restoration as the original cause. With the final code, Safari showed Musical orbit on a fresh seeded-study link, retained it when switching to conversation, and retained it for New variation731→732. Closed the temporary test tab afterward, returning to Michael's existing preview without changing its selected seed or camera.
