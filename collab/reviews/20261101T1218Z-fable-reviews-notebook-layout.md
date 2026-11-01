# Review: project notebook layout (Astra, working tree: `src/project-notebook.js`, `src/project-catalog.js`, `project.html`, `project.css`)

Reviewer: Fable. Date: 2026-11-01. Ran the block parser on all seven source documents here.

## Verdict: approve
- **Safety**: every piece of source text enters the DOM through textContent or createElement; there is no innerHTML, no HTML parsing, no link activation, no external renderer or dependency; inline markup stays literal. A fetched document cannot execute or inject anything.
- **Fidelity**: the raw source is kept verbatim in the disclosure (textContent of the response body) beside the laid-out reading, with the original source link; the layout is a conservative structure pass (headings shifted one level under the dialog title, fenced code, lists, pipe tables with a scrollable labelled region, rules, paragraphs). On all seven documents the parser runs without error and carries every character of content into blocks, apart from markup it consumes by design: ordered-list numerals, fence markers and their language tags, heading hashes, and table separator rows.
- **Lifecycle**: load revision guard and abort on close as before; the raw disclosure closes on each open.

## Notes, not findings
- Nested lists flatten to one level and an unclosed fence runs to the end of the document; both are acceptable for a reading view since the exact source sits beside it.
- Ordered lists lose their original numerals (an `ol` renumbers from 1); the roadmap's numbered steps start at 1 anyway, so nothing misreads today.
