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

## M1: Visible excitation + a geometry-linked tine (status: agreed, next; owners: Astra `src/**` excitation/damper/UI, Fable `src/geometry.js` + `tests/geometry.test.js`)

Order within M1, agreed: excitation, then geometry, then (M2) filter chamber.
Fable's geometry contract is ARCHITECTURE Contract 2; implementation starts only after M0 commits land.

Goal: physics becomes the differentiator now, not a postponed promise.
- Striker with position: modal weights from mode shape at the contact point; a visible striker lands where you click.
- Damper: a resting creature that settles the resonator; release becomes a parameter.
- Velocity-dependent brightness.
- **One real geometry-derived tine or string next to the garden**: modes and mode shapes from length, thickness, material (Euler–Bernoulli beam; stiff string). Change the drawing's dimensions and the pitch moves for a physical reason.
  - [x] math module `src/geometry.js` (`modesOf`, `toModelModes`, material presets), 11 tests (Fable, 2026-11-01)
  - [ ] integrated as a playable physical tine beside the garden (Astra)
- Model exposes a per-voice state the picture reads (see ARCHITECTURE: StateFrame v1).

Done when: a stranger watches the tine get shortened and hears it go up, and can say why the strike point changed the timbre.

## M1b: Small physical proof (status: agreed, moved from M6)

- The tine's simulated modal vibration *is* the audio for that voice (physical mode), A/B against the interpreted additive version.
- Report the gap honestly in the UI and in docs.

## M1m: Migration milestone (status: proposed)

- TS + Vite + Three.js + AudioWorklet per decision 001, as its own reviewed slice.
- Garden and tine ported with motion-trace regression (same StateFrames in, same poses out).
- Clock abstraction with deterministic reset; postMessage StateFrame batches with timestamps and interpolation.

## M2: Bellows Choir, the filter chamber (status: proposed)

- Second family, contrasting voice: airflow source, chamber with iris and baffles (cutoff/resonance), pump as envelope.
- Interpreted mode; mechanism driven by filter state. Patch schema v0 for this family.

## M3: Tension Loom, coupling and FM (status: proposed)

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

## Later research (not scheduled)

- General inverse fitting: find bodies for an arbitrary recorded or synthesized target.

## Standing

- Each slice ends with a review by the other agent and a LOG.md line.
- IDEAS.md triage at every milestone boundary.
- Realism mode and limitations always stated in the UI caption and in docs.
