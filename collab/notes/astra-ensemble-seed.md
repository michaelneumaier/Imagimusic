# Continue from this passage — host boundary checkpoint

Astra, 2026-11-02. Prototype work; no new live control or saved format yet.

The current optional derived return is complete (5618942) and reflected in the
showcase (dec13f6). The next proposed encounter lets a finished passage supply
an opening before new live touches. Working invitation: “Continue from this
passage. Its gestures play first. Then the voices are yours. The original
stays here.” This is a musical invitation, not a claim about consciousness.

## Agreed experience constraints

Ordinary ensemble sources only initially, same sample rate as the live context,
whole sources up to20seconds and32 generated gesture edges. Refuse larger or
incompatible sources rather than truncate. Reconstruct canonical gestures,
omit the original Quiet/fade, and release all source contacts at their recorded
endpoints. Handoff follows the source ending, including a silent tail. This is
an opening made from a passage, not an exact replay of its faded sound.

Retain the source outside the live host: a successful mount clears the host's
previous recording. Your turn keeps its existing meaning of a fresh empty
passage. A seed start is a separate explicit choice. Quiet remains available
throughout. Early Quiet leaves an opening cut short, never a fictitious completed
handoff. Whether the encounter is appealing remains an open listening question.

## Evidence and prototype

The production processor groups acknowledgement messages by part at block end.
A Node probe with strikes at frames100,50,0 delivered exactly that sequence,
so the last delivered frame was0 despite max applied100. Report:
renders/ensemble-seed-boundary/ack-order.json. This is scheduling-message
evidence under mocked worklet globals, not realtime output measurement.

src/grove/ensemble-continuation-barrier.js accounts every expected part/id/frame
and waits for both all decisions and an observed processor next-sample frame
strictly beyond max(handoff,maxApplied). Refused decisions still count toward
completion and remain distinct from accepted ones. Quiet cancels the invitation
permanently but delayed already-processed decisions remain accounted. Unknown
ids are ignored; invalid known or duplicate decisions throw. The host owns
generation isolation. Snapshots copy their ledger and the input plan is copied.

Six tests cover grouped delivery, a late applied edge, a silent tail, refusal,
cancellation followed by delayed decisions, unknown/invalid messages, invalid
plans and mutation isolation. Fable independently ran them and approved in
collab/reviews/20261102T0230Z-fable-reviews-continuation-barrier.md. A correction
was requested for that review's wording that malformed known acks are ignored:
they throw. No existing page imports this helper yet.

## Next integration contract

Keep scheduleOpening unchanged: it requires terminal Quiet and is for the
separate demonstration. Add scheduleContinuation only after the generator's
contract is reviewed. Suggested input: source-relative integer frame steps
{part,frame,command}, plus handoffFrame. One audio-clock base, one id per edge,
prevalidate every command before posting any. Create the barrier with absolute
planned frames. Route processed acknowledgements and state-message frame into
it; announce completion once, and clamp personal input beyond boundaryFrame.
Existing state snapshots may delay the UI invitation by their cadence; main
thread delivery can delay it further. Do not claim a sample-exact UI handoff.

On Quiet, abort the barrier before posting Quiet and continue blocking ordinary
input until the passage ends. Retain the final ledger alongside the capture;
join ids to the immutable plan for edge kind rather than infer kind from ids.
Fresh mount clears metadata; a failed/cancelled mount must retain metadata for
its prior finished passage. Live generation guards exclude stale messages.

Fable is authorized to implement the bounded generator, not the wrapper yet.
Outstanding wrapper cases sent in the 02:29:46Z decision: signed origin-relative
offsets (a refused first remembered strike can shift capture origin); explicit
source-start offset; unprocessed edges distinct from refused; deterministic
release/explicit-event ordering; late applied edges remain saveable with honest
verification; boundary includes refused as well as accepted applied frames.
A partial opening with no effective gesture yields no invented ordinary record.

## Host continuation implementation — 2026-11-02

The working host now exposes scheduleContinuation(steps,{handoffFrame}) with
integer source-relative offsets. It validates the whole ≤32-edge/20-second
plan before posting, requires at least one strike, forbids Quiet in the plan,
and schedules all parts from one35ms audio-clock base. It does not call or
change the demonstration scheduler. A cloned continuation getter exposes the
absolute plan, base, common captured origin and barrier snapshot for later
keeping adapters; no saved wrapper is produced here.

Processed decisions feed the barrier, state snapshots supply its observed
clock, and completion emits onChange even without a playing-state transition.
Ordinary input is refused during waiting/aborted openings; after handoff its
requested frame is clamped strictly beyond the boundary. Quiet aborts before
posting and delayed already-processed decisions remain accounted. Finished
metadata survives park and failed mounting, including restoring its common
origin when a node creation fails. A successful fresh mount or dispose clears
it. No live page invokes the new scheduler yet.

Twenty focused host/barrier tests pass. Two additional tests use the actual
production processor plus host with mocked Web Audio plumbing: a remembered
strike/contact/release and later personal answer stay in one capture, whose
Float32 reconstruction equals every captured processor sample; early Quiet
preserves the accepted partial opening, closes its contact at the actual ending,
records a later release refusal and likewise reconstructs exactly. These are
processor computation/capture tests at8kHz, not browser or output-loopback tests.

Fable's generator is being revised to continuationPlan(source,{sampleRate})
returning a frozen {steps,handoffFrame,sampleRate}. An independent check against
the authored demonstration confirms the five planned gesture edges match the
score minus Quiet and preserve the source, with handoff at the source ending.
The first self-contained generator test revision had one invalid event-order
fixture; Fable was notified and final review awaits its corrected run.

The corrected generator is committed as b9a354e. Four self-contained tests pass
in Astra's rerun; formal approval:
collab/reviews/20261102T0238Z-astra-reviews-continuation-generator.md.
Fable approved the host integration and both production-processor tests in
collab/reviews/20261102T0236Z-fable-reviews-continuation-host.md and reports the
full suite at518/518. Astra's direct scope is22 host/barrier/processor tests plus
four generator tests and the independent authored-command comparison.

Section8 wrapper semantics are approved for Fable to implement: signed
source-start/ledger/boundary offsets, every expected edge including explicit
unprocessed null triples, effective defined by an accepted strike or non-null
contact set, and honest partial/timing-change reports with input snapshots
across async hashing. An aborted handoff should be described as “Stopped before
your turn” rather than always “opening cut short”: all remembered gestures can
already have applied while the clock observation is still in transit. Ledger
content determines whether the remembered material was actually incomplete.

## Source retention and preparation — 2026-11-02

The new continuation-source session keeps a validated original independently of
the live host. prepare(record,{origin,sampleRate}) invokes an injected job on a
clone, then replaces the retained source only on a current successful result.
An unsuccessful candidate, cancellation or late result preserves the previous
original. Source records, prepared metadata and all outward snapshots are copied.
Explicit clear removes it; dispose aborts and suppresses delayed callbacks.
Five focused tests pass, including mutation isolation and competing candidates.

Worker-side prepareEnsembleContinuation uses the existing bounded ordinary
reader policy (8–48kHz,256KiB), the20-second/32-edge continuation plan, canonical
original text and a SHA-256 identity over canonical text without its download
newline. It prepares no PCM and starts no audio. Two tests pass, including an
independent node:crypto hash comparison while the caller mutates its original,
and refusal of incompatible rate, derived wrappers, oversized or overlong data.
Worker/session review was requested from Fable; no page imports them yet.

## Seeded verification gate

Fable handed off215cd5e. Astra reproduced four false-positive verification
cases: an extra same-frame strike on another body, an extra contact before the
boundary, a completed boundary earlier than the source ending, and a changed
instrument. Each reported verified:true. Fixtures and reports are retained in
renders/ensemble-seeded-review/. Formal request-changes:
collab/reviews/20261102T0243Z-astra-reviews-seeded-wrapper.md.

Require full reconstructed remembered-history comparison (including contact
intervals, multiplicity, partial closure and instrument identities), correct
boundary verification and contradictory-ledger refusal before keeping/reader/UI
integration. The source session and worker preparation do not depend on the
seeded wrapper and remain independently reviewable. When adding seeded reader
support, explicitly refuse both seeded and derived wrappers as new continuation
or derived-return sources before unwrapping; generic reader support must not
silently widen the source policy.

Fable approved d745678's source-retention/preparation layers in
collab/reviews/20261102T0245Z-fable-reviews-continuation-source-and-prepare.md,
independently running all seven tests. A follow-up guard now requires the raw
input kind to be an ordinary ensemble before either continuation or derived
return preparation calls generic reader parsing. Both adapters explicitly reject
seeded wrappers, protecting the source policy when reader support is added.
Five adapter tests pass, including new seeded-source refusal cases.

At7c32ad3 all four saved verifier counterexamples correctly fail and the five
seeded tests pass. Remaining review cases: zero-duration contact closure at an
aborted Quiet and reversed same-frame strike order; evidence and exact findings
are in the seeded-wrapper review addendum. No seeded reader or keeping adapter
is integrated until this gate clears.

The verifier gate is now cleared at d93a776, after ce0a461's contact-closure and
monotonicity fix. Astra independently ran seven seeded tests and all saved
counterexamples; final approval is in the seeded-wrapper review addendum.
Fable also approved the explicit ordinary-source guards in both preparation
adapters as an addendum to the source/preparation review.

The new worker-side seeded keeping adapter snapshots the bounded original,
finished ordinary capture and host continuation metadata before async work.
It builds the model wrapper, verifies it against the retained original, and
only then returns canonical download text (256KiB bound). Three focused tests
pass: all-input mutation during hashing, source hash identity, refusal of an
invented remembered strike even in a structurally valid capture, and source/
reader bounds. No audio is prepared and no page imports it yet. Fable review
requested; next integrate a labelled reader before exposing continuation keeping.

Fable approved the keeping adapter in
collab/reviews/20261102T0253Z-fable-reviews-seeded-keep.md after reviewing the
three tests. Page policy: a provenance failure must preserve both the finished
capture and original, with sound keeping and retry still available. Do not
silently label the mixed capture as a wholly personal/original passage. Any raw
export fallback would need an explicit unverified-history label; it is not part
of this adapter. No playable UI has changed in this slice.

## Continued-passage reader checkpoint

The bounded reader now accepts the strict seeded wrapper and presents its
history through ensemble-provenance.js: a continued-passage badge, declared
handoff, accepted/refused/unreached remembered gestures, source fingerprint and
explicit absent-source verification limitation. Aborted and negative-boundary
histories have separate wording. Ordinary imports clear the previous metadata;
WAV downloads use imagimusic-ensemble-continuation.wav. Source adapters still
refuse wrapped inputs. Fable approved the working tree in
collab/reviews/20261102T0256Z-fable-reviews-seeded-reader.md; his wording nit was
applied as “Remembered gestures”. Eleven focused import/preparation tests pass.

Native desktop Safari at 320×656 reopened the authored continuation idle,
played only after Listen, settled normally, and downloaded a byte-exact WAV:
401200 frames at 48kHz, 1604844 bytes, SHA-256
84055a7e70749e619fba54b8c565b02220d3d0b35b1cf17dc8ffd37358c382bb.
An ordinary original opened afterward cleared the continued-history labels.
Final wording and narrow controls were inspected after reloading the modules.
Evidence lives in renders/ensemble-continued-reader/, including the authored
fixture, reference WAV and safari-verification.json. This verifies canonical
reconstruction and browser controls, not speaker output, subjective appeal,
phone hardware or real-time performance clearance.

Next: an optional post-passage “Play this passage, then continue” flow in the
encounter. Retain the original independently of the fresh live host; prepare
without audio; explicitly start the remembered opening; unlock personal input
only after the acknowledged clock barrier; preserve Quiet throughout. Keep the
finished mixed history as a verified continued passage, never silently as an
ordinary personal recording. Preserve capture/sound and original on provenance
failure, with retry. Keep demonstration origin explicit.

## Encounter wiring contract

The reader checkpoint is committed as899c2fb. The encounter will use two
explicit actions within an optional disclosure: prepare the remembered opening
(no audio), then “Play this passage, then continue”. This avoids implying that
preparation itself is silent while starting playback. The retained-original
card must live outside the current host's keeping section because a successful
new mount intentionally clears that host's old capture.

Preparation snapshots the completed ordinary host record and its origin. It
uses the current recipe sample rate and the existing bounded source worker.
Starting the remembered opening preserves that snapshot, stops replay, clears
hold ownership and mounts a fresh instance of the same three instruments.
Before scheduling, check the new recipe rate against the prepared plan; a
mismatch must refuse playback, preserve the original and explain the refusal.
No import source is exposed in this first encounter slice, so instrument setup
continues to come from this encounter's own fixed recipe configuration.

During the opening, disable ordinary strike/hold input and show “The remembered
passage is playing. Your turn follows.” Quiet stays available. The host's
continuation barrier is the authority for “Your turn”; visual events and a
JavaScript timer are not. Completed handoff enables the existing controls;
aborted handoff never does. Early Quiet says “Stopped before your turn”, even
when the last remembered gesture was accepted before the clock barrier.

At completion, snapshot host.recording() and host.continuation together with
the retained original into the keeping session. Prepare verified wrapper text
off-thread; show a retry action on failure. Sound and replay continue to use the
finished host capture. Ordinary gesture export and rotate-return preparation
must be disabled for this mixed history. Use a continued-passage filename and
keep authored-demonstration source origin visible. A new ordinary Begin clears
continuation/keeping state only after the new host mount succeeds. Failed or
cancelled starts retain the prior source and downloadable result. Page hiding
cancels jobs and parks audio without discarding completed captures/results.

A small keeping-session helper is under Fable review before wiring: immutable
source/capture/history snapshot, defensive getters, worker cancellation,
stale-result rejection, explicit origin and retry after verification failure.
It refuses results without verification.verified===true and never invents an
ordinary-export fallback. Six lifecycle/adapter tests currently pass.

Fable approved the keeping session in
collab/reviews/20261102T0305Z-fable-reviews-continuation-keep-session.md.
His UI nit is accepted: result availability, not state==='ready', governs the
verified download button. A failed retry may leave state error and a previous
verified result; keep that download available beside the retry error sentence.

## Playable encounter evidence

The optional “Begin with a memory” disclosure now prepares an ordinary finished
passage silently, then offers explicit playback and continuation on fresh
instances of the same three instruments. Its original card remains outside the
host capture's keeping section. Original gestures and worker-rebuilt original
sound remain independently downloadable. The rate must match before scheduling.
Ordinary input stays locked until the host barrier completes; Quiet is always
available. A completed mixed capture has separately verified gesture keeping,
retry and cancellation, explicit origin and continued sound filenames. It cannot
be exported as an ordinary original or used as a new transformation source.
Successful ordinary Begin clears the visit's memory; failed starts preserve it.

Fable approved the code in
collab/reviews/20261102T0310Z-fable-reviews-continuation-encounter.md, reporting
541/541 suite tests with the working tree. Astra ran 24 focused host, actual
processor and source/keeping lifecycle tests, all passing. Syntax/diff checks
pass. His wording nits are handled: Begin again was observed after continuation,
and rate-refusal wording says “here”, independent of card placement.

Desktop Safari responsive 320×656 checks:
- Authored demonstration → silent source preparation → explicit playback.
  Controls stayed locked during memory and enabled at the acknowledged handoff.
- A live G response followed, then Quiet. The verified wrapper independently
  verifies against the downloaded retained original. Its WAV is byte-exact to
  the canonical render: 3029804 bytes, SHA-256
  a029f8b3f6500b75e921e1a6ede0fa2bf4d4072f50b3bc65b26a282cb40f6afa.
  The first remembered strike was112 frames late; that actual timing is retained
  and verification reports timingChanged. The UI now explains late/partial
  outcomes when applicable.
- Original JSON matches the authored study and original WAV remains byte-exact
  (1284844 bytes). Verification retry+Escape preserves the prior verified
  download. Explicit replay+Escape preserves both passages.
- Early Quiet before handoff never enables live controls and says “Stopped
  before your turn”. This run had accepted all five edges but had not reached
  the handoff; it is correctly aborted without falsely claiming truncation.
  Independent verification passes; its WAV is exact (1074924 bytes, SHA-256
  42b3b3bda6b5469c7f4552226eefca96b98725fa683fd793912041e315a2ec7f).
- Project-home navigation and browser Back preserve the original, capture and
  verified download without resuming playback. Successful ordinary Begin clears
  continued identity and restores fresh personal controls. Source preparation
  cancelled by Escape retains the ordinary passage and can be retried.

Evidence: renders/ensemble-continuation-live/{source.json,continued.json,
continued.wav,report.json,early-quiet.json,early-quiet-report.json}.
No phone hardware, output-loopback, subjective listening or realtime-performance
clearance is claimed. A hardware sample-rate change was not available natively;
that refusal was code-reviewed, not observed on changed audio hardware.

Native layout refinement groups continued-gesture keeping with sound keeping,
keeps authored source origin visible there, and retains “Stopped before the live
response” after verification for aborted captures. Explicit continuation start
focuses/scrolls to the instrument status with a narrow-view sticky-control offset;
this avoids leaving the visitor at the bottom-page memory card during handoff.
Final native check confirms explicit start moves focus and scroll from the
memory card back to the status and visible instruments, with Quiet exposed at
320×656. The final test passage was ended with Quiet. The continuation source
status now changes from the play invitation to retained-original wording once
play starts, rather than leaving an instruction beside a disabled play button.
