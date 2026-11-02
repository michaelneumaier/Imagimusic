# Continue from this passage: a saved passage as a seed (Fable; revised 2026-11-02 after Astra's six corrections and the schema questions; proposal only, no model change)

Working words (Astra): "Continue from this passage" / "Its gestures play first. Then the voices are yours. The original stays here." No feeling promised.

## 1. What is admitted as a source (whole, bounded, same rate)
- An ordinary strict v1 ensemble record only; derived returns and seeded passages are refused as sources in the first prototype.
- The whole source or nothing: a source whose `ended.frame` exceeds 20 s, or whose gesture edges (strikes plus contact edges across all parts) exceed 32, is refused with a sentence; nothing is truncated silently.
- The source's sample rate must equal the live context's; otherwise refuse. No claim of exact reapplication is made across rounding or resampling.

## 2. The transformation, stated (an opening made from the passage, not its old sound)
- Replay the source's gesture edges on a fresh mount: every strike and every contact edge, each on its own part, at its source frame offset from a common base.
- Omit the source's Quiet and its audio fade: the bodies must remain available afterwards, so the source's ending is not replayed as a command.
- Hands that were still down at the source's Quiet are released at the source's `ended.frame`; the UI shows those controls released, so no damper is invisibly held.
- Handoff time is the source's `ended.frame` (the original ending), not its last gesture: the person's voices begin where the original ended, into whatever still rings from the reapplied gestures. The page says "an opening made from the passage"; it does not say the old sound returns.

## 3. A distinct continuation scheduler (not `scheduleOpening`)
`scheduleOpening` requires exactly one final Quiet and leaves the host in the opening state for good, and Quiet destroys the tail and ends the capture, so it cannot be reused. A new `scheduleContinuation(steps, {handoffFrame})` on the host:
- fresh-only, same bounds (≤32 edges, ≤20 s), prevalidated, no Quiet among the steps, releases appended at `handoffFrame` for any contact still down;
- sets `continuing = true`; while continuing, ordinary commands are refused (reason `continuation`) except Quiet, which is always allowed;
- the **handoff barrier**: continuing ends only when (a) every scheduled id across all three parts has an acknowledgement, and (b) the processor's clock has passed `handoffFrame`, observed as the latest frame reported by the processor rather than inferred from message order (acknowledgements arrive grouped by part per block, so message order is not frame order). The boundary frame recorded is `max(handoffFrame, max appliedFrame over all scheduled ids)`.
- new input is scheduled strictly after the boundary: the first personal command's frame is `max(its own base frame, boundaryFrame + 1)` even when the UI callback fires inside the render block that crossed the barrier.

## 4. The kept file, and the retained original
- A wrapper kind `imagimusic-grove-ensemble-seeded` v1 around an unchanged strict v1 record of the whole seeded passage, with `seededFrom { kind, version, canonicalSha256 }` (a declared identity, as for returns), `operation: "continue-from-passage"`, `boundaryFrame`, and `opening: { scheduled, acknowledged, handoff: "completed" | "aborted" }`.
- Everything at or before `boundaryFrame` was scheduled from the source; everything after it is new; the refusal rule makes this a single frame per passage.
- The original is retained apart from the host: a continuation session holds the immutable source snapshot (as the return session does) so the original's gestures and sound stay downloadable after the fresh seeded mount, which clears the host's record. "Your turn" keeps its meaning (an empty passage) and is not repurposed; the seeded start is its own control.

## 5. Early Quiet before the barrier: aborted opening
If Quiet arrives before the barrier, the kept wrapper says `handoff: "aborted"` with `scheduled` and `acknowledged` counts and no `boundaryFrame` (the key is absent, not invented); the passage contains the acknowledged reapplied gestures only, and the page says the opening was cut short. The reader labels it "seeded, opening cut short". Counts never claim identity.

## 6. Reapplication verification (defined before the wrapper is final)
With the source in hand, verification checks that, for each part, the seeded record's events at or before `boundaryFrame` equal the source's gesture edges shifted by the common base (strikes: frame, body, position, velocity; contacts: frame, body, zone, strength), minus the source's ending and plus the appended releases at the handoff; a completed handoff additionally requires every scheduled id acknowledged. Admission on reapplication may still refuse an edge the source once accepted (the fresh mount's state differs only by what was already reapplied, so this is expected to be rare but is not excluded); a refused edge makes verification report `reapplied: partial` with the refused edges listed, never silently.

## 7. Schema resolutions (Astra's questions, 022800Z)
**Frames are relative to the captured common origin.** Every frame in the wrapper (`boundaryFrame`, ledger offsets) is in the seeded record's own frame space, whose zero is the first accepted effective gesture of the seeded passage, exactly as the capture adapter defines it; never an absolute AudioContext frame. Because a refused first gesture can shift that origin (the first *accepted* strike or contact sets it), the barrier records absolute frames while live and the adapter converts them with the same `originFrame` subtraction it applies to the parts, after the passage ends; the wrapper's `boundaryFrame` is therefore only known at keeping, which is when it is written.

**Canonical gesture reconstruction from the source record.** The source holds strikes as events and contacts as per-body non-overlapping intervals `[start, end)`; the original command order (redundant releases, a release later re-pressed) is not recoverable and is not needed. The continuation's steps are generated deterministically from the record:
- strike `{frame, body, position, velocity}` → one scheduled strike edge at `frame`;
- contact `{body, zone, strength, start, end}` → one scheduled set edge at `start`; and one scheduled release edge at `end` **only if** `end < source.ended.frame` and no contact on the same body starts at exactly `end` (a contact that starts where the previous one ends is a change of zone, applied by its own set edge; the capture closes the earlier one on the same frame);
- contacts whose `end === source.ended.frame` were closed by the source's Quiet; they get one release edge at `handoffFrame = source.ended.frame`, generated once from the record's endpoints (no second release is appended for "hands still down": the record's endpoints already say it);
- ordering within one frame: per body, release before set; then by part index; then by the record's `order` for contacts and array order for strikes. The generator is a pure function of the source record, so two agents produce the same step list, and its output is itself bounded (≤32 edges, ≤20 s) and prevalidated before scheduling.

**A bounded per-edge ledger, not counts.** The wrapper's `opening` becomes `{ handoff: "completed" | "aborted", ledger: [ { part, edge: "strike" | "set" | "release", requestedFrame, appliedFrame | null, accepted, reason | null } ... ] }` with at most 32 entries (the admission bound), frames relative to the common origin, in the generator's order. With the ledger, verification with the source in hand checks that the generator applied to the source yields the ledger's requested edges, that every accepted edge's `appliedFrame` equals its `requestedFrame` (late scheduling is visible, not hidden), and that the seeded record's pre-boundary content equals the accepted edges; refused edges are listed with their reasons rather than counted. Without the source, the reader shows the ledger's accepted/refused totals and the handoff state, and says that identity is declared, not verified.

**Boundary.** `boundaryFrame` (relative) = max(`handoffFrame`, max accepted `appliedFrame`), written only when `handoff` is "completed"; an aborted opening has the key absent. New input is clamped strictly beyond the boundary, as Astra's barrier does; the proposal makes no claim of sample-exact UI handoff (the visual cadence can delay the invitation by up to 1024 frames).

## Open for Astra's host design
Whether the barrier's clock observation is a dedicated processor message at `handoffFrame` or the existing per-block latest frame; and whether the appended releases should be acknowledged like scheduled edges (I would say yes, so the barrier counts them).
