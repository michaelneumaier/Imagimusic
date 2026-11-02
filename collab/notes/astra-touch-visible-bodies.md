# Touch the body you see

Astra · 2026-11-02 · body-button integration implemented and peer-reviewed

The close view reveals a meaningful unused possibility: each Grove contains
three modeled, connected bodies, but the ensemble's main Play buttons strike
only body01. Letting someone choose the body they excite could make the
instrument's anatomy consequential in their hands. This follows the original
sound/body idea more directly than another layer of keeping machinery.

## Original interaction proposal

In an optional close view, expose three explicit buttons: Play body01, Play
body02, Play body03 of the named Grove. Only one Grove's body controls appear
at a time; Together hides them. Use the actual existing strike position and
velocity so only the chosen body changes. Require the same explicit Begin and
handoff gates as the main controls. No sound merely from choosing a view.

Keep the existing three-voice controls intact initially. Their shortcut keys
still strike body01. Soften still rests on body01, explicitly described next to
the new body controls. This is a genuine limitation: it lets someone excite a
neighbour while damping body01, but does not offer arbitrary simultaneous hands.
Do not silently change the target under a held pointer or keyboard owner.
A later, separately designed hand interaction can make each body touchable.

The body numbers must be plainly identifiable in the picture before this is
called discoverable. Existing tiny floor labels may be insufficient. Any static
identification cue should point at the actual body, not move it or suggest a
change in sound. This deserves a native narrow check, not only a raycast test.

## Direct touching, after labelled controls work

Allow a deliberate tap on a visible shell to trigger that same accepted strike.
Do not require pointer precision: retain the labelled buttons for keyboard,
assistive input and a canvas-free route. Distinguish a tap from scrolling; a
pointer cancelled by scroll must never become a strike. Do not let an input
handler fabricate a successful cue before the audio acknowledgement. No dragging
to retune, arbitrary continuous force, or simulated hand physics is implied.

## Evidence requested before implementation

Fable is assessing admission and record/continuation/return support for bodies1
and2 and producing matched response evidence. We need to know that the current
recipes offer a useful difference without assuming that three bodies mean three
independent notes. They are coupled members of one instrument; striking another
member changes how the existing modes are excited. Any listening description
must come from an actual audition, not spectral summaries alone.

A meaningful experiment is one phrase played on body01, then the same gesture on
a neighbour, then the visitor's choice. No correct answer or ranking. Ask what
changed and what they wanted to touch next. Do not imply that a body choice
reveals emotion, identity or an intended spiritual state.

## Ownership and order

Fable: recipe/admission/record assessment and matched study artifacts under his
existing ownership. Astra: encounter design, labels, input and lifecycle once
the contract is agreed. Finish the optional marker distinction first; keep the
two experiments separately reviewable. No new schema presumed necessary; verify
that assumption from actual supported paths before exposing the new gestures.


## Implemented checkpoint

The optional close view now exposes three labelled buttons for the viewed Grove.
All six main voice/hand controls remain, always targeting body01. Begin and the
existing active-input gate govern the new buttons, including the remembered
opening and handoff. Together hides them. Selecting a view sends no gesture.
Labels use the scene's existing numbered sprites, lifted above their actual
bodies and enlarged only in close view; saved ordinary transforms and material
attenuation are restored in Together. No engine, scene source or schema changed.
The initial small label scale failed the narrow check; final scale0.56/0.28
reads clearly above C and E-flat at320×656 and G at1000×656. These are desktop
Safari responsive checks, not phone hardware evidence.

Five production host/processor continuation tests pass, including remembered
body02 followed by newly played body03, correct acknowledgement-driven markers,
kept body indices and exact offline reconstruction of captured processor PCM.
The test waits for the visual snapshot as well as acceptance: an acknowledgement
can arrive before the snapshot clock reaches the accepted strike.

Native evidence in renders/ensemble-body-live:
- source.json: C body02 at frame0, C body03 at12799, G body02 at218751;
  48kHz, ending229247, fade1200. All use position1/velocity0.5.
- continued.json: those three remembered strikes retain their exact times and
  bodies; a new G body03 arrives at541696 after boundary229247.
- report.json: independent verifySeededEnsemble against the saved source returns
  all checks true, no refused/unprocessed steps, timingChanged false.

Observed: disabled before Begin and during preparation, enabled after handoff,
disabled after Quiet. The remembered interval itself passed between browser
observations; its exclusion is covered by the real processor test and shared
active gate, not claimed as a captured native screenshot. Together restores the
ordinary floor-label view and removes the extra controls. Replay remains static.
No subjective hearing, perceptual superiority, physical strain or device output
claim follows from these checks. Direct shell tapping was the next slice at this checkpoint.

The home now describes the numbered body choices, links the four authored
comparisons and opens this note from its notebook. Native home navigation
confirms the updated invitation and the formatted note. Accessible button names
start with the visible “Play 01/02/03” text and then name the selected Grove.

## Review closure and direct interaction

Fable approved405c80a in review20261102T0430Z (48d023d). The later direct-tap
prototype is documented separately in astra-direct-body-taps.md; it keeps these
numbered controls and the same acknowledged strike path.
