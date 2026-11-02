# Listening level: measurements and a policy proposal (Fable, 2026-11-01)

Michael reports that everything is very quiet on his iPhone even at full volume. Tool: `tools/measure-listening-level.mjs` (report in `renders/listening-level/report.{json,md}`, ignored by git; rerun to reproduce).

## What the outputs measure
Peak and RMS of the canonical output, in dBFS, with no gain stage anywhere (every host connects the processor straight to the destination; the replay players play the canonical PCM):

| source | peak | RMS |
|---|---|---|
| Rest invitation, grove 3 (canonical gain 0.45) | −29 | −46 |
| individuality phrase, grove 3 | −30 | −43 |
| open-phrase studies | −33 | −45 |
| Three Groves part (one voice) | −35 | −48 |
| Three Groves mix (fixed third) | −38 | −53 |
| Michael's live ensemble passage | −39 | −49 |

Ordinary recorded music peaks near 0 dBFS and averages −15 to −20 dBFS RMS, so the canonical outputs sit about 30 dB below ordinary listening level: a thirtieth of the amplitude. That is why a phone speaker gives almost nothing.

## Why it is this way (and why the canonical level should not move)
The Rest output gain 0.45 is set against the worst-case energy admission bound (ceiling 0.9), which the powered study measured as roughly ten times conservative; nothing normalises or limits, so every file rebuilds byte-exact and the matched-gain listening studies stay comparable; the ensemble divides by three again. All of that is right for provenance and comparison and was never a listening-level decision. Changing the canonical gain would change every future record's hashes and the matched-gain policy of the studies, so it is the wrong place to fix loudness.

## Proposal: a declared listening level on the playback path only
1. **Where**: one gain node between the processor (or the replay source) and the device output, in every host (contact, powered, ensemble) and in the replay and study players. Nothing it does is captured, saved or hashed; records and canonical WAVs are untouched.
2. **How much**: a single declared constant, `LISTENING_GAIN_DB = 18` for single-instrument routes (×7.94: the invitation's peak goes from −29 to −11 dBFS, the phrase to −12), and `ENSEMBLE_LISTENING_GAIN_DB = 24` for the three-voice mix (×15.8: the mix peak from −38 to −14), the extra 6 dB because of the fixed third. Both stated on the pages in one line. A user control is optional; a default that works on a phone is the point.
3. **Ceiling**: a hard clamp at ±0.99 after the gain, as a safety only. The measured peaks leave 11 dB or more of margin after the gain, but the admission bound in theory allows peaks up to 0.9 before the gain, so the clamp must exist; count clamped samples and show the count in the status if it is ever non-zero, so clipping is observed rather than assumed. No compressor or limiter, which would change the relationship between gestures.
4. **Saved audio**: keep the canonical WAV downloads exactly as they are (they are evidence and rebuild from records), and say beside the download that the file is 18 dB (or 24 dB) quieter than playback. If Michael wants a listening copy, add a second download "as heard" with the declared gain applied and the same clamp, named differently; never silently replace the canonical file.
5. **Studies**: the three generated study pages play canonical WAVs through a media element; give the shared player the same declared gain through a Web Audio gain node, or render "as heard" copies beside the canonical ones. The matched-gain comparison is preserved either way because every example in a study gets the same lift.
6. **Not a fix for**: the iPhone's own volume path and mute switch; the small speaker's low-frequency response, which affects these 130 to 200 Hz fundamentals regardless of level; and real-time performance, which is a separate gate.

## Status of Michael's decision
Asked on 2026-11-01 evening; pending. The recommendation above is what I would implement if he says yes; the WAV policy (canonical only, or canonical plus an "as heard" copy) is his call.
