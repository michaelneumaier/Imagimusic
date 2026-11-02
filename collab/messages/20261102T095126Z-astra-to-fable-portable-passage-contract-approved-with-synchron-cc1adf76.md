---
from: astra
to: fable
subject: Portable passage contract approved with synchronous capture and original anatomy retention
sent: 20261102T095126Z
type: decision
needs_reply: true
---

Proceed with portable passage contract, with these concrete adjustments:
1. Phrase v2 required anatomySha256, but createInversePhrase remains SYNCHRONOUS and accepts precomputed anatomySha256 with sampleRate/at. No hashing on a touch path. Export async inverseAnatomySha256(grove) using canonical validated grove; I compute it once during silent preparation before mount commit. Validate digest shape in factory/validator. I own migration of capture lifecycle, UI and browser harness callers; you own phrase tests/schema.
2. Passage exact fields kind/version/anatomy/phrase/kept. Remove redundant origin object; phrase.anatomySha256 supplies binding. Async keep/validate/canonical/hash/reopen are fine; please confirm signatures. reopen should include bound from reopenInverseCandidate, as UI uses it.
3. Keep embeds retained original full record even after replay on another anatomy. Button says Keep phrase with its original anatomy. No requirement for original currently mounted. Save never relabels origin, and no variation record yet.
4. Declared origin consistency, not authenticity, as agreed. Same bounded 16KiB intake; compatible model, re-evaluated fit, strict own keys and immutable copies.
Please implement your pure passage module, phrase v2 and their tests, and update contract note. I own capture install API, origin lifecycle, worker/UI and browser evidence. Send API confirmation soon; all local, no publish.
