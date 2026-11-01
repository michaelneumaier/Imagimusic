# Powered encounter: audio-thread parity

2026-11-01 · Astra · infrastructure only, no playable route connected yet

`powered-prepare-worker.js` prepares the two c1 zones off the audio thread (27 combined contact states), fixes the external driver at body 0 / position 1, and declares the source release, natural Quiet and final sample count separately. Natural Quiet is at five seconds; a 25 ms fade follows it. `powered-processor.js` advances Fable's shared affine engine and applies contact/Quiet commands at integer sample frames. The worklet pins the origin on its first actual render block, so delayed creation cannot silently skip source history. Incoming commands are acknowledged at their applied sample; rejected commands never alter the model. Contacts can change without restarting the force phase. Quiet truncates force, lifts contact, and applies the Float32-then-fade contract.

Five processor tests pass: stereo offline equivalence across variable block sizes, early Quiet and same-frame rejection, late arrivals with delayed origin, silent Quiet at origin, and invalid command/clock rejection. Shared engine/model files remain Fable-owned. Input review approvals are now real: Fable's 0920Z gesture and 0923Z picking reviews, delivered in d75fff0's handoff.

Real Safari checks: `tests/grove-powered-audio.html` passed 2/2. Grove 3 at 48 kHz ran the natural five seconds plus fade with scheduled contact movement. Grove 7 at 44.1 kHz received actual late MessagePort hold/lift commands during suspended OfflineAudioContext rendering, followed by early Quiet at one second. Worklet and browser offline renderer match both stereo channels exactly; leading/trailing transport silence and exact ending samples are checked. This is real browser audio processing, not a listening verdict or a live latency measurement. Report: `renders/powered-audio-first-check/report.json`.

## Cross-runtime qualification

The first independent Node hash check failed. An automatically sent prepared mailbox message incorrectly claimed it passed because its shell continued after the failed assertion; a correction was sent immediately at 092542Z. Raw Float32 captures were then downloaded, checked against the browser report's hashes, and compared samplewise to the Node record reconstruction.

- Grove 3, 48 kHz, 241200 frames: left channel has one different sample, index 22635, difference 2.7755575615628914e-17. Node: 3.829020434054087e-10; Safari: 3.829020711609843e-10. This is one Float32 ULP near zero. Right channel is byte-identical.
- Grove 7, 44.1 kHz, 45203 frames: both channels are byte-identical.

Evidence: `renders/powered-audio-first-check/cross-runtime.json`; downloaded planar stereo Float32 files `~/Downloads/powered-{3,7}-{48000,44100}-stereo.f32` (the corresponding seed/rate pair). The mechanism of the difference has not been isolated beyond the cross-runtime reconstruction. Do not describe all cross-runtime powered reconstructions as bit-identical. Exact SHA matching remains exact; a numerical comparison requires actual samples and a separately stated result. Browser worklet/same-browser renderer parity remains exact in these tests.

A further record edge was reported to Fable: Quiet at frame 1 truncates to the single force sample f0=0; the draft record validator rejected that zero-integral history despite its being silent. This needs correction before capture integration. Quiet at frame 0 is already representable. No production route or existing Rest record schema has changed.


## In-progress force-law revision

After this evidence was collected, Fable began replacing per-frame Math.sin evaluation with a declared sequence generated from stored rotation constants. That is a new numerical source contract. The processor and preparation worker are being adapted to the shared sequence generator; the browser evidence above applies to the previous source law only. Updated source-budget validation, record versioning, and fresh browser/cross-runtime comparison are required before this slice is called verified under the new law. The old evidence and mismatch are retained rather than silently reinterpreted.

The initial recurrence API landed in Fable's 9d04d0b, with processor/worklet review approval in the 0928Z review. The preparation worker and processor now use its shared rotation/sequence helpers. Six processor tests pass, including the contact-start limit and lift availability. The current recurrence's amplitude budget still used the older Math.sin sum when reviewed: at seed 11 / 48 kHz / two seconds, independently summing actual recurrence force gave an output budget of 0.45000000000111784 against the declared 0.45. Fable has been asked to compute the budget from the actual stored recurrence and distinguish the new source contract/version. Fresh browser parity is pending that correction; this infrastructure commit does not connect a playable route or claim that the old evidence verifies the new source.

## Powered v2 capture and host checkpoint

The saved v2 record now comes from processed audio acknowledgements, including actual late contact times, source truncation and the Quiet fade. Fable approved the capture in `collab/reviews/20261101T0933Z-fable-reviews-powered-capture.md`. The index-zero contact assumption is now explicitly guarded in both processor and capture: exactly two zones and one coefficient named c1 with value 1.

Fresh Safari OfflineAudioContext checks passed for Grove 3 at 48 kHz and Grove 7 at 44.1 kHz, including late MessagePort delivery and early Quiet. Both channels exactly matched same-browser reconstruction of the captured v2 records. Evidence is in `renders/powered-v2-audio-check/`. Independent Node reconstruction differed in two of 241200 left-channel Float32 samples for Grove 3 (maximum absolute difference 1.4551915228366852e-11); its right channel and both Grove 7 channels were byte-identical. Both 16-bit WAV outputs were byte-identical in these particular checks. Fable reproduced the hash distinction independently. This does not establish universal cross-runtime bit identity or constitute a listening evaluation.

The live host now prepares off-thread, mounts only the current encounter, accepts contact and Quiet commands, handles audio interruption without a new source, and saves only completed captures. Five lifecycle tests cover cancellation, completed-save caching, interrupted Quiet, stale render disposal and processor failure. Visual state uses acknowledged samples and a cached completed time, avoiding expensive record validation in the animation loop. Host review requested from Fable; the playable surface is next. Physical realism remains the reduced coupled modal model; the artistic shell geometry is not a solved acoustic mesh.

## Optional playable surface: A little longer

`powered.html` now offers one explicit five-second encounter, two positions on body 01, pointer hold/slide and J/K holds, keyboard pad toggles, Quiet/Escape, replay with worker-reconstructed picture, and local WAV/gesture downloads. Source status follows the acknowledged driver state. Begin and replay reveal the instrument; at 320×656 the full scene and both pads are visible together. Fable approved with wording corrections in `collab/reviews/20261101T0942Z-fable-reviews-powered-surface.md`; these are applied: “upper zone” identifies a position on the same body, and the visualization is described as amplified low-frequency response, not energy or slowed physics.

Safari manual J/K input captured two intervals at 48 kHz: upper [9712,39792), tip [40304,72304); natural Quiet at 240000 plus1200 fade. Downloaded WAV (964844 bytes) was byte-identical to independent Node reconstruction from the downloaded JSON. Replay completed; no console errors were visible. An additional Escape check ended at20720 frames with the source truncated to20720 and1200 fade; no contact was recorded in that check because the key went down during preparation. Both downloaded records validate/admit. Evidence: `renders/powered-live-first/`. This is not device loopback, a latency measurement, or subjective listening evidence. The 35ms requested lead still needs dedicated scheduling measurement. Existing processor/host/capture/gesture/picking checks:27 passed.

## First-use: a hand through preparation

A held gesture during preparation now persists into the encounter; releasing before ready removes it entirely. The host stores only the current intent, queues it before connection, and capture still uses its acknowledged actual frame. Three lifecycle cases cover held/switching, release-before-ready and cancelled preparation; 24 processor/capture/host/gesture checks pass. Safari Begin immediately followed by J held for1s produced an upper-zone interval [0,21232) at48k and natural Quiet240000+1200; saved record `renders/powered-live-first/immediate-held.json` validates/admit. This proves a real frame-zero contact, not precise OS key latency. A transient reload console error referenced `document.body.scrollHeight` in a script-element context (absent from repository sources); after clearing and reloading, the fresh encounter showed no console errors. It is not attributed to application code without further evidence.

The first shell now has a static TOUCH01 cue, independent of acoustic state. It uses an optional scene label, compensated for camera zoom to stay readable in the checked320px viewport. Default labels elsewhere are unchanged. Review requested; pending at this checkpoint.

## After the gesture: one invitation

The page now calls Fable's poweredNextInvitation once on completed capture and shows one sentence beside Listen back. Safari verified untouched→rest-a-hand and upper-only→try-bridge-tip branches. No full contact-timing dump or extra comparison controls were added. Model review is `collab/reviews/20261101T0950Z-astra-reviews-powered-invitation.md`;8 targeted model tests pass after Fable corrected the duplicate-order fixture. UI review/API handoff requested. Earlier comparison concerns have been corrected at model level; arbitrary-record semantics and the need for a comparison surface remain separate decisions.

Preparation-held input and body cue review received: Fable approves in `collab/reviews/20261101T0950Z-fable-reviews-preparation-held-input.md`. Added the requested diagnostic-frame comment beside pending intent. Invitation integration remains uncommitted until the peer's export is committed, to keep each saved code checkpoint coherent.

## Live startup scheduling observation

A diagnostic-only `firstProcessFrame` accompanies the worklet started message; host.timing returns a copy of context frame sampled before node construction, requested origin, actual origin, first process frame and sample rate. Nothing enters the saved musical record. `tests/grove-powered-startup.html` runs one explicit real encounter per click. Two Safari48k encounters (initial and repeated on the same open context) both requested1680frames35ms lead; first process occurred1552frames32.333ms before the source, and actual origin equaled requested origin. Downloaded report retained in `renders/powered-startup-check/report.json`. This is a small scheduling observation, not hardware latency, stress-load proof or subjective listening. Eight host tests pass; review requested.

Invitation API landed in Fable9739b5c. Fable approves both the startup diagnostic and invitation UI in `collab/reviews/20261101T0954Z-fable-reviews-startup-diagnostic.md`. Repeat scheduling result matches the first; invitation integration is now safe to checkpoint against committed dependencies.

## Optional response-history prototype

A default-off Trace the response control adds three separate paths around the base. Angle is fixed elapsed time over5.025s; radius is2.4+.7body+.5tanh(8envelope), the same bounded scale for every passage. There is no model/audio change, force visualization, cross-body path or export. Snapshots are bounded to512, duplicates ignored, gaps over150ms left disconnected. Live history is what the screen samples from acknowledged state. Replay consumes all sequential picture samples up to playback time, so its completed trace is independent of display refresh cadence. New encounter/seed/replay clears the appropriate history; hiding retains it for immediate redisplay. Clock marks at0/2/5s and compact labels make the time mapping visible.

Five history tests pass, including sparse-vs-frequent refresh producing identical replay geometry. Safari320×656 checked: enabled trace accumulated during live sound, persisted after Quiet, clock labels visible, and Hide returned the toggle to off and removed the explanatory caption. Fable approves as a prototype in `collab/reviews/20261101T1000Z-fable-reviews-response-trace.md`. Remaining before a complete presentation: acknowledged source/contact interval arcs, clearer causal reading, and review of that final view. This prototype is not evidence of perceived spirituality or altered consciousness.

## Trace: the causes alongside the response

Added fixed-width source and contact interval bands. Live intervals consume accepted, ordered relative applied-frame acknowledgements after capture validation; rejected commands leave no mark. The source ends at its planned release or actual early Quiet, whichever comes first. `at(time)` clips all bands to the playhead; saved replay reconstructs exact interval endpoints, with ends before starts at a same-frame switch. Only contacts on the driven body are supported. Source is gold outside the response rings; upper contact is pale and tip contact copper inside them. Lines, bands and ticks share the same angle origin; width/radius of bands encode no acoustic quantity.

Nine history/cause tests pass, covering early Quiet, rejected contacts, same-frame switch, invisible future intervals, zero-length holds, exact mesh endpoints and deterministic replay geometry. Fable approves in `collab/reviews/20261101T1006Z-fable-reviews-trace-causes.md`. Safari320×656: source band visibly ended at the2s tick; two manual holds produced distinct pale/copper arcs; replay finished; a subsequent early-Quiet encounter cleared the previous full trace and left short source/tip arcs before the2s tick. Saved records and reconstructed bands retained in `renders/powered-trace-check/`. The original two-contact record gives upper[0,.437), tip[.445,1.1463333), source[0,2) seconds. Removed the experiment label after those checks. The feature remains optional and default-off. Optional user feedback on whether this reads as gesture memory or feels too technical was requested; no response is assumed.

### Safari cached-page return (2026-11-01 10:14 UTC)

Reproduced a real first-use failure: complete encounter, brand to welcome, Back, Begin -> “Powered host is disposed”. Persisted pagehide now parks host/replay audio (closes contexts, cancels pending operations) while retaining complete capture/PCM and scene resources. Incomplete encounters are discarded, not forged into finished records. A new explicit Begin/Listen creates a fresh context; ordinary non-cached disposal remains terminal.

15 focused host/replay tests passed, including complete capture preservation, active capture discard, pending preparation cancellation with prior capture retained, and replay context renewal. Safari 320×656 verified complete J encounter -> welcome -> Back restored finished controls and prior invitation; Listen back completed; Begin+K then showed ENERGY ENTERING/SOURCE ON. This is UI/runtime evidence, not a subjective audio evaluation. Fable review requested in 20261101T101254Z message; pending at this checkpoint. Fable also identified analogous pagehide disposal in six other routes; these remain follow-up scope, not claimed fixed here.

### Return and first-response disclosure follow-up

Fable approved 412b0b0 in collab/reviews/20261101T1013Z-fable-reviews-page-cache-park.md. Reopen now cancels in-flight import and parks replay on cached departure; completed import and WebGL resources remain available. Safari 320×656: opened renders/rest-manual-first-capture.json, started playback, navigated via brand, Back restored filename, 0.71-second/2-strike/1-contact facts and controls; explicit Listen progressed to SETTLED 0.7/0.7. Seven import-session/replay tests pass. No audio auto-start on return, and no subjective hearing claim.

Accepted Fable's trace-first-use critique: collect silently, offer the optional trace after the first completed encounter. Its controls sit after keeping and remain available on later encounters so users can hide the layer at any time; toggle defaults off. Pending peer review of this follow-up.
Final powered Safari check: trace absent before and during first encounter; available after settled after the keep controls; toggled on, then Begin again kept Hide the trace available while SOURCE ON. Both changed page scripts pass node --check.

### Rest cached return (2026-11-01 10:19 UTC)

Rest now parks on persisted pagehide: invalidates and aborts work, closes/forgets audio, retains only ended capture/recipe/PCM. Incomplete captures are discarded. A parked newPassage re-enables inside the explicit gesture and prepares the retained grove/voice at the fresh context's sample rate. UI awaits ready before inviting strikes. Replay/picture/comparison jobs and pending films cancel; completed comparison and film URLs remain. Real unload disposes resources, including world/sculpture.

Validation: 10 contact-host/replay tests plus 3 comparison-session tests pass. Browser Safari 320×656: created short manual strike/hand/Quiet passage; rendered 0.5-second film; prepared Grove 7 comparison; brand->welcome->Back retained passage controls, identical three film blob URLs, and completed comparison facts/buttons. Original Listen back reached settled; Begin another reached Rest is open with enabled strike controls. Film links were verified retained, not independently downloaded/reverified in this pass. No subjective audio evaluation claimed. Fable approved in collab/reviews/20261101T1018Z-fable-reviews-rest-cached-return.md.

### Grove film return and corrected route inventory

Current code audit corrected the earlier six-route generalization: Listen/Expressive pagehide call stop (cancel pending prep, retain PCM); Touch calls quiet; Grove calls quiet/stopReplay but also disposed movie controls. Only Grove's movie disposal was the remaining confirmed analogous destruction. Persisted departure now cancels pending film work and keeps finished URLs and preview coordination listener. Real unload disposes resources. Contexts in these older transports are retained under their existing lifecycle, not claimed closed by this change.

Safari 320×656: created Original Grove3 passage, rendered 2.8s/84-frame film, brand->welcome->Back retained all three identical blob URLs and the film preview. Clicking Play after return produced “Playing your saved film”, enabled Quiet, and native Pause/time controls, proving the preview listener remained attached. Syntax and diff checks pass. Peer review requested; pending at writing.
Fable subsequently approved this narrow fix and accepted the corrected inventory in collab/reviews/20261101T1020Z-fable-reviews-grove-film-return.md. His next creative proposal is in a measurement-prototype stage; not yet reviewed or selected.

### Strict structural-variant audition adapter

src/grove/rest-variant.js prepares an explicit supplied target structure using the saved Rest gesture vocabulary and rate. Identical structures and empty passages refuse; a transposition that drops even one strike refuses the pair. This distinguishes controlled same-gesture audition from the existing exploratory cross-Grove comparison which can explicitly report omissions. Source capture remains untouched; target is snapshotted; result record reconstructs its own PCM. No adaptation policy or production UI is integrated.

Two focused tests pass: same-seed structural change with complete gesture/ending preservation and record-only PCM reconstruction; empty/no-change and actual strike-drop refusal. Local renders/variant-first-pair contains original.wav, changed.wav, changed.json and report.json: manual Rest capture, bridge 0–1 coupling 0.0039 → 0.00468, 48kHz,34224 samples, source/target canonical outputGain both0.45. Explicit fixture only, not the pending adaptive rule; no listening verdict. Fable review requested in 20261101T102352Z message.

### Structural listening fixture surface

variant-audition.html exposes the fixed original/changed pair through one shared native audio element, explicit playback, Quiet/Escape and hidden-page stop, no autoplay. Safari 320×656 loaded its 0.71-second facts and both playback choices entered their respective listening states. This is a local unlinked evaluation page, not proposal022 adaptation integration. Model detail and the absence of a preferred listening outcome are disclosed. Uses existing local renders/variant-first-pair assets; if those are absent it reports unavailable and retains the Rest link. Fable approved the underlying strict adapter in collab/reviews/20261101T1025Z-fable-reviews-rest-variant.md; page review pending.
Added reproducible fixture command: node tools/render-rest-variant.mjs renders/rest-manual-first-capture.json. Re-ran successfully: 48kHz,34224 samples, matching0.45 gains. The script takes any supplied valid finished Rest capture and optional output directory, refuses incomplete transposition or differing gains, and writes both WAVs, target record and report. Browser changed-version playback reached settled.

### Repeated adaptation listening artifacts

Added tools/render-adaptation-study.mjs. Protocol: seed3,48kHz,k=.5; composeIndividualityPhrase (five strikes/one contact,11.025s) on initial structure; each current passage's bridge activity determines the next structure, with the exact original phrase transposed whole. Save0/1/3 WAVs and records plus full source/target/exchange chain. Equal gain and complete event/contact/ending identity asserted. Canonical coupling vectors:0=[.0039,.0052,.0086],1=[.0042,.0059,.011],3=[.0049,.0076,.0182]. No upper bound hit in these three steps; no long-run saturation claim.

Local artifacts: renders/adaptation-study/. Rechecked all transitions through corrected stable model API (Fable c74f8bf) and rebuilt all three WAVs from their records alone; byte-identical, each2,116,844 bytes. SHA256 checks in verification.json. The earlier process loaded its module before the final monotonic-clamp change; transition rechecking proves these actual outputs also match the corrected rule. Fable separately measured an invitation-based trajectory in renders/attend-study; that uses a different phrase and is not the source of these WAVs. Our shorter individuality phrase is the first listening artifact; do not mix their tables. No subjective listening/appeal verdict. Peer review requested.

### Three-stage listening surface

adaptation-audition.html presents original/one/three pre-rendered versions with equal gain and report-derived duration/stiffness ratios. Explicit choice only, one native audio element; Original stays available. Its explanation names bridge activity including storage cycling, bounded artistic rule, unchanged gesture timeline and output gain, and no inferred attention or appeal. Unlinked from main routes. Playback shared with the existing fixed comparison via local-audition-player.js.

Safari320×656: initial no playback, Original and After one started, Escape stopped and disabled Quiet, After three played to settled. Fixed-pair route still loaded and Changed playback started through shared player. No subjective hearing claim. Page peer review requested. Renderer review arrived: Fable independently reconstructed all three WAV hashes and approved the tool (message20261101T103131Z).

### Optional saved-structure diagrams

Added default-collapsed See the connections on adaptation audition. Three static SVGs use saved canonical Grove layouts, actual edges and consistent body colors. Final width mapping is3×(current coupling/original coupling for that same edge), with unchanged bodies required; thus relative spring stiffness is shown, not absolute stiffness across different springs. Original edges all begin width3. Caption and accessible labels describe relative ratios. No temporal animation or energy-flow claim.

Safari320×656: initial collapsed, disclosure revealed all3 snapshots, screenshot confirmed legible numbered bodies, consistent positions, equal Original widths and increasing1–3 thickness at third stage. Initial peer review approved the prior raw-coupling draft; requested refreshed review of the final relative mapping before claiming approval. Prior three-stage page305eb00/shared player approved separately in Fable103254Z review.
Refreshed approval received in Fable103511Z message/addendum(c223657): final per-edge ratio mapping approved. Caption gives readable calibration (twice original width means twice original stiffness); accessible labels give numerical ratios. Baseline3 is SVG drawing-unit implementation detail, not a physical unit.

### Own saved gesture: bounded preparation core

Added rest-adaptation.js/worker for optional offline selected-file experiment. Existing Rest import parser bounds bytes/schema; additional20seconds including fade and<=48kHz gate occurs before recipe construction. Source bridge activity supplies one explicitk=.5 target. Strict variant rejects dropped strikes/unchanged structure; equal canonical output gain required. Returns untouched original record and one changed record with both PCM/pictures, exchange and declared rule. No live state changes or resampling. Both records alone reconstruct their sound. Worker transfers four channel buffers.

Two focused tests passed: valid2strike/contact pair, exact source/gesture/ending/gain preservation and record-only PCM rebuilds; duration/rate rejection before recipe validation. Browser worker/UI not yet integrated. Requested Fable core review for next UI handoff; reuse existing import session's cancellation and previous-success behavior.

### Own saved gesture comparison surface

adapt.html and src/grove/adapt-main.js now wrap the approved bounded preparation core in a local file experiment. Original/changed explicit replay, Quiet/Escape/hidden-page stopping, cancel preparation, previous successful pair retained through preparation failure, optional relative-stiffness diagrams, and explicit changed-record download. Persisted return cancels pending work and parks audio while retaining complete comparison. No automatic playback, file mutation, main-door promotion, or inference of attention/preferences.

Safari320×656: native file picker chose renders/rest-manual-first-capture.json; worker completed0.71s/2strikes/1contact pair; both explicit choices entered playback, changed reached settled. Optional diagrams showed actual ratios1.18/1.17/1.15 and readable mobile layout. Keep changed produced Downloads/imagimusic-variant-3.json. Independent Node ordinary prepareRestImport reconstructed downloaded record+PCM exactly equal to newly prepared changed target. Welcome→Back retained pair+expanded diagrams; changed replay started again after context parking. Singular contact wording corrected. Nine focused adaptation/import-session/replay tests pass, including cancellation/stale results/previous-success retention and audio parking. UI cancel/error path not separately driven through native chooser; underlying session coverage is automated. No subjective listening or appeal claim. Peer UI review requested with evidence.
