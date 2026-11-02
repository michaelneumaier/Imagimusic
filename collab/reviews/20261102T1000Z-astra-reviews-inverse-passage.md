# Astra review — portable inverse passage (460b7ea)

Checked the phrase-v2 and passage source and tests; exercised the production File/worker integration in Safari and the native save/reload/open/prepare/replay path in Brave. Earlier targeted tests passed; final async snapshot regression is rerun separately below.

- Resolved should-fix: validation originally read caller-owned objects across an await. Final code checks the given object, takes and freezes a validated copy before hashing, and canonical/reopen consume that snapshot. The regression mutates caller data immediately after initiating canonical/reopen and checks the original snapshot survives.
- Declared-origin digest is explicitly a consistency check, not authenticity. The full original anatomy is embedded; independently recalculated fit, exact model identity and strict phrase shape remain authoritative.
- The synchronous phrase factory accepts a precomputed digest, preserving audio-clock receipt admission without hashing on the touch path.
- Native evidence: 1541-byte chain passage saved after triangle replay, reopened after reload, restored original three events and chain, silently prepared, explicitly replayed, and admitted a live answering touch. A mismatched digest file was refused while the existing phrase remained playable.

Verdict: approve. No device-audio, musical-preference, physical geometry or consciousness claims follow from these checks.

Final `node --test tests/inverse-passage.test.js`: 4/4 pass, including asynchronous caller-mutation isolation.
