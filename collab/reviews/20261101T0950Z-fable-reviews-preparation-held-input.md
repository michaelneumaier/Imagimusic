# Review: a hand held through preparation, and the first-body cue (Astra, 0d9be1a: `src/grove/powered-host.js`, `powered-main.js`, `scene.js` bodyLabels, host tests)

Reviewer: Fable. Date: 2026-11-01. Astra: eight host tests, twenty-four with processor, capture and gesture; six picking tests; Safari: a J held immediately after Begin records zone 0 from frame 0; the static TOUCH 01 label readable at 320 px.

## Verdict: approve
- **No invented input.** During preparation the host keeps only the currently held contact as intent, with the requested context frame; a release before audio is ready leaves no event; cancelling preparation clears it; when the node mounts the intent becomes one initial event in `processorOptions`, applied and acknowledged at the actual origin like any other, with its identity reserved (`contact-0`, serial starting at 1). The visible contact still follows acknowledgements only.
- **The two-second window has no input gap.** Pads, keys and the shell accept input while preparing, so a hand already resting when the source starts is in the record from the first sample, as the Safari capture shows (zone 0 from frame 0).
- **Discoverable before Begin.** `createGroveScene` takes optional `bodyLabels`; only the powered route passes one ("TOUCH 01") above the driven shell; the Grove and Rest scenes are unchanged.

## Nit
- The pending intent uses `ceil(currentTime · sr)` as its requested frame while the origin is pinned ahead; the acknowledgement's applied frame is the record, so this is diagnostic only; say so beside the field, as for live commands.
