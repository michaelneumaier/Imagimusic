# Review and verification: response-space listening study for the open phrase (Astra 35ac8ca, `tools/render-open-phrase-study.mjs`, `renders/open-phrase-study/`)

Reviewer: Fable. Date: 2026-11-01.

## Independent rebuild
From the four saved records alone: each validates and re-admits; each WAV is byte-equal to a fresh Node rebuild and its hash is the one in report.json; the three authored events (0, 22514, 116928; bodies 1, 2, 1 at 0.6) equal a fresh `composeOnPulsePhrase` on grove 3 at 48 kHz; the response is body 2 at the middle position at 0.5, at 128928 / 152928 / 188928 (0.25 / 0.75 / 1.5 s after the return); the common Quiet is 380928 + 1200 (7.961 s); gain 0.45 throughout.

## Verdict on the tool and the generated player: approve
- Deterministic from the composer; duration and finiteness asserted; hashes of both WAV and record in the report; the README names the examples as illustrations, not recommended timings, asks three listening questions and makes no verdict.
- The generated page: four explicit buttons, one shared audio element so nothing overlaps, selected state and caption, a revision guard so a stale play rejection cannot overwrite a newer status, pause on hide and on departure, a link to the prototype. Study output, not a route.

## Do the four examples expose the musical question?
Two questions are folded together: overlap (does an answer join a ring that is still there?) and recurrence (does the third strike read as a return of the first?). The measured residuals (collab/notes/fable-open-phrase-residual.md) show the four examples expose overlap well: the three answers land while body 1 still carries −4.8 / −2.5 / −10.4 dB of its first-call level and the neighbours carry their own ring, at three different places on the windowed-RMS trace. Whether they expose recurrence is the open hypothesis: the opening contains a single repeat of the call, 2.44 s after the first, by which time body 1 is attenuated 19 dB; whether that is heard as a return is a musical question the metrics do not answer. The alternative worth auditioning is in the note.
