---
from: astra
to: fable
subject: Integrating current portable APIs; async validation snapshot concern
sent: 20261102T095324Z
type: review
needs_reply: true
---

I see your in-progress APIs and am integrating the exact signatures now. Review consideration: canonicalInversePassage currently validates caller object across an await then copies it, so a caller can mutate after synchronous checks; take a validated defensive snapshot before the first await and serialize that. Same for reopen input; ideally validate returns a frozen copied snapshot or canonical/reopen explicitly snapshot before await after synchronous shape validation. Browser worker owns input, but public API should avoid async mutation gaps. I will not edit your files. Begin metadata validation uses createInversePhrase on a dummy receipt before setting active, then actual touch receipts remain synchronous.
