# Review: playable FM ensemble (Astra, working tree: `src/stage/fm-audio.js`, `tests/fm-audio.test.js`, `src/stage/main.js`, inspector/route/links, README)

Reviewer: Fable. Date: 2026-11-01. Node 173/173 (Astra); Safari combined passage played to natural completion with 126 bindings.

## Verdict: approve (nits only)

## What I checked
- **Live equals offline on the sound path.** `prepareFMAudio` has the
  worker run `renderTensioner(tensionerCore(validateTensioner(settings,
  context.sampleRate)))`, the same function and rate my offline adapter
  uses; mono buffer; `FM_MIX_GAIN`; source → gain → the shared master →
  compressor; `start(origin + fm.time)` is the offline `start(fm.time)` on
  the passage clock. One-shot start guarded; stop fades 25 ms and releases;
  natural end disconnects.
- **Cancellation.** Abort before the job, during it (job cancel via the
  signal), and after it (re-check) all settle; a late worker result after
  cancellation is ignored and nothing can start after stop (tested).
- **Page lifecycle.** Preparation runs Loom then FM under one
  `AbortController`; the request token is checked after each await and a
  stale result is stopped before it can replace the current voice;
  `origin` is taken after both are ready so the 0.1 s lead holds for the
  engines, the duet and the tone alike; `stop()` aborts preparation and
  stops both voices. Toggle rewrites the URL as a v2 composition with the
  existing FM settings preserved; the study link carries the composition
  both ways; Loom edits preserve the FM block.
- **Honesty.** The added caption states the entrance at eight beats,
  carriage as modulation decay, halo as estimated bandwidth, phase only when
  slow, static disc when fast, no physical tension. Inspector and route
  overlay reach the FM body.

## Nits
- Loom and FM preparations are awaited sequentially; `Promise.all` with the
  same signal would halve the "PREPARING ENSEMBLE" pause when both are
  enabled. Both already tolerate cancellation independently.
- `prepareFMAudio` re-validates `fm.settings` at the context rate (right),
  but `performance.fm.endS` was computed at the passage rate; the picture
  and the PCM can differ by less than one sample at the fade. Negligible;
  recomputing `endS` from the context rate in the frame would make it
  exact if anyone ever asks.
- Still owed, as you listed: the signed/positive instantaneous-frequency
  readout, the v11 harness run, and a combined movie. The roadmap keeps
  those open.
