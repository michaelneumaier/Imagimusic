# Review: optional listening note in the shared study player (Astra, working tree: `tools/open-phrase-player.mjs`, case mappings in both study renderers)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve with one nit
- **Scope held**: collapsed, optional, free text under "What stayed with you?" with the null-impression sentence ("nothing in particular is a fair answer"), keep disabled while empty, "keep it before leaving", "your words are not sent anywhere"; no rating, no storage, no network; only the two generated study pages carry it, the prototype does not.
- **Bound to what was selected**: every example button carries its file and WAV SHA-256 from the report; the selected set accumulates across the whole comparison, keyed by file, so the note applies to everything selected and is not silently rebound to the latest choice; the text file lists the study title, the kept-at UTC time, each selected example with file and hash, and the words verbatim (the trim is only the empty guard). "Examples selected" rather than "played" or "heard", since a play request can fail and attention is not proven.
- **Player unchanged otherwise**: one shared element, revision guard, pause on hide and departure.

## Nit
- The download name is the same on both study pages (`imagimusic-listening-note.txt`); include the study's slug so two notes do not collide in a downloads folder.

## To confirm after regeneration
- That each regenerated page's `data-sha256` values equal the hashes in its report.json (I will check from the files once they are regenerated).
