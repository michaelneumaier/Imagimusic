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

## M2.5: One stage, one state bus (status: done 2026-11-01; agreed in collab/decisions/002-shared-stage.md; evidence summarized in collab/notes/movie-export-validation.md)

- [x] Slice A (done 2026-11-01, Astra commit 3a46cc3): `src/clock.js`, `src/state.js`, `src/bindings.js` + tests (Fable); lab 2D canvases rewired to collectState frames via `src/snapshots.js` with energy-parity and finite-coordinate tests (Astra; Fable review collab/reviews/20261101T0057Z-fable-reviews-lab-migration.md approve; Safari choir smoke by Astra). No canvas reads an engine object.
- [x] Slice B (done 2026-11-01): vendored pinned Three.js with provenance, import map, stage islands on layout.js, same bindings, scene parity 324/324
  - [x] first 3D preview at /stage.html on the shared score + state bus, 84 stateless bindings, scrub + cameras (Astra b5ba697); Fable review collab/reviews/20261101T0040Z-fable-reviews-stage-preview.md
  - [x] per-parameter inputs consolidated from bindings-catalog STAGE_INPUTS (stageInputsFor, incl. performer/pump sections); lab 2D migrated to the bus (slice A)
  - [x] live == score equivalence gate (closed 2026-11-01): (a) audio side proven by render-audio tests; (b) engine-side plan test in tests/stage.test.js (Astra); (c) planned score == synthesized engine voices on the state bus, src/stage/equivalence.js, identical over 1007 frames in node with explicit id/order/timeline normalization (Fable); (d) browser-clock vs offline picture parity 324/324 in Safari via tests/stage-parity.html (Astra); (e) real-engine browser run tests/stage-engine-parity.html in Safari: raw and projected frames identical for all 2011 sampled frames, 48 kHz, seed 731 (Astra, renders/engine-parity-731-20261101T014804.json)
- [x] Slice C (done 2026-11-01): Keepers and pump operators, procedural camera director, route-overlay inspector with per-actor bindings, deterministic MP4 export with canonical manifest and verifier, repeatable audio (decision 004)
  - [x] offline passage audio through the live graph: src/stage/render-audio.js (Fable), node tests with mocks + tests/stage-render-browser.html for real OfflineAudioContext evidence
  - [x] deterministic video export prototype (Astra): vendored Mediabunny (decision 003), /stage.html "Render movie" → MP4 H.264 720p30 + AAC 48 kHz; full passage verified with ffprobe (1007 frames, 33.567 s video, 33.561 s audio, first note at 0.35 s) and all 1007 state hashes regenerated in Node with 0 mismatches
  - [x] audio repeatability (decision 004, 2026-11-01): repeated offline renders of the full passage and the air choir are bit-identical float32 on Safari 26.6.2 / 48 kHz / seed 731 (harness v6 candidate, v7 shipping default 12/12, full movie 1007/1007 on the default path); default lifecycle outlive-render with engine gains zeroed at cutoff; as-live kept as an explicit negative control; controlled finding: differences observed after source finish, never-stopped controls identical (max-difference location is not the first difference); no cross-browser or codec byte-identity promised
  - [x] Tension Loom A: reciprocal two-body model (src/coupling.js, 11 tests incl. coherent superposition; proposal 003 revised, FM units corrected); loom.html study 01 and the scored eight-strike passage (Astra), both reviewed and approved
  - [x] performer planner (Fable, proposal 006, src/perform/planner.js: actors spawned by the score, pre-positioned first notes, explicit truncated recovery, previousEventId for continuity, unplanned events reported never hidden) and Keepers (Astra 2eca102 → 89f5349, f9be89a): articulated arms with the per-slot strike endpoint as hand, bellows crosshead operators, 12 actors / 0 unassigned / 0 unreachable on the default passage, declared per-actor bindings, per-actor inspector; live and export integrated; Fable review approve (addendum in collab/reviews/20261101T0110Z-fable-reviews-keepers.md)
  - [x] procedural camera director (Astra 0b83583; Fable review approve)
  - [x] inspector route overlay with note-local LFO settings (Astra 5dea2c5 + fix; Fable review approve-with-fixes, fixes applied)
  - [x] manifest consolidation on src/stage/manifest.js; export/inspector review fixes applied (Astra 3a46cc3)
  - [x] full-movie regression on the adopted default lifecycle (Astra: renders/conservatory-repeatable-731.mp4, 1007 frames, verifier 1007/1007, 113 bindings, 12 Keepers, 0 unassigned, 0 unreachable)
  - [x] M2.5 close-out: all evidence above in place (scene parity, engine parity, full movie, repeatable audio)

State bus + bindings-as-data + clock (slice A, 2D), then the 3D shared stage (slice B), then performer, cameras, inspector, and deterministic video capture (slice C). Replaces the separate M1m migration and pulls the render milestone into slice C.

## M3: Tension Loom, coupling and FM (status: done 2026-11-01; verification complete: v13 focused FM contribution 3/3 arrangements bit-identical, 0 difference in the 100 ms before the 6.064 s entrance and a positive contribution after; claims limited to the tested settings and that window; proposal 003 revised; reciprocal pair model, study 01, scored passage, shared scene adapter, composition v1 with live and offline adapters done; done 2026-11-01: opt-in ensemble UI (?loom=1), composed exports verifiable (composition saved canonically in the manifest, verifier rebuilds with it; renders/conservatory-loom-731.mp4 1007/1007); composed audio identity verified for three arrangements after the duet-buffer padding fix (decision 004 scope extension); composed scene parity 361/361; FM tensioner (B): core (src/fm.js, 12 tests incl. full-passband alias measurement), scene, study page with settings links, composition v2 foundation with a single featured tone and the offline adapter done; frame/projection/world/director/export/verifier on v2 with scene parity 379/379, live stage audio and controls with the signed-frequency readout, harness v11 14/14 with FM alone and FM + Loom bit-identical (decision 004 scope), combined movie renders/conservatory-fm-loom-731.mp4 verified 1007/1007; v13 focused contribution check passed (renders/stage-render-report-v13-731-20261101T023441.json))

- Shared bridge/soundboard leaking energy between resonators; FM as a bridge that stretches strings while ringing.
- LFO pendulum visibly linked to what it modulates.
- "Why did this move?" inspection: highlight the signal path and shared parameter behind a motion.

## M3.5: A conversation in three movements, the explicit score (status: in progress 2026-11-01; contract docs/proposals/008-conversation-score.md rev. 2.2 approved; score math + 10 tests over a 36-preset grid (Fable a4d00b9, b4c807f); explicit-event compiler, authored assembly, stage controls, link persistence, export and verifier integrated (Astra d55df8f), integration reviewed and approved; Safari scene parity 341/341 on the generated score with both children, legacy manifests 1007/1007 unchanged. Generated-phrase audio evidence: harness v14 full 15/15 (three presets × 44.1/48 kHz, twice each, bit-identical, bounded, exact length) and v15 focused (final 0.5 s at 48 kHz below −109 dBFS for all three presets, the proposal's settling criterion); score-event inspection shipped (bbbcdfa). Baseline movie renders/conservatory-conversation-731.mp4 verified 1960/1960 (calm 0.7 / seed 731 / 84 BPM, both children, manual wide camera; decoded audio finite, final 0.5 s ≈ 4e-6). Cadence-weighted camera shipped (proposal 009, Astra 4c11070; legacy follow digest exact; Safari parity 275/275; opening frames the whole ensemble). Audition evidence tool tools/audition-report.mjs writes renders/audition-<seed>.json/.svg. Cadence-follow movie verified 1960/1960 with decoded PCM byte-identical to the wide movie; listening room audition.html shipped (Astra 7162f49) with both movies, the follow version selectable, the plot and the stage link. Engineering deliverables complete 2026-11-01; Michael's listening is optional feedback, available any time, not a block.)

Deterministic phrase score (opening / exchange / release) over the existing mechanisms; slot and body, never arbitrary pitch; density by weight, character by variant; one FM entrance at the turn; legacy passage re-expressed as a score with identical hashes; sections inspectable in the frame.

## M4: MIDI import onto the score contract (status: in progress; proposal docs/proposals/010-midi-import.md rev. 3)

- M4a SMF 1.0 parser built from the RP-001 text (src/midi/smf.js, Fable 5c0b4ef; Astra review 20261101T0440Z with fixes in progress).
- M4b mapping / compile / report built (src/midi/mapping.js, Fable; Astra review 0453Z fixes landed). M4c MIDI desk: intake, source overview (bd9afae), mapping preview with the real compiler, explicit Use to the stage via a keyed session transfer, stage playback at the audio rate and export (Astra; Fable review approve 0503Z); Safari: example → bellows → 3 entrances → PLAYING. M4d imported adapter, export and verifier built (Astra; Fable review approve). Imported movie renders/conservatory-midi-triad-731.mp4 verified 153/153 with source, plan and report in the manifest (Astra). Harness v16 imported-MIDI row 1/1 at 48 kHz (exact repeated PCM, final 0.5 s exactly 0; renders/stage-render-report-v16-731-20261101T050154.json). M4 engineering deliverables complete 2026-11-01 (Astra 9b456a6); the 44.1 kHz run of the imported row and a non-example file through the desk remain as optional further evidence.

## M5.5: The listening doorway, a Loom journey (status: in progress 2026-11-01; Michael: keep going, get creative, make it something people want; proposal docs/proposals/012-loom-journey.md)

Score: src/score/loom-journey.js (Fable): solo → late answer → interweaving → silence over the static coupling model, three settings (close kin, distant cousins, tight weave) whose differences are measured from the model (mode split, modal amplitude ratio of the unstruck body, ring), 5 tests. Page: listen.html + src/listen/** (Astra): explicit Listen, quiet pauses, worker render with the same PCM for live and save, chapters, still view honoring reduced motion, model disclosure. Shipped 2026-11-01 (Astra fc64cc4; Fable review approve; attack/release click fixed with a regression; Safari lifecycle verified; kept WAV byte-identical to an independent Node render; 400 px framing verified; evidence in collab/notes/listening-doorway-validation.md). Next: the audition question list applied when Michael listens; then a presentation layer only under the VISION rule.

## M5.6: Call and answer, one playable gesture (status: shipped 2026-11-01; proposal 013 rev. 2; model functions Fable, page "Touch. Listen. Answer." Astra 3f004b0; Fable reviews approve; touch-audio harness 4/4 with declared tolerances, saved record reconstructed byte-identically in Node; mobile multitouch and cross-browser not claimed)

Touch one Loom body; the other swells through the bridge (a swell, not an arrival: the coupled response begins at once); the page waits until a conservative bound on the ring is still, and names what an early touch did to the struck body's own envelope (grows / softens / unchanged). Model: answerPeak, stillnessBound, meeting (src/score/call-answer.js, 3 tests, measured swells 0.57 / 0.11 / 0.20 s). Page, Still state, recording list and "keep what you played" through the Loom performance and verifier (Astra).

## M6: The Grove, anatomy from sound (status: shipped 2026-11-01; proposal 014 rev. 3; network model and generator/greeting Fable, page/scene/audio Astra 1c6d3e0; mutual reviews approve; Safari greeting/live/Quiet/save verified, two-gesture WAV byte-identical to Node, six offline cases at both rates within recorded tolerances; mobile 400 px framing verified)

Three to five seeded bodies joined by bridges whose topology is the visible anatomy; a coupled-network generalization of the pair (symmetric eigen-solve, N = 2 reproduces the Loom exactly); discovery by touch with bridges lit only by measured exchange history (a presentation layer, separated from the model); a composed ritual over three seeds. 014a network model and 014b generator/ritual (Fable); 014c page and lighting (Astra).

## M6.5: A richer voice for the Grove (status: shipped as an optional playable route 2026-11-01, Astra 3c06f56; proposal 015; original remains the default; modal network, voice factory and comparison tool Fable, adapters, page, worker and A/B surface Astra; Safari six-case worker parity within 7.5e-9, captures rebuilt byte-identically in Node; no subjective preference claimed; the position-aware greeting shipped as the richer voice's invitation (d788107; six-case browser parity on the authored greeting, saved JSON equal to the authored events))

Bodies with a few beam partials (geometry.js family), strike position selecting partials, bridges coupling every partial through mode shapes at the attachment point, per-mode decay by a stated classical-damping approximation; M = 1 reproduces today's grove exactly; a measurable A/B comparison tool before any page change.

## M7: A movie of a saved Grove performance (status: done 2026-11-01, Astra c33a47a; proposal 016; core, audio evidence and page film controls by Astra, all approved; Fable's independent verifier tools/verify-grove-movie.mjs passed at the full level on the smoke fixture and on the first real page performance; cancellation verified incl. a deterministic abort at frame 9)

## M8: Rest, a damping contact (status: shipped as an optional route 2026-11-01, Astra 4f2676b rest.html; proposal 017; the first gesture that changes the instrument rather than the input; Fable: exact state stepper with contact damping, pure worklet engine, serializable recipe with 343 contact states, energy-based admission invariant (Astra's; the free bank bound refuted under contacts), capture v2, exact renderer, picture, invitation, verifier rebuild, captions draft; Astra: scheduling primitive, worklet with admission, limits and automatic acknowledged Quiet, capture adapter, live host, page with invitation and honest captions; evidence: five offline parity cases at zero difference, worklet heard output byte-equal to the Node rebuild of the acknowledged record, invitation capture equal to the authored record with a byte-equal WAV, a real manual passage rebuilt; Rest keeping complete 2026-11-01: Listen back (Astra 3481f0c) and film (Astra 7cc3001, held contacts drawn as acknowledged rings), the first Rest film verified by both verifier runs at the full level, records reconstructed by recipeForRecord with admission replayed, strengths recorded with coefficients (bare default names mean the defaults); not claimed: speaker latency, dropouts, import; next phase: first-use polish and creative exploration, see collab/notes/fable-first-use.md)

The first gesture that changes the instrument rather than the input: a viscous contact at a point on a shell, exact by a state stepper between gesture boundaries, equivalence-tested against the modal sums; capture v2 with contacts; live path moves to a worklet stepper only after equivalence is proven.

Export from the saved record only: soundtrack = the unit-bank sum (byte-identical by proof), frames from the same analytic visual the page draws on the frame clock, a manifest that rebuilds PCM and scene values for verification, stage export untouched, voice labeled, presentation named as input cues.

## M9: The same gestures, another grove (status: shipped 2026-11-01, Astra 6b1c6c8 on rest.html; proposal 018; Fable: transposeRestRecord with an identical-vocabulary requirement, source re-admission and truthful drops; Astra: comparison core, session, explicit selector after Quiet, separated controls and film, single-source rule including film previews; evidence: Safari worker report rebuilt in Node, first comparison film verified at the full level, original byte-identical before and after, comparison equal to the Node transposition of the original; next: an authored listening comparison across the three groves and one named musical weakness before more features)

Hear a finished Rest passage on another grove: same hands, same moments, different bodies; strikes the other grove could not take are left out and reported.

## Evaluation checkpoint (2026-11-01, Astra 4b20924): listening studies, not evidence of appeal

Two reproducible local listening studies exist (the 20 s Rest invitation and the 11 s individuality phrase, each on all three groves, natural level plus attenuation-only RMS-matched copies, hashes checked by both of us). Measured: each grove is one pitch with beating; seeds 3 and 7 near C3, seed 11 near G3; decay 2.4 / 1.65 / 1.9 s; natural-level spread 5.35 dB (invitation) and 7.56 dB (phrase), so phrase-dependent. No listening verdict exists; the question for Michael is whether the groves sound like three instruments or one. No production sound change; pitch curation stays an explicit audition experiment until there is listening evidence.

## First-use polish (2026-11-01, Astra e4411b4): counted

Before the first gesture the Grove's first screens show 3 buttons and 3 selects (from 9 and 3) and Rest's 5 buttons and 4 selects (from 18 and 5); pads preserved; passage tools and the comparison revealed only for a finished passage; film-format text only beside a film; no scroll on Quiet. Counts are evidence of the change, not a target.

## Proposed next: the second gesture (docs/proposals/020-second-gesture.md)

A: the neighbour strike timed against the beat, measured at up to 8 dB of consequence by timing alone on seeds 7 and 11; audition pairs then listening. B: sustained excitation with an explicit friction force law on the same exact model, as a bounded offline experiment.

## M4.5: Expressive bodies, MIDI 2.0 expression (status: in progress; Michael's direction 2026-11-01; proposal docs/proposals/011-expressive-bodies.md rev. 2 approved by Astra; 011b evaluator + fixture built, Fable src/midi2/expression.js; next 011c bellows adapter + bodies, Astra)

Three simultaneous notes with independent pitch, pressure and brightness; one analytic evaluator (sound, visuals, seek, export) over a MIDI 2.0 channel-voice subset read from M2-104-UM v1.1.2 (per-note controllers, per-note management, per-note pitch bend, attribute pitch); raw integers preserved, units only at the instrument boundary (src/midi2/values.js, Astra f51d001). Fixture first, bounded MIDI Clip import next, live bridge research last; no Safari MIDI 2.0 claim.

- MIDI file loader mapping pitches to the nearest available slot with a visible "mapped" flag; polyphony limits enforced by the validator.
- Performer actor and lookahead planner already shipped (Keepers); camera already follows attention.

## M5: Render mode (status: substantially done 2026-11-01)

- Shipped: deterministic fixed-step playback, synchronized repeatable offline audio (decision 004), frame capture and mux to MP4 with canonical manifest and verifier (decision 003), composed and combined movies verified.
- Future automation (not shipped): a one-command headless render (CLI / headless browser) and batch export; nothing about determinism depends on it.

## M6: Skins and worlds (status: proposed)

- Visual skins (palette, lighting, environment) that never change timing; regression compares motion traces across skins.
- Michael-facing knobs documented in one page.

## Track V (parallel): Voice Observatory (status: planning only; V0–V3 order, tiers and ownership approved by Astra 2026-11-01; one-minute gesture review and three visual directions consolidated into docs/proposals/005-voice-observatory.md; first build when Michael lifts planning-only: woven spectrum beside a plain spectrogram)

Michael's new direction (2026-11-01, relayed by Astra): live human voice → highly reactive, detailed visual feedback. Measured / estimated / inferred tiers; V0 normal voice mirror → V1 resonance portrait → V2 articulation and beatbox atlas → V3 creative performance (features on the stage bus, recorded trajectories by explicit choice); anatomy inference is a separate research track off the main line, never the main visual truth. Planning only: no microphone code. Does not displace the Conservatory track.

## Later research (not scheduled)

- General inverse fitting: find bodies for an arbitrary recorded or synthesized target.

## Standing

- Each slice ends with a review by the other agent and a LOG.md line.
- IDEAS.md triage at every milestone boundary.
- Realism mode and limitations always stated in the UI caption and in docs.
