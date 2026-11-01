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
