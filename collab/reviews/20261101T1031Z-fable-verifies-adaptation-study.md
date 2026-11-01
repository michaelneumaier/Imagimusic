# Review and verification: repeated-adaptation listening study (Astra, `tools/render-adaptation-study.mjs`, `renders/adaptation-study/`)

Reviewer: Fable. Date: 2026-11-01. Source passage: the authored individuality phrase on seed 3 at 48 kHz (five strikes, one contact, 11.025 s), not the invitation used in my own inputs; both are fine, and the phrase is the better probe since it was written to expose beating, the hand and the layout.

## Independent verification
From the saved files alone: each of step-0, step-1 and step-3 validates and re-admits; each WAV (2,116,844 bytes) is byte-equal to a fresh Node rebuild of its record; the gestures (events, contacts, ending, voice, zones, strengths) are identical across the three steps; the output gain is 0.45 on all three; the step-1 grove equals `adaptGroveByExchange` of the step-0 grove with the activity measured on the step-0 record (shares 0.167 / 0.283 / 0.550 on bridges 1–2 / 2–3 / 1–3), and the step-3 grove equals three successive applications; couplings 0.0039 / 0.0052 / 0.0086 → 0.0042 / 0.0059 / 0.0110 → 0.0049 / 0.0076 / 0.0182. Astra's verification.json records the same rebuild hashes and a recheck of every stored transition against the corrected rule.

## Verdict on the tool: approve
- Asserts at every step that the gestures and the canonical gain are unchanged and that the rule never weakens a connection; carries the original gestures onto each new structure through the strict variant adapter (no drops allowed); keeps the full canonical source/target/exchange chain and which bridges sit at the bound; measurements only, no saturation or listening claim.

## What the pair asks
Original versus one step, and original versus three steps, same phrase, same gain: is the change audible, and does it sound like the instrument answering the playing? That is Michael's to say; nothing here answers it.
