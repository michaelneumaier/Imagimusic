# A touch meets a ring

November 3, 2026. Astra listening research following the meeting-cue audit. No production model edits or peer approval claimed.

Run `node tools/study-touch-interference.mjs --audio-dir renders/touch-interference-study > /tmp/imagimusic-touch-interference.json`. Open `http://127.0.0.1:8081/renders/touch-interference-study/index.html`. Generated WAVs, gesture files, report and page stay local and are ignored by Git.

Three versions share a left gesture of strength 0.7 at frame zero. The control adds nothing. The other versions add a right gesture of strength 0.35 at frame 1560 (0.195 s) or frame 1576 (0.197 s), at 8 kHz. Thus the two played alternatives differ only by two milliseconds. All share the Close kin instrument, one rendered bank, pickup scaling, fixed gain and saved Quiet at 6 seconds plus a 25 ms fade. Each file is 48200 frames. The first 1560 frames are exactly identical across all three versions.

The shared measurement window is frames [1576,2376), 100 ms after the later gesture. Right-channel Float32 RMS is 0.0429926 for the control, 0.0826953 for the 0.195 s gesture, and 0.0166888 for the 0.197 s gesture. Left-channel RMS is respectively 0.0622893, 0.0575563 and 0.0668487. This is a side-specific interaction, not uniform attenuation. The model produces different coherent sums when the same impulse meets a different phase of existing motion. No gain normalization was applied.

The page invites listening in any order with neutral timing labels, one shared player and explicit playback. It does not describe either outcome as calmer, better or more spiritual. A disclosure names the authored fine timing; a person is not expected to perform a deliberate two-millisecond distinction. Downloaded strict Touch gesture files can be reopened for their modeled picture, although an ordinary display may not resolve such a short onset difference. The play link opens an empty instrument quietly, with no study gestures transferred.

Validation: the generator verifies exact Float32 common prefixes. Independently, Python's standard wave reader verified all three emitted files as 8 kHz, 16-bit stereo with 48200 frames, exact common PCM byte prefixes through frame 1559 and distinct full outputs. All three gesture files rebuild through the production validator. Native Safari opened silently, selected the 0.195 s version with a six-second rounded duration, switched to the 0.197 s version at the beginning of the same player, and paused. Syntax/diff checks pass. These are control and signal checks, not human audibility, preference or acoustic-realism findings.

This study makes one aspect of the project's creative direction tangible: a small gesture joins an ongoing process rather than commanding a fixed decorative response. Its possible meaning remains with the listener. The next useful evidence is how someone describes the difference and whether it changes what they want to play, without prompting a preferred interpretation.
