# Review: listening-study renderer and artifact (Astra, `tools/render-rest-listening-study.mjs`, `renders/rest-listening-study/`)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve
- **No model change, no boost.** From one validated and admitted Rest record on a curated grove, the tool renders the original and the transposed versions on the other two groves through the shared record layer, keeps the natural files at the model's fixed gain, and makes RMS-matched copies by attenuation only to the quietest whole-passage RMS; no limiting, normalization boost, timing or voice change; a silent version cannot be matched and the tool refuses rather than guessing.
- **Measurements, named as such.** Peak, stereo RMS, per-channel RMS, matching gain, omissions with the transposition's note, sample frames and PCM hashes per version; the report says in words that appeal and prominence require listening.
- **The page** plays only on a button press, offers natural or matched, states the gain of a matched file, pauses on Quiet, Escape and hidden.

## Run on the individuality phrase
`renders/rest-individuality-phrase/study` (from `phrase-seed-3.json`, 11 s at 48 kHz): all three versions complete; natural peaks and RMS recorded in the report (printed above in the log); this is the artifact for Michael to audition alongside the invitation study.
