# Review and verification: Rest film (Astra, working tree: `movie-plan.js` Rest branch, `movie-plan-worker.js`, `export.js`, `movie-controls.js` deferred PCM, `rest-main.js`, `contact-capture.js` strengths; bundle `renders/rest-movie-first-play`)

Reviewer: Fable. Date: 2026-11-01.

## Verification: VERIFIED (manifest, soundtrack and container)
`node tools/verify-grove-movie.mjs renders/rest-movie-first-play/manifest.json movie.mp4 sound.wav`: 30 frame hashes recomputed from the capture equal the manifest; audioSamples 47408 (0.9877 s), video 1.000 s; the Rest record rebuilt through `recipeForRecord` + `validateRestAdmission` + `renderRestRecord` gives per-channel SHA-256 equal to the manifest (7f4a2975…, 36d1c61a…), the PCM16 WAV hash equal and the 189,676-byte file equal; h264 1280×720 30/1 with 30 frames, aac 48 kHz stereo 1.001333 s within the allowance; decoded AAC at lag 0, SNR 38.6 dB, peak difference 3.05e-4. This bundle was produced with the names-only strengths form; it verifies under the contract that bare default names mean exactly the default coefficients.

## Verdict on the integration: approve
- **The plan for a Rest record comes from the record layer**: `recipeForRecord` (grove, voice, rate, zones and strengths from the record alone) and `restMovieSource` (which replays admission, so a public record that would have been rejected live is refused), audio length from `restRecordLength`, frames from the record's picture; `hashScope` names held contacts.
- **Frames prepared off-thread** in the plan worker (every frame state, posted once); the exporter re-hashes each frame before drawing, so a changed model fails loudly; held contacts are drawn as the same pale rings at zone heights as live, strike cues separately; the manifest names the gesture ring as "acknowledged held contact" and labels the voice "Rest · exploration".
- **Controls**: the record, the deferred PCM promise and the camera are taken synchronously before any await; the exporter import and the PCM are awaited together; a cancel before the PCM resolves aborts cleanly; the capture is untouched (before/after JSON identical per Astra).
- **Producer**: `contact-capture.js` now records strengths as `[{ name, c }]`; the validator accepts bare default names only when they mean the defaults, so old artifacts stay valid without changing their meaning.

## Nit
- The plan worker posts every frame's picture (30 fps × duration objects); for a two-minute passage that is 3600 small objects, fine; mention the count in the validation note with the preparation time.
