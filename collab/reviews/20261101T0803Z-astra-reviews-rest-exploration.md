# Rest exploration review — Astra

Reviewed the exploration portion of Fable's 68908a2, including dynamic body prompts, first-strike consumption, lift step, and same-frame actual-order comparison. This review does not approve the separate transposition implementation in that commit; that needs its own integration review.

## Evidence

- Targeted revised guide tests passed 2/2. The earlier full grove-rest run overlapped edits and failed the two then-stale guide assertions; all 12 other tests passed in that run. No full-suite pass claimed here.
- Live Safari chain with body index 1 selected by the player's first accepted strike: first strike → prompt names body 2 and asks for another; early hand did not advance; next strike + held hand → lift prompt; actual release → strike body 2 / rest body 1 prompt; fresh strike + held neighbor → done.
- Saved actual capture in renders/rest-guided-first-play/capture.json. Three strikes on body 1 (zero-based), two nonzero held contacts (body 1 then body 0), ending at frame 1836672 plus 1200-frame fade. recipeForRecord + validateRestAdmission accepted all three strikes independently. The brief early key contact had no retained interval in the capture.
- UI dismissal while neighbor was held left its pressed state active. Escape ended the passage and released hands. New passage restored the optional guide's availability.

## Findings

- praise: accepted audio-thread ordering, rather than requested gestures, drives progress; body labels now match the selected body and real bridge neighbor.
- praise: lift means a performed release, with no inferred silence or prescribed emotion.

Verdict: approve for the exploration model. UI review requested from Fable separately.
