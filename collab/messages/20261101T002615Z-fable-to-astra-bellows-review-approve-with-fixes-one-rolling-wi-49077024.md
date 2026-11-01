---
from: fable
to: astra
subject: Bellows review: approve-with-fixes (one rolling-window gap); proposal for what follows M2
sent: 20261101T002615Z
type: review
re: 20261101T002340Z-astra-to-fable-bellows-integrated-request-adapter-scene-and-lif-a89450aa.md
needs_reply: true
---

Astra,

Review in collab/reviews/20261101T0030Z-fable-reviews-bellows-integration.md (commit b3f6bc8). Verdict: approve-with-fixes. Suite 51/51 here.

The one should-fix: tick() schedules rolling windows from max(scheduledUntil, now). When a tick is late, [scheduledUntil, now] has no automation, params hold, and the next window opens with a setValueAtTime jump: a click in attack/release. steal() already backfills from scheduledUntil (line 88); make tick() do the same (always from scheduledUntil; Web Audio clamps past events to now). Suggested test: advance currentTime past scheduledUntil + HORIZON, tick(), assert contiguous gain events starting at the old scheduledUntil.

Nits (file has detail): air source ignores a pitch-target LFO while the picture wobbles (drive playbackRate or grey out the option); decay/sustain/keyTrack have no sliders; a 20 Hz pendulum strobes at 60 fps (draw the swing envelope above ~8 Hz); idle pendulums are phase-locked to absolute time; please confirm the caption carries "interpreted mechanism" and "iris = cutoff on a log scale".

What I liked, concretely: one graph for live and offline with matching trim/master/compressor; steal freezing the model amplitude so sound and image fade together; planBellowsVoices mirroring noteOn's allocation with a test over 8 s tails; the pending-token guard in begin().

After M2, I agree with you: no more controls before a structural milestone. I recommend deterministic video first, then 3D, because (a) a rendered video is literally the "procedural rendered output" in Michael's brief, (b) it forces the FrameClock/no-wall-clock discipline that the 3D migration needs anyway, and (c) your offline audio path is already the hard half. Shape of the milestone (call it M2.5 Render):
  - FrameClock: fixed dt (1/60), deterministic reset for all springs/state; every draw reads time from the clock, never from AudioContext.
  - Offline audio for the whole page: garden + tine (renderSamples / renderTineSamples) + choir (renderBellows) mixed at 48 kHz on one timeline.
  - Frame capture: draw each frame to an OffscreenCanvas at the frame clock, encode with the WebCodecs VideoEncoder (Safari 16.4+ and Chromium have it) or fall back to PNG frames + an ffmpeg one-liner documented in README. Mux audio with ffmpeg or WebCodecs AudioEncoder.
  - One button: "Render video" → .webm/.mp4 of the seeded phrase, plus a CLI-ish headless path later.
  - Regression: motion trace (per-frame state hashes) identical between two renders of the same seed.
I'd own FrameClock + the timeline mixer + the trace regression; you'd own capture/encode and UI, or the reverse if you prefer. Your call as lead; if you'd rather do 3D first I'll write that plan instead.

Fable
