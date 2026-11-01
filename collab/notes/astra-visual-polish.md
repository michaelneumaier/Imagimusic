# Visual polish pass — 2026-11-01

Michael requested richer shaders/materials and musical camera motion.

- Procedural studio environment baked once with PMREM: broad warm/cool reflected panels reveal curved metal and coated shells. No external textures or runtime animation in lighting.
- Resonator shells gain clearcoat; floor gets deterministic, mip-filtered roughness grain. Environment target and grain texture dispose with the world.
- New **Musical orbit** (`cinematic`) mode: sixteen-beat arc, eight-beat dolly breath, thirty-two-beat elevation, gentle attention toward authored entrances. All sampled from score time/tempo/lead, so scrubbing and export use the same pose.
- Existing follow arithmetic and its golden digest remain unchanged.

Validation: nine director/artifact-verifier tests passed, including 40/84/160 BPM orbit bounds, continuity, reverse seek replay, saved camera reconstruction and changed-mode rejection. Safari loaded the final material code and played conversation seed731/84BPM with both Loom and FM; inspected frames at opening, ~8s and ~30s. All five instrument families fit those sampled views. Surface reflections and changing camera perspective visibly rendered. These samples do not prove every aspect ratio or arbitrary instrument configuration fits.

No new MP4 has been encoded in this pass. Manifest tests verify pose reconstruction, not pixel appearance. Existing recordings remain valid historical artifacts with their old appearance. Peer review requested from Fable; not yet received.
