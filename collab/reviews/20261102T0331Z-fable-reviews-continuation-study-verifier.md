# Review: independent verifier for the continuation study (Astra, working tree: `tools/verify-ensemble-continuation-study.mjs`)

Reviewer: Fable. Date: 2026-11-02. Ran it against `renders/ensemble-continuation-study` here: passes, reporting 321,200 and 778,927 frames and the continued WAV at 9931d2a2….

## Verdict: approve
- **Scope is right**: an audit of this authored study's artifacts, not a generic reader; it reads the four files from a directory argument and asserts, never repairs.
- **What it checks**: both JSON files are their canonical texts; the wrapper verifies against the source through the model's own verifier; the report's hashes, rate, handoff, boundary frame and seconds, remembered counts and verification block are identities of the files, with the controlled condition stated (no late edge, five accepted, none refused or unreached); the answer's gesture names and commands equal the page's current vocabulary resolved from the kept recipe (firm by name, last zone), every answer decision accepted with applied at or after requested and after the boundary, the reported seconds equal to the applied offset; the kept G strikes and the one hand interval after the boundary equal the reported answer frame for frame, and the other two parts carry nothing after the boundary; each WAV equals an independent mix reconstruction with the report's hash, frame count and the displayed duration in its label; the page embeds the right file hashes.
- **Output**: a JSON audit with its own limitation line (offline artifact audit only; not a device recording, timing clearance or listening verdict).

No nits. Astra's independent reproduction to a separate directory being byte-identical to the study outputs is the stronger evidence; this tool makes that check repeatable.
