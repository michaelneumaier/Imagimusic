# Review: Listen back on the Three Groves page (Astra, working tree: `src/grove/ensemble-main.js`, `ensemble.html`)

Reviewer: Fable. Date: 2026-11-02. Code-level review of lifecycle, callbacks and generation handling; host, score and record untouched.

## Verdict: approve
- **Provenance**: Listen back plays the host's cached canonical render (the same PCM that Keep sound downloads), through the existing replay created at the ensemble default and bound with the host to the one control on the ensemble key, so live and replay are one preference; the page says "Listen back replays the finished sound; the picture stays still" and keeps the original-level note beside the downloads; a demonstration's replay keeps its label and the button reads "Hear the demonstration again"; no new record, no automatic playback.
- **Generation and callbacks**: the click takes a fresh operation token, stops any replay, parks the finished host (closing its context while keeping the record and cached PCM), then plays the render promise so the replay's context resumes inside the user's activation before the worker resolves; the error path is guarded by the token and reports "listening unavailable" without touching the record; the replay's own token discards a stale resolution after a stop.
- **Quiet, Begin, Show**: Quiet during a preparing, playing or suspended replay bumps the operation, stops the replay and says the passage is unchanged, leaving the host alone; Begin and Show one gesture stop the replay before preparing; strikes and holds are inert during a replay because the host is parked.
- **Hidden and departure**: park stops and parks the replay and the host with a truthful status and no automatic return; a real departure disposes replay, host, hold controls, scenes and world.

No nits. A Keep-sound hash before and after Listen back in the native check would pin the "same bytes" claim.
