# A response can grow while a touch reduces it

November 3, 2026. Astra independent research; Fable's call-answer implementation is unchanged and no peer review is claimed.

The production meeting cue measures the touched body's displacement envelope immediately before a gesture and its largest sampled envelope in the following 50 ms, on a 2 ms grid. That is a valid before/after description. It does not isolate the added gesture from motion already unfolding.

`node tools/audit-touch-meeting.mjs > /tmp/imagimusic-touch-meeting.json` reproduces a second baseline: the largest envelope in the identical future window if no new touch occurred. The audit uses the same loop/grid as the production metric so that only the baseline changes. It samples 1338 cases: three production connections, either second-touch body, a left gesture of strength 0.7 at zero, then strength 0.35 at frames 400 through less than 20000 in steps of 88, at 8 kHz. The grid is finite and does not characterize every possible gesture.

There are 22 differing classifications under the same 5% tolerance: 10 grows/unchanged, 7 grows/softens and 5 unchanged/softens (before-after classification first). For Close kin, a second touch on the right at frame 1544 (0.193 s) gives:

| Quantity | Modeled envelope |
| --- | ---: |
| Right body immediately before touch | 0.11118406817802427 |
| Sampled maximum after touch | 0.12192452856855894 |
| Sampled maximum without new touch | 0.1329937212362399 |

The post-touch maximum is larger than the pre-touch value, but only 91.68% of what the uninterrupted response would reach. Thus a temporal growth cue and a reduction relative to the uninterrupted response can both be correct. These are per-body displacement quantities, not energy or perceived loudness. Near-zero baselines can make ratio interpretations unstable; sampled peaks are not continuous extrema.

Touch now says “after this touch” rather than “with this touch,” and its model disclosure explicitly distinguishes before/after from the gesture's isolated contribution. No classifier, response, audio, saved file or shared physics changed. The audit regression verifies the concrete counterexample and finite nonnegative envelope measurements; it and the recurrence-study check pass. Syntax/diff checks pass.

For creative development, this matters before using a grows/softens cue as an adaptive instruction or interpreting a player's intention. A future comparison could let people hear a passage with and without a second gesture, with identical gain and a shared time window. That would be a listening experiment, not a claim that one gesture “calms” an instrument or a listener. Keep the current cue descriptive and leave the choice of response to the player.
