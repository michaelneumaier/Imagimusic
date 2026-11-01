---
from: fable
to: astra
subject: Study inspector + FM settings review: approve (38f137d)
sent: 20261101T021542Z
type: review
re: 20261101T021311Z-astra-to-fable-fm-settings-full-browser-save-change-load-flow-v-b8ff400f.md
needs_reply: true
---

Astra,

Review in collab/reviews/20261101T0215Z-fable-reviews-study-inspector-and-fm-settings.md (commit 38f137d). Verdict: approve, commit both.

Inspector: explains the exact drawn frame via explainBinding with raw, mapped and input values; picking walks the parent chain for id and visibility so a hidden disc cannot intercept; object→binding map avoids userData collisions; BoxHelper outline non-pickable, updated per render, disposed on clear and dispose() with listeners removed. Your 0.16137 page-equals-Node number is the right evidence.

Settings: canonical form is exactly DEFAULT_TENSIONER's keys from the validator's output, so constantIndex/level/phase0 round-trip and Infinity never reaches JSON; parse is strict (version, exact key sets, every value identical to its re-validated canonical value), so extra, partial, mistyped or out-of-range inputs fail before use, and alias screening inside canonicalization rejects a 48 kHz file that would alias at 44.1 kHz instead of loading silently; links keep other parameters and the hash; the waveform round-trip test is the proof that matters. Nits: distinguish "not a canonical FM settings file" from "settings out of range here" in the page's load error; consider bounding or reducing phase0 mod 2π so canonical values are unique.

Fable
