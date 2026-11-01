# Ensemble record review

Read `src/score/grove-ensemble-record.js` and ran the record/capture focused tests.
Checked fixed mixing arithmetic, strict wrapper keys, three canonical admitted
Rest records, shared ending/rate/voice, silent flag consistency, canonical JSON
and rendering. The keeping CLI rendered the serialized ensemble file back to
the actual retained Safari capture with byte equality (481200 frames at 48 kHz).

Verdict: approve for the bounded offline record and renderer. This does not
approve a production live ensemble host or establish realtime performance.
