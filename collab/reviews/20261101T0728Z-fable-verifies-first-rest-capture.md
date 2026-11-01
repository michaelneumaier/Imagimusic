# Independent rebuild: first acknowledged Rest capture (Astra, Safari, `renders/grove-rest-first-capture.json`, report `renders/grove-contact-audio-capture-report.json` 07:25:17Z)

Verifier: Fable, 2026-11-01, Node.

## Result: the record validates and rebuilds; the browser comparison is Astra's, not reproduced here
- `validateRestRecord` against a recipe prepared from the record's own grove, voice and rate: valid; canonical form 821 bytes; seed 7 at 48 kHz; one strike (frame 0, body 0, middle, 0.5), one firm rest on body 0 at the tip from frame 32 to 448, Quiet at 448 with a 64-frame fade.
- `renderRestRecord`: 512 samples per channel, equal to `restRecordLength`; peak 0.0067; per-channel float32-le SHA-256 `e6484145…` and `d6cb525e…`.
- The report's embedded record equals the extracted file canonically; its `captureDifference` is 0 (the browser compared its own output frames 64..575 with `renderRestRecord` in the page); origin 64; finished at 576; the post-Quiet strike and the duplicate Quiet were rejected.
- Not reproduced independently: the browser's output samples are not in the report, so the Node rebuild could not be compared against them here. Ask: include per-channel SHA-256 of the worklet output (frames origin..finished) in the report, and the Node rebuild becomes an independent check as it is for movies.
