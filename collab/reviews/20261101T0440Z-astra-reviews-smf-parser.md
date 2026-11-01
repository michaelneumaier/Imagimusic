# Astra review: SMF parser 5c0b4ef

Verdict: **request changes before mapping/UI integration**.

Read `src/midi/smf.js` and its fixtures; ran `node --test tests/midi-smf.test.js`
(7/7 pass). Executed additional independent fixtures in
`node collab/reviews/fixtures/astra-smf-audit.mjs`; findings below are reproduced, not inferred.

## Blocker: ignored events bypass the event limit

`eventCount` is incremented only by `push`, which is called for retained raw
events. A file with **65,537 Program Change events** (running status, about
131 KiB) is accepted under the default 65,536-event bound. Similar omissions
affect other ignored channel/meta/SysEx events. Increment the count once per
decoded event, independently of retention. Give every decoded event stable
source ordering even when it is later ignored. Validate limit overrides as
finite bounded integers rather than allowing NaN/Infinity to disable checks.

## Blocker: saved NoteList validation is not yet strict

The following modified records currently pass `validateNoteList`:

- Sustain `eventOrder: NaN`.
- Note `offEventOrder: 0` preceding its positive note-on event order.
- Negative ignored counters and arbitrary extra ignored fields.
- Warning `{kind:'invented',noteId:Infinity,detail:{}}`.
- Duplicate channel entries in a track.

Also inspect ordering/uniqueness and bounds for all event-bearing arrays,
time-signature eventOrder, marker eventOrder, track indices, and note-channel
membership in its declared track. Require arrays and bounded lengths before
iteration. Canonicalization currently serializes some accepted invalid numeric
values as null, so validation must reject them first. Cross-event identity may
legitimately be shared for retrigger closure/new note or multiple EOT closures;
do not impose blanket uniqueness on every reference.

## Should fix: parser and validator disagree about cumulative ticks

A valid file with 65 deltas of 0x0FFFFFFF parses to endTick=17,448,304,575,
then `validateNoteList` rejects that same output. Its endTick maximum is based
on 64 events, not the configured event bound. Choose one documented product
bound and enforce it in both paths, or derive a safe cumulative bound from
maxEvents. Keep numeric arithmetic within the exact-integer range.

## Should fix: structural bounds and accounting details

Read operations currently check against file end rather than track end, then
reject the overrun after the track loop. Enforce the local chunk boundary while
reading payloads so an event cannot consume bytes from the following chunk.
This observation is from code inspection, separate from the reproduced cases.

The parser preserves time-signature numerator zero despite proposal 010's
1–255 policy; reconcile rather than letting parser/contract diverge. Zero gates
created by retrigger or EOT do not receive `zeroGate` (only explicit offs do);
normalize warnings after all notes are closed if this is the intended policy.

## What is working

Source-cited header/meta extension handling, running-status cancellation,
tempo conflict ordering, multipart SysEx skipping, all four time-signature
fields, and off-event identity address the earlier review substantively.
Keep this isolated input-adapter scope while fixing the boundaries.
