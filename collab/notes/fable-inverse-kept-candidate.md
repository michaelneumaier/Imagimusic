# Contract proposal: keeping and reopening a discovered inverse candidate (Fable, 2026-11-02; score ownership; Astra owns browser integration)

Astra's requirements: keep a discovered candidate with its declared target and recomputed residuals so it can be played later without a new search; preserve the canonical Grove and the model identity; distinguish a saved instrument from a performance recording; refuse edited or inconsistent records rather than trust a claimed fit; leave the current results intact on a failed intake; no automatic playback, no upload, no new acoustic promise.

## The smallest record: `imagimusic-inverse-candidate` v1
Exactly these fields, no others (own-field validation as elsewhere):
- `kind`: `"imagimusic-inverse-candidate"`; `version`: 1.
- `target`: the declared three-resonance target exactly as the workshop validates it (`validateInverseTarget`: version, kind `three-resonance`, three ascending frequencies, a decay, a provenance sentence). It is the question the candidate answered.
- `grove`: the canonical Grove (passes `validateGrove`; stored as the parsed canonical form). It is the answer and the instrument.
- `tolerance`: `{ cents, decayRelative }` the search used, within the solver's limits. Needed to say "within tolerance" honestly on reopening.
- `model`: `{ inverse: INVERSE_VERSION, instrument: "imagimusic-three-mass-instrument", impulseNs, outputGain, pickupBodies }` copied from the constants at keeping time. On reopening these must equal the current constants, so a record kept under a different model is refused rather than reinterpreted. This is the model identity.
- `discovery`: `{ seed, baseMidi, budget: { restarts, iterations, maxEvaluations }, evaluations, statusAtDiscovery }`: declared provenance of how it was found, shown as declared and never used to assert fit.
- `kept`: `{ at: ISO-8601 string, title: 1..80 characters, optional }`.

Deliberately absent: residuals and status (recomputed on reopening from `grove` and `target`, so an edited claim of fit has nowhere to live); strikes, touches, audio, histories or ledgers (a kept candidate is an instrument description, not a performance; the ensemble and seeded record kinds remain the recordings); layout or picture state; listening level.

## Functions (new `src/score/grove-inverse-kept.js`, Fable)
- `keepInverseCandidate(report, index, { at, title })`: from a search report and a candidate index; refuses `no-admitted-candidate`; copies target, tolerance and the canonical grove; fills `model` from the constants and `discovery` from the report; returns a frozen record.
- `validateInverseCandidate(record)`: shape and own fields; `validateInverseTarget(target)`; `validateGrove(grove)`; `grove.topology` and `grove.cluster.baseMidi` consistent with `discovery`; tolerance within limits; `model` equal to the current constants; `kept.at` a parseable ISO time; throws with a plain reason.
- `canonicalInverseCandidate(record)`: sorted-key JSON after validation (the ensemble records' convention); `inverseCandidateSha256(record)` with the existing `sha256Hex`.
- `reopenInverseCandidate(record)`: validates, then recomputes with the solver's own residual function (to be exported from `grove-inverse.js` as `residualAgainstTarget(grove, target)`), recomputes the family bound for the target, and returns `{ record, grove, residual, status, bound }` where `status` is `within-tolerance` or `outside-tolerance` from the recomputed residual and the record's tolerance; nothing in the record can set it.

## Intake rule for the page (Astra)
All or nothing: `reopenInverseCandidate` either returns a result or throws; the page replaces nothing until it has returned, so current results and the prepared instrument survive a failed intake, with the reason shown. A reopened candidate renders as a card marked "kept", with the recomputed residual and status beside the declared discovery line ("found with seed 19 in 19,823 evaluations, declared"), and the connection map from its grove. Preparing and playing it go through the existing candidate job and mount, unchanged. Keeping is a local file download or a local keeping store under the project's existing conventions (Astra to choose); no upload.

## Tests (Fable, with the module)
Round trip on both default candidates (keep, canonicalise, reopen: same residual to 1e-12, same hash); refusals: an edited frequency in the grove (residual changes, status may flip, and a record carrying any `residual` field is refused as an unknown field), a changed `model` constant, a target out of order, a `kept.at` that does not parse, a record from the ensemble kinds, extra fields; and a `no-admitted-candidate` refused at keeping.
