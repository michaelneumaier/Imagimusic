# Independent rebuild: first acknowledged Rest capture (Astra, Safari, `renders/grove-rest-first-capture.json`, report `renders/grove-contact-audio-capture-report.json` 07:25:17Z)

Verifier: Fable, 2026-11-01, Node.

## Result: the record validates and rebuilds; the browser comparison is Astra's, not reproduced here
- `validateRestRecord` against a recipe prepared from the record's own grove, voice and rate: valid; canonical form 821 bytes; seed 7 at 48 kHz; one strike (frame 0, body 0, middle, 0.5), one firm rest on body 0 at the tip from frame 32 to 448, Quiet at 448 with a 64-frame fade.
- `renderRestRecord`: 512 samples per channel, equal to `restRecordLength`; peak 0.0067; per-channel float32-le SHA-256 `e6484145…` and `d6cb525e…`.
- The report's embedded record equals the extracted file canonically; its `captureDifference` is 0 (the browser compared its own output frames 64..575 with `renderRestRecord` in the page); origin 64; finished at 576; the post-Quiet strike and the duplicate Quiet were rejected.
- Not reproduced independently: the browser's output samples are not in the report, so the Node rebuild could not be compared against them here. Ask: include per-channel SHA-256 of the worklet output (frames origin..finished) in the report, and the Node rebuild becomes an independent check as it is for movies.

## Independent comparison (after Astra added output hashes, report 07:31:01Z)
`renders/grove-contact-audio-hashes-report.json` carries per-channel float32-le SHA-256 of the actual OfflineAudioContext worklet output, frames 64..575, for the acknowledged v2 capture: `e64841454c87…` / `d6cb525e5add…`. The Node rebuild of the embedded record through `createGroveRestRecipe` + `renderRestRecord` gives the same two full hashes. So the worklet's heard samples and the record's exact rebuild are identical bytes, established without relying on the page's own comparison.

`renders/grove-contact-live-report.json` (real AudioContext at 48 kHz: one strike late by 384 frames, a held contact, release, Quiet at 36992 with a 1200-frame fade; 38192 frames per channel): its audio hashes `1ea8dfbc14ac…` / `68a0bdc8f049…` equal the Node rebuild of its record. Those hashes are of the host's saved render (the shared renderer in a worker), not of a loopback of the live output, so this shows the saved audio is the record's exact rebuild; it does not measure speaker output, device latency or dropouts, which Astra also does not claim.

## Rest page artifacts (Astra 4f2676b, 2026-11-01)
- `renders/rest-invitation-first-play/capture.json`: validates; canonically equal to `restInvitationRecord(recipe, composeRestInvitation(recipe))` for seed 3 at 48 kHz (6 strikes, 3 rests, Quiet at frame 960000 = 20 s with a 1200-frame fade), i.e. every invitation command was acknowledged exactly when requested. `sound.wav` (3,844,844 bytes) is byte-equal to the Node rebuild `stereoWav(renderRestRecord(capture, recipe))`.
- `renders/rest-manual-first-capture.json` (a real manual passage: strike A, hold J, strike S, Escape): validates; two strikes at frames 0 and 32896 (bodies 0 and 1, middle, 0.55), one firm rest on body 0 at the middle from 384 to 32128, Quiet at 33024 with a 1200-frame fade; rebuilds to 34224 frames per channel, peak 0.0158.
