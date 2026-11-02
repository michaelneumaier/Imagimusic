# A visitor phrase carried by another anatomy

Astra · 2026-11-02 · local work in progress

## Purpose

The inverse workshop now offers an authored three-touch gesture, individual touch comparison and kept anatomies. The next musical step is a visitor choosing which bodies and when, then carrying those choices to another fitted anatomy. This is a way to compose through instrument discovery. Attention, recurrence and the freedom to answer remain the experiential direction; no particular feeling or consciousness claim is prescribed.

Fable's assessment is in `collab/notes/fable-inverse-visitor-phrase.md`. Under the current model, moving connections during a ring would require a different time-varying simulation or re-rendering, and modifying them changes the fitted resonances. A short touch phrase uses the instrument's existing expressive dimensions honestly. Carrying a kept anatomy into the richer Grove passage world remains a later possibility with an explicit voice/model contract: those additional partials have not been fitted.

## Agreed first slice

Visit-local memory only. The visitor explicitly starts remembering from quiet after Start listening. Capture at most eight admitted manual touches within eight audio-clock seconds of the first admitted touch. The first touch defines time zero; waiting before the first touch consumes no phrase time. Remember body choices and relative timing, not monitoring gain, camera, the authored example or a Quiet cutoff.

Done completes the draft without stopping its natural ringing. Quiet stops sound and discards a new draft while preserving the previous completed phrase. Eight touches or passage beyond eight audio-clock seconds completes the draft automatically. A late touch is never silently included; its admission result distinguishes playing from being remembered. Replay starts from quiet through the same bounded gesture scheduler and allows natural model tails. Authored and remembered replay must not recapture themselves.

The interface must explain these semantics before capture: a phrase of touches, not a recording. Show capture count and the eight-second limit without a wall-clock countdown driving admission. A previous completed phrase survives an empty Done, cancellation and failed preparation. Search, reopening and candidate preparation are locked throughout active capture, including before its first touch. Pagehide cancels the draft. Successful new search/reopen clears visit-local phrase memory; failed/cancelled work retains it. No phrase is silently written into kept-anatomy v1.

## Implemented foundation

- `src/inverse/transport.js`: `strikeWithReceipt(body)` returns a frozen `{body,time}` from the same origin passed to `AudioBufferSourceNode.start`; overlap refusal returns null, other validation/lifecycle failures throw. Existing `strike(body)` remains boolean through the same implementation. Receipt means successful scheduling, not device playback or proof of hearing. Time is sampled after source creation, not guessed from pointer events or a later snapshot.
- Fable's `src/score/grove-inverse-phrase.js`: `createInversePhrase(receipts,{at,sampleRate})`, `validateInversePhrase`, `inversePhraseTransportEvents`. Frozen visitor-kind phrase with declared fixed impulse and sample rate; relative times quantized to that rate's sample period. Raw span is bounded before rounding. Exact receipt fields, nonnegative ordered times, dense arrays and declared sample-grid offsets are validated. The authored gesture shares event validation while keeping its distinct identity.
- `src/inverse/phrase-capture.js`: transactional begin/admit/expire/finish/cancel/clear and a read-only snapshot. A draft never replaces the last completed phrase until Done or a declared limit. Empty finish and cancel retain it. Receipt validation occurs before any draft mutation or late-receipt completion.

## Evidence

Node: seven transport tests plus three capture-lifecycle tests and three peer phrase tests passed. The receipt test advances the mock context during source creation and verifies that the receipt names the source's scheduled start rather than the earlier caller clock. Lifecycle checks cover previous-phrase preservation, empty finish, no-first-touch waiting, eight-touch completion, the inclusive eight-second endpoint, an out-of-window touch, reentrant begin and invalid input leaving the draft intact.

Native Safari 26.6.2 / WebKit 605.1.15 ran `tests/inverse-phrase-render.html`: **PASS, three rendered cases**, tolerance 1e-7. Actual OfflineAudioContext suspension boundaries at 8 kHz admitted bodies 2, 1 and 3 at 0.064, 0.432 and 0.864 seconds. The resulting phrase offsets are 0, 0.368 and 0.8 seconds. Capture versus replay on the same anatomy, aligned by their first-touch origins, has maximum PCM error **4.656612873077393e-10**. Against summed prepared PCM: capture error 4.656612873077393e-10; same-anatomy replay 3.4924596548080444e-10; other-anatomy replay 3.4924596548080444e-10. Every tail is exactly zero.

This diagnostic uses actual offline clocks, nodes, workers and scheduling receipts. Only lifecycle state is adapted to permit offline scheduling. It does not test native capture controls, live timing under load, device output or musical appeal. Brave's earlier strict raw-readback discrepancy remains recorded in the spatial-preview note; no privacy settings or tolerances were adjusted for this work.

## Encounter integration checklist

Astra owns inverse.html/css/main.js and the lifecycle; Fable owns the phrase contract and its tests. At foundation checkpoint 2488253, production UI had not yet been changed for phrase capture. The implementation and native evidence are recorded below.

1. Add an optional “Remember a phrase” disclosure with clear visit-local, touches-only, eight-touch/eight-second and Done/Quiet wording. Existing manual play remains the primary entry.
2. Use `strikeWithReceipt` for admitted manual actions; feed only those receipts to active capture. Keep authored and replay scheduling separate. Preserve existing visitor last-touch behavior.
3. Block search/open/prepare/authored/replay during a draft; finish from model-clock expiry in the render/control update and synchronously around manual admission. Guard transitions before side effects, including a touch whose receipt crosses the boundary during source creation.
4. Replay the completed phrase on the prepared instrument through `playGesture(inversePhraseTransportEvents(phrase))`. Explain source/current topology without claiming the visitor heard anything. Never replace phrase memory merely by replaying it.
5. Cancel draft on Quiet/pagehide; clear completed memory only after successful new search/reopen. Keep prior phrase on failed/cancelled work. Do not alter kept-anatomy v1.
6. Native capture → Done → Quiet → another anatomy → explicit replay → answering touch; then cancellation preserving a previous phrase, empty Done, time/event limit, and reset checks. Peer source review and evidence note before a local UI checkpoint.

Later: a distinct portable passage record embedding the kept anatomy and phrase, with its own model identity and replay validation. That is deliberately not implemented by silently extending the kept-anatomy record.

Boundary follow-up before UI integration: exact eight-second receipt intervals can subtract to 8.000000000000002, and adding eight to the origin can also round below the corresponding sample-clock endpoint. The phrase factory and capture lifecycle now share Fable's `inversePhraseSpanExceeded`, which distinguishes an actual excess from representation/subtraction error using 2·Number.EPSILON·max(8, |origin|, |time|). A lifecycle regression checked 6,132 windows across four sample rates and origins near zero, one minute, one hour and 24 hours: all exact endpoints retained; every one-sample-late touch excluded. Combined transport/capture/phrase/gesture tests: 16 pass. The earlier offline PCM evidence uses offsets below the boundary and remains scoped to those rendered cases.

## Visitor-facing capture integration — 2026-11-02

Implemented in inverse.html/css/main.js as an optional disclosure below the shared gesture. It explains the eight-touch/eight-second limit, visit-only memory, natural-tail replay, Done versus Quiet, and that anatomy files do not include the phrase. Manual strikes now use scheduling receipts; only admitted touches enter an active draft. Capture locks search, intake, preparation, authored gesture and phrase replay, including before the first touch. Expiry runs against the audio clock during controls and immediately before manual admission; a touch crossing the deadline during admission is played but explicitly reported as not remembered. Phrase replay uses the existing scheduler and never recaptures or changes last-touch memory. Source topology and numbered sequence remain visible; the cross-anatomy invitation appears only while replay is available.

Fable source review: `collab/reviews/20261102T0939Z-fable-reviews-inverse-phrase-ui.md`, approve. No model or file-schema change.

Native Brave checks (local no-store server):

- Fresh chain preparation is Silent. Opening the disclosure exposes the semantics; capture and replay remain disabled before Start listening. Explicit listening enables capture. Remember from quiet locks search and both candidate cards and the authored gesture before any touch; manual controls remain available.
- Touches **2 → 1 → 3**, then Done: summary “3 touches from the chain,” span **0.40 s**, with **3 ringing / 8** still active. Done therefore completes capture without cutting sound. Quiet retains the phrase and enables replay.
- Triangle preparation retains the chain phrase but is silent/disarmed. Start listening offers “Try your phrase on this triangle, too.” Replay shows three ringing responses and retains the chain sequence. A body-1 answer adds a fourth response and changes only the visitor's last-touch invitation, not the phrase.
- Begin a replacement, touch body 2, then Quiet: the previous chain three-touch phrase remains. Begin again and choose Done without any touch: “No new touches. Previous phrase retained,” with the same sequence and span.
- A one-touch draft automatically completes with “Eight-second window finished. Remembered 1 touch.” This is a native state observation; exact boundary correctness comes from the sample-clock regression, not wall-time measurement of the UI.
- Nine rapid manual clicks in a new draft: the first eight complete it, sequence **1 → 2 → 3 → 1 → 2 → 3 → 1 → 2**, span **1.71 s**, and the ninth is visibly refused by the existing eight-slot limit. The last-touch invitation remains body 2, the last admitted touch.

A replay status initially used “Playing…” and remained after Quiet. Changed the event wording to “Your phrase started…” so it cannot be mistaken for current ringing state; the separate ring count remains authoritative. Final reload and copy check follow before checkpoint. The capture and playback logic is otherwise unchanged from the native flow above.

Final native checks: a successful new search removed the phrase summary and last-touch invitation and disabled Play your phrase. Reloaded the final code, captured one body-2 touch, replayed and quieted it; the status correctly remained the past event “Your phrase started on the chain” alongside Silent. Desktop screenshot confirmed the expanded disclosure, wrap-safe button row, phrase summary and separate last-touch invitation are legible with clear spacing. No mobile-device claim.

Set the low target to 200 Hz while the middle/high stayed near 131/132 Hz, then searched: the ordered-frequency validator refused it and retained results. Play your phrase remained enabled with the original one-touch chain summary. Restored the starting input values afterward. Failed reopening, cancelled asynchronous jobs and pagehide cancellation were source-reviewed in this slice but not newly replayed natively. The existing capture-core tests cover cancellation preservation independently.

### Return foundation and home discovery — 2026-11-02

Added `capture.restore(input)` for a future validated portable intake. It refuses replacement during a draft, validates the original before copying (so JSON cannot hide invalid fields), validates and freezes the independent copy, and replaces completed memory only after success. Five capture tests pass, including mutation isolation and preservation after refused replacement; the 6,132-window boundary sweep remains included. This is a foundation API, not an exposed portable-file feature yet.

The project home now mentions the optional visitor phrase, explicitly limited to this visit, and its catalog gives the eight-touch/eight-second bounds. The archive links this evidence note. Native Brave on the local no-store server showed the updated invitation and catalog text; clicking “A phrase of your own” opened this notebook. No new layout or audio behavior was introduced by that copy update.

Portable contract decision sent to Fable: phrase v2 uses a precomputed declared-origin anatomy digest so manual capture stays synchronous; the enclosing passage embeds the full original kept anatomy and phrase, without a redundant origin field. Keeping should retain that original after comparison on another anatomy. A matching digest checks consistency, not authenticity. Pure schema work is assigned to Fable; capture/intake/UI integration remains Astra-owned. No portable save/reopen completion is claimed here.

### Portable phrase encounter — 2026-11-02

Fable's `460b7ea` supplies phrase v2 and a distinct `imagimusic-inverse-passage` v1 file. The completed phrase carries a digest of its declared original anatomy. The passage embeds that full kept anatomy, the phrase and a kept timestamp; no audio, gain, view, Quiet cutoff or fitted-status assertion. The digest checks internal consistency and is not an authenticity proof. The actual three-mass model and virtual-pickup realism limits are unchanged.

Astra integration computes the anatomy digest during silent preparation, before the mount commits. Draft and completed phrase retain separate full original records. A rejected preparation, cancelled draft or comparison replay cannot relabel the completed phrase. Keep remains available after switching anatomies and embeds the original. Opening uses the existing bounded local File reader and disposable worker, validates before replacing state, recomputes fit and installs the phrase. Previously prepared instruments remain retained, but the newly opened phrase cannot replay against that old instrument before preparing the new results. Listening and replay remain separate explicit choices.

`begin` validates all metadata before entering active capture. Real touch admission remains synchronous. The offline capture diagnostic was migrated to supply the actual prepared anatomy digest. The return diagnostic now tests passage File/worker roundtrip, semantic fields, fit/bounds, exact prepared PCM and mismatched-origin/foreign-model refusals. Its initial assertion used JSON string order and failed on canonically reordered keys; corrected to compare event and scalar values, not serialization order.

Evidence:
- Targeted schema/capture/job run passed 14 tests before the peer's added async-mutation regression. Fable reports full suite **651/651** at `460b7ea`, including current owned worktree tests. Final schema regression rerun is recorded in the review handoff.
- Safari 26.6.2: real File/worker diagnostic **PASS 12 checks**. Original fixture comparison covers 919,866 samples at maximum error zero; the additional portable-anatomy comparison also matches all three stereo strike buffers exactly.
- Safari migrated phrase render: **PASS three cases**, maximum reference error **3.4924596548080444e-10**, exact zero tails, shifted capture/replay error **1.776764417257003e-22**, tolerance 1e-7. Actual offline clocks and nodes, with the previously disclosed lifecycle-state facade; no device-output claim.
- Native Brave: fresh chain capture **2 → 1 → 3**, offsets **0, 0.4106666666666667, 0.6666666666666666 s**, rate 48 kHz. Done retained the natural ring. Quiet, prepare triangle, explicitly enable listening, replay, Quiet, then Keep: downloaded `imagimusic-phrase-chain.json`, **1541 bytes**. Independent Node reopening confirms original chain, those events, and within-tolerance fit.
- Reload and native picker opening produced one kept-chain card without starting sound. Prepare restored the visible three-touch phrase while Play stayed disabled. Start listening, Play, then body 1: live answer accepted alongside the phrase, whose sequence remained unchanged.
- Native picker opening a deliberately mismatched digest refused the file, retained the prior chain/results/phrase and kept Play available. Desktop screenshot confirms the keep action wraps cleanly onto its own line with readable explanation and separate last-touch panel.

Peer integration review `collab/reviews/20261102T0956Z-fable-reviews-inverse-passage-integration.md` approves with a nonblocking identity nit: repeated preparation of a newly found candidate creates distinct kept timestamps. No stable passage-hash promise exists across separate preparations or keep actions; caching such declarations is deferred. Replay at a different sample rate preserves stored event offsets but scheduling may quantize to that device's sample grid. Save records describe touches with natural tails; they do not preserve the visitor's stopping cutoff. No mobile, device-audio or listener-preference evaluation is claimed.
