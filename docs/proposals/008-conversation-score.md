# Proposal 008 (rev. 2.2, approved by Astra 2026-11-01 with amendments a–g applied): "A conversation in three movements", the explicit score contract

*Fable, 2026-11-01. Rev. 2 applies Astra's review
(`collab/reviews/20261101T0238Z-astra-reviews-conversation-score.md`): all
seven corrections accepted. Contract and musical design; no implementation
until Astra confirms rev. 2. Fable owns `composeConversation`,
`validateScore`, `sectionAt`, `eventsPerBar` and the beat → compiler-event
adapter; Astra owns performance compilation, child Loom/FM attachment,
state/scene/UI/export/verifier. The legacy `createPerformance` route and
every v1/v2 artifact stay exactly as they are; the score is a new optional
route only.*

## What this is

An optional, deterministic **phrase score** that makes the existing
mechanisms sound and look like an ensemble: an opening sparse enough to see
anticipation, an exchange where a motif is answered across families with
one FM entrance at the turn, and a release that thins to natural decay. It
changes **which events are scheduled and when**; it never fakes visual
intensity, compresses time, or asks a fixed resonator to play a pitch it
does not have.

## Audit (corrected): what each family can actually play

| Family | Pitch | Simultaneity | Per event | Notes |
| --- | --- | --- | --- | --- |
| Garden (8 resonators) | fixed per slot: MIDI 48 51 55 58 60 63 67 70 | any slots together; repeats on a slot pile up | velocity | Keepers plan reach; reachability is proven by running the plan (see evidence), not by a gap rule |
| Tine (1) | fixed by geometry (default 192.99 Hz) | repeats pile up | velocity | pitch is a patch property |
| Bellows choir | **any positive pitch below Nyquist** (`noteOn(noteHz, …)`) | 6 chambers allocated chronologically by `planBellowsVoices`, stealing beyond | pitch, velocity, gate | the chamber a note breathes from is a plan result, not an authoring choice; `BELLOWS_NOTES` is the generator's palette, not a limit |
| Loom (2 bodies) | fixed by the composition | one system; strikes superpose | body, velocity | energy exchange is the expression |
| FM tensioner (1) | fixed by the composition | **one entrance per score** | entrance time | repeated/polyphonic FM excluded |
| Dampers | — | — | — | **not schedulable** today (no audio or state adapter); parked, see below |

Consequence: garden and tine melody is which slot speaks and when; bellows
is pitched, so the choir carries whatever pitches the composer writes
(the draft uses the minor-pentatonic pool of the garden so the answer is
consonant with the question, a musical choice stated as such).

## Contract: `Score` v1

```js
Score = {
  version: 1,
  seed: 731, tempo: 84,                 // BPM, integer 40–160
  beatsPerBar: 4, lead: 0.35,           // seconds of pre-roll before beat 0 (the stage's existing lead)
  controls: { density: 0.7, character: 'calm' },     // density 0–1; character 'calm' | 'bright' | 'restless'
  sections: [                            // half-open beat ranges, contiguous from 0; tail begins at the last end
    { id: 'opening',  beats: [0, 16],  cadence: 'anticipation' },
    { id: 'exchange', beats: [16, 48], cadence: 'answer', turnBeat: 32 },
    { id: 'release',  beats: [48, 64], cadence: 'settling' },
  ],
  hold: 8,                               // seconds of designed final hold after the last onset (extends, never trims)
  events: [                              // sorted by beat, then by input order
    { id: 'garden:opening:1',  family: 'garden',  beat: 0,  slot: 2, velocity: 0.7,  anchor: true },
    { id: 'garden:opening:4',  family: 'garden',  beat: 7,  slot: 2, velocity: 0.5,  weight: 0.5 },
    { id: 'tine:exchange:1',   family: 'tine',    beat: 16.5,         velocity: 0.6,  weight: 0.7 },
    { id: 'bellows:exchange:1',family: 'bellows', beat: 24, noteMidi: 55, velocity: 0.55, durationBeats: 1.5, weight: 0.6 },
    { id: 'loom:exchange:1',   family: 'loom',    beat: 25, body: 0, velocity: 0.6,  weight: 0.8 },
    { id: 'fm:exchange:turn',  family: 'fm',      beat: 32,                           anchor: true },
    { id: 'garden:release:4',  family: 'garden',  beat: 60, slot: 2, velocity: 0.45, anchor: true },
  ],
}
```

- **Time.** `seconds = lead + beat · 60 / tempo`. Tempo scales time
  uniformly and nothing else; the Score's tempo is authoritative (Astra's
  assembly replaces the patch tempo with it).
- **Anchors and density.** An event is either `anchor: true` (always
  scheduled; the skeleton) or carries `weight ∈ (0, 1]` and is scheduled
  iff `density > 0 ∧ weight ≥ 1 − density`. The two are exclusive on an
  event. Density thins by removing non-anchor events, never by shortening
  time or scaling levels; `density: 1` keeps everything, `density: 0` keeps
  anchors only. The skeleton is: opening motif notes 1–3, the exchange's
  returning motif, the Loom's entrance and its last strike, the FM turn,
  the final strike. Weights used: 0.35 (ornament), 0.5 (echo), 0.55
  (bellows), 0.6 (tine), 0.75 (Loom), 0.8 (inverted motif), so each step
  down in density removes one layer.
- **Character** selects a deterministic variant of voices on the same
  beats: calm (low slots, soft, long gates, central strikes), bright (upper
  slots, harder, short gates, near-tip strikes), restless (alternating
  registers, syncopated tine, low strikes).
- **Bellows** events carry `noteMidi` (integer 36–96) and `durationBeats`;
  the adapter converts to `noteHz = 440 · 2^((noteMidi − 69)/12)` and
  `noteOff = time + durationBeats · 60 / tempo`. Chamber allocation and
  stealing are the compiler's.
- **Loom** events carry `body ∈ {0, 1}`; **fm** has exactly one event with
  no parameters; both are handed to Astra's attachment path as overrides
  (`loomScore`, `fmTime`) when the composition enables those children, and
  dropped when it does not (the score plays without them, documented).
- **Sections** are half-open `[start, end)` beat ranges, contiguous from
  0. `sectionAt(score, t)` returns `{ id: 'pre-roll' }` for `t < lead`,
  the section for `lead ≤ t < lead + end·60/tempo`, and `{ id: 'tail' }`
  after the last section's end; within a section: `bar` (1-based),
  `beatInBar`, `progress01`, `cadence`.
- **Hold.** The passage's end is `max(lastOnsetSeconds + hold, last voice
  end)`: the hold extends a short decay, never trims a long one.
- **Position** (approved and implemented by Astra 2026-11-01): garden and
  tine events may carry a finite `position ∈ [0, 1]` (default
  `patch.strikePosition`); character variants use it (calm central, bright
  near the tip, restless low).
- **Loom anchors**: when the score has Loom events, at least one is an
  anchor (the draft anchors the entrance at beat 25 and the last strike at
  beat 49), so an enabled Loom has strikes at every density (Astra's
  attachment rejects an empty Loom list).
- **Validation** (`validateScore`): version 1; tempo, density, seed, lead
  bounds; sections contiguous, half-open, non-empty; ids unique and of the
  form `family:section:n` with the section containing the beat; family in
  the five names (garden, tine, bellows, loom, fm; dampers are not a family); slot 0–7, body 0–1, noteMidi 36–96, velocity (0, 1],
  durationBeats > 0; exactly one `fm`; `anchor` xor `weight`; at most 256
  candidate events and every onset and gate end within the compiler's
  120 s; unknown keys and coerced types rejected. **No
  reachability rule in the validator** (Astra's point 5): reachability is
  evidence from running the planner on authored presets, not a property
  the schema can promise.

## Pure functions (Fable)

```js
composeConversation({ seed = 731, tempo = 84, density = 0.7, character = 'calm' }) -> Score   // deterministic
validateScore(score) -> score                                                                   // throws
scheduledEvents(score) -> events after density thinning, sorted                                // pure
compileScoreEvents(score) -> { events: [{ id, family, time, velocity, slot | noteHz + noteOff }], loomScore, fmTime, holdUntil }
   // the compiler's input shape exactly (seconds, lead included); feeds Astra's createPerformanceFromEvents unchanged
sectionAt(score, t) -> { id, bar, beatInBar, progress01, cadence }
eventsPerBar(score, { scheduled = true }) -> number[]                                           // actual counts, excitations only
canonicalScore(score) -> string                                                                 // sorted keys, for links and manifests
```

One compiler: `compileScoreEvents` produces data only; all modes, voices,
planning and stealing happen in `createPerformanceFromEvents`.

## Parked (explicit next slices, not silent)

- **Scored dampers**: need a scheduled damping path in the audio adapters
  and a state change in `collectState`; both absent today. The first phrase
  uses fewer excitations and natural decay instead.
- **MIDI import** (M4) maps onto this contract later.

## Musical design (first draft; per-bar counts are computed by `eventsPerBar`, reported by the tests, never hand-written as acceptance)

16 bars at 84 BPM, beats 0–64 ≈ 45.7 s plus hold.

- **Opening [0, 16), anticipation.** Garden motif on slots 2, 4, 5 at beats
  0, 2, 5 (anchors) and a fourth note on slot 2 at beat 7 (weight 0.5);
  the motif repeats a fifth higher in bar 3 (slots 5, 7, 7→6, weights 0.6)
  and the tine answers once at beat 12.5 (weight 0.7). At least two beats
  between strikes on any one slot.
- **Exchange [16, 48), answer.** Bars 5–6: motif returns (anchors) with the
  tine on each off-beat (weights 0.7). Bars 7–8: bellows answer on the
  motif's pitches (MIDI 55, 60, 63) with 1.5-beat gates (weights 0.6).
  From bar 7: Loom strikes alternating bodies on odd beats (weights 0.8).
  **Beat 32, bar 9 beat 1: the one FM entrance** (anchor). Bars 9–12: the
  motif inverted in the upper slots (7, 5, 4) over continuing Loom
  exchanges, bellows sustaining a long low gate (MIDI 48, 4 beats, weight
  0.6).
- **Release [48, 64), settling.** Bar 13: last Loom strike (anchor) and last
  bellows gate. Bar 14: two garden notes. Bar 15: one tine. Bar 16, beat
  60: the final garden strike (anchor). Then the 8 s hold: no onsets, natural decay.

## Inspectability

`sectionAt` feeds `StateFrame.global.score = { section, bar, beat,
progress01, cadence }` (Astra wires it), so the caption names the movement,
the director weights attention by cadence, and the inspector shows each
strike's event id, section and anchor/weight. The canonical score string
travels in links and manifests like the composition, so an export is
reproducible from its link and the verifier rebuilds the same events.

## Acceptance evidence (each a test or a labeled measurement)

- **Determinism:** identical canonical Score and identical compiled events
  for identical inputs; `scheduled(density a) ⊆ scheduled(density b)` for
  `a ≤ b`; anchors present at every density.
- **Reachability:** for the authored preset grid (3 characters × density
  {0, 0.5, 0.7, 1} × seeds {731, 1, 2}), `planPerformers` reports 0
  unplanned events for garden and tine (the actual plan, not a gap rule).
- **Anticipation:** in the opening, each garden strike's approach window
  (0.18 s before contact) contains no other scheduled onset on any family,
  computed from the compiled events.
- **Settling:** `eventsPerBar` non-increasing across the release; no
  scheduled onset in `(lastOnset, lastOnset + hold]`; every compiled voice
  end ≤ passage end (each model at or past its natural end); rendered
  audio in the final 0.5 s below −60 dBFS peak. Plots label exactly what
  they include: `out.modeledIntensity` (garden + tine + bellows only);
  Loom and FM shown on their own frames' amplitudes. No monotonic
  combined-intensity claim (coherent Loom beating can raise a local
  envelope while energy decays).
- **Family limits:** validator rejects a second `fm`, an out-of-range slot
  or body, `noteMidi` outside 36–96, `anchor` with `weight`.
- **Legacy untouched:** the default route's manifests remain 1007/1007
  (already shown by the compiler slice; re-asserted after the score lands).
- **High-contrast audition:** one side-by-side export, the legacy passage
  vs the conversation at seed 731 / 84 BPM, each with its events-per-bar
  curve and the labeled intensity plots. The question for Michael: does
  the ensemble read as a conversation, and does the release read as
  settling.

## Decisions for Astra (rev. 2)

1. Confirm the schema above (anchors xor weights, pitched bellows via
   `noteMidi`, half-open sections, hold semantics, `compileScoreEvents`
   output shape as your compiler's input plus `loomScore`/`fmTime`/`holdUntil`).
2. Confirm the overrides on your attachment path (`loomScore`, `fmTime`),
   defaults unchanged when absent.
3. Confirm the parked list (dampers only now; position is in).
4. On confirmation, Fable implements `src/score/conversation.js` with tests
   (pure, dependency-free), nothing else.
