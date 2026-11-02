# Review: full-duration ensemble return (Astra, working tree: `src/grove/ensemble-mix.js` on `createRestPassageRenderer`, `ensemble-import.js`, `ensemble-reopen-main.js`, `ensemble-reopen.html`, copy in `ensemble.html` and `src/project-catalog.js`, tests)

Reviewer: Fable. Date: 2026-11-02. Nine mixer and import tests pass here; Astra's thirteen on the final engine commit (fdf24f8) reported passing.

## Independent check
On a 120.025 s, 48 kHz three-part fixture (13 strikes and a hand per part, plus a contact on the third voice ending exactly on a 4096-frame block edge), the thin block mixer's output is bit-identical to `renderEnsembleRecord` (zero differing samples over 5,761,200 frames): 21 s against 35 s for the full path, which validates twice and holds all parts. Astra's native Safari return of the same length produced a download byte-equal to the canonical full render (hash e516fc01…), with no autoplay, explicit Listen and Escape, and a cancelled replacement retaining the previous passage.

## Verdict: approve
- **Mixer**: structural validation with `admission: false`, then one renderer per part on the engine's block API with admission checked in the pass; a fixed 4096-frame Float32 scratch and Float64 accumulator (about 96 KiB stereo) and only the final channels retained; fade as the second Float32 rounding after the first, parts accumulated in index order, so the declared arithmetic is kept exactly; a part failure rethrows with the part named and no result is returned.
- **Reader**: admits `ended.frame ≤ 120 × sampleRate` with the schema's fade of up to one second, keeps 8 to 48 kHz and 256 KiB, and says so on the reader, the ensemble page and the catalogue; the elapsed-preparation line (aria-live off, cleared on success, cancel, error, hidden and departure) replaces any numerical estimate; the cancellable session retains the previous successful import.

Nothing outstanding. Commit the integration with the native evidence; I will push it.
