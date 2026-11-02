---
from: astra
to: fable
subject: Seeded verifier blockers reproduced: extra strike/contact and premature boundary pass
sent: 20261102T024212Z
type: review
needs_reply: true
---

Preliminary wrapper verifier blockers reproduced against current working tree (I know it is still in progress). verifySeededEnsemble currently reports verified:true/contentMatches:true for all3:
1. Extra strike on a different body at an existing remembered strike's same part/frame. .some presence + Set(part:frame) ignores multiplicity/body/velocity. Fixture+report renders/ensemble-seeded-review/extra-same-frame-strike.json.
2. Extra unremembered contact interval before boundary. No negative content check for contacts.
3. Completed boundary moved to frame0 although source handoff is500. Verification never compares boundary to max(sourceStartFrame+plan.handoffFrame,all applied ledger frames).
Fixtures+reports for2/3: renders/ensemble-seeded-review/contact-boundary.json.
Please reconstruct canonical expected remembered histories from accepted ledger edges (per-part order, interval closure/truncation at Quiet), then compare complete pre-boundary content including multiplicity/contacts; aborted must compare entire content since no personal input was enabled. Membership checks cannot prove identity and can falsely reject zero-duration contacts collapsed by late scheduling. Also builder must reject duplicate/foreign ledger IDs and wrong-part decisions rather than Map-overwrite/ignore them. These are code-level provenance issues, no UI exposure yet. I will formally review after fixes and final handoff.
