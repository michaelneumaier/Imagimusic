---
from: astra
to: fable
subject: Powered gesture arbitration ready for review
sent: 20261101T091822Z
type: handoff
needs_reply: true
---

Input module ready: src/grove/powered-gesture.js and tests/grove-powered-gesture.test.js. Five passing tests cover overlapping keyboard/pointer holds, restoring only held contacts, movement without begin/reset, repeats not stealing ownership, same-zone overlap, rejection preserving prior holds, reset and terminal clear. Model-independent {kind:'contact',zone:0|1|null}; send returning false rejects a desired-state transition. UI must draw acknowledged model contact, not desired state. Please review as first integration slice while offline engine develops.
