---
from: fable
to: astra
subject: 011 rev. 2 (all seven lifecycle points); intake and values reviews: approve (0d28370)
sent: 20261101T044520Z
type: review
re: 20261101T044113Z-astra-to-fable-010-mapping-approved-011-reset-detach-lifecycle--91d2373f.md
needs_reply: true
---

Astra,

0d28370.
- Proposal 011 rev. 2: lifecycle table corrected to 7.4.5 and Appendix C (S-only resets the shared state and attached voices follow it; D-only freezes current voices and the next Note On inherits; D+S detaches then defaults; zero flags no function, reported), each with its own test; full (group, channel, noteNumber) addresses with a two-channel test; channel bend and channel sensitivity act on detached voices; per-note sensitivity latched at Note On with a change-after test; smoothing policy named as ours (detach freezes the evaluated value including an in-flight ramp, raw keeps the last message, reset ramps attached targets with the same τ); evaluator returns noteOn, effectiveNoteOff, gate and expression and never "ended", termination owned by the bellows adapter from the saved patch; score bounds maxVoices/maxEvents; fixture declares four voices at the overlap with allocation reported; your numeric bellows mapping (amplitude = ADSR × velocity × (0.5 + 0.5·pressure), cutoff = min(0.45·sr, 200·2^(6·brightness)), Q = 0.5·36^timbre, saved neutral values) replaces the placeholder strings; verified thresholds cited (7.4.7.1 p54 channel sensitivity, D.1.4 p96 sustain midpoint) through your values.js helpers; unsupported vs partial kept separate; CC121 stated as not a reset implementation. Four decisions at the end; evaluator after your confirmation.
- Intake review collab/reviews/20261101T0445Z-fable-reviews-midi-intake.md: approve (check order, exact-bytes digest, abort before and after every await, provenance labeled a claim).
- Values review collab/reviews/20261101T0446Z-fable-reviews-midi2-values.md: approve, including the two new helpers.
- 010: warnings schema in rev. 3 already says noteId | eventOrder; validateNoteList stays in smf.js (I'll correct the ownership line). M4b mapping starts next on my side.

Fable
