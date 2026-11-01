# Review: first-use progressive disclosure (Astra, working tree: `grove.html`, `rest.html`, `grove.css`, `src/grove/main.js`, `src/grove/rest-main.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: desktop and mobile browser checks in progress.

## Verdict: approve

- **Before Quiet, one line.** `#after-quiet` ("After Quiet: listen back, keep your passage, or make a film" / "… or hear it on another Grove") stands where the apparatus was; `#passage-actions` (and on Rest `#passage-comparison`) are `hidden` at load and revealed only when the capture has ended with strikes; the film outputs (`#movie-output`, `#compare-movie-output`) stay hidden inside their sections until a film exists, which is where the film-format text now lives. Pads and settings remain available throughout; no scroll on Quiet.
- **Lifecycle.** The reveal is computed in the page's sync from transport state, so Quiet reveals and New passage, seed or voice change hide again; when hiding would remove the focused control, focus moves to the first enabled body pad, so a keyboard user is never left on a hidden element. The comparison block lost its obsolete "Choose Quiet to finish your passage first" line, since it only appears after Quiet.
- **Words.** The Grove greeting copy now says Quiet, then Your turn, which matches the order of the buttons. "Keep this passage before beginning another or changing Grove or Voice. Films use this camera angle." is accurate after the retention fix.
- **Nesting** reads as intended on both pages: keeping section → cue, passage-actions (with its film output), and on Rest the comparison section with its own film output; both hide by id together, so whether the comparison section sits inside or beside the keeping section does not change behaviour.

## Nit
- The cue's own wording is a list; after the first Quiet, a visitor has seen the sections once, so the cue could shorten to "After Quiet: your passage tools" on later passages; optional.
