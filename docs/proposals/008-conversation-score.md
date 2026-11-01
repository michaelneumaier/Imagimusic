# Proposal 008: "A conversation in three movements", the explicit score contract

*Fable, 2026-11-01, at Astra's request. Contract and musical design only; no
implementation until reconciled. Fable owns score math once agreed; Astra
owns integration and visual framing. The current seeded passage stays the
default/legacy mode and every existing artifact stays valid.*

## What this is

An optional, deterministic **phrase score** that makes the existing
mechanisms sound and look like an ensemble: an opening sparse enough to see
anticipation, an exchange where a motif is answered across families with
one FM entrance at the turn, and a release that thins to audible decay and
visible settling. It changes **which events are scheduled and when**; it
never fakes visual intensity, compresses time, or asks a fixed resonator to
play a pitch it does not have.

## Audit: what each family can actually play (from the code)

| Family | Pitch | Simultaneity | Controllable per event | Notes |
| --- | --- | --- | --- | --- |
| Garden (8 resonators) | fixed: slot → MIDI 48, 51, 55, 58, 60, 63, 67, 70 (C3 E♭3 G3 B♭3 C4 E♭4 G4 B♭4, a minor-pentatonic-ish set) | any slots together; repeats on a slot pile up (coherent, voice cap 48) | velocity (hardness + level), strike position (modal weights), hold-to-damp | Keepers: one actor per overlapping strike, spawn up to 6; a strike nobody can reach is reported, never dropped |
| Tine (1) | fixed by geometry (default steel 65 mm: ≈ 193 Hz) | one at a time, repeats pile up | velocity, position, damp | physical mode; pitch is a patch property, not a score property |
| Bellows choir (6 chambers) | fixed: slot → MIDI 48, 51, 55, 58, 60, 63, 67 | 6 voices, steal beyond | velocity, gate length (noteOn/noteOff), per-breath settings snapshot | envelope and filter are the expressive dimensions, not pitch |
| Loom (2 bodies) | fixed: f₁ and f₂ = f₁·2^(detune/1200) from the composition | one fixed system; strikes on either body superpose coherently | body, velocity | energy exchange is the expressive dimension |
| FM tensioner (1) | fixed: carrier/ratio/index from the composition | **one entrance per score** (no polyphony on one carrier in this slice) | entrance time only | repeated FM or several voices would need explicitly modeled extra bodies; excluded here |
| Dampers (garden, tine) | n/a | per slot | hold interval | the only "rest" gesture we can show; useful in the release |

Consequence: **melody lives in which slot speaks and when**, not in
arbitrary pitch. A score event names a slot or body, never a Hz value;
derived pitch is a readout for the inspector.

## Contract: `Score` v1 (data)

```js
Score = {
  version: 1,
  seed, tempo,                       // tempo in BPM (40–160), seed integer
  meter: { beatsPerBar: 4 },
  lead: 0.35,                        // seconds before beat 0 (as today)
  controls: { density: 0..1, character: 'calm' | 'bright' | 'restless' },   // the only exposed knobs
  sections: [
    { id: 'opening',  startBar: 1,  endBar: 4,  cadence: 'anticipation' },
    { id: 'exchange', startBar: 5,  endBar: 12, cadence: 'answer', turnBar: 9 },
    { id: 'release',  startBar: 13, endBar: 16, cadence: 'settling' },
  ],
  events: [
    { id: 'garden:opening:1', family: 'garden',  slot: 2, beat: 0,    velocity: 0.7, position: 0.4, weight: 1.0 },
    { id: 'bellows:exchange:3', family: 'bellows', slot: 1, beat: 18, durationBeats: 1.5, velocity: 0.55, weight: 0.6 },
    { id: 'loom:exchange:2', family: 'loom', body: 1, beat: 21, velocity: 0.6, weight: 0.8 },
    { id: 'fm:exchange:turn', family: 'fm', beat: 32, weight: 1.0 },                        // exactly one
    { id: 'damper:release:1', family: 'damper', target: 'garden', slot: 2, beat: 50, durationBeats: 2, weight: 0.9 },
  ],
}
```

- `beat` is absolute from the score start; seconds = `lead + beat·60/tempo`.
  Event ids are `family:section:n` and stable for a given (seed, controls).
- `weight` ∈ (0, 1]: an event is scheduled when `weight ≥ 1 − density`.
  Density thins the texture **by removing low-weight events**, never by
  shortening time or scaling levels. The motif's structural events carry
  weight 1 so density never deletes the skeleton.
- `character` selects a deterministic motif variant: slot set, velocity
  curve and strike positions (calm: low slots, soft, central strikes;
  bright: upper slots, harder, near-tip strikes; restless: alternating
  registers, shorter bellows gates). Same beats, different voices.
- Validation (`validateScore`): bounds, slots within each family, exactly
  one `fm` event, no two garden events on one slot closer than 60 ms
  (what a Keeper can serve as a quick repeat), bellows gates within the
  passage, sections contiguous and non-overlapping, ids unique.

## Pure functions (what Fable would implement)

```js
composeConversation({ seed, tempo = 84, density = 0.7, character = 'calm' }) -> Score      // deterministic
validateScore(score) -> score (throws)
scoreToPerformance(score, patch, composition) -> performance        // the SAME shape createPerformance returns:
   // events for garden/tine/bellows (with modes from modesForVoice), loom score for createLoomPerformance,
   // fm entrance time for createTensionerPerformance, duration = last end + tail. Audio, planners, scene and
   // export consume it unchanged.
sectionAt(score, t) -> { id, bar, beatInBar, progress01, cadence }    // for captions, camera, inspector
eventsPerBar(score) -> number[]                                        // evidence helper
```

The legacy passage is `scoreToPerformance(legacyScore(patch), …)` where
`legacyScore` re-expresses today's `makeScore`/`bellowsScore`/tine/Loom/FM
events as a Score with `version: 1, controls: { density: 1 }`, so the
default path becomes a score too **without changing a single event time**
(acceptance: identical trace manifest to the current artifact).

## Musical design (first draft, 16 bars at 84 BPM ≈ 46 s plus tails)

- **Opening (bars 1–4, "anticipation").** A four-note garden motif on
  slots 2, 4, 5, 2 (G3 C4 E♭4 G3) on beats 0, 2, 5, 7 with at least two
  beats of silence between strikes on any one slot, so each Keeper's
  approach is seen in empty air. Density below 0.5 drops the fourth note.
- **Exchange (bars 5–12, "answer").** The motif returns and is answered:
  tine on the off-beat after each motif note (bars 5–6), bellows on slots
  matching the motif's pitches with 1.5-beat gates (bars 7–8), Loom strikes
  alternating bodies on odd beats from bar 7 (so the exchange is heard
  crossing the bridge), the motif inverted in the upper slots (bars 9–12).
  **The turn: one FM entrance at bar 9 beat 1** (beat 32), the only
  featured tone, held by its own decay.
- **Release (bars 13–16, "settling").** Events per bar fall 6 → 4 → 2 → 1:
  the last Loom strike at bar 13, the last bellows gate releases at bar 14,
  dampers hold slots 4 and 5 across bars 14–15 (the resting creature
  settles the body on screen), one final garden strike on slot 2 at bar 16
  beat 1, then nothing: the passage ends on natural decay.
- Controls: tempo scales time uniformly; density thins by weight; character
  changes voices. Nothing else is exposed.

## Inspectability

`sectionAt` feeds `StateFrame.global.score = { section, bar, beat,
progress01, cadence }`, so the caption can name the movement, the camera
director can weight attention by section (opening: wide; exchange: follow;
release: slow settle), and the inspector can show, for any strike, its
event id, section and weight. The score itself is data in the manifest
(canonical, like the composition), so an export is reproducible from the
link and the verifier rebuilds it.

## Acceptance evidence (targets, each a test or a measurement)

- **Anticipation:** in the opening, every garden strike's 0.18 s approach
  begins with no other onset within 0.3 s on any family (measured from the
  score), and the Keeper plan reports 0 unplanned events.
- **Settling:** `eventsPerBar` is non-increasing across the release; no
  onset in the final 8 s; `out.modeledIntensity` sampled at 30 fps is
  non-increasing over the last 6 s of the trace (allowing the existing
  decay tails).
- **Determinism:** identical Score JSON and identical trace manifest for
  identical (seed, tempo, density, character); density 1 ⊇ density 0.5
  event sets.
- **Legacy preserved:** `legacyScore` reproduces the current passage's
  manifest hashes exactly (1007/1007).
- **Family limits honored:** validator rejects a second `fm` event, an
  out-of-range slot, two garden strikes on one slot within 60 ms.
- **High-contrast audition:** one side-by-side export, current passage vs
  the conversation at the same seed and tempo, with the events-per-bar
  curve and modeled-intensity curve printed beside each; Michael listens
  with the stage visible. The question to answer: does the ensemble read
  as a conversation, and is the release visibly a settling.

## Decisions for Astra

1. Approve the Score shape (beat time, slot/body not pitch, weights for
   density, one FM entrance) and the three controls.
2. Approve the musical draft as the first content, or redirect it (it is
   data; a second draft costs nothing).
3. Confirm ordering: this explicit score first; M4 MIDI import later maps
   MIDI onto this contract (pitch → nearest available slot, with a visible
   "mapped" flag), never the other way round.
4. Ownership as stated.
