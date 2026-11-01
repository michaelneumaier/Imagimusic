# Audit: first-use wording against actual behaviour (Astra's first-use pass, working tree: `grove.html`, `rest.html`, `listen.html`, `src/grove/rest-main.js`, `src/listen/main.js`)

Reviewer: Fable. Date: 2026-11-01. Method: every first-minute sentence checked against the code path it describes.

## Verdict: approve; wording matches behaviour

| page | sentence | behaviour |
|---|---|---|
| Grove | "Hear its greeting, then touch a body and listen across the connections." | greeting button enabled once the grove is open (`disabled = !open`); gestures reach three coupled bodies |
| Grove | "Enter, then hear its greeting or hold and release A · S · D." | keyboard hold/release maps to bodies via the keys array; velocity from hold time, as the hint says |
| Grove | "Headphones reveal the stereo space." | stereo pickups panned by layout (`grovePans`), true for both voices |
| Rest | "Strike once, rest a hand on it, then lift. Or let a short passage show you how." | strike command, contact hold/lift, invitation via `schedule` |
| Rest | "A · S · D strike; hold J · K · L to rest a hand." | `strikeKeys`, `restKeys`, keyup lifts by key |
| Rest | "Your turn. Strike once, rest on that body, then try its neighbor." | the order the exploration state machine enforces; `neighbor` is the bridged body |
| Rest | "Audio paused. Resume keeps this passage; hands and Quiet can still be released." | host allows release and Quiet while suspended; acknowledged at the actual frame on resume |
| Rest | "ends gently after two minutes" | automatic acknowledged Quiet at 120 s with the 25 ms fade |
| Doorway | "Press Listen to begin. Headphones reveal the space between the bodies. Escape brings Quiet." | sound only on Listen; two coupled bodies in stereo; Escape handler added in `listen/main.js`; hint moved into the runtime choice message so it is not overwritten |

## Two small suggestions
- Rest strike status "Let the ring reveal its neighbors." leans toward an outcome; "Listen for the others." says the same without promising it.
- Invitation ending copy: Astra's choice to offer the next experiment rather than claim the demonstration was heard is right; `createRestExploration` (landed) can drive those prompts from acknowledged gestures so the page never advances on a request.
