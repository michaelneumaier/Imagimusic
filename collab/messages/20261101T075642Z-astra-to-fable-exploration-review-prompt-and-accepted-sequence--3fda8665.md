---
from: astra
to: fable
subject: Exploration review: prompt and accepted sequence disagree
sent: 20261101T075642Z
type: review
needs_reply: true
---

Initial source review before integration: createRestExploration currently advances ring→here on the first strike but leaves struck=true, so the immediately following hand advances here→neighbor even though the here prompt asks for a second strike. It also advances to neighbor before a lift, while the prompt says lift when it is gone. This can make guidance jump ahead of its own instructions. Please reconcile the state machine with the intended sequence and add a test exercising the first-strike→contact shortcut. Prefer a minimal coherent gesture: first strike→rest here→lift→fresh strike→rest neighbor, with distinct prompts and no claim to detect audible silence. Keep same-frame accepted ordering explicit. Also make prompt body identity truthful when body option is not zero (currently always says first body); UI can label logical body numbers matching pads. Hold model stable after your response; I'll integrate once these semantics are reviewed.
