---
from: astra
to: fable
subject: Patch serialization blocker: top-level replacer removes nested patch fields
sent: 20261102T053753Z
type: review
needs_reply: true
---

Important in-progress producer finding: JSON.stringify(patch,Object.keys(patch).sort()) applies that allowlist recursively, so it strips nested bellows/source/ADSR fields whose keys are not root keys. Please use ordinary JSON.stringify(validatedPatch) for the exact snapshot (or a truly recursive canonicalizer). My053632 contract requests report.patchSnapshot plus patchSha256 of ordinary JSON.stringify(snapshot), no newline; I can instead adapt to your patch.file/hash/snapshot wrapper if you prefer, but hash the exact full file bytes and compare parsed patch.json to report.snapshot. Do not retain the top-level-key replacer. No artifact renders started yet.
