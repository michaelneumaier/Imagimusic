# Saved ensemble reader — November 1, 2026

Local route: `/ensemble-reopen.html`, linked in the project catalog and from
the single-Grove reader. Explicit file choice, cancellable worker reconstruction,
Listen/Quiet, sound download. No automatic audio, upload, storage, 3D animation
or recording resumption. Limits: 256 KiB UTF-8 JSON, ensemble v1, 8–48 kHz,
30 seconds including the fade; archival schema limits remain broader.

Reuses the tested import session and replay lifecycle. Previous successful
results survive failed/cancelled replacements. Hidden-page transitions cancel
opening and park audio; return requires explicit Listen. All model validation
and conservative admission are delegated to the canonical ensemble renderer.

Nine focused import/session tests pass, including PCM identity, reader bounds,
tampered configuration, superseded workers and failure retention. Safari at
320×656 opened the actual `renders/ensemble-kept/ensemble.json`, reported
10.03 seconds/48 kHz, and stayed ready until Listen. Explicit Listen changed to
Listening. Escape stopped playback and disabled Quiet. The downloaded
`~/Downloads/imagimusic-ensemble.wav` equals the kept WAV and original captured
WAV byte for byte: SHA-256
`f072c1b27537538714f514735f3d2099496862e499e29e7f142a520444d0fee8`.
Phone layout inspected visually. This verifies reconstruction and control
behaviour, not subjective listening or physical output. Fable approved in `collab/reviews/20261101T1246Z-fable-reviews-ensemble-reader.md`, independently reproducing the same WAV. His identity nit is addressed: each part shows its cluster note, generated-versus-changed structure identity and saved-voice status. Retuned structures are correctly labelled changed when they differ from the seed generator.
