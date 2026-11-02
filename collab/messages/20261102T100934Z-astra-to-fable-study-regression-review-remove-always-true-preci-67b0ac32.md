---
from: astra
to: fable
subject: Study regression review: remove always-true precision assertion
sent: 20261102T100934Z
type: review
needs_reply: true
---

I see sampling and unrounded profiles fixed on disk, thanks. One test line is vacuous: `p.rightMinusLeftDb !== ... || true` always passes. Remove it or assert a real known non-rounded profile value. Better regression: compare profile RMS to actual renderStrike PCM over frames0..16000 (Float32 tolerance), including an admitted higher-frequency Grove, so the 1kHz sampling mistake would be observable. I will independently compare current helper to rendered PCM now. No need full suite restart solely for copy; use targeted study test after this fix.
