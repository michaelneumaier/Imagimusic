# The return in the next voice: derived-record contract (Fable, 2026-11-02; proposal before code, per Astra)

## Purpose
After Quiet on Three Groves, one secondary, never-automatic action, "Hear it return": the person's own kept passage with each voice's gesture history moved to the next voice up, rendered offline as a separately labelled derived record. Recurrence of what the person did, in another voice; no control while playing; the original untouched.

## File shape: a wrapper around an unchanged strict v1 record
```
{ "kind": "imagimusic-grove-ensemble-derived", "version": 1,
  "derivedFrom": { "kind": "imagimusic-grove-ensemble", "version": 1, "canonicalSha256": "<64 lowercase hex>", "operation": "rotate-voices", "rotation": 1 },
  "ensemble": { ...a strict version-1 ensemble record... } }
```
- The inner record is validated, canonicalised and rendered by the existing ensemble code without change; nothing is added to the strict v1 schema.
- `canonicalSha256` is SHA-256 of the UTF-8 bytes of `canonicalEnsembleRecord(source)` with no trailing newline, 64 lowercase hex characters. It is a **declared source identity**, not proof of the transformation: a reader that does not hold the source can only display it ("Derived return · source fingerprint …"), never claim to have verified the absent original. A tool that holds both files can verify by recomputing the rotation and comparing canonical forms.
- The source file and its hash are never modified.

## The rotation (pure, `rotateEnsembleVoices(record, { rotation = 1 })`)
- The destination instruments are the record's own three parts in their fixed order (C, E♭, G as kept); what moves is the gesture history: part k's events and contacts become part (k + rotation) mod 3's, with frames unchanged (one shared clock) and the common ending unchanged.
- Vocabulary check before any move: the destination part's zones, strengths (name and coefficient) and voice must equal the source part's, and every event's position and every contact's zone and strength must index the same entries; any mismatch is a refusal, never a silent remap of an index onto a different coefficient.
- Silent flags recomputed from the moved histories; each moved part re-validated and re-admitted on its destination recipe by the ordinary path (`ensembleRecordFromParts`), so a strike admitted on one voice is checked again on the next, and a refusal is reported as a refusal of the derived result, not patched.
- Output: the wrapper above, with the inner record canonical.

## Reader and page wording
"Derived return": the reader labels a derived file as such, shows the operation and the source fingerprint, states that the fingerprint identifies the source and does not verify it, and plays and keeps it like any ensemble (keeping names say "return"). The page's button is "Hear it return"; status says what moved where ("your C gestures now on E♭, E♭ on G, G on C"). No autoplay, no change to the personal record.

## Tests first
Schema: wrapper validation, strict inner, hash format, refusal of a wrong kind or version, of a modified inner record, and of a vocabulary mismatch. Rotation: frames and ending preserved; silent flags recomputed; rotation 1 three times equals the identity canonically; rotation of the kept demonstration and of a kept personal passage re-admits; a crafted over-loud history refused on its destination; the source canonical text unchanged by the operation.
