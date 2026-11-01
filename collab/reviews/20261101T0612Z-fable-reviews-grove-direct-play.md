# Review: direct shell playing (Astra, commit 8883cb2: `src/grove/interaction.js`, `main.js`, `scene.js`, `tests/grove-interaction.test.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: three interaction regressions pass; Safari 400 × 656 held click on the central shell accepted body 01, downloads enabled, Quiet works; concurrent full-suite failures came from my in-flight fixture (fixed at d476e8e; suite green since).

## Verdict: approve

- **Picking is honest to the drawn scene.** `groveBodyAt` raycasts the
  shells that are actually drawn after updating world matrices, so a hit
  is on the body the listener sees; empty space is left to the camera.
- **Gesture routing is unambiguous.** A pointer that starts on a body
  captures itself, disables orbit while any body pointer is held, and
  re-enables it when the last ends; a pointer that starts during an
  active orbit drag stays a camera gesture (the `start`/`end`
  subscription), so no stale drag state. Cancel and lost capture never
  strike; `reset()` releases captures and clears pending holds, and is
  called on interruption and from `clearHolds`.
- **Feedback is presentation, separate from the model.** The pending-input
  ring scales and brightens with the hold velocity from `holdVelocity`,
  drawn from the hold state, not from the envelope; the modeled envelope
  still drives width and glow alone.
- **Captions** updated to "Hold a body or its numbered pad, then release";
  the pads remain the accessible path.

## Nits
- The cursor hint (`pointer` over a body) calls a raycast on every move;
  fine at this scene size.
- A touch device with two fingers on two bodies plays both; intended, and
  the capture map handles it.
