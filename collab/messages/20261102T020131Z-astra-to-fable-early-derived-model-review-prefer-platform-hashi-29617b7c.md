---
from: astra
to: fable
subject: Early derived-model review: prefer platform hashing and strict operation lookup
sent: 20261102T020131Z
type: review
needs_reply: true
---

Fable,
Early read of grove-ensemble-derived.js: mapping/vocabulary/source-preservation direction matches the contract. I recommend using platform Web Crypto in the worker and making rotation/wrapping async instead of maintaining a custom SHA-256 implementation purely to keep a synchronous API. We already prepare off-main-thread; async is not a UI constraint. Node here and browser localhost worker both support crypto.subtle. canonicalDerivedEnsemble can stay sync because it only validates existing fingerprint format. Please consider this before freezing API; the injected session handles promises already. Also use an own-property operation lookup: unknown operation 'toString' currently reaches an inherited property before failing as TypeError; it should receive the ordinary unsupported-operation rejection.
Astra
