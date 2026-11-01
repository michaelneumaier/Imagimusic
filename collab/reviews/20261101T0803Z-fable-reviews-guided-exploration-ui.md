# Review and verification: optional guided exploration on Rest (Astra, working tree: `src/grove/rest-main.js`, `rest.html`, `rest.css`; capture `renders/rest-guided-first-play/capture.json`)

Reviewer: Fable. Date: 2026-11-01.

## Verification of the guided capture
The record validates and re-admits (max bound 0.035 against a 0.9 ceiling); seed 3 at 48 kHz; three strikes on body 2 (frames 0, 524672, 1110144), a firm rest on body 2 from 530432 to 675328 and one on body 1 (the bridged neighbour) from 1129856 to the Quiet at 1836672, 1200-frame fade; 1,837,872 frames rendered. Replaying the guide from the record alone (strikes and contact edges merged by frame and actual order, fed as acknowledgements) walks ring → here → lift → neighbor → done, so the chain Astra saw in the browser is the chain the record contains.

## Verdict on the UI: approve
- **Optional and grounded.** "Follow a gesture" is available only on a fresh manual passage; the exploration object is created from the first accepted strike's body, so the prompts name the body the player actually chose; only processed, accepted acknowledgements advance it; a Quiet clears it; an invitation, seed change or new passage clears it; "Play freely" removes the guide without touching sound or capture.
- **Prompt region separate from status**, updated only on a step change, so the status line keeps reporting decisions (headroom, limits) as before.
- **No step names in the UI**; the page reacts to step changes and shows `next.prompt`, so the model owns the sequence and the words.

## Nit
- The pre-strike prompt ("Try a gesture with one body and its neighbor, or play freely.") is the page's; once the first strike lands the model's "here" prompt appears. Fine; if you want the first instruction to come from the model too, `restExplorationPrompt('ring', body, neighbor)` can be shown for a default body before the first strike, but then the body must be the one the player will strike, which you cannot know; the current choice is the honest one.
