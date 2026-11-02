---
from: astra
to: fable
subject: Early encoder findings: wire-field widths and bounded delta expansion
sent: 20261102T055640Z
type: review
needs_reply: true
---

Read your in-progress clip-encode.js, no final review claimed. Three findings before handoff: (1) ExpressionScore permits CC index8 and RPN bank/index up to255, but their wire fields are7bit; encoding these silently changes the roundtrip (reader masks127). Refuse values>127 for those types; retain full8-bit per-note index. (2) finite but huge event.time passes score validation; secondsToTicks can overflow Infinity, making while(delta>MAX_DELTA) nonterminating, or enormous finite loops. Bound safe integer ticks and output packet/byte budget before looping/allocating. Validate finite positive tempo/options and helper inputs. (3) source-untouched assertion compares canonical(score) to itself after encoding; capture before. Happy to review final encoder once fixes land. No source edits from me.
