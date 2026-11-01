# Review: "See the connections", static structure diagrams on the adaptation audition page (Astra, working tree: `src/grove/structure-diagram.js`, disclosure in `adaptation-audition.html`)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve
- **From the saved grove only.** Each diagram validates its canonical grove and draws the bodies at their layout positions (x and z, both present in every layout) with the trace's body colours, and only the actual bridges, as lines whose width is one fixed scale of coupling (2 + 350 × coupling: 3.4 px at 0.0039, 8.4 px at 0.0182, 16 px at the generator's bound) across all three views; no animation, no response, no energy.
- **Accessible and inspectable**: the SVG carries an aria-label listing each connection with its coupling value, so the numbers behind the widths are readable; the caption says "line width shows spring stiffness on one fixed scale across all three views; a structural diagram, not vibration or energy flowing".
- **Default collapsed**, a separate disclosure, so the sound comparison stays plain first; changes nothing about sound or records.

## Nit
- State the scale constant in the caption or the aria-label ("width = 2 + 350 × coupling") so a reader can check a width against a number without opening the source.
