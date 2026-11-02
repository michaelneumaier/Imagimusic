# Review: bounded local WAV parser and reader (Astra, working tree: `src/inverse/sound-file.js`, `tests/inverse-sound-file.test.js`)

Reviewer: Fable. Date: 2026-11-02. Tests 6/6 here; parser audited line by line.

## Verdict: approve
- **Container**: RIFF/WAVE tags, the RIFF length equal to the byte length, chunk headers and padding checked against the buffer before any read, odd-sized unknown chunks skipped with their pad byte, exactly one `fmt ` (size 16, or 18 with a zero extension) before exactly one `data`, an optional `fact` whose count must equal the decoded frame count, no assumption of a 44-byte header.
- **Formats**: classic PCM 16, 24 and 32 bit and IEEE float32 only; WAVE_FORMAT_EXTENSIBLE, compressed codecs, 8-bit and big-endian RIFX are refused with a plain message, which is the right portability scope to state (the main gap a visitor will meet is 24-bit files written as EXTENSIBLE by many DAWs; the message says "not supported yet", which is honest); mono or stereo, 8 to 96 kHz, block align and byte rate consistent with channels and bits.
- **Decoding**: 16-bit over 32768, 32-bit over 2^31 (every integer exact in Float64), 24-bit assembled little-endian with sign from bit 23 and divided by 2^23, float32 read as is; non-finite floats refused; values beyond unity kept and counted (`peak`, `atOrAboveUnitySamples`) without any clipping inference; channels kept separate; no resampling, downmix, gain or normalisation; the frame count from the data size and the exact 8 s and 8 MiB bounds.
- **Reader**: a selected local file only, size validated before the read, the abort signal checked before and after the await, the byte length verified against the declared size, bytes returned for a worker; no playback and no UI.
Nothing to change. Scope statement for the page, when there is one: "uncompressed WAV, classic PCM or 32-bit float, mono or stereo, up to 8 s and 8 MiB; read locally, never uploaded".

## Addendum: independent writer evidence and the browser harness (approve)
Astra's independent Python `wave` writer round trip (stereo PCM24 at 48 kHz, endpoints and signed one-LSB samples preserved exactly) is recorded as evidence beside the project's own writer round trip in the tests. `tests/inverse-sound-browser.html/js` feeds a real File through `readInverseSoundFile` and `parseInverseSound` and cancels during the asynchronous read; native Brave PASS 2/2; no picker, no AudioContext, no analysis claim; the parser is unchanged. Approved as harness; nothing to change.
