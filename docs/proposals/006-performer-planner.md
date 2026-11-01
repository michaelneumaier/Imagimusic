# Proposal 006: Performer planner

*Fable, 2026-11-01, at Astra's request. Contract plus a first pure
implementation in `src/perform/planner.js` with tests. Astra owns the scene
side (actor bodies, bindings to actor poses, integration into
projection/world).*

## What a performer is, and is not

The sound is made by the exciters we already have: the per-slot striker
whose contact lands exactly on the audible onset (`strikerPose`), the
bellows that squeezes on attack. Those stay as they are; their timing is the
ground truth and this proposal does not touch it.

A **performer** is the visible actor that *carries* the exciter: the arm or
rail that moves a mallet from slot to slot, the pumper that works a
bellows. It explains *why a striker is at that slot at that moment*. It is
not a conductor waving in time; if an actor cannot reach a slot in time, the
plan says so (`unplanned`) and the striker still fires, because the sound is
not the actor's to cancel. Dishonesty would be an actor that pretends to
cause a sound it could not have reached.

The creative consequence (from VISION): **the music decides the anatomy.**
A dense passage needs more arms. The planner spawns actors only when the
score forces it, up to a configured maximum, so the number of limbs you see
is a fact about the phrase.

## Contract: `src/perform/planner.js` (pure, deterministic, time-indexed)

```js
planPerformers(events, {          // events: { id, slot, noteOn, position?, velocity? }
  family,                   // 'garden' | 'tine' | 'bellows' (one plan per family)
  slots,                    // number of slots this family has (positions 0..slots-1 along the rail)
  approach = 0.18,          // seconds the exciter needs before contact (must match the striker's approach)
  recover = 0.28,           // full recovery after contact when the actor has time
  minRecover = 0.06,        // least recovery before the same actor may begin the next approach on the same slot
  speedSlotsPerSecond = 6,  // travel speed along the rail, in slot widths per second
  maxActors = 6,            // spawn limit; beyond it events are marked unplanned
  restSlot = (slots - 1) / 2,
})
-> {
  family,
  actors: [{ id, restSlot, assignments: [{ eventId, slot, noteOn, arriveBy, leaveAt, approach, truncated, position?, velocity? }] }],
  unplanned: [{ eventId, slot, noteOn, reason: 'no-actor' }],
  meta: { approach, recover, minRecover, speedSlotsPerSecond, maxActors, restSlot, slots, events: n },
}

actorPose(plan, actorId, t) -> {
  slot,                         // fractional rail position at t (linear travel between slots)
  phase: 'rest' | 'travel' | 'approach' | 'contact' | 'recover',
  progress01,                   // progress within the phase
  eventId | null,               // the assignment being served, if any
  truncated?,                   // during recover: true when a quick same-slot repeat shortened this recovery
}

performerFrame(plans, t) -> { performers: [{ id, family, ...actorPose }] }  // fragment for StateFrame.global
```

Rules:
- Events are sorted by `noteOn`; assignment is greedy and deterministic:
  the actor with the **earliest feasible arrival** that can reach
  `slot` by `noteOn − approach` takes the event; ties go to the lowest id.
- An actor is busy from `arriveBy` until `noteOn + recover`; an actor that
  is already at a slot may serve repeated notes on it without travel.
- An actor already at the slot may serve a quick repeat before its full
  recovery has elapsed, provided at least `minRecover` has passed since its
  contact; the previous assignment's `leaveAt` is then truncated to the new
  approach start and marked `truncated`, so the picture shows a shortened
  recovery, never a skipped one. A repeat sooner than `minRecover` goes to
  another actor.
- If no existing actor can arrive in time and `actors.length < maxActors`,
  a new actor is spawned. Performers take their places before the music
  starts: the new actor rests at the shared rest slot if it can reach its
  first note from there in time, otherwise it is already standing at that
  slot. If the limit is hit, the event is `unplanned` with
  `reason: 'no-actor'`; the sound is unaffected.
- Between assignments an actor waits at its last slot (musicians don't run
  home between every note); there is no return-to-rest travel.
- Poses are a pure function of `t` and the plan: no accumulators, so seeks
  and offline renders agree (decision 002).

## How poses feed existing strikers and bellows

The per-slot striker keeps producing contact exactly at `noteOn`. The actor
body is a separate scene object (rail + arm) whose **hand position** is
bound to `actorPose.slot` (where along the rail) and whose **arm extension**
is bound to the phase: `approach`/`contact`/`recover` reuse the striker's
reach curve so hand and mallet coincide at contact; `travel` and `rest`
retract. The mallet mesh can simply parent to the hand when the actor is
serving that slot, or stay per-slot with the hand arriving behind it; either
keeps contact timing untouched because contact is still `strikerPose`.
Bellows: one pumper per chamber for now (no travel), its pose bound to
`bellows.fill01`; a shared pumper rail is a later option using the same
planner with `family: 'bellows'`.

Bindings (data, as always):

```
performer/garden/actorN   railSlot ← global.performers[id=garden/N].slot      inputs: ['tempo', 'seed']   label: interpreted
performer/garden/actorN   extend   ← global.performers[id=garden/N].progress01 (phase-gated in the map)
```

Caption: "Arms carry mallets between resonators; contact timing comes from
the planned strike, not from the arm. An arm that could not reach a note is
shown resting and the note is marked unplanned."

## Tests (in `tests/planner.test.js`)

- A single slow melody needs one actor; every assignment arrives before
  `noteOn − approach` and leaves after `noteOn + recover`.
- Two simultaneous notes on distant slots need two actors; a third within
  the recover window needs a third.
- With `maxActors: 1` and an unreachable jump, the event is `unplanned`
  with `reason: 'no-actor'` and nothing else changes; a first note too early
  to walk to is served from position.
- Poses: at `noteOn` the phase is `contact` and `slot` equals the event
  slot; during travel `slot` moves linearly at the configured speed; at
  `t = 0` every actor rests at `restSlot`; evaluation order does not change
  results (time-translation and shuffle tests as in dynamics).
- The default Conservatory passage needs exactly 5 garden actors with 0
  unplanned events, and 4 leaves one note unplanned (a fact about the
  phrase, pinned so a future tempo or seed change that alters it is noticed).

## Decisions for Astra

1. Approve the contract and the greedy policy (vs. an optimal assignment,
   which is overkill until a phrase needs it).
2. Where the arm meets the mallet: parent the mallet to the hand, or hand
   follows mallet. I recommend the latter for the first slice (zero risk to
   contact timing).
3. `maxActors` default (6), `minRecover` (0.06 s), and travel speed (6 slots/s): tune by eye.
