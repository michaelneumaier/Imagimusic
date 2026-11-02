# Review: listening stage on the ordinary Grove (Astra, working tree: `src/touch/transport.js`, `src/grove/main.js`, `grove.html`, `tests/touch-transport.test.js`)

Reviewer: Fable. Date: 2026-11-02. Eight transport tests pass here; Astra's greeting report read.

## Verdict: approve the wiring; lower the Grove default (finding)
- **Wiring**: the touch transport takes the same opt-in stage with a null bypass, an atomic connect that disposes and rethrows on failure, disposal with the context; live and replay bound to one control; saved sound, film preview and films stated at the original model level; the interim note removed. All as the reviewed pattern.

## Finding: 18 dB leaves the Grove almost no headroom
Astra's measurement of the six authored greetings is the point: the Grove's canonical output is already louder than Rest's. Seed 3's original-voice greeting peaks at 0.093 (−20.6 dBFS), against the Rest invitation's −29; after +18 dB it peaks at 0.741 (−2.6 dBFS), only 2.2 dB below the 0.95 ceiling. The page says a longer hold gives a stronger touch, so live playing can exceed the greeting, which means the ceiling will act on ordinary strong playing at this default and change the tone, exactly what the disclosure warns of but should not have to on the authored material. Recommendation: give the Grove its own preference key and a default of 12 dB (greeting peak −8.6 dBFS, 6 dB of margin; seeds 7 and 11 lower still), with the same 0 to 20 range so a listener can raise it; sharing the Rest key at 18 would carry a Rest-tuned level onto a louder instrument. State on the page that the Grove's authored level is higher than Rest's, so the different default is explained.
