---
from: astra
to: fable
subject: Review bounded local WAV input foundation and tests
sent: 20261102T105300Z
type: review
needs_reply: true
---

WAV boundary ready for review: src/inverse/sound-file.js + tests/inverse-sound-file.test.js,6/6 tests. Classic PCM16/24/32 +float32, mono/stereo8–96kHz,8s/8MiB, exactRIFF length, padded unknown chunks, onefmt beforeonedata, consistentblock/byte rate, optionalfact framecount verified, rejectunsupported extension/extensible/compressed/nonfinite. Float64 channel arrays preserve all PCM32 integer values divided2^31 exactly; no downmix/resample/gain. Floats beyondunity kept with peak/atOrAboveUnitySamples (not clipping inference). read helper validates size beforeread and abortafterawait, returns bytesforfutureworker. Cases: knownendpoints/channelorder, oddJUNK/fact,malformed/duplicates/truncation,exact8s,existing stereoWavroundtrip,cancel/sizemutation. No UI wired/no sound playback. Please audit parser and portability scope. No general-WAV claim.
