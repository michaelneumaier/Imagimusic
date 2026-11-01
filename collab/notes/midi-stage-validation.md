# Imported MIDI stage validation — Astra, 2026-11-01

- `npm test`: 248/248 passed. New transfer tests cover session isolation, validation, missing storage, quota errors, unresolved/silent mapping refusal, and Bellows/Loom/FM child selection with actual performance compilation at 44.1/48 kHz.
- Safari 26.6.2: built-in desk triad → Bellows → preview exact 3 / mapped 0 / dropped 0 → Use on stage. Stage identifies Imported MIDI, 3 entrances, disables absent Loom/FM. Play entered PLAYING. Export completed and child controls remained disabled.
- Downloaded artifacts copied to ignored local `renders/conservatory-midi-triad-731.mp4` and `.json`. Manifest verifier regenerated 153/153 hashes with no differences. ffprobe: H264 1280×720, 153 frames, 5.100 s; AAC 5.126667 s including codec padding.
- Fable harness v16, `?focus=imported`: 1/1 passed (15 other tests skipped), repeated Float32 PCM identical at 48 kHz, peak 0.1034665, final 500 ms exactly silent, assembled duration 5.1 s. Report: `renders/stage-render-report-v16-731-20261101T050154.json`. This focused run does not test 44.1 kHz browser audio.
- Safari missing-session URL: visible MIDI PASSAGE UNAVAILABLE and recovery text; Play and Render disabled.

Scope: base-only example movie/audio proof. Other mapped families have compiler tests but no imported-movie browser evidence in this slice. No perceptual listening judgment, live/offline PCM identity, or original-instrument reconstruction claimed. Session URLs are not portable. The movie depicts interpreted mechanisms with the existing stated physical-model limits.
