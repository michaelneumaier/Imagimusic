# Roadmap and milestones

*v2, 2026-11-01. Order set by Astra (lead); Fable maintains the file. Status
values: `proposed | agreed | in-progress | review | done`.*

## M0: Foundation (status: done 2026-11-01, owner: both)

- [x] Collab protocol, atomic message helper, claims, reviews, decisions
- [x] Vision, roadmap, architecture (Fable), amended and approved (Astra)
- [x] First cross-review: `collab/reviews/20261031T2359Z-fable-reviews-prototype-v0.md`
- [x] Decision 001 (stack) agreed
- [x] Astra: README, 7 node tests, Safari verification of M0.5 (UI, sequence, keys, materials, seed, WAV/JSON/PNG export)
- [x] Astra reviewed foundation: `collab/reviews/20261101-astra-reviews-foundation.md`
- [x] First commits: Astra `0726745`, Fable `1f54f24` (separate owned paths).

M0 is closed as an implemented, reviewed study. Perceptual listening quality is
unassessed; Michael's ears are welcome feedback, not a blocking task.

## M0.5: Shared modal anatomy study (status: done 2026-11-01, owner: Astra)

The resonator garden: dependency-free Canvas + Web Audio, 3 materials, seeded
score, save/load, PNG, WAV worker, node tests. **Preserved as-is**; it is the
kernel later milestones extend, not a scaffold to replace.
- [x] Should-fix 1–3 from the v0 review: 60 ms shared fade on voice retirement, one gain + one pan per voice, cap 48, letter keys work after button focus, empty-modes guard. Picture uses the same retirement factor as audio.
- [x] Caption identifies interpreted modes and amplified envelopes; source and README identify stylized sway.

## M1: Visible excitation + a geometry-linked tine (status: done 2026-11-01; Astra commit 610b549, Fable commits 1e1ce9b, 8b45246)

Order within M1, agreed: excitation, then geometry, then (M2) filter chamber.
Fable's geometry contract is ARCHITECTURE Contract 2; implementation starts only after M0 commits land.

Goal: physics becomes the differentiator now, not a postponed promise.
- Striker with position: modal weights from mode shape at the contact point; a visible striker lands where you click.
- Damper: a resting creature that settles the resonator; release becomes a parameter.
- Velocity-dependent brightness.
- **One real geometry-derived tine or string next to the garden**: modes and mode shapes from length, thickness, material (Euler–Bernoulli beam; stiff string). Change the drawing's dimensions and the pitch moves for a physical reason.
  - [x] math module `src/geometry.js` (`modesOf`, `toModelModes`, material presets), 11 tests (Fable, 2026-11-01)
  - [x] integrated as a playable physical tine beside the garden, patch v3 with bounded geometry, key L, tine WAV (Astra, 2026-11-01; Fable review in collab/reviews/20261101T0015Z-fable-reviews-excitation-slice.md)
- Model exposes a per-voice state the picture reads (see ARCHITECTURE: StateFrame v1).

Done when: a stranger watches the tine get shortened and hears it go up, and can say why the strike point changed the timbre.

Evidence: 35 node tests green; Safari check by Astra (65 mm steel tine 193 Hz vs 72 mm 157 Hz, spectral probe on the exported WAV confirms the 193 Hz fundamental and a 7.1 s natural decay); clamp and free tip drawn and labeled; canvas dead edges fixed; both Fable reviews approved. Perceptual judgement by a human listener remains optional feedback.

## M1b: Small physical proof (status: done 2026-11-01, reviewed, as a *bounded linear-modal proof*; no calibrated acoustic-transfer claim)

- [x] The tine's audio is the modal sum of its geometry-derived modes: frequencies, mode shapes, and material decays are physical; the damping slider is an explicit added loss.
- [x] A/B exists on one page: interpreted garden (ratio tables) beside the physical tine.
- [x] Stylized and stated in code and caption: modal amplitudes (no impulse spectrum, modal mass, pickup, or radiation model). A calibrated transfer model is later research, not part of this proof.

## M1m: Migration milestone (status: superseded by M2.5 in proposal 004)

- TS + Vite + Three.js + AudioWorklet per decision 001, as its own reviewed slice.
- Garden and tine ported with motion-trace regression (same StateFrames in, same poses out).
- Clock abstraction with deterministic reset; postMessage StateFrame batches with timestamps and interpolation.

## M2: Bellows Choir, the filter chamber (status: done 2026-11-01; Astra commit e09464e, Fable f564cd7; reviews in collab/reviews)

Evidence: 52 node tests; four real OfflineAudioContext checks in Safari (rolling-vs-full schedule peak error 5e-17, same-seed noise identical, gate release tail zero, max-resonance export finite); Michael heard the choir live. Known limitation, documented not hidden: a main-thread stall longer than the 300 ms horizon can't be retroactively repaired by backfilled automation. Air source has no fundamental; its pitch target scales playback rate.

Equations: docs/bellows-equations.md. Proposal: docs/proposals/002-bellows-choir.md.

- Second family, contrasting voice: airflow source, chamber with iris and baffles (cutoff/resonance), pump as envelope.
- Interpreted mode; mechanism driven by filter state. Patch schema v0 for this family.

## M2.5: One stage, one state bus (status: in-progress; agreed in collab/decisions/002-shared-stage.md; slice A owner Fable, slices B/C Astra + Fable)

- [x] Slice A (done 2026-11-01, Astra commit 3a46cc3): `src/clock.js`, `src/state.js`, `src/bindings.js` + tests (Fable); lab 2D canvases rewired to collectState frames via `src/snapshots.js` with energy-parity and finite-coordinate tests (Astra; Fable review collab/reviews/20261101T0057Z-fable-reviews-lab-migration.md approve; Safari choir smoke by Astra). No canvas reads an engine object.
- [ ] Slice B: vendored pinned Three.js, import map, stage islands, same bindings, identical traces vs 2D
  - [x] first 3D preview at /stage.html on the shared score + state bus, 84 stateless bindings, scrub + cameras (Astra b5ba697); Fable review collab/reviews/20261101T0040Z-fable-reviews-stage-preview.md
  - [ ] live == score equivalence test; per-parameter inputs consolidated from bindings-catalog STAGE_INPUTS; lab 2D migrated to the bus
- [ ] Slice C: performer actor, three cameras, inspector, FrameClock video capture
  - [x] offline passage audio through the live graph: src/stage/render-audio.js (Fable), node tests with mocks + tests/stage-render-browser.html for real OfflineAudioContext evidence
  - [x] deterministic video export prototype (Astra): vendored Mediabunny (decision 003), /stage.html "Render movie" → MP4 H.264 720p30 + AAC 48 kHz; full passage verified with ffprobe (1007 frames, 33.567 s video, 33.561 s audio, first note at 0.35 s) and all 1007 state hashes regenerated in Node with 0 mismatches
  - [x] audio repeatability (decision 004, 2026-11-01): repeated offline renders of the full passage and the air choir are bit-identical float32 on Safari 26.6.2 / 48 kHz / seed 731 (harness v6); default lifecycle outlive-render with engine gains zeroed at cutoff; as-live kept as an explicit negative control; controlled finding: differences observed after source finish, never-stopped controls identical (max-difference location is not the first difference); no cross-browser or codec byte-identity promised
  - [x] Tension Loom A: reciprocal two-body model (src/coupling.js, 11 tests incl. coherent superposition; proposal 003 revised, FM units corrected); loom.html study 01 and the scored eight-strike passage (Astra), both reviewed and approved
  - [ ] performer planner: proposal docs/proposals/006-performer-planner.md, pure src/perform/planner.js (actors spawned by the score, poses as functions of t, unplanned events reported never hidden); Astra keeper rig + scene integration next
  - [x] procedural camera director (Astra 0b83583; Fable review approve)
  - [x] inspector route overlay (Astra 5dea2c5; Fable review approve-with-fixes)
  - [x] manifest consolidation on src/stage/manifest.js; export/inspector review fixes applied (Astra 3a46cc3)
  - [ ] performer actor, three procedural cameras, route highlight in the inspector

State bus + bindings-as-data + clock (slice A, 2D), then the 3D shared stage (slice B), then performer, cameras, inspector, and deterministic video capture (slice C). Replaces the separate M1m migration and pulls the render milestone into slice C.

## M3: Tension Loom, coupling and FM (status: proposed; contract drafted in docs/proposals/003-tension-loom.md; lands after M2.5 slice B as the first family born in 3D)

- Shared bridge/soundboard leaking energy between resonators; FM as a bridge that stretches strings while ringing.
- LFO pendulum visibly linked to what it modulates.
- "Why did this move?" inspection: highlight the signal path and shared parameter behind a motion.

## M4: Performance and anticipation (status: proposed)

- MIDI file loader; polyphony across resonators; separate performer actor.
- Lookahead striker planner (approach before note-on, recover after); camera follows the exciter.

## M5: Render mode (status: proposed)

- Deterministic fixed-step playback; synchronized offline audio; frame capture + mux; one command, no intervention.

## M6: Skins and worlds (status: proposed)

- Visual skins (palette, lighting, environment) that never change timing; regression compares motion traces across skins.
- Michael-facing knobs documented in one page.

## Track V (parallel): Voice Observatory (status: planning only, plan approved by Astra 2026-11-01 with measurement corrections; docs/proposals/005-voice-observatory.md)

Michael's new direction (2026-11-01, relayed by Astra): live human voice → highly reactive, detailed visual feedback. Measured / estimated / inferred tiers; V0 normal voice → V1 resonances → V2 articulation and beatbox → V3 optional research. No microphone code until the plan is agreed. Does not displace the Conservatory track.

## Later research (not scheduled)

- General inverse fitting: find bodies for an arbitrary recorded or synthesized target.

## Standing

- Each slice ends with a review by the other agent and a LOG.md line.
- IDEAS.md triage at every milestone boundary.
- Realism mode and limitations always stated in the UI caption and in docs.
