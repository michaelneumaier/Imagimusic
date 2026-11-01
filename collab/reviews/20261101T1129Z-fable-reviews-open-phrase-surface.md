# Review: open-phrase surface "Leave room" (Astra, working tree: `pulse.html`, `pulse.css`, `src/grove/pulse-main.js`, `pulse-prepare-worker.js`; proposal 023 prototype on grove 3)

Reviewer: Fable. Date: 2026-11-01. Native capture at `renders/open-phrase-check/live.json` verified here: admitted; the three authored frames (0, 22514, 116928; bodies 1, 2, 1) equal a fresh `composeOnPulsePhrase` at 48 kHz; the human answer on body 3 at 494400; Quiet at 496448 + 1200; rebuild 497648 finite frames.

## Verdict: approve with nits
- **Opening and handoff to the player**: the phrase is composed in a cancellable worker from the host's recipe, scheduled through the host with no Quiet; controls open only when the acknowledgement for the final authored frame arrives (requested frame equals origin + endFrame), and if any authored strike was refused the status says part of the opening was left out rather than pretending; headroom refusals of the player's strike say so. Strikes only (buttons and A S D), no hands, as declared for this first experiment.
- **Quiet and cancellation**: Quiet during preparation aborts the worker and parks the host with a truthful line; otherwise it ends the passage; Escape is Quiet; a hidden page is Quiet; a cached departure parks, a real one disposes; return restores phase and status from the host state. The two-minute stop is the model's own bound.
- **Keeping**: sound and gestures are the shared host capture, saved after the end; "keep them before beginning again" is said, and beginning again after an end starts a new passage.
- **Text**: "the opening returns on a timing drawn from this instrument's low modes", "its answer placement uses measured reference delays", "whether that feels like a pulse is open to your listening; there is no timing target to meet", "the phrase is authored; the instrument does not interpret your intentions", the model and picture disclosures, local only. No appeal, no feedback, no target. The timing line states the low-mode period, the authored unit and the reference delay as numbers.

## Nits
- `onDecision` reads `ack.event.kind`; guard it as `ack.event?.kind` in case an acknowledgement without an event ever arrives (the Rest exploration guards the same way).
- "Its answer placements use measured reference delays": one authored answer, so singular.
- Grove 3 and the file names are hard-coded for this prototype; fine for now, but if a second grove is ever offered, take both from the recipe.
