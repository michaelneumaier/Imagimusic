# Continuation listening study — preliminary review

Reviewer: Astra, 2026-11-02. Scope: read the uncommitted draft of
`tools/render-ensemble-continuation-study.mjs` while Fable prepares the handoff.
No renderer execution or artifact verification is claimed yet.

## Status

Not approved yet; stable artifact handoff and independent checks remain pending.
These draft observations were sent through the canonical mailbox before final
handoff so they can be addressed without treating an unfinished draft as final.

## Findings

- **Should fix — answer timing is nominal, not acknowledged.** The draft waits
  until `frame() >= at(seconds) - 2048`, then calls `host.send`, which adds the
  host's35ms lead and rounds against the block clock. The resulting requested
  and applied frames differ from the `secondsAfterHandoff` values in the report.
  Record the actual per-command decisions, acceptance and requested/applied
  frames; label target offsets as nominal if retained. A queued result does not
  prove an answer was accepted. Require acceptance of the intended authored
  answer before producing the comparison.
- **Should fix — match the advertised playable vocabulary.** The current
  Three Groves controls strike body0, position1, velocity0.5. Draft answer
  strikes on bodies1/2 with different velocities cannot be reproduced through
  those controls. For this introductory listening-to-playing pair use the
  actual vocabulary and vary timing and the firm hand/release instead. Resolve
  hand zone/strength through the recipe as the page does. Astra initially
  suggested varied velocity, then corrected that suggestion explicitly after
  checking the page's fixed velocity.
- **Nit — gesture count.** The comment says four authored gestures but the
  answer list contains five edges.
- **Aligned — provenance and limits.** The draft labels both pieces authored
  and offline, gives their different durations, discloses omission of the
  original terminal Quiet fade, uses a controlled late-free remembered opening,
  and makes no claim of adaptive response or device recording. It uses the
  existing shared player and same ensemble listening preference.

## Independent checks required at stable handoff

Reproduce to a separate directory; independently verify source hash, canonical
wrapper, exact source relationship, actual answer ledger against kept strikes
and contacts, durations, WAV hashes and embedded player identities. Verify
processor output versus the kept renderer rather than relying on the report's
own verdict. Confirm only body0/position1/velocity0.5 strikes and the same firm
hand as the live page. Then inspect explicit playback, origin disclosure and
the route to Three Groves in the native browser. No subjective hearing verdict
or device-performance claim follows from these checks.

## Corrected artifact review — 0a4e704

The draft findings are resolved. Actual decisions are collected through the
host callback and required accepted; the report separates nominal targets from
requested/applied frames and actual offsets. All three answer strikes now match
the page's body0/position1/velocity0.5; the hand uses the final zone and recipe
strength named firm. Comment vocabulary/count corrected.

Astra reran the producer independently into
renders/ensemble-continuation-audit. All six outputs (two JSON, two WAV, report,
HTML) were byte-identical to the handoff outputs. That run executed the
production-processor-versus-kept-render sample equality assertions.

A separate verifier, tools/verify-ensemble-continuation-study.mjs, checks the
canonical files and hashes, source relationship, boundary and remembered
ledger report, actual answer offsets against the kept strikes and contact,
exact live control vocabulary, independent thin-mix WAV reconstruction, frame
counts/peaks and embedded player hashes. It passed. Deliberately replacing an
actual offset with its nominal target, changing a reported strike body, and
changing one WAV byte were each refused by the appropriate assertion.

Original:321200 frames, SHA-256
1eb28041b3cf742e4794e5ff1b5d7f610cccad202ea318222d67c06fe26e5270.
Continued:778927 frames, SHA-256
9931d2a23ea35ebb4c0be692086fd089ee9a97428c4cbb66df94da509305381d.
Both48kHz. Handoff320000 frames; five remembered edges accepted, none late
under the controlled clock. Actual answer offsets differ from the nominal
targets and are now reported as such.

Verdict: approve corrected artifact generation and provenance at0a4e704.
Native page opens idle with the shared saved listening preference; explicit
continued-example playback reaches its natural end. A presentation nit remains:
shorten the intro and scale the title on narrow screens so choices appear sooner.
Full timing/model/Quiet disclosures stay available. No subjective hearing,
phone hardware or device-output performance verdict is claimed.
