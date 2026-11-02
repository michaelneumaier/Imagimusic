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

## Samples-only inspection page

`inverse-sound.html` now offers a selected local WAV, worker parsing, separate channel min/max interval plots on a shared sample-value scale, per-channel RMS/mean, exact-byte SHA-256, and Clear/cancel lifecycle controls. It does not play sound, infer resonances or submit a target. Fable reviewed the parser in 3593030 and the page in 4c8827a, both approve.

Native Brave successfully opened the generated `/tmp/imagimusic-study-ring.wav` through the real file picker: 4.000 seconds, stereo, 8,000 Hz, PCM16, 32,000 frames. The two plotted channels visibly differ, with the second quieter and faster-decaying. This is a synthetic fixture, not a recorded instrument. Two summary tests cover all-frame bucket coverage, stereo differences, mean/RMS, silence and bounded bucket count; combined parser/summary tests pass 8/8.

Remaining native checks are explicit: malformed-file selection did not reach the parser through the macOS picker, so no application error-recovery result was observed. Subsequent Clear/keyboard actions left the AX state unchanged; a coordinate click returned `noWindowsAvailable`. The unchanged result is not treated as proof that Clear works or fails. Mobile layout, production cancellation and malformed replacement recovery still need usable native interaction. Keep this page a direct-access local study until those checks finish; no incoming catalog link has been added.

The analysis study review found that spectral-window length and available decay duration differ in its current implementation. See `collab/reviews/20261102T1300Z-astra-reviews-sound-file-study.md`; no estimator is admitted into the page by these waveform checks.

### Native follow-up

Rebinding Brave exposed the actual malformed-replacement result: “The WAV container length does not match its bytes. The previous sound remains visible.” The original four-second stereo fixture and both channel images remained in the accessibility tree. A subsequent observation showed “Sound cleared. Choose another whenever you like.” with Clear disabled and the result removed. Earlier interaction failures were therefore not evidence of application failure; delayed observation prevents attributing the exact transition to a particular attempted click.

The expanded real-browser harness passed **5/5 in Safari**: File decode and reader cancellation, actual module-worker summary with a SHA-256 independently calculated using Node crypto, malformed-byte rejection, and worker cancellation followed by successful retry. This is worker lifecycle evidence, not a forced cancellation via the production button. Brave navigation to the harness showed a blank content area, so no Brave harness pass is claimed in this follow-up.

The page is now linked from the project catalog as a Study and from the inverse workshop as a separate silent waveform study. Both links explicitly say it does not yet estimate a target or suggest an instrument. No analysis capability is implied.

Safari also verified catalog discovery: searching “local WAV” showed exactly 1 of 31 entries with the scoped study description. Following its link opened `inverse-sound.html` in the silent initial state, with Clear disabled and the no-estimation sentence visible.

## Extensible WAV compatibility

The parser now accepts standard 40-byte extensible format chunks (22 extension bytes), restricted to full PCM or IEEE-float subformat GUIDs. The original byte, duration, rate and one/two-channel bounds remain. PCM containers may hold fewer valid bits; the parser preserves their left-aligned values and refuses nonzero unused low bits. Float requires 32 valid/container bits. Declared channel masks are retained without routing or remix: zero is unspecified; nonzero masks must use defined speaker bits and match channel count. The page calls a two-channel file “two channels”, avoiding an assumed stereo layout, and shows format, precision and mask in details.

This follows Microsoft's [extensible format structure](https://learn.microsoft.com/en-us/windows/win32/api/mmreg/ns-mmreg-waveformatextensible) and [valid-bit alignment description](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ksmedia/ns-ksmedia-waveformatextensible). This implementation deliberately refuses extra extension bytes, reserved speaker bits, zero PCM precision, and nonzero unused sample bits. It is still a bounded subset, not universal WAV support.

Ten parser/summary tests pass, including extensible integer endpoints at 16/24/32 container bits, reduced valid precision, unspecified and non-stereo masks, float values outside unity, altered GUID bytes, invalid precision/masks/extensions and dirty padding. Existing classic-file cases still pass.

Independent reference: installed FFmpeg generated a 0.1 s, 48 kHz two-channel PCM24 WAV using `-f lavfi -i sine=frequency=220:sample_rate=48000:duration=0.1 -ac 2 -c:a pcm_s24le`. Its format was extensible, validBits=24, mask=3. All 4,800 frames in both channels matched FFmpeg's f64le decode exactly (maximum absolute error 0). A separate FFmpeg-generated 8 kHz, 0.01 s two-channel float32 WAV decoded with the expected 80 frames, but FFmpeg wrote a classic header; the extensible-header assertion failed. It therefore supplies no independent extensible-float evidence; that branch is covered by the constructed tests only. These are generated reference files, not a Logic-export compatibility claim. Native picker and displayed metadata for this new format have not yet been checked.
