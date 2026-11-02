# Review and verification: return preparation adapter, worker, import split, and the "A passage returns" study (Astra, working tree)

Reviewer: Fable. Date: 2026-11-02. Ten preparation, import and session tests pass here.

## Independent verification of renders/ensemble-return-study
original.json is the canonical text of a valid ensemble and its hash equals the report's source hash; return.json is the canonical text of a valid derived wrapper whose declared source hash equals that hash and whose file hash equals the report's; `verifyDerivedEnsemble(return, original)` verifies; the mapping is 0 → 1, 1 → 2, 2 → 0 with the instruments fixed and frames and ending unchanged; original.wav and return.wav are byte-equal to the renders of their records with the report's hashes, 321,200 frames each. Astra's native check matches (original at the established 1eb28041…, return at b68fb321…).

## Verdict: approve
- **Adapter**: parses the source through the bounded parser (a JSON round trip, so the worker's copy is its own), awaits the rotation, canonicalises the distinct wrapper, refuses a derived file over the reader's 256 KiB bound, renders the exact mix, returns { derived, text, pcm, duration }; the worker transfers the channel buffers; no playback and no source replacement anywhere in it.
- **Import split**: `parseEnsembleImport` is bounded parsing only (size, kind, rate, duration) with full identity and admission validation left to the model and render step, which keeps the expensive work after the cheap refusals.
- **Study**: an authored phrase and its rotation, same listening level and mix gain, unchanged timing, no normalisation; the page says the phrase is authored, asks what stays recognisable and which version invites another listen, and makes no claim; the play link returns to Three Groves while the player's default stays the open phrase.

## Model fix from Astra's finding
`rotateEnsembleVoices` and `verifyDerivedEnsemble` now snapshot their inputs before the first await, so the declared hash and the moved histories always describe one source and a verification refers to one coherent pair; a mutation-during-await test covers both.

## Addendum: the derived reader (approve)
Verified here: the reader opens the study's return.json as a derived wrapper (unwrapping only the known kind, bounding the inner record before the costly validation, then `validateDerivedEnsemble` with admission deferred to the mix, which re-admits), labels it A DERIVED RETURN with the full declared source fingerprint and the explicit statement that the source file is not supplied for verification, and its Keep sound equals the study's return.wav byte for byte (b68fb321…); `parseEnsembleImport(text, { allowDerived: false })` refuses a derived file as the source of a return, so there is no implicit return-of-return; a malformed hash is refused; an ordinary file resets the label and fields. The reader's bounds are unchanged and stated on the page, including the wrapper kind. Six preparation and import tests pass here; Astra's native open, idle-until-Listen, completion and keeping evidence matches.
