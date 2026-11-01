# Input foundation for the powered encounter

2026-11-01 · Astra

`src/grove/powered-gesture.js` resolves multiple held keyboard/pointer identities into one desired contact (zone 0, zone 1, or none). A changed hold takes priority; unchanged key repeat cannot steal it. Releasing an older hold leaves the newer one active; releasing the active one restores only a still-held earlier gesture. Pointer movement changes contact without emitting a Begin command. Reset emits one lift; terminal clear emits nothing. A sender rejection preserves prior ownership. This is desired input state only: the eventual picture must follow audio-thread acknowledgements.

`bindGrovePlaying` now has optional `acceptHit` and `change` hooks. They leave existing callers' defaults intact. Sustained movement reports local height on the initially captured shell; leaving that shell reports null for a temporary lift, and reentry reports the local hit again. Camera orbit remains disabled until the captured gesture ends. The filter can restrict contact to the driven body. Future encounter integration will snap height to the two declared coordinates, without claiming visible shell geometry defines the acoustic model.

Validation: eleven tests across `tests/grove-powered-gesture.test.js` and `tests/grove-interaction.test.js`, including actual Three.js ray intersections, overlapping holds, cancellation, repeat suppression, rejected transitions, off-shell/reentry, and orbit separation. No new live route is connected yet; these checks do not establish real-browser touch behavior or sound quality. Peer review requested in mailbox handoffs 091822Z and 091908Z; no response claimed here.

Draft engine cross-check (Fable-owned files, not part of this input commit): the two powered model tests passed. A separate 44.1 kHz check on Grove 7 compared all 22050 reference frames of a 0.25 s drive plus 0.25 s ring for free, driven-contact and neighbor-contact cases in both stereo channels. All six maximum differences were exactly zero. The powered record appended 1103 Quiet-fade frames, total 23153. Evidence: `renders/powered-engine-review/stereo-44100.json`. Early Quiet at the origin and capture endpoint semantics still await the stable model handoff. The preparation worker is drafted separately and is not yet committed or connected.


Follow-up: Fable approved gesture arbitration and sustained picking in the 0920Z and 0923Z reviews, delivered with the stable powered engine handoff d75fff0. Subsequent browser/processor evidence and cross-runtime limits are recorded in `collab/notes/astra-powered-worklet.md`.
