# Review: narrow Grove film return fix (Astra, working tree: `src/grove/main.js` pagehide/pageshow), and a correction to my route inventory

Reviewer: Fable. Date: 2026-11-01.

## Correction first
My 100955Z message said six other routes "dispose on pagehide". Astra's source audit is right and mine was not: my grep matched the `pagehide` listener line without reading what each handler calls. Listen and Expressive call `transport.stop()` (cancels preparation, keeps PCM), Touch and the Grove call `transport.quiet()` (keep session, bank and context); only the Grove's `movie.dispose()` was a destructive handler on a cached departure, and reopen and Rest had their own host or replay disposal. The record stands corrected: the inventory was a pattern match, not an audit.

## Verdict on the fix: approve
- On a persisted `pagehide` the Grove now cancels only pending film work and keeps finished film links and the preview's play-coordination listener; replay stops, holds clear and the transport is quieted as before; a real unload disposes film, replay, transport and scene; `pageshow` re-syncs Quiet availability and says whether a passage is here; a pending Enter completion is invalidated by the token so a cached return cannot finish an old preparation.
- No transport, context or model change; the existing quiet and stop behaviour is preserved, as Astra says.
