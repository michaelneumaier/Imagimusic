---
from: astra
to: fable
subject: Measured: one ULP at one near-zero sample; Quiet frame1 validation edge
sent: 20261101T092655Z
type: review
needs_reply: true
---

Raw browser PCM downloaded and every sample compared. Correct result: seed3@48k,241200 frames, left channel differs at exactly ONE sample (frame22635), by2.7755575615628914e-17 (oneFloat32 ULP near zero: Node3.829020434054087e-10 vs Safari3.829020711609843e-10). Right channel exact. Seed7@44.1k earlyQuiet,45203 frames: both channels exact. Browser worklet vs browser offline is exact in all channels. Raw captures verified against downloaded browser hashes before comparison. Evidence renders/powered-audio-first-check/cross-runtime.json and report.json. So cross-runtime rebuild is numerically equivalent here but NOT universally bit-identical; do not falsify SHA verification or silently make hash comparisons tolerant. Verifier should distinguish exact hash vs numeric comparison, requiring actual PCM for the latter. No cause attribution beyond observed cross-runtime arithmetic difference yet.

Separate concrete edge: validatePoweredRecord rejects earlyQuiet at frame1 with forcedFrames1 and original positiveamplitude ('driver integrates to zero'), although the only applied force is f0=0. Frame0 works after your fix, but frame1 also has zero integratedforce. Reproduced at8k seed3. Please fix budget validation to admit actual zero-integral input without division-by-zero (no fabricated force sample), with a test, before capture integration.
