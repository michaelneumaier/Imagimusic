# One gesture, three Groves — baseline listening material

2026-11-01 · Astra · musical evaluation, not a new product entry

## Question

Does a shared passage reveal distinct bodies and interactions, and how much does the natural level difference affect that comparison? This is an artistic question requiring actual listening. The present measurements are not a judgment of appeal, timbre quality, or perceived loudness.

The starting material is the previously verified 20-second Rest invitation capture at renders/rest-invitation-first-play/capture.json. It contains a free ring, a hand on the struck body, a hand on its neighbor, and a three-body closing gesture. Its six strikes and three contact intervals carry over to all three curated groves without omission. Using an already verified passage establishes a baseline alongside Fable's new, shorter phrase.

## Reproduce

```
node tools/render-rest-listening-study.mjs <finished-rest-record.json> <output-directory>
```

The tool validates/admission-checks the source, prepares each explicit curated Grove with the same voice, strike/rest coordinates, strengths and sample rate, and uses the shared transposition and renderer. It writes natural stereo PCM16 WAVs, attenuation-only RMS-matched WAVs, gesture records, report.json, and a local single-player listening page. It rejects an empty or non-curated source and a silent comparison that could not be RMS matched. No production voice/gain changes.

Current artifact: http://127.0.0.1:8080/renders/rest-listening-study/

## Measurements for this invitation only

| Grove | Natural sample peak, dBFS | Whole-passage stereo RMS, dBFS | Gain for matched copy |
| --- | ---: | ---: | ---: |
| 3 | -28.93 | -46.40 | 0.54005 |
| 7 | -30.95 | -50.50 | 0.86603 |
| 11 | -32.08 | -51.75 | 1.00000 |

The matched copies target the smallest whole-passage RMS, 0.0025844134. No boost or limiter is used. Floating-point matched RMS values agree within 1e-10; exported PCM16 RMS differs slightly through quantization. This is not perceptual loudness matching. Quiet portions, phase/interference, articulation, spectral distribution and stereo placement all affect the experience beyond one RMS number.

A useful hypothesis is that the approximately 5.35 dB natural RMS spread could influence judgments of prominence independently of timbre. The low absolute sample peaks also warrant an audition at a consistent comfortable monitoring level. Neither observation licenses a silent production gain change: that would require reviewing admission, saved-record compatibility and live/export consistency.

## Checks and limits

Independent Python wave/struct/hashlib checks verified all six WAV hashes, stereo sample counts/rates, decoded RMS/peaks, and attenuation. Natural PCM16 matches the renderer's quantized values; no subjective listening claim follows from this. Safari verified explicit playback, 20-second duration, a single native audio player, and labeled file-mode selection. Changing the mode pauses and hides the previous player until another Grove is selected, avoiding stale native-control presentation after clearing its source.

No audio listening analysis tool is available in this session. Browser transport checks do not establish that Astra heard the sound. Fable reviewed and approved the tool in collab/reviews/20261101T0829Z-fable-reviews-listening-study-tool.md and independently rendered the shorter phrase. The proposed musical weakness is pitch monotony: near-unison bodies could feel like one instrument in different rooms. That remains a listening hypothesis, not a verdict.


## Shorter individuality phrase

Fable's composeIndividualityPhrase produces five strikes and one contact over 11.025 seconds: free ring, a strike followed by a firm hand, then a three-body exchange. Astra rendered it separately at http://127.0.0.1:8080/renders/rest-individuality/; Fable independently used renders/rest-individuality-phrase/study/. Both preserve every gesture on each Grove.

Natural whole-passage RMS is 0.00704057 / 0.00334217 / 0.00294998 for Groves 3 / 7 / 11, a 7.56 dB spread. Matching gains are 0.418997 / 0.882653 / 1. The different spread from the invitation demonstrates that the level relationship depends on the passage. Independent Python checks verified all six file hashes, duration, stereo/sample rate/frame counts, decoded PCM16 RMS within quantization error, and no clipping. These measurements still do not determine perceived loudness or appeal.

Safari checks on the baseline page confirmed that changing file mode hides the old player and asks for another explicit selection; Grove 7 then played the matched file with gain 0.866 and a 20-second duration; Quiet changed Pause to Play at two seconds.

Astra's review caught a false free-ring/held-contact attribution in the first individuality captions. Fable fixed it in 0706852 by measuring both gestures separately and naming the ratios as pickup-displacement amplitudes, never energy shares. This is why none of those numbers is presented as a claim about a listener's subjective experience.
