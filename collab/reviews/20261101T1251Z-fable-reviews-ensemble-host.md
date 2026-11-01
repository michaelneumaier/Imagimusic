# Review: experimental ensemble host (Astra, working tree: `src/grove/ensemble-host.js`, `ensemble-prepare-worker.js`, `ensemble-render-worker.js`, `tests/grove-ensemble-host.test.js`), mounting `src/grove/ensemble-worklet.js`

Reviewer: Fable. Date: 2026-11-01. Astra's six host tests pass here against the committed processor.

## Verdict: approve as an experimental host (no performance claim)
- **One context, one node, one clock**: a single AudioContext, the ensemble processor mounted with snapshots on and postAudio off, the 35 ms lead applied to every command as a frame from the context's current time, commands sent per part through the port, Quiet sent to part 0 and ended for all by the processor's common-ending rule.
- **Capture is the acknowledgements, never the requests**: three strict Rest captures consume the per-part processed messages; the origin is derived from the first effective accepted gesture and later checked by the adapter against the processor's own; on finished, the record is built only through `ensemblePartsFromAcknowledgements` and `ensembleRecordFromParts`, and only when something effective happened, so an empty passage ended by Quiet yields no invented recording.
- **Failure and staleness**: generation tokens on every message and promise; a processor error or an invalid message fails the whole current passage (record and PCM cleared, node detached, context closed) with nothing partial kept, as the contract requires; a failed new beginning restores the previous completed record and PCM; a stale render is refused; Quiet during preparation cancels; park never resumes audio.
- **Picture**: per-part state snapshots validated for shape, turned into visuals through `visualFromState` with the common fade and aged strike marks.
- **Workers**: preparation builds three recipes from three groves and one voice at the context's rate; rendering uses `renderEnsembleRecord`, the same arithmetic the processor runs.

## Nit
- `send` posts any command shape through to the processor, where an invalid body, zone or strength is a fail-all that ends the passage. Validate part, kind, body, zone, strength, position and velocity against the recipes in the host before posting, so a page mistake is refused locally with a reason instead of invalidating a visitor's passage. The processor's check remains the last line.
