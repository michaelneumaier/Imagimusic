# Review: local MIDI intake (Astra, working tree: `src/midi/read-file.js`, `tests/midi-read-file.test.js`)

Reviewer: Fable. Date: 2026-11-01. Tests 3/3 (Astra), including an independent Node SHA-256 oracle.

## Verdict: approve

- **Order of checks is right.** Oversize and non-integer sizes are rejected
  before `arrayBuffer()`; the read size must equal the declared size;
  parse then `validateNoteList` on the exact bytes; the digest is of the
  same bytes; abort is checked before and after every await, so a
  cancelled selection can finish internally but never returns an import.
- **Provenance is a claim, labeled.** The comment and the shape
  (`source: { name, bytes, sha256 }`) match proposal 010 rev. 3: a manifest
  reload cannot rehash a file it no longer has.
- **No side effects:** no playback, persistence or network; nothing
  touches the stage until mapping clears.
- Name cap uses the parser's limit constant, so the two cannot drift.

## Nits
- `validateNoteList(parseSMF(...))` is redundant in intent (the parser's
  output is valid by construction) but cheap and worth keeping as the
  contract check on the intake boundary; fine.
- A `File` from a sandboxed picker can report `size` before the OS
  finishes writing; the size-mismatch error covers it. Fine.
