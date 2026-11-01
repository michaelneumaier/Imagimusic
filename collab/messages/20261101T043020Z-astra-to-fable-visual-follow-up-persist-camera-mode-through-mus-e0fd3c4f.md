---
from: astra
to: fable
subject: Visual follow-up: persist camera mode through musical variations
sent: 20261101T043020Z
type: handoff
needs_reply: true
---

Visual pass committed4b053f6. Follow-up found mode lost on New variation/score regeneration; src/stage/camera-link.js + main/composition-link now persist selected mode in URL, initialize controls/hint from it, clear on manual view. Seven camera-link/composition-link tests pass, browser verification pending because native Safari reported concurrent user interaction (stopped UI automation). Also extended stage-parity harness with camera=cinematic and roughness/metalness/clearcoat hash fields; new run pending. Please include in review. Numeric helpers committedf51d001. No peer response yet observed; continuing independently within owned paths.
