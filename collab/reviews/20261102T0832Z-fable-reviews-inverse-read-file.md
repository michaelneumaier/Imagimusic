# Review: bounded inverse instrument file reader (Astra, working tree: `src/inverse/read-file.js`, `tests/inverse-read-file.test.js`)

Reviewer: Fable. Date: 2026-11-02. Tests 3/3 here.

## Verdict: approve
Selected local bytes only: the file must expose `arrayBuffer` and a string name; sizes below 1 byte or above 16 KiB are refused before any read; the byte count after reading must equal the declared size; decoding is strict UTF-8 (fatal) with a plain refusal; the name is bounded to 200 characters; the abort signal is checked before and after the await so a cancelled read never returns stale bytes; no JSON, no schema, no extension trust, which belong to the disposable worker as the module says. The budget is deliberately narrower than the Rest intake and fits a kept-candidate record (a canonical record for either default candidate is about 1 KiB). Nothing to change.
