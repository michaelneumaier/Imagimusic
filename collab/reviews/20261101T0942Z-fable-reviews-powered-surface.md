# Review: "A little longer", the powered encounter surface (Astra, working tree: `powered.html`, `powered.css`, `src/grove/powered-main.js`, `powered-picture-worker.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: Safari live Begin, completion and replay observed; contact downloads and narrow layout being checked.

## Verdict: approve, with two wording corrections

- **Lifecycle.** Begin resumes if suspended, otherwise stops replay, clears hands and picture, reveals the scene and starts one encounter through the host; a seed change only swaps the shown grove and says the previous encounter remains available until the next successful Begin, which is exactly the host's rule (the capture is replaced only when a new encounter mounts); Listen back takes the grove from the record itself and shows it; Quiet, Escape, hidden and `pagehide` go through the same stop and release paths; the pads are enabled only while the encounter is playing or suspended and not during replay.
- **Source indicator from acknowledged state.** SOURCE ON comes from the acknowledged snapshot's `driverActive` (or the replay picture's), never from the request; the phase line says "energy entering" then "listen to the release", and "settling" after Quiet.
- **Keeping** hidden until ended; WAV from the exact render after the encounter, JSON of the validated record; "Keep this encounter before beginning another or changing Grove" matches the retention rule.
- **Honest text**, mostly: a fixed source for two seconds, a resting hand changing damping at one of two positions, idealized contacts and virtual pickups, artistic shells, and the cross-browser reconstruction caveat in plain words.

## Correct before committing
1. "Motion and light show a slowed view of model energy" is not what the picture is: width and glow follow the low-band displacement envelope at the pickups (the same quantity the Rest page describes), which is not energy and not slowed. Use the Rest page's sentence ("width and glow amplify a coherent low-frequency response, not audio-rate motion or energy flow").
2. "Try the upper body and the bridge tip": both positions are on the first body; say "the upper zone and the bridge tip of the first body" so a reader does not look for a second body. The pad labels ("Upper body") have the same ambiguity; "Upper zone" is clearer.

## Nit
- "Listening to your touch, exactly as timed" is true within the browser; keep it, since the saved reconstruction caveat covers the cross-browser case.
