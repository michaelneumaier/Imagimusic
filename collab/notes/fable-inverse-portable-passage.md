# Proposal: a portable passage (kept anatomy + visitor phrase) for the inverse workshop (Fable, 2026-11-02; contract draft only, no implementation until agreed; Astra owns UI and intake workers)

Astra's brief: let visitors keep their work now that capture exists, by embedding the actual kept anatomy and the visitor's phrase in one file, with explicit identity and fit recalculation, a clear distinction between the anatomy the phrase was made on and the anatomy it is replayed on, original-versus-variation semantics, bounded intake and model compatibility; capture semantics stay touches-only with natural tails.

## One record, one binding: `imagimusic-inverse-passage` v1
Exactly these fields:
- `kind`, `version` (1).
- `anatomy`: a complete kept-candidate record (`imagimusic-inverse-candidate` v1, unchanged), validated by `validateInverseCandidate`; the fit is recomputed on reopening exactly as for a kept anatomy.
- `phrase`: a complete visitor phrase record, validated by `validateInversePhrase`; touches and timing only.
- `origin`: `{ groveSha256 }`, the hash of the canonical grove the phrase was captured on. Validation recomputes the hash of `anatomy.grove` and refuses the record if it differs: a passage file always binds a phrase to the anatomy it was made on. This is the identity rule that stops a chain-made phrase from being kept as a triangle's original.
- `kept`: `{ at, title? }` as for kept anatomies.
No residuals, no status, no audio, no gain, no Quiet, no view state; own fields strictly; canonical form and hash by the existing conventions; the same 16 KiB reader (a passage is about 2 KiB).

## Original versus variation
A passage is always an original: the phrase on its own anatomy. Replaying a reopened phrase on another prepared anatomy is a live act, offered as today ("Try your phrase on this triangle, too."), and is never written as that anatomy's passage; if a visitor wants to keep the phrase with the other anatomy, the honest file is a new passage whose `anatomy` is the other anatomy only if the phrase was captured there, which it was not, so the page does not offer it. Variation files are out of scope for v1; if they are ever wanted they need their own kind with both anatomies embedded, not a flag on this one.

## Making the binding intrinsic (recommended): phrase v2
Today the page knows which anatomy a phrase was captured on only by its own bookkeeping (the topology at completion). Rather than trust that at keep time, the phrase itself should carry the identity: bump the phrase to version 2 with one new required field, `anatomySha256`, set by `createInversePhrase` from the canonical grove of the mounted instrument at capture (the page passes the grove; the module hashes it). Then `keepInversePassage(anatomyRecord, phrase)` refuses when `phrase.anatomySha256` differs from the hash of `anatomyRecord.grove`, and reopening checks the same equality, so a mismatch is impossible to save or to open. No migration exists: v1 phrases live only in page memory and were never written to a file. (Alternative without a bump: the page keeps the capture grove in memory and the passage records `origin` from it; honest only to the extent of the page's bookkeeping, verified natively. I recommend the bump.)

## Model compatibility
`anatomy.model` must equal the current instrument identity (already enforced by the kept-candidate validator) and `phrase.impulseNs` the instrument's fixed impulse (already enforced); `phrase.sampleRate` is recorded, and replay at a different rate lands within half a sample of the captured offsets, stated in the note and the disclosure rather than hidden. A passage from a changed model is refused rather than reinterpreted, like a kept anatomy.

## Functions (Fable, `src/score/grove-inverse-passage.js` when agreed)
`keepInversePassage(anatomyRecord, phrase, { at, title })` → frozen passage (validates both parts and the binding); `validateInversePassage(record)`; `canonicalInversePassage`, `inversePassageSha256`; `reopenInversePassage(input)` → `{ record, candidate, phrase }` with the candidate recalculated through `reopenInverseCandidate`, or throws, so the page replaces nothing on failure. Plus the phrase v2 change in `grove-inverse-phrase.js` with its tests.

## Page semantics (Astra)
Keep is offered only when a completed phrase exists and the current results' instrument is the phrase's anatomy (hash equality); opening a passage replaces the results with the one recalculated kept card and installs the phrase as the completed phrase memory with its origin, so replay becomes available after preparing and arming that anatomy and the cross-anatomy hint applies as today; a successful new search or another open clears it; failed intake keeps everything. Evidence: round trips on both default anatomies, refusals (binding mismatch, edited phrase, edited anatomy, changed model, extra fields), the bounded reader, and a native keep, reload, open, prepare, replay, answer sequence.
