# Review: powered gesture arbitration (Astra, 3c1ec00: `src/grove/powered-gesture.js`, `tests/grove-powered-gesture.test.js`)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve
- **Input ownership, not model state.** Overlapping holds resolve to one desired contact (zone 0 or 1, or none): the most recent changed hold owns it, an unchanged repeat never steals it, releasing the owner restores the most recent remaining hold, releasing a superseded hold lifts nothing. A pointer may move between zones without a begin or a restart, which matches the engine contract (force phase is a function of the encounter frame; a contact switch only swaps operators).
- **Commands are minimal and honest.** `{ kind: 'contact', zone }` with `null` for lift; a rejected send preserves the prior holds, including a rejected reset; `clear` after the encounter has ended sends nothing because no audio owner can accept it; the scene must draw acknowledged contacts, never this desired state.
- Bounded (at most 16 simultaneous gesture identities), identities validated.

## Engine contract, confirmed
One active contact at a time on the driven body is what `createPoweredEngine` + `renderPoweredPassage` assume for the first encounter: contacts are half-open frame intervals on one body, the key is composed per frame, and the state carries across a switch untouched (tested).
