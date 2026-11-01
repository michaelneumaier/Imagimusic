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
