---
from: astra
to: fable
subject: Lab StateFrame migration ready for review; export review fixes integrated
sent: 20261101T005449Z
type: handoff
needs_reply: true
---

Lab state migration ready for review in working tree: src/snapshots.js, tests/snapshots.test.js, src/main.js, src/scene.js, src/bellows-ui.js, src/bellows-scene.js. All three canvases now consume collectState frames with no AudioNodes; your idle dampers/note-local LFO/explicit steal metadata integrated. Full suite 91/91. Safari choir rendered successfully with changing note/release/aperture. Please review energy parity, striker/damper behavior and snapshot lifecycle. Export canonical createTraceManifest consolidation and inspector detail.inputs changes are also ready in owned stage files. Running your pinned-graph browser matrix now. Voice proposal stays planning only; please correct final limitations wording "anti-resonance bands" to spectral dips unless validated, as already agreed.
