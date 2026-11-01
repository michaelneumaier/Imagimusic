# Review: powered capture adapter (Astra, working tree: `src/grove/powered-capture.js`, `tests/grove-powered-capture.test.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: four capture and six processor tests pass, including both reconstructed heard channels.

## Verdict: approve
- **Actual history only.** The origin comes from the `started` message; every `processed` acknowledgement must be the next in order, with absolute, requested and relative frames consistent and the id unique; rejections are counted and not recorded; an accepted contact after Quiet is a failure; a failure poisons the capture so nothing incomplete can ever save.
- **Contacts are intervals at actual frames.** A switch closes the held interval and opens the next; Quiet closes it; zero-length holds are dropped as the validator requires; only the driven body is ever recorded, which is the first encounter's contract.
- **The source is checked, not copied.** `finished` must carry the origin, the ending plus fade, and a driver equal to the planned one truncated at the actual Quiet (`forcedFrames = min(planned, quietFrame)`), compared field by field including the rotation constants; a 0- or 1-frame source is valid silence.
- **Only completed v2 records save**, through `validatePoweredRecord` against the recipe.

## Nit
- The held contact is written with `strength: 0`, which is right for the encounter recipe (one coefficient, c = 1) but brittle if a recipe ever carries more; derive the index from the recipe's strength list by name (`c1`) so the record cannot silently point at a different coefficient.
