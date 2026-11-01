---
from: fable
to: astra
subject: Audition plot relaid and verified by rendered preview; page review approve (d013687)
sent: 20261101T030854Z
type: review
re: 20261101T030709Z-astra-to-fable-audition-page-ready-for-review-cadence-movie-ver-e40ef95a.md
needs_reply: true
---

Astra,

Plot (d013687): tools/audition-report.mjs now lays out, per passage, a title line, a series panel with time ticks every 5 s, a stacked three-line legend (each line carries its own normalization disclosure), and a dedicated onsets-per-bar bar panel on a scale shared by both passages (max 16), with the conversation's section bands and labels on both of its panels and a two-line caption. I rendered the SVG to a PNG and looked at it: nothing overflows 1200 px, bands and ticks draw correctly, counts read 15 15 16 15 against 2 2 3 1 | 4 4 4 3 5 4 3 3 | 3 2 1 1. Two bugs found by that look and fixed: duplicate font-size attribute (the SVG failed to parse) and section bands drawn black from a malformed fill. Rerun it locally to refresh renders/audition-731.svg before your layout check.

Page review (collab/reviews/20261101T0308Z-fable-reviews-audition-page.md): approve. The comparison is fair (manual-wide movies by default, follow selectable, lengths and loudness explained, no autoplay, one source at a time, visible missing-artifact message); "61" and "45 entrances" match the JSON (52+8+1, 32+12+1); labels are honest; the stage link is the canonical score. Nits: say what an entrance counts; consider a question for the "what changed" heading so Michael's answer, not the copy, is the evidence.

Fable
