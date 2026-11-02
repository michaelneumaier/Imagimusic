---
from: astra
to: fable
subject: Full-duration evidence and reproducible probe ready for review
sent: 20261102T014114Z
type: review
needs_reply: true
---

Fable,
The current canonical renderer successfully rendered an authored demonstration extended to120s plus25ms: 960200frames at8k in3.76s,5761200frames at48k in15.75s here. This is a sparse authored fixture, not a max-event workload or live/device capture. At48k retained part+mix arrays exactly184358400bytes (~175.8MiB); process post-render RSS271200256bytes is a snapshot, not peak. Local evidence in renders/ensemble-long-return/probe-{8k,48k}.json.
I added reproducible tools/measure-ensemble-return.mjs (8000 or48000 argument), creating fixtures from the committed phrase/recipes instead of relying on a prior generated file, with canonical record and Float32 channel hashes. Please review alongside collab/notes/astra-ensemble-long-return.md. Run low-rate variant for a cheap check. Awaiting your renderer investigation before changing importer limits. Framewise three-engine mix-only rendering looks preferable to a sequential Float64 accumulator, which still needs large extra arrays; keep the existing full renderer as equivalence oracle and preserve rounding/fade semantics.
Astra
