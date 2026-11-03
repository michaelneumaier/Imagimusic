# First encounter artistic proof

*Astra · 2026-11-03 · Proposal 025, developing the Living Instrument plan*

The first proof pairs a 72-second authored sound sketch with an opening-body art target and six proposed camera scenes. Open [the local proof](../../renders/flagship-sketch/index.html) to listen manually. This is a direction to assess before implementing the flagship scene.

## The musical thread

The motif has three touches at offsets 0, 0.65 and 1.7 seconds, with impulses 0.1, 0.025 and 0.05 µN·s. Its unequal gaps and accents give it an identity that can survive a change of body. The opening statement at six seconds returns exactly at thirteen and sixty seconds; softer statements provide answers and a final recollection.

Three independent steel tines supply the sound: lengths 80, 95 and 65 mm, all 10 mm wide and 1 mm thick. Their tuning and inharmonic partials come from the existing uniform-beam model. No pitch correction, reverberation or simulated acoustic room is applied. Artistic stereo panning separates their roles. The same body continues vibrating across its touches; no phrase boundary resets its state.

## The six scenes

| Time | Proposed picture | Musical purpose |
| --- | --- | --- |
| 0–12 s | One blade, its clamp and dark ceramic support. Hold the camera; a prepared striker may anticipate the authored touch. | Establish a sound, then the three-touch phrase. The first two seconds are silent. |
| 12–24 s | A closer view makes the contact location and lingering response readable. | Recognize the same phrase, then its softer answer. |
| 24–36 s | Reveal the longer and shorter bodies on the shared stage. Each has its own clamp and free tip. | Expand the motif through lower, original and upper voices. These bodies share a score, not a modeled mechanical bridge. |
| 36–48 s | Offer a restrained inner view; statistical displacement is a labeled presentation, not a material surface. | Thin the activity and leave room to follow decay. |
| 48–60 s | Hold the ensemble in one composed view. A larger architectural frame becomes visible around it. | Distribute the motif across three voices, then reverse the voice order. |
| 60–72 s | Return to the opening body and camera orientation. Other structures recede into shadow. | Recover the opening statement, then hear it more softly. Apply the declared final 100 ms recording fade. |

The images are design references made with the built-in image_gen tool. They do not prove geometry, force contact, vibration, acoustics or an implemented camera path. The opening blade remains a straight cantilever; supports, materials and lighting are art direction. In particular, an inner-view image must not pin both ends of the blade: its free tip must remain free. Runtime motion will come from the actual model, not from tracing generated contours.

## What to assess next

Listen to the complete sketch before deciding whether the physical tine is sufficient as the flagship’s first voice. Is the rhythm recognizable in the middle? Does the return feel earned? Does the long, dry ring sustain attention, or does it need different excitation, damping or a deliberately added spatial treatment? These questions remain open; numerical verification does not answer them.

The visual target establishes tactility and a clear point of interaction. The storyboard currently emphasizes restrained material continuity. The next iteration should explore whether the ensemble reveal can become more spatially surprising while keeping the original body and musical phrase recognizable. Compare that stronger treatment with this grounded one before committing to a finished scene.

## Reproduction and evidence

Run `node tools/render-flagship-sketch.mjs` to regenerate the local page, stereo WAV and report. Generated audio remains in ignored `renders/flagship-sketch`; selected concept images and exact prompts live under `assets/flagship`.

The sketch contains 35 touches across three continuous four-mode states. Summed absolute impulses satisfy the model’s conservative small-displacement admission. Exact homogeneous state stepping is independently compared with analytic impulse superposition every 10007 frames; maximum displacement difference is 6.768e-19 m. Source output uses fixed velocity-pickup gain 100 followed by artistic gain 8 and equal-power panning; observed peak is 0.0586075 and RMS 0.0116365. There is no normalization or clipping. The only audio ending is the last 100 ms output fade.

An independent Python WAV read verifies stereo 16-bit PCM, 48 kHz, 3456000 frames, two initial silent seconds, a zero final frame, integer peak 1920, and the report’s SHA-256. Native Safari reports 1 minute 12 seconds and verifies explicit Play/Pause; it is left paused. Listening quality, device output, a complete audiovisual performance and a playable flagship remain to be evaluated or built.
