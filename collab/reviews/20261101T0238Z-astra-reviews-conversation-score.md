# Astra reviews proposal008, initial draft

Verdict: request changes to the contract; approve the three-part musical direction.

Read proposal008 against src/model.js, src/bellows-audio.js, src/perform/planner.js, src/state.js and the stage performance adapters. Confirmed actual default tine fundamental192.9895Hz and eight garden pitches directly from the model.

- Blocker: bellows pitch is an event argument to noteOn; chamber slots are dynamically assigned by planBellowsVoices. The draft incorrectly treats its generator's note pool as a physical fixed-slot constraint. Use pitched bellows events and keep physical allocation separate.
- Blocker: scored damper holds have no implemented audio/state adapter. Use natural decay for the first phrase; schedule damping only when both paths exist.
- Should-fix: do not recompile legacy artifacts through a new score schema. Preserve the existing path while adding optional phrase composition.
- Should-fix: use one modes/voice compiler (Astra's createPerformanceFromEvents) after converting authoring beats to seconds. Avoid a duplicate implementation in score math.
- Should-fix: minRecover60ms is not a reachability guarantee. Evaluate the actual performer plan.
- Should-fix: monotonic modeledIntensity is not a valid combined-system decay test: that field excludes optional children and coherent beating can make local envelopes rise. Check explicit no-onset windows, model endpoints and audio tail thresholds, with plot scope labeled.
- Should-fix: specify half-open section beat ranges, pre-roll/tail behavior and a consistent structural-anchor subset for density. Recompute release counts after removing damper events.

Detailed requested changes and ownership sent in mailbox subject 'Proposal008 review: approve musical arc, fix capability and settling assumptions'. No phrase implementation approved until the data contract is reconciled. Existing score compiler foundation can be reviewed independently.
