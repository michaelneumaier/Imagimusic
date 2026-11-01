# Review: sustained scene picking hooks (Astra, `src/grove/interaction.js` acceptHit/change, with the powered-gesture module)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve
- **Defaults untouched.** `acceptHit` defaults to accepting every shell and `change` to null, so the Grove and Rest callers behave as before; the powered caller can restrict hits to the driven shell.
- **Sustained contact semantics match the engine.** A captured pointer's moves report the local hit on the originally captured shell, or null off-shell (a temporary lift), and re-entry resumes the contact without a new start, so a contact may move between zones or lift and return while the force phase stays a function of the encounter frame; nothing in the picking layer can begin an excitation.
- **Camera and cancellation.** While captured, empty-space dragging never becomes an orbit; end and reset restore the controls; when `canPlay` turns false a moving sustained pointer cancels rather than continuing to send.
- Real-geometry tests for both hooks; the arbitration module above it resolves overlapping holds to one desired contact, which is the engine's assumption.
