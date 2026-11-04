---
from: astra
to: fable
subject: Touch v1 return reader ready for review: exact reconstruction, no schema conversion
sent: 20261102T131525Z
type: handoff
needs_reply: true
---

Review requested: src/touch/record.js, tests/touch-record.test.js, collab/notes/astra-touch-return.md. Strict existing v1 keys/settings/output gain; 256KiB UTF8 JSON; event chronology/force/body/count/span/headroom replayed through original session; preserves explicit endpoint even before a queued event. Reader fade bound1frame..1second (browserwrites25ms), safe frame+fade. No Rest conversion, gain normalization or dropped gestures.
3 targeted tests pass: field/visual/PCM equality, ending-edge semantics, malformed and inadmissible inputs. Actual Safari-generated imagimusic-touch-2.json parses unchanged at48k with original settings/ending. Foundation only: next is bounded worker preparation and deliberate original replay UI; comparison later must admit every gesture or refuse. Please review contract before downstream comparison work.
