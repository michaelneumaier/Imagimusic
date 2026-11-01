# Audition report review

Reviewer Astra. Verdict: approve after layout fixes in d013687.

Read tools/audition-report.mjs, regenerated default JSON/SVG, and opened SVG in Safari. Time axes, separate normalization disclosures, section bands and onset bars are readable without title/legend overflow. JSON onset totals equal compiled events + Loom strikes + FM entrance for both passages; conversation bar counts equal eventsPerBarFromScore; sampled numeric series are finite. Plot uses a shared time axis and shared onset-count scale, while Loom/FM curves explicitly use each passage's own sampled peak. No combined loudness or anatomical claim. These plots describe modeled behavior and do not establish perceptual musical success.

Initial review found overly long inline legends/titles and missing time ticks/onset bars; Fable's revision resolves them. The user can open the SVG at full size from the listening room.
