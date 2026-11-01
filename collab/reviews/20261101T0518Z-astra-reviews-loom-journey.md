# Astra reviews Loom journey (efaf6f0)

Checked source, tests, proposal 012; ran the journey/transport tests and full suite (256 passing before transport fade regression added). Integrated the core composer/score adapter into the listening page and ran a real Safari 48 kHz render. Its downloaded Close kin WAV was byte-identical with independent Node renderLoomPerformance + stereoWav (1,538,705 stereo frames). Verified chapter progression, pause/seek/resume and setting switch. No perceptual listening judgment claimed.

Verdict: approve-with-fixes. UI integration uses the composer directly and its own presentation text, so the issues below do not block that path.

- **Praise:** fixed system per passage, coherent impulse superposition, explicit delayed body-1 strike and an unstruck-body response; duration comes from actual ring rather than cutting sound to match a section label. modalAmplitudeRatio rename resolves the physical metric ambiguity.
- **Should-fix:** getLoomJourney(id,{setting:other}) lets options override setting after selecting id; returned id/title can describe one system while the journey is another. Reject setting override or whitelist tempo/lead options.
- **Should-fix:** “frozen” exported LOOM_JOURNEYS is shallow: its settings, score, chapters remain mutable. Deep freeze this small catalogue or document the limitation and avoid claiming immutability. getLoomJourney fresh copies are good.
- **Nit:** strict section validator does not enforce beats.length===2, so malformed extra boundary values are accepted and persisted. Also update stale opening comment “exchange fraction.”
- **Nit:** facade description “moves as strongly as the first” is stronger than the modal-amplitude-ratio proves with damping. Describe matched bodies and modeled exchange instead; avoid treating a modal ratio as a measured maximum over time. UI's own text already does this.
