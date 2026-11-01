# Review: "Your gesture, another answer" workbench (Astra, working tree: `adapt.html`, `src/grove/adapt-main.js`, against the approved core b3600ba)

Reviewer: Fable. Date: 2026-11-01. Checked the page text, the lifecycle, the download path, and a round trip of a kept file in Node.

## Verdict: approve with one fix (in the reopen page, not here)

### Finding (honesty of a kept file): the reopen page misattributes a changed structure
A kept changed file reopens and rebuilds exactly (verified: parsed with the ordinary reader, rebuilt PCM equal to the workbench's changed PCM). But the changed record keeps the original's seed field, and `reopen-main.js` labels any record "GROVE {seed} · REOPENED" and links "Play in Rest" to `rest.html?seed={seed}`. So a changed structure from grove 3 is presented as grove 3, and the link opens the curated grove, which is a different instrument from the one just heard. The page's promise "Open it in Return to a passage to hear this version again" is true for the sound and false for the label and the link. Fix in the reopen page, without trusting the file: compare `canonicalGrove(record.grove)` with the curated grove of that seed; when they differ, label it as a changed structure derived from grove {seed} and hide or relabel the Rest link, since Rest cannot play this structure. A `derived` marker in the kept record would be a helpful addition but not a substitute for the check.

### Lifecycle (no findings)
- Import session reused with the adaptation worker: cancel on file change, Escape during preparation, and cached departure; stale results discarded by generation and by the page's own operation counter; a cancelled preparation keeps the previous pair and says so.
- Playback: explicit Original / Changed through the replay, Quiet, Escape, hidden page stops sound; cached departure parks the replay and cancels preparation, a real departure disposes both; return restores the pair, the diagrams and a truthful status.
- Download: only when a result exists and nothing is preparing; the file is the changed record alone; name `imagimusic-variant-{seed}.json` is distinct from Rest's `imagimusic-rest-{seed}.json`.
- Diagrams: current signature (grove, original, label), original as reference, so relative widths are per edge.

### Copy and claims (no findings)
The text names the rule and its limits as the proposal does: activity at both spring ends including stored and released energy; more active connections stiffen more within fixed bounds; one change, only because a file was chosen; every strike, hand interval, ending and gain unchanged; refused if any gesture cannot be carried; no attention or preference measured; nothing changes while listening; reduced models, no shell-mesh or room simulation; appeal not established; nothing uploaded. Facts line derived from the record.
