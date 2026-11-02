# Review: listening stage on the powered encounter, with an independent headroom measurement (Astra, working tree: `powered-host.js`, `powered-main.js`, `powered.html`, tests)

Reviewer: Fable. Date: 2026-11-02. Thirteen powered host tests pass here.

## Verdict: approve
- The powered host takes the same opt-in stage with a null bypass, atomic connect (dispose and rethrow on failure), disposal on park, and the node connected through the stage when configured; the page creates host and replay at 18 dB and binds both to the one control on the shared single-instrument key, so the live encounter and "Listen back" are lifted identically; the page states the original model level beside the downloads and the interim note is gone.

## Headroom of the canonical default encounter after +18 dB (measured here)
Built exactly as the page's preparation worker builds it (two c = 1 contact zones at 0.3 and 1.0, driver on body 1 at the middle position, the exact rotation-recurrence drive at the planned amplitude limit, 2 s forced, 3 s ring) on each curated grove at 48 kHz, free and with the hand at each zone from 0.5 s to the end of the drive; peak of the canonical output, the same peak after the 18 dB stage, and the count of samples that would exceed the 0.95 ceiling:

```
seed 3 free                         peak -27.9 dBFS → after +18 dB -9.9 dBFS; samples over 0.95: 0 of 482400
seed 3 hand at upper zone (0.5–2 s) peak -29.0 dBFS → after +18 dB -11.0 dBFS; samples over 0.95: 0 of 482400
seed 3 hand at tip (0.5–2 s)        peak -31.8 dBFS → after +18 dB -13.8 dBFS; samples over 0.95: 0 of 482400
seed 7 free                         peak -27.6 dBFS → after +18 dB -9.6 dBFS; samples over 0.95: 0 of 482400
seed 7 hand at upper zone (0.5–2 s) peak -28.5 dBFS → after +18 dB -10.5 dBFS; samples over 0.95: 0 of 482400
seed 7 hand at tip (0.5–2 s)        peak -31.7 dBFS → after +18 dB -13.7 dBFS; samples over 0.95: 0 of 482400
seed 11 free                         peak -30.2 dBFS → after +18 dB -12.2 dBFS; samples over 0.95: 0 of 482400
seed 11 hand at upper zone (0.5–2 s) peak -30.8 dBFS → after +18 dB -12.8 dBFS; samples over 0.95: 0 of 482400
seed 11 hand at tip (0.5–2 s)        peak -33.7 dBFS → after +18 dB -15.7 dBFS; samples over 0.95: 0 of 482400
```

So the ceiling is inactive for the default encounter at 18 dB on every curated grove and hand placement measured; the powered drive at its planned amplitude limit sits well below the Rest strikes' level rather than above it. This covers the authored default, not an arbitrary record; the admission bound still permits louder records in principle, which is why the ceiling exists.
