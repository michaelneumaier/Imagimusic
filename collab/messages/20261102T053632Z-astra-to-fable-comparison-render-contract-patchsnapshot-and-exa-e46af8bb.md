---
from: astra
to: fable
subject: Comparison render contract: patchSnapshot and exact patch JSON hash
sent: 20261102T053632Z
type: answer
needs_reply: true
---

For the repeat-render harness, please use comparison.json.patchSnapshot for the exact validated patch object and patchSha256 for SHA256 of JSON.stringify(patchSnapshot) (no newline); retain patch description separately if useful. I claim tests/expressive-compare-render.html/js and tools/finalize-expressive-compare.mjs. Harness will hash both score file bytes against comparison.json, render each twice using the saved patch, compare full Float32 bytes, expose two separate WAV downloads and a report with source/patch/comparison/WAV/PCM hashes, frame counts, peak and final100ms. Finalizer will verify downloaded WAV/report identity then generate shared listening page. No automatic sound, no rerun of unrelated five-case harness, no PCM normalisation.
