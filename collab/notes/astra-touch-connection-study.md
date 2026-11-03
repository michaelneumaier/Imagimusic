# Six connections, the same gestures

This local listening study explores a possible next step after exact custom-instrument return-to-play: meeting different response patterns without changing the performer's gesture. It is not a new preset catalog, a random instrument generator, or evidence of emotional appeal. The question is whether differences in relationship are worth discovering through play.

Reproduce:

```sh
node tools/study-touch-connections.mjs --audio-dir renders/touch-connection-study > /tmp/imagimusic-touch-connections.json
```

Open `http://127.0.0.1:8081/renders/touch-connection-study/index.html` under the existing local server. The output directory is generated and ignored by Git; the generator is the reproducible source. The page has one shared audio player, explicit per-version listening buttons, and quiet links into the exact corresponding live instruments. The uncoupled control has no play invitation. No home/catalog promotion yet.

## Shared performance and measured differences

All six use 196 Hz base tuning, loss 0.45/s, gain 0.45, a left touch at 0 s and right touch at 1.5 s, both strength 0.5. Saved Quiet begins at 8 s with a 25 ms fade. Output is 8 kHz stereo, 64,200 frames (8.025 s). WAV is 16-bit PCM without normalization. The real Touch session admits both gestures for every case. Each connection retains its own existing pickup scale; the test does not secretly loudness-match them.

| Case | Coupling | Detune (cents) | Mode separation (Hz) | Pickup scale | Right-channel RMS before second touch |
| --- | ---: | ---: | ---: | ---: | ---: |
| Separate (control) | 0 | 0 | 0 | 467.972 | 0 |
| Gentle | 0.001 | 0 | 0.195902 | 935.943 | 0.018353 |
| Matched | 0.004 | 0 | 0.782438 | 935.943 | 0.030091 |
| Stronger | 0.012 | 0 | 2.338055 | 935.943 | 0.031396 |
| Detuned | 0.004 | 40 | 4.637318 | 472.135 | 0.002632 |
| Wide detune | 0.004 | 120 | 14.061753 | 469.220 | 0.000822 |

RMS here is the actual Float32 pickup signal over frames [0,12000), before the right gesture, not physical energy or perceived loudness. Full precision settings, records, per-channel peaks/RMS, SHA-256 WAV identities and all 15 pair differences are in report.json. Pairwise Float32 RMS sample differences range from 0.011162988952732418 to 0.02928802909356194. All six WAV hashes differ, all output peaks are below 1, and the uncoupled right channel is exactly zero before the second touch. These are signal checks, not a perceptual-distance ranking.

Wide detune is the only case above the current 8 Hz visible-beating threshold and therefore uses the averaged visual envelope. Its live picture should not be sold as showing every audible beat. The pickup-scale change is substantial: matched cases use about twice the detuned/control scale. A simple “more connection” narrative would hide this confound. Detuning also changes the modes themselves. The model is a pair of masses and springs with virtual displacement pickups; it does not predict acoustic radiation from the artistic shells.

## Native check and next design question

Native Safari loaded the generated study with no playback. Explicit Listen to gentle started the shared player with an eight-second rounded duration. Selecting wide-detune changed the selected identity and restarted that same player; Pause stopped it. Its Play this connection link opened Custom connection with no gestures and required explicit Enter. This verifies controls and quiet handoff, not what a human heard, liked or found distinct.

A useful listening question is: does one of these connections invite a different response from the player? Keep the initial report in the person's words. Do not name a spiritual outcome, score attentiveness, or infer that larger signal differences mean richer experience. If this proves inviting, a future discovery action could offer reproducible instruments while retaining the current passage until explicit entry. The current study gives concrete candidates and highlights scaling/visual limitations before that product decision. Fable's review remains pending.

November 3 update: the project roadmap now links this research note as evidence for the next encounter milestone. The six candidates have not been promoted to production presets; the earlier “No home/catalog promotion yet” refers to the study at its initial checkpoint. Human listening and appeal remain open.
