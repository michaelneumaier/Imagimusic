# Review: comparison UI and separate film controls (Astra, working tree: `src/grove/rest-main.js`, `rest.html`, `rest.css`, `movie-controls.js` prefix)

Reviewer: Fable. Date: 2026-11-01. Astra: browser verification starting.

## Verdict: approve

- **Explicit target, after Quiet only.** The selector offers a placeholder and the other two curated seeds, enabled only for a finished capture with strikes; nothing is chosen automatically and nothing plays on entering the page.
- **One replay source, two pictures.** `playComparison` prepares (or reuses an existing result) and hands the replay a deferred PCM; on resolution the view switches to the target record's grove and picture (`comparisonView`, `showGrove`), and `stopReplay` restores the original scene and cancels pending preparation; `draw` takes the picture and the zones from the comparison record while the view is active. The identity line reads "GROVE N · COMPARISON".
- **The original is never touched.** The comparison has its own status, caption, play, save sound, save gestures and film controls; the host record remains the original's; new passage and seed change clear the comparison; failure or cancel keeps the previous result; an unavailable result (no strike survived) is shown through its own note and never played as the passage.
- **Film snapshot identity.** The comparison film's source is the comparison record and the worker's exact PCM for it, taken synchronously, with the camera pose from the current view; the plan rebuilds the recipe from that record, so the manifest's capture is the comparison with the target grove and the verifier will rebuild it; the DOM prefix keeps the original's film controls and links intact; filenames `comparison-<source>-to-<target>-…` and the caption prefix name both seeds; the caption names the result's own target even if the selector changes.
- **Words.** "Carry the gesture. Your timing and hands, on a different Grove." and the result's note verbatim: honest and specific.

## Nit
- `draw` builds the hold and position arrays from the original `grove.bodies` while the scene is the target's; both have three bodies today, but index by the shown grove (`shownGrove.bodies`) so a future grove with a different body count cannot misalign.

## Independent verification of the first comparison film (`renders/rest-comparison-first-play`, 2026-11-01)
`tools/verify-grove-movie.mjs manifest.json movie.mp4 film.wav`: VERIFIED (manifest, soundtrack and container): 7 frame hashes equal; 9648 samples (0.201 s), video 0.2333 s; per-channel source hashes 7627f687… / d6473417… equal to the Node rebuild of the comparison record; WAV hash and the 38,636-byte file equal; h264 1280×720 30/1 with 7 frames; aac stereo 48 kHz within the allowance; decoded AAC lag 0, SNR 40.8 dB. Cross-checks from the bundle alone: the original record before and after is byte-identical; the manifest's capture equals comparison.json canonically; transposing original-before.json onto seed 7 in Node gives exactly comparison.json (kept 1 of 1, "every gesture carried over."); comparison.wav equals film.wav byte for byte and equals the Node rebuild. Astra's browser observations (scene swapped to seed 7 and restored, selector change not altering the result's caption, a cancelled seed-11 preparation leaving the seed-7 result) are theirs; the data in the bundle is consistent with them.

## Addendum: film previews join the single-source rule (approve)
`bindGroveMovieControls` takes an optional `onPreviewPlay` (default no-op, listener removed on dispose). On Rest, `stopReplay` pauses both film previews by default; a preview's own play callback stops replay with `pauseFilms: false` and pauses only the other preview, so it never stops itself. Result: replay, the comparison and the two films can never sound together; capture and export ownership unchanged.

## Addendum 2: Quiet while a film plays; comparison film cleared with the comparison (approve)
`filmsPlaying()` now takes part in Quiet's availability, and Quiet or Escape pause the previews through `stopReplay`; preview pause and ended events resync availability. `clearComparison` calls the comparison movie's new `clear()` (abort pending, release old URLs) so a new original passage can never show a previous comparison's film under a new result; a cancelled preparation still keeps the previous film. Both close real gaps in the single-source promise; no model, capture or export change.
