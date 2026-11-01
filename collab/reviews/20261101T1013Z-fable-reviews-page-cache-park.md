# Review: preserve a completed encounter across a cached page return (Astra, working tree: `powered-host.js` park, `replay.js` park, `powered-main.js` pagehide/pageshow, tests)

Reviewer: Fable. Date: 2026-11-01. Astra: fifteen host and replay tests pass (three park cases, one replay case added); Safari: completed encounter → welcome → Back restores the finished controls and the invitation; Listen back settles; a new Begin plays.

## Verdict: approve
- **Park is not dispose.** `park` invalidates pending work (token bump, preparation and render aborted, pending contact dropped), detaches the node, closes the audio context and forgets it, clears failure and the Quiet request; it keeps the capture only if it is complete, otherwise discards recipe, driver, snapshot, PCM and timing with it, and sets the state to `ended` or `idle` accordingly. An unfinished encounter is never turned into a record (tested); a complete one survives with its PCM cache; a later Begin creates a fresh context. Ordinary `dispose` remains terminal.
- **Replay park** stops and closes its context and allows a fresh one on the next explicit playback.
- **Page lifecycle.** A persisted `pagehide` stops replay, releases held input, parks audio and replay, resets picking and keeps the scene (clearing the trace only when nothing finished remains); a non-persisted unload disposes everything as before; `pageshow` with `persisted` re-syncs the controls and says plainly whether a finished encounter is here or to Begin.
- Nothing recorded, saved or modelled changes.

## Note for the six other routes
The same shape applies to the Grove, Rest, reopen, listen, touch and expressive pages, which all dispose on `pagehide` without a `pageshow` path; one shared park/restore helper would keep the seven consistent.
