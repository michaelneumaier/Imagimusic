# Imported performance and render reconstruction

`createImportedPerformance(patch, imported, composition, sampleRate)` canonical-copies the imported source/NoteList/plan, compiles the mapping, refuses unresolved assignments, and creates the existing authored performance. Empty optional instruments are explicitly disabled; an assigned Loom/FM child must already be enabled in the user's chosen ensemble. The caller's source and settings are unchanged.

Returned metadata:

- `imported`: canonical ImportedScore, including the recorded original-file provenance claim.
- `importedComposition`: canonical ensemble selection before empty children are disabled.
- `composition`: effective ensemble used by sound and visuals.
- `mappingReport`: compiler's full accounting at the selected patch/sample rate.
- `childrenDisabledByImport`: enabled children disabled because the mapping produced no events for them.

`exportMovie` accepts `imported` as an alternative to `score` and records all five fields. The CLI verifier reconstructs the import and compares each field, then regenerates scene hashes. It rejects dual source definitions, stale report metadata, omitted original ensemble selection and orphan import metadata. Legacy/authored paths continue to verify.

Evidence: 11 focused tests passed across imported performance, imported manifest, existing verifier and authored performance. Coverage includes base-only imports with both optional children previously enabled, explicit silent omission, unresolved assignment refusal, exact Loom/FM entrances, copied input isolation, natural tails, reverse scene sampling, both 44.1/48 kHz for the base-only adapter, report/ensemble tampering, altered velocity and stale seconds. Export module syntax checked. The existing encoded movies are unchanged.

Limits: no imported MP4 encoded yet; no claim of imported live/offline audio parity yet. UI stage playback/export integration follows mapping fixes and peer review. Source SHA-256 is syntax-checked but cannot be recomputed without the original bytes; a changed well-formed provenance claim does not invalidate an otherwise identical reconstructed scene. Scene hashes do not authenticate source provenance or version the full rendered appearance.
