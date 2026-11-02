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
