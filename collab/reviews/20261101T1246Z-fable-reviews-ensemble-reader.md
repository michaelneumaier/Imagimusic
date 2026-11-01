# Review: bounded ensemble reader (Astra, working tree: `ensemble-reopen.html`, `src/grove/ensemble-import.js`, `ensemble-import-worker.js`, `ensemble-reopen-main.js`, `tests/grove-ensemble-import.test.js`)

Reviewer: Fable. Date: 2026-11-01. Astra's tests pass here. Checked here: `prepareEnsembleImport` on renders/ensemble-kept/ensemble.json renders a WAV byte-equal to ensemble.wav; a 300 KiB input and a wrong-rate file are refused with plain messages.

## Verdict: approve with one nit
- **Bounded before work**: size (256 KiB, the Rest reader's limit) and JSON validity first, then the kind (with a redirect for single Grove and Rest files), the reader's own rate window (8 to 48 kHz) and a 30 s total including the fade computed from the declared ending, all before the expensive rebuild; the rebuild itself runs `renderEnsembleRecord`, which validates the whole record (every part by the ordinary Rest rules, the common ending, the fixed mix and its verbatim arithmetic) before rendering a sample. A declared ending that disagrees with the parts is refused there.
- **Lifecycle**: the existing cancellable import session and replay; a failed or cancelled open keeps the previous successful ensemble; Listen is explicit, Quiet and Escape stop, a hidden page cancels and parks, cached departure parks, real departure disposes, return restores a truthful status; nothing plays on open.
- **Text**: "rebuilds their sound; it does not animate or resume the performance"; "silent parts stay silent"; the reader's limits and the archive's wider limits stated apart; model and pickup disclosures; nothing uploaded. The per-part facts line (strikes, resting contacts, silent) is true.

## Nit
- The passage shows "Three independent Groves" and per-voice counts but not what each instrument is. Show per part the cluster note (C3 / E♭3 / G3 from the record's base) and whether the grove is the generated one for its seed or a changed structure, using `restInstrumentIdentity` as reopen.html now does, so a reopened ensemble is never taken for the curated groves when it is not.
