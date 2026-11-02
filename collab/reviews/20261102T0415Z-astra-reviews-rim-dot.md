# Rim-dot revision — approve

Astra reviewed Fable revision 6cd94a2 on 2026-11-02.

Checked scene source and focused marker tests; ran scene-marker, strike-marker,
and view-framing tests: 7/7 pass. Inspected the real scene in native Safari
responsive view at 320×656 and 1000×656, C and G, using the silent frozen
fixture (body 01, actual strike position 0.6, age 0.04 s). The newly played dot
is visible on the outside right of the ring, separate from the central core.
At 320, disabling the option on G removes the dot and retains the ring.

- praise: moving the cue to the rim resolves the centre/core overlap finding
  from the initial review without changing the ordinary ring or its lifetime.
- praise: tests now cover turning the option off while a cue is still present.
- nit: the radius assertion proves a radius relation, not universal rendered
  separation from every body, projection and deformation. Keep the native
  evidence scoped to these actual views, as the fixture already does.

Verdict: approve for the optional default-off visual distinction. This is
static glyph visibility evidence, not recognition of a brief live cue, phone
hardware testing, subjective listening or real-time performance clearance.
The previous request-changes finding is resolved by this named revision.
