# Three Groves: the first playable encounter

Astra · November 1, 2026 · proposed experience, not shipped behaviour

## The invitation

“Three voices. Leave room for what remains.”

The promise is small and directly discoverable: touch one instrument, hear it
continue, bring another voice into that continuation. The person chooses how
long to listen. Nothing judges timing or asks them to reach a special state.
The working name stays Three Groves so the existing listening study and future
playable page remain recognisable as related work.

## First minute

1. Arrive at three intact, visibly separate Groves: C, E-flat, G. A single
   “Begin” action prepares their common audio engine; arrival itself is silent.
   Keep the short invitation and Quiet in view at phone width.
2. After preparation, each Grove has one large “Play C”, “Play E-flat”, or
   “Play G” button. Each strikes body 0 at position 1, velocity 0.5. The same
   gesture across all three makes the harmonic difference accessible without
   a control panel. Keyboard A/S/D maps left to right; ignore key repeats.
3. The first strike begins an empty passage. No compulsory demonstration,
   countdown, metronome, guided breathing or automatic accompaniment. Listening
   between gestures is a complete use of the instrument.
4. Offer one secondary action per voice: “Hold to soften”. While held, a firm
   damping contact rests on body 0 at the last canonical zone; release removes
   that contact. This acts on an already sounding body and never triggers a
   strike. Each voice can be held independently while another is played.
5. Quiet ends all three together with the established 25 ms fade. Only after
   completion offer “Keep gestures” and “Keep sound”, then “Begin again”. Keep
   the completed passage available until a deliberate new beginning succeeds.

This is an initial reachable surface, not the eventual limit of playing each
Grove. All its internal bodies continue responding through their own model.
The visible button position identifies the struck body; do not imply the whole
sculpture is a single oscillator or that every branch is directly playable.

## Visual experience

Use one renderer/camera and three instances of the existing Grove scene, rather
than three WebGL contexts. Preserve the whole-cluster identities and internal
bridges. Separate plinths and clear empty space make their independence legible;
no animated threads between Groves, because no physical cross-Grove coupling
exists. A steady camera lets recurrence in the response become perceptible.

Retain the current amplified low-band deformation and glow from model state.
Strike and hand marks appear on acknowledgement, not merely pointer input;
refused gestures show a brief plain-language status and no successful strike
mark. Avoid hue cycling, particles, strobing, reactive camera travel, and an
ambient soundtrack that would obscure the modeled consequence of a gesture.

At narrow widths, show the three instruments together above three adjacent
large strike buttons; put the three separate hold controls below in matching
columns. A/S/D are secondary hints, not mobile instructions. Keep Quiet fixed
within the controls region without covering content. Reduced motion suppresses
animated widening while preserving static identities and acknowledged marks.
Canvas failure should leave labelled controls and a plain explanation; whether
a useful no-canvas mode is possible depends on host separation, not cosmetics.

## Input and lifecycle requirements

- Explicit audio activation, cancellable preparation, fresh generation tokens.
- Pointer capture for holds; release on pointerup, pointercancel, lost capture,
  window blur and page hiding. No stuck hand after leaving a control.
- Keep multiple hold owners per part distinct: releasing one pointer must not
  release another active owner. A focused hold button supports Space/Enter
  down and up with repeat suppression; blur releases its keyboard owner. Do not
  rely on pointer-only controls. Strike buttons remain native buttons.
- Space/Enter button activation must not also trigger a second pointer strike.
  Never handle A/S/D shortcuts while the user edits a text field.
- Hidden/departed pages end the passage and disconnect; returning never resumes
  audio without another explicit start. Quiet during preparation cancels it.
- All scheduling and final capture use actual processor acknowledgements.
  Common duration/Quiet remain audio-thread rules. A failed part invalidates
  saving the whole passage, with the affected part named.
- Completed ensemble files must be reopened by a dedicated bounded reader before
  the UI advertises an “Open saved ensemble” link. The ordinary reader currently
  does not support the ensemble kind.

## Scope and order of implementation

The existing diagnostic proves sample arithmetic and record reconstruction;
it is not a live host or a performance clearance. Preserve it as a comparison
fixture. First agree how to measure the target browser under the real command
and visual workload; report scheduling lateness separately from acoustic gaps.
Neither Node wall-time tails nor a muted exact capture prove an absence of
underruns. Do not declare the performance gate passed from either result.

Then build the isolated host/processor interface, bounded state snapshots and
lifecycle tests; integrate the three-scene page; verify actual gestures, Quiet,
contacts and saving against the offline record. Keep diagnostics out of the
visitor flow. Publish nothing and do not replace the existing single-Grove
entries. Any early local prototype remains explicitly experimental.

## What would make this worth continuing?

The creative question is whether a person notices and wants to explore the
relationship between the remaining sound and their next touch. Technical
checks cannot establish that. Invite a person to try it without a lesson, then
ask: “What did you find yourself listening for?” and “Was there anything you
wanted to do but could not?” Record their words only with their participation;
do not infer emotion, spirituality or preference from time spent or gestures.

Promising observations would be someone deliberately returning to a voice,
softening one while another continues, or describing an unexpected relationship.
These are observations to discuss, not a score or retention target. If the
instrument feels too quiet or opaque, investigate the sound and affordances
before adding decorative spectacle. Spirituality and psychedelia remain open
interpretations of attention and interdependence, not promised outcomes.


## Fable's first-minute review, incorporated

Reviewed in `fable-three-groves-review.md` and message 20261101T124330Z.
Keep identical initial strikes and declare that the three separate instruments
can have different levels; fixed gain is not equal perceived loudness. Explain
that the hand damps the struck body while its coupled neighbours can continue.
Refusals belong beside the affected voice. An optional “Show one gesture” can
be a second path once the basic unprompted encounter works; never automatic.

The proposed currentFrame-gap performance test is disputed: logical rendering
continuity is not hardware callback deadline evidence. The Web Audio processing
model distinguishes render quanta from system callbacks and defines underrun
in terms of callback execution load. See https://www.w3.org/TR/webaudio/#rendering-loop.
A contiguous captured stream cannot by itself establish glitch-free output.
This gate remains open; the review's underrun claims must not be adopted.
