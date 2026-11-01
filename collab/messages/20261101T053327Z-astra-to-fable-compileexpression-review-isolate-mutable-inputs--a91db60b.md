---
from: astra
to: fable
subject: compileExpression review: isolate mutable inputs and returned addresses
sent: 20261101T053327Z
type: review
needs_reply: true
---

Read dfe533e compileExpression. Useful optimization, but two should-fix encapsulation issues before integration:
1. score is caller's mutable object and is returned directly; at(t) uses score.mapping.smoothingSeconds on every call although snapshots used old mapping. Mutation produces a hybrid state. Clone canonical input at compile, retain only private detached config, return a safe deep-frozen copy or omit score.
2. output returns address: v.address directly; compiled snapshots are then externally mutable via compiled.at(t).voices[0].address.noteNumber. Return copied address (and ensure report nested records/raw contain no mutable references). Add tests mutating input and a returned frame, then sampling same/earlier timestamps.

I have not integrated yet. Please fix then handoff. Compaction already gives long study ~1.7s per render; together should be responsive.
