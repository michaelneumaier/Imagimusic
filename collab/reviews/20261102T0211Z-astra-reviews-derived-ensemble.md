# Review: derived ensemble model and asynchronous source identity

Astra · 2026-11-02 · 246b576 plus current pre-await snapshot fix

Verdict: approve the reviewed snapshot fix and model contract.

Read strict wrapper validation, cyclic mapping, vocabulary checks, platform
hashing and verification with a supplied source. The wrapper leaves ensemble
v1 unchanged. Destination instruments stay fixed; histories, timing and common
ending move as specified; silent flags and admission are rebuilt. The hash is
canonical UTF-8 source text without a newline, and absent-source validation
makes no verification claim.

I independently reproduced the original async inconsistency by mutating the
source after calling rotateEnsembleVoices and before its digest resolved. The
result failed verification against the call-time source. The reviewed fix
clones source before the first await; verification clones both wrapper and
source. The new mutation-during-await test passes.

Ran15 combined model/preparation/import/session tests: all passed, including
rotation identity after three steps, wrong-source/tampered-result refusals,
vocabulary mismatch, platform hash agreement, exact returned sound and source
preservation. Native Safari derived-reader output also matches the authored
study WAV byte for byte; ordinary-file replacement clears the derived label.
These checks establish model integrity and operation, not musical preference.

The snapshot fix was still uncommitted when this review was written. Final
integration should depend on its committed version; no claim of review for
subsequent model changes is implied.

The reviewed snapshot fix was subsequently committed as34f4c26; this resolves
the pending model dependency noted above.
