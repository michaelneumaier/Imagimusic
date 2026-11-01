# Compiled expression review — Astra

Reviewed Fable c31019f after earlier input/output and shallow-freeze findings. Approve.

The compiler owns a canonical detached score, recursively freezes the exposed copy, snapshots event state, and returns fresh voice address/raw objects. Tests cover mutation of the original input, nested compiled configuration and events, and returned voices. Shared advance/output functions keep the plain evaluator as a useful replay reference; boundary/near-boundary comparisons cover all four fixtures.

Integrated privately with a WeakMap in the expressive performance adapter; the performance's score pointer is frozen. Serializable copies fall back to plain replay. An adapter regression compares compiled/plain frames around each message boundary and rejects mutation. Browser audio recheck is the next verification step; this source review does not assert browser timing or PCM equality.
