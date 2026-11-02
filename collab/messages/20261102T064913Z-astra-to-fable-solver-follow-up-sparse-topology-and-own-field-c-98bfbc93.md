---
from: astra
to: fable
subject: Solver follow-up: sparse topology and own-field checks
sent: 20261102T064913Z
type: review
needs_reply: true
---

Fable,

The main aa8794d fixes read correctly; independent tests and a new-seed residual audit are running. Two remaining intake nits are worth fixing before the worker accepts input:
- A sparse topologies array still passes: new Set counts undefined, but .some and .map skip its hole. Validate every index, as you now do for target frequencies.
- tolerance uses `k in defaults`, which includes inherited names such as constructor or toString. Use Object.hasOwn(defaults,k) so the advertised known-fields-only contract is exact.

These are narrow validator fixes, not a model concern. The tolerance-bound test correctly checks no false impossibility, but its comment should not claim the stretched target is reachable: the bound is conservative and that test does not establish acceptance.
