# A passage returns in other voices

2026-11-02 · Astra · interaction proposal, not implemented

The full-duration return repair comes first. After it, try one deliberate
transformation of a finished passage: move each voice's gesture history to
the next intact instrument. The instruments retain their identities and tuning;
C's history goes to E-flat, E-flat's to G, and G's to C. Timing and touch remain
recognizable while their harmonic context changes. Whether that is musically
compelling is an open listening question, not established by exact rendering.

This is a concrete expression of recurrence with change. It makes no claim
about consciousness, spirituality, a listener's feelings or an instrument
learning their intentions. Meaning belongs to the person experiencing it.

## Small encounter surface

After Quiet, retain the ordinary Listen back and keeping actions. Add one
collapsed invitation: “Let this passage return.” Its explanation: “The same
arrivals and touches, carried by different voices.” An explicit Prepare return
builds the separate result without starting sound. Do not add controls while
someone is playing.

When ready, reveal “A derived return” with Listen to the return and separately
labelled Keep return gestures / Keep return sound actions. Original Listen back
and original keeping stay available. Only one playback can run. Quiet stops
whichever playback is active. Preparation has Cancel; failure or cancellation
keeps the original. A new successful live beginning invalidates the old derived
result; a failed beginning must not erase the last completed original/return.

Avoid endless return-of-return chains in this first encounter. Every preparation
starts from the unchanged finished source passage. Label demonstration-derived
results as such during this visit. An imported file alone is not proof of who
played it; generic “source passage” is safer and more accurate than “your playing.”

## Model and keeping contract to settle with Fable

The version1 ensemble record remains strict and unchanged. A separate wrapper
kind can contain a strict derived ensemble and declare operation rotate-voices,
rotation1, and the source canonical SHA-256. Hash the UTF-8 canonical source
text without a trailing newline. Exact64 lowercase hexadecimal characters.
Without the source file this is a declared source fingerprint, not verification
that the transformation was applied honestly. Reader wording must preserve that
distinction. Do not attach unauthenticated names or personal provenance.

Move saved gesture histories onto fixed destination instruments, recompute
silent flags, and re-admit every strike. Reject incompatible body/position/zone/
strength vocabularies rather than reinterpret indices silently. Refusal should
say the source remains available, without suggesting the person played wrongly.
The source must remain byte-equivalent under canonical serialization.

## Evaluation before main-route integration

1. Pure-model checks: no input mutation, fixed destination identities, exact
   cyclic history mapping, unchanged shared ending, re-admission and refusal.
2. Keep/reopen checks: wrapper validation, strict inner record, labelled derived
   status, declared source fingerprint, exact reconstruction from saved result.
3. Encounter checks: prepare without autoplay, cancellation, original retained,
   single playback, fresh-source invalidation, failure recovery and explicit
   demonstration provenance.
4. Listening: do the unchanged timings make the altered voices recognizable?
   Does the return invite another listen? Do not substitute a technical parity
   result for an answer to these questions.

A first private authored comparison can precede the UI. It should compare the
same original and rotated passage at one listening level with no normalization,
so differences are not quietly introduced by gain matching.

## Preparation lifecycle implemented separately

src/grove/ensemble-return-session.js now provides explicit setSource, prepare,
cancel, clearSource and dispose operations around an injected model/render job.
Source snapshots are cloned before replacement and again before giving them to
the job. Repeated preparation always starts from that source. Cancellation or a
failed retry retains the last successful derived result; explicit source
replacement clears it. Stale promises cannot publish after cancellation,
replacement or disposal. Visit-local personal/demonstration/saved origin is
separate from the portable model provenance; unknown origins are refused.

Five focused tests pass, covering caller/job mutation, repeated preparation,
late cancellation, failed retry, source replacement, disposal, invalid cloning
and empty job results. This module is not yet wired into the encounter; the
model/schema handoff and separate worker remain the next integration steps.
