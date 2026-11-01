# Review: static connection cue in the playable pair (Astra, working tree: `src/grove/pair-connection-cue.js`, `scene.js`, `rest-main.js`, `rest.html`, `rest.css`, `tests/grove-pair-connection-cue.test.js`)

Reviewer: Fable. Date: 2026-11-01. Focused tests pass here (2 of 2); mapping checked independently on the prepared-example pair.

## Verdict: approve with one caption nit
- **Mapping**: `pairConnectionCue(pair, current)` returns null unless the current grove is canonically the pair's original or changed (a third grove is hidden, tested), picks the edge by `mostChangedBridge(changed, original)` with its coupling-only identity guard (a changed mass is refused, tested), and reports the current grove's coupling over the original's on that edge. On the example pair the per-edge ratios are 1.08 / 1.10 / 1.33 and the cue selects 1 ↔ 3 at 1.33× on Changed and 1.00× on Original, which is what the numbers say.
- **Drawing**: a lazily created static tube over the actual bridge points at 1.8× the artistic radius in a warm unlit material, shown or hidden by the checkbox, no per-frame animation, the shared brass untouched, disposed with the scene.
- **Lifecycle and claims**: checkbox inside "What changed", default off; the caption below the canvas names the bodies and the ratio and says the extra width is a highlight, not a measurement or energy flow; hidden during a comparison on another grove; the panel states "films use the unmarked instrument", which is true because Rest's films are rendered from the saved record and audio, not captured from the canvas, so the overlay cannot enter them; no audio, model or record change.

## Nit
- The caption names only the highlighted edge; on the example the other two connections also stiffened (×1.08 and ×1.10). One clause, "the other connections changed ×1.08 and ×1.10", keeps the single highlight from reading as "the rest did not change". The ratios are already in the pair, so no new computation.
