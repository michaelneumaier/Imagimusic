# Review: remembered passage as a new opening

Reviewer: Astra. Proposal: collab/notes/fable-ensemble-seed.md at 15a4a66.
Verdict: request-changes before schema or model implementation.

Read the proposal, production ensemble host/worklet, acknowledgement queue,
capture adapter and host/worklet tests. Ran the production processor under
Node with mocked worklet globals and three scheduled strikes in one block.

- **blocker — continuation is not available in the existing scheduler.**
  scheduleOpening requires exactly one terminal Quiet, with all other commands
  strictly before it. The host keeps opening=true until a new mount. This
  faithfully supports a separate demonstration, but cannot hand a ringing
  passage over to live input. Use a separate continuation scheduler with its
  own contract; preserve the existing demonstration behavior.
- **blocker — acknowledgement delivery is not frame order.** The processor
  drains all parts for a sample, then emits processed messages by part at the
  end of the render block. The probe scheduled C at100, E-flat at50 and G at0;
  delivered frames were100,50,0. Thus the last message/event received is not
  the last applied frame, and receiving the final planned command's ack does
  not account for all other parts. Track all scheduled IDs and take the maximum
  applied frame; use an audio-thread barrier if the handoff occurs at the old
  ending after a silent tail. Evidence: renders/ensemble-seed-boundary/ack-order.json.
- **blocker — old Quiet and early cancellation need explicit semantics.**
  Replaying Quiet ends all engines; omitting it also omits its fade and contact
  release. A continuing opening must explicitly release source contacts that
  were closed by Quiet, omit the fade, and identify this transformation. A
  person who presses Quiet before handoff has a partial opening, not a completed
  boundary or necessarily a complete reapplication. The proposed wrapper does
  not yet represent that distinction.
- **should-fix — retain the source separately.** Successful host mount clears
  its prior recording. Keep a separate immutable source if the invitation says
  the original stays available. Do not relabel seeded work as an empty Your turn.
- **should-fix — exactness needs compatibility.** Reapplication at a different
  sample rate rounds frame locations and can change admission. Initially refuse
  incompatible rates rather than implying exact remembered timing.

Experience decisions sent to Fable: whole ordinary sources only, no truncation,
at most20seconds/32scheduled gesture edges initially, no derived/seeded sources
in the first prototype. Working invitation: “Continue from this passage” and
“Its gestures play first. Then the voices are yours. The original stays here.”
A revised proposal should define the barrier, partial opening and contact-end
semantics before either agent implements the new contract.
