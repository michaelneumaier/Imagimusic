# Coming closer to a Grove

Astra · 2026-11-02 · proposed next encounter experiment

## Why this follows memory and response

The remembered-opening milestone makes continuity playable. Its next useful
complement may be perceptual: the same instrument and sound, seen at a scale
where someone can follow the struck body and its neighbours. The current
three-wide composition compresses each whole Grove, particularly at phone
width. The project's original promise joins sounding bodies and music; more
record machinery alone does not make that relationship easier to encounter.

## Small playable experiment

Keep the existing wide view as the default. Offer a collapsed “Look closer”
choice below the voice controls: Together, C, E-flat, G. Choosing a voice moves
the view immediately to that intact Grove, at a useful scale. All three remain
audible and their Play/Soften controls remain available. A persistent caption
names the viewed Grove and says all three remain audible. Together restores the
exact current framing. No automatic follow, moving camera, new sound, mute,
solo, input changes or remembered view between visits.

The close view should reveal existing internal bridges and acknowledged marks;
it should not add invented energy trails or reshape the bodies. Geometry,
response state, timing and modeled relationships remain identical. This is a
camera choice, not a new physical model or a claim about inner experience.
Replay continues to disclose that its picture stays still.

Keep the canvas/voice controls adjacent, preserving the recent narrow layout
improvement. Choices belong after the controls rather than between them. The
caption can occupy the existing picture note. When WebGL fails, hide the view
choices and retain the usable sound controls and existing fallback message.
Keyboard and assistive activation use native buttons with explicit pressed
state. The view must be usable before Begin, while playing, after Quiet, and
during replay without starting or stopping audio. Reduced motion receives the
same immediate static framing change, with no transition animation.

## Implementation boundary

Astra: ensemble.html/css/main.js and a small camera-framing helper if useful.
Fable: critique the musical/experiential premise and propose a complementary
experiment under his existing ownership. No renderer/model edits are required.
Inspect actual geometry bounds before deciding camera distance; no guessed
clipping accepted. Keep all scene transforms unchanged, avoiding any suggestion
that choosing a view moves an instrument in the sounding world.

## Evidence and open question

Native wide/narrow checks must show the selected intact Grove without clipping,
readable state and an immediate way back. Verify changing view during playing
leaves the host state and available controls intact; Quiet still works. Review
code paths to confirm view selection never sends audio commands. This proves
interaction and framing only.

The creative question remains for a listener: does coming closer reveal a
relationship worth following, or does it distract from the three-voice whole?
No subjective verdict will be inferred from renderer correctness. If the
picture is too abstract to make an internal response clear, keep that limitation
visible and investigate the representation rather than promising causality that
cannot be seen.

## Prototype checkpoint

Camera-only prototype is in the working tree (not yet approved or committed):
world.js optional focus, view-framing.js sphere fitter, ensemble view controls.
Two frustum/depth tests pass. Native Safari at320×656 on localhost confirms
silent view selection, selected-button/canvas/caption updates and intact C
geometry. The first 127.0.0.1 check exposed a cached older world module; a fresh
localhost origin loaded the new API. No browser-wide caches were cleared.

The first screenshot also reveals a design limitation: a sphere enclosing the
whole artistic support is too conservative. C enlarges, but not enough to make
its bodies inviting. Actual scaled scene bounds are about3.41×1.96×3.27; the
sphere includes depth that the chosen camera angle does not need on screen.
Next: fit the oriented box against the actual view frustum instead, retaining a
small deformation margin, then inspect all three, wide/narrow restoration and
per-body demonstration response. Do not declare this prototype shipped from
the two passing camera tests. Audio/playback tests and peer review remain.

## Refined prototype evidence

The sphere fitter is replaced by a box fit against the camera's actual horizontal
and vertical perspective limits at each corner depth. The selected instrument's
world-space box gets a0.12 margin; scene roots retain their transforms. Other
roots are hidden only from this view, named in the explanation. Together restores
the saved camera position/quaternion and all three roots. Refitting occurs only
on selection or viewport resize, not every animation frame. Optional close view
uses240px canvas height at narrow width; the default wide view stays170px.

Three tests pass: all box corners inside the frustum across four aspect ratios
and three positions, tight side fitting; invalid/depth-clipped input refusal
without camera mutation; all three actual scene bounds retain maximum display
deformation and hand marks within the framing margin. These are geometric tests,
not acoustic or appeal evidence.

Native Safari320×656 shows the intact C closer, with its internal bridges and
acknowledged hand ring visible during the authored demonstration. Individual
body pulse differences remain too subtle to claim clear discrimination from
these screenshots. The existing separate envelope[i] mapping is unchanged.
At1000×656 the E-flat close view, G selection, a fresh personal passage, Play C
while C is outside the view, Together during the passage, and Quiet all work.
The ending offers normal keeping. A short caption immediately above the canvas
names the looked-at Grove and keeps the all-three-audible explanation nearby.
No subjective listening, phone hardware or improved response-legibility verdict.

For module-cache-independent native iteration a temporary local preview on8081
serves Cache-Control:no-store. The regular8080 runtime is unchanged. Local server
session54747; stop it after prototype verification is complete. The current
browser is on8081, desktop1000×656, passage ended with Quiet.

## Final native interaction check before review

Explicit Listen back remains in its playback state while choosing C and then G;
Quiet settles it with keeping available. Silent memory preparation succeeds,
the remembered opening retains view controls while playing controls are locked,
and changing G to C across the handoff preserves the expected Your turn state.
Play G while viewing C and Quiet produce the usual continued-passage keeping
surface. This confirms reachable controls/state, not a new audio parity claim.

A final arrival refinement focuses the short caption and scrolls it into view
immediately after selection; Together focuses the canvas. Both have tabindex-1,
so these are not added Tab stops. Native320×656 now shows sticky Begin/Quiet,
the all-three-audible caption, the complete G picture and all six voice buttons
in one viewport. Together restores all three intact Groves and the original
170px canvas. No animation transition is introduced. Reload defaults to Together.
The browser is idle after these checks, at the temporary8081 preview.

Implementation review was requested from Fable; no final approval received at
this checkpoint. The optional view is an inspection aid; clearer per-body
response discrimination and subjective appeal remain unproven.
