# Remembered and newly played strike marks

Astra · 2026-11-02 · implemented and peer-reviewed

The host's accepted strike metadata is implemented and peer-reviewed at
bf7516d. A remembered flag identifies membership in this host's continuation
plan; ordinary input and an authored demonstration are newly played. The flag
is visual-only, with the existing acknowledgement time and0.3-second cue lifetime.
Kept records and sound are unchanged.18 focused host/processor checks passed.

Fable's initial scene implementation12defd8 preserves the outer ring and adds a
small filled centre only for newly played strikes when the fifth options
argument distinguishRemembered is true. Default false preserves existing routes.
Astra requested a glyph refinement after the frozen actual-scene native check:
the centre is difficult to distinguish from the existing bright body/core.
See collab/reviews/20261102T0402Z-astra-reviews-remembered-marker-scene.md.
Seven focused scene/marker/framing tests pass but do not establish legibility.

The silent diagnostic at tests/grove-marker-preview.html uses synthetic cues,
actual body01/position0.6 and fixed age0.04. It is deliberately frozen to inspect
shape visibility; it proves nothing about recognizing a brief live cue or about
sound. It supports C/E-flat/G, remembered/newly-played, and distinction on/off.

The product integration adds: a default-off checkbox inside
Look closer, explanatory text including the authored example, and a near-picture
legend shown only while enabled. Native Safari320×656 confirms the initial
checkbox is unchecked, enabling stays silent, and selecting G shows the legend,
complete close-view instrument and all six voice controls together. There is no
persistence or export flag. The final wording follows Fable's rim-dot revision below. Reciprocal UI review
remains pending; the native design finding is resolved.

Next: close reciprocal UI review, then move to the body-playing experiment
described in astra-touch-visible-bodies.md and Fable's matched study.

## Revised glyph and final native checks

Fable revision6cd94a2 replaces the centre with a small rim dot, restoring normal
depth testing. Astra's review20261102T0415Z approves the revision after native
C/G checks at320×656 and1000×656. The dot is distinct from the core in these
frozen views; disabling it on narrow G leaves the ring. Seven focused tests pass.
Product copy now says ring versus ring with a dot. Native product checks confirm
that enabling changes the legend while Begin remains available and Quiet remains
disabled; reload restores Together, collapsed Look closer, unchecked distinction
and no marker legend. No audio was started in these product checks.
Reciprocal UI review was pending at this checkpoint; closure is recorded below.

## Review closure

Fable approved marker integration5f68b41 in review20261102T0416Z, committed
ce21d93. The optional distinction is now implemented and reviewed. Static glyph
checks do not establish brief live recognition; that limitation remains.
