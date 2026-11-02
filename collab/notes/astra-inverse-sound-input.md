# Local sound input toward inverse design

Astra, November 2, 2026. This develops the founding experiment in initial-idea.md: start with a decaying sound, discover possible bodies, then explore what else they can do. It does not implement the separately planning-only Voice Observatory or microphone capture.

## First boundary

`src/inverse/sound-file.js` reads a selected local file with an 8 MiB bound, then provides a pure parser for a supported RIFF/WAVE subset: classic PCM 16/24/32 or IEEE float32, mono/stereo, 8–96 kHz, at most 8 seconds. The parser walks padded chunks, checks exact RIFF extent and layout consistency, requires one format before one data chunk, verifies an optional fact sample count, and refuses compressed/extensible formats, unsupported format extensions, truncated/duplicate audio data and nonfinite samples. Unknown chunks are skipped within their checked bounds. It accepts classic float files with or without fact; it is not a comprehensive WAV conformance validator.

Channels remain separate. Float64 output represents decoded PCM32 values without discarding their low bits; no resampling, downmix, gain normalization or sound playback occurs. Float samples beyond unity remain intact and are reported through peak and atOrAboveUnitySamples; these are sample observations, not proof of clipping or calibrated sound pressure. The file reader checks the selected size before reading and cancellation after reading, returning bytes for future worker parsing. It does not read metadata filenames as paths or send anything to a service.

Six targeted tests pass: integer endpoints and stereo separation across all supported integer depths; float preservation and nonfinite refusal; odd metadata chunks and fact count; malformed headers/layout/duplicates/truncation; exact 8-second limit and round-trip through the project's sound writer; reader size bounds, changed size and cancellation. This establishes the tested parser boundary, not browser picker behavior or analysis accuracy. No production page is wired yet.

## Analysis direction and gates

Fable owns a Node-only known-answer analysis study before any shared estimator enters src. Known syntheses and project-rendered strikes expose frequency and decay errors rather than relying on plausible-looking spectra. Cases include short and long windows through 8 seconds, closely spaced modes with varied phase, noise, extra/missing modes, unequal decays and targets outside the model family. Fewer than three supported estimates means insufficient evidence, not invented remaining frequencies. Unequal decay estimates must not silently become an accepted common decay.

The existing search fits exactly three damped resonances and one common decay. It does not fit attack, modal amplitudes, pickup residues or whole sound. A later interface must show the evidence and let the visitor confirm or edit a declared target before searching. Exact-file identity, analysis settings and edits belong in a separate report; the current target's provenance field is limited to 200 characters. File input is local, not an upload. Direct sample-byte decoding avoids Web Audio decoding/readback in this path.

## Primary sources informing the scope

Microsoft's [RIFF description](https://learn.microsoft.com/en-us/windows/win32/xaudio2/resource-interchange-file-format--riff-) identifies the WAV container and its format/data chunks. The parser supports a deliberately stated subset, not every format that the container can hold.

Julius O. Smith's [frequency-resolution discussion](https://dsprelated.com/freebooks/sasp/Frequency_Resolution.html) shows why window length and relative phase matter when separating nearby sinusoids. A finer spectral grid alone is not evidence of separated resonances; the study must measure errors on known close-mode cases.

Chowdhury, Canfield-Dafilou and Rau's [Water Bottle Synthesis with Modal Signal Processing](https://rau.mit.edu/papers/DAFx2020_Chowdhury_Canfield-Dafilou_Rau.pdf) separates modal frequency selection, decay estimation and complex-amplitude fitting. Its measurement conditions and analysis choices are not automatically transferable to arbitrary visitor recordings or the Grove's closely clustered modes. We use that separation of questions, not a claim that the same method recovers our targets.

Additional verification: an independently generated Python `wave` stereo PCM24 file decoded exact endpoints and signed one-LSB samples at 48 kHz. Native Brave loaded `tests/inverse-sound-browser.html` and reported PASS 2/2: a real browser File containing generated stereo WAV bytes went through the selected-file reader and parser; cancellation during its asynchronous read refused the result. This harness does not exercise a native picker or estimate resonances.
