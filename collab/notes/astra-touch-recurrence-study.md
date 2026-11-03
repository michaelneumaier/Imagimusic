# Room between touches

November 3, 2026. Astra-owned listening research, developed independently while Fable is unavailable. No production preset or model change; peer review and human listening remain pending.

The question is whether the spacing of a gesture invites a different next gesture. This offers a concrete route toward Michael's interest in spirituality and psychedelia: recurrence, expectation and a response already in motion. It does not assign those meanings to a person or claim a change in consciousness.

## Reproduce

Run `node tools/study-touch-recurrence.mjs --audio-dir renders/touch-recurrence-study > /tmp/imagimusic-touch-recurrence.json`. Open `http://127.0.0.1:8081/renders/touch-recurrence-study/index.html` under the local server. Generated files are ignored by Git. The tool writes three WAVs, three strict Touch gesture records, the report and a listening page. The page has one player and explicit version selection, pauses on hiding, and links to an empty instrument with the same settings. Study gestures can be downloaded and reopened through Touch return.

## The controlled difference

All patterns alternate left/right six times at strength 0.35. First touch is at 0 seconds, last at 4 seconds. Only the four interior onsets differ:

| Pattern | Onsets in seconds |
| --- | --- |
| Even spacing | 0, 0.8, 1.6, 2.4, 3.2, 4 |
| Pairs and space | 0, 0.2, 1.9, 2.1, 3.8, 4 |
| Widening intervals | 0, 0.2, 0.6, 1.3, 2.4, 4 |

The instrument is 196 Hz, coupling 0.004, zero detuning, loss 0.45/s. All use one shared rendered bank, pickup scale 935.9432208729135, fixed output gain 0.45, and 8 kHz sample rate. Quiet starts at frame 80000 with a 200-frame fade; each output is 80200 frames (10.025 seconds). WAVs are 16-bit stereo without normalization. The model is two coupled masses with displacement pickups, not acoustic radiation.

Measured Float32 channel RMS is 0.02997/0.03022 for even, 0.02876/0.03146 for paired and 0.02008/0.02152 for widening. All channel peaks are below 0.096. Each WAV hash is distinct. These are signal facts, not perceptual distances: changed overlap and phase can alter loudness despite identical gain, gesture count and endpoint times. Lower RMS does not establish calmness, spaciousness or preference.

## Evidence and the next listening question

The focused test verifies that the admitted records differ only in event frames, with exact common first/last frames, alternating bodies, gain/settings/ending, equal output lengths, equal pickup scale and distinct WAV hashes. Each record rebuilds through the production validator. Native Safari opened silently; selecting Even spacing started the sole player at the beginning with a ten-second rounded duration. Pairs and space changed the visible selection and restarted the same player. Pause stopped playback. These observations establish browser control behavior, not what a human heard.

For a first listening encounter, let someone choose a version without describing its expected effect. Ask what they noticed, then whether they wanted to leave it ringing or add something. Offer the empty instrument on the same connection if they want to respond. Keep their language separate from the authored labels and metrics. A follow-up could compare their chosen gesture timing against the original passage, but should not rate attentiveness or interpret an inner state. Any adaptive instrument feature should follow listening evidence rather than assume that a timing pattern is universally inviting.
