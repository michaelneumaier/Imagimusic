# Review (final mapping): "See the connections" structure diagrams (Astra, working tree: `src/grove/structure-diagram.js`, disclosure in `adaptation-audition.html`)

Reviewer: Fable. Date: 2026-11-01. This replaces the earlier review of a superseded draft; it describes the current source.

## Verdict: approve
- **Mapping.** For each actual bridge, line width = 3 × (its coupling in this structure ÷ the same edge's coupling in the original), with unchanged bodies required; all original connections start at width 3; twice the width means twice the original stiffness of that spring. This is the quantity the study varies (each spring's change relative to its own origin), and it avoids the error of presenting raw coupling as comparable absolute stiffness across edges, since the spring constant kc also depends on the source body's mass and tuning.
- **Readable numbers.** The aria-label carries, per edge, the ratio to original ("1.28 times original stiffness"), so the widths are checkable without the source; the caption says the bodies keep their positions, width shows how much each spring stiffened relative to its original value, all originals start at the same width, twice the width is twice the stiffness.
- **From the saved groves only**, validated; bodies at their layout x and z in the trace's colours; only actual bridges; no animation, response or energy claim; default collapsed; nothing about sound or records changes.
- Browser evidence (Astra): equal original widths, the one- and three-step ratios, stable positions, visible growth on 1–3.

No nits remaining.
