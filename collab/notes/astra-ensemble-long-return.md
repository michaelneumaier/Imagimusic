# Returning to a full ensemble passage

2026-11-02 · Astra · investigation, not an expanded reader release

The live ensemble ends automatically at 120 seconds from its first accepted
gesture, followed by a 25 ms fade. Its reader currently refuses any total
length over 30 seconds. A visitor can therefore keep a valid passage which the
linked reader refuses. Direct Listen back now works during the same visit,
but does not resolve returning later from a gesture file.

## Admission contract proposed to Fable

Accept an ending frame through REST_MAX_SECONDS * sampleRate, plus the
canonical ending fade. A limit of 120 seconds on the total would still reject
the automatic ending. Preserve strict identity/admission, 256 KiB file bounds,
and 8–48 kHz for this first extension. Explicitly retain the sample-rate/file
limitations in page copy; do not claim every possible live record is admitted.
No resampling, tail truncation, synthetic silence or schema change.

Preparation remains in a worker which Cancel opening terminates. A previous
successful result remains available if replacement fails or is cancelled.
Playback still requires Listen. On long reconstructions, the page should say
that preparation can take time and Cancel leaves the previous passage intact.

## Resource concern

renderEnsembleRecord currently retains all three stereo Float32 part buffers
and the stereo mix. At 120.025 seconds / 48 kHz, those buffers alone require
184,358,400 bytes (about 175.8 MiB), before recipe banks, engine allocations,
worker overhead, a previous reader result or the playback AudioBuffer copy.
The worker transfers only the final mix; this does not reduce its render peak.

A requested model-side investigation is a mix-only renderer that advances the
three existing engines on one clock and retains only the final mix. It must
retain the exact Float32 part rounding, fade multiplication and Float64 sum
order; the current full renderer remains a reference for equivalence. This is
an implementation hypothesis, not a completed optimization or API agreement.

## Evidence produced

Local renders/ensemble-long-return/ contains authored fixtures derived from
the existing short demonstration with their ending extended to 120 seconds,
plus the 25 ms fade. They are not recordings of a human playing for two minutes.
The reproducible tool composes the authored gestures independently at each
sample rate; it does not resample a saved recording. The earlier ad-hoc 8 kHz
probe retimed those same gesture frames. The 48 kHz fixture preserves the
original gesture frames.

The 8 kHz fixture renders 960,200 frames in approximately 3.76 seconds in Node
on this development machine. Retained part-and-mix PCM is 30,726,400 bytes.
Detailed process memory is in probe-8k.json; it is a post-render process
snapshot, not a measured memory peak. These timings do not establish browser,
phone or realtime performance. Browser cancellation and full-duration opening
remain to be checked once a bounded implementation is agreed and built.

## Experience after this repair

The musical reason to preserve return is that an unhurried passage can remain
recognizable across visits. This supports recurrence and personal meaning
without claiming the instrument remembers a person or interprets a mental
state. Fable has been asked for a concrete musical exploration that deepens
attention/recurrence without adding a large control panel. The existing
optional introduction should remain optional and clearly authored.

Reproduce in separate Node processes:

```sh
node tools/measure-ensemble-return.mjs 8000
node tools/measure-ensemble-return.mjs 48000
```

The tool writes ensemble-8k.json / ensemble-48k.json and corresponding
-report.json files with canonical record and native-endian Float32 channel
hashes. It reports render-only elapsed time separately from recipe preparation.
The first reproducible 8 kHz run took 2.93 seconds; the initial ad-hoc probe's
3.76 seconds included subsequent canonicalization. Neither is a browser claim.
Fable review was requested; no review response is claimed here.

The reproducible 48 kHz run took 12.25 seconds for rendering alone and retained
184,358,400 bytes of part/mix PCM. Canonical record SHA-256:
a83589be256d67e7908e9a65ef140506772b57307d0e7a47a5cd82bbd3dfaeea.
Channel hashes and process snapshots are preserved in ensemble-48k-report.json.
The earlier 15.75-second ad-hoc run included canonicalization after rendering;
do not compare those durations as repeated measurements of the same scope.

## Mix-only prototype (not yet integrated)

Astra-owned src/grove/ensemble-mix.js uses the existing validated recipes and
public Rest engine. It precomputes contact keys at boundaries, applies saved
strikes in their original order, and preserves both Float32 roundings around
the fade before summing parts in Float64. No engine or canonical model files
were changed by Astra. Only final output channels have passage-length storage.

Four focused tests compare to renderEnsembleRecord for one/three partials,
simultaneous strikes, contact boundary changes, silent parts with contacts,
one-frame and one-second fades, input preservation and invalid identity.
All pass. Full 120.025-second / 48 kHz output has exactly the same two channel
hashes and canonical record hash as the reference run. Reproduce with:

```sh
node tools/measure-ensemble-return.mjs 48000 renders/ensemble-long-return mix
```

Retained PCM is 46,089,600 bytes instead of 184,358,400: a 75% reduction in
those arrays, not a claim about total process peak memory. This prototype's
measured Node render took 28.04 seconds versus the earlier reference run's
12.25 seconds. They were separate runs, not a controlled timing benchmark;
the result does not justify a speed improvement claim. The time/memory tradeoff
and browser responsiveness need evaluation before integrating it. Fable review
requested; no response or public reader limit change claimed yet.

## Follow-up experiments and current working tree

A 1024-frame Float64 scratch-block variant produced the same full-duration
hashes, but took27.82seconds in the measured Node run: no material improvement
over28.04seconds. Its report is retained in renders/ensemble-long-return-block/.
The block implementation was discarded in favor of the simpler framewise loop.
The extra late-strike/adjacent-contact equivalence test remains useful.

Fable is changing admission validation in owned model files. An independent
original per-frame-key reference agreed exactly with six seed3/7/11 × partial1/3
cases, including frame0 contact, simultaneous strikes, a contact boundary and
a late strike; admission-comparison.json preserves their bounds. This ran
against an intermediate working tree, so is not final review approval.

The mix adapter working tree now uses Fable's proposed admission:false option
and checks every candidate bound before applying the strike in its own pass.
An over-loud40-strike record is rejected by both renderers. Six focused tests
pass. This integration is deliberately uncommitted until the model API is
finalized; no production worker or browser reader uses this adapter yet.

Fable finalized the deferred-admission API in f72e1b1, resolving the pending
commit dependency above. The six-test adapter can now be committed. His engine
block-renderer proposal is approved for implementation, with fixed scratch,
persistent state and admission checks in the part's tight loop. A thin mixed
adapter will consume its exact samples in part-index order. The earlier block
experiment did not use an engine-local rendering loop, so does not establish
whether this proposed form will improve throughput.

Reader duration extension is agreed in principle. Do not turn speculative
phone slowdown factors into an ETA: duration, elapsed preparation and Cancel
are truthful before any device-local calibration exists. Fable's proposed
musical follow-up is a separately labelled rotation of a person's own gestures
through the three voices, re-admitted and never automatic; provenance placement
needs a contract before any strict version1 file changes. Repair return first.

## Reader integration and native full-duration return (working tree)

The importer now accepts ended.frame through120*sampleRate plus a1..sampleRate
fade, preserving256KiB and8..48k limits. It calls the thin block mix adapter.
The reader shows elapsed preparation without a numerical completion estimate;
the timer clears on completion, cancellation, error and departure. Catalog and
encounter disclosures now state the same limits. Twelve focused importer/mix/
session tests passed, including a121-second maximum-fade boundary and exact
PCM comparison; the additional4096-frame boundary test also passed separately.

Native Safari reopened the120.025-second48k authored fixture and remained idle
until Listen. Listen started and Escape stopped playback. Keep sound produced
23,044,844 bytes,5761200 frames. It equals renderEnsembleRecord + stereoWav
byte for byte: SHA-256
e516fc0115eaff7ea1118abe06809269dea087368ed0135340e170e5c163e7e3.
Evidence: renders/ensemble-long-return/safari-return.wav and
safari-return-verification.json. A second full-file opening was cancelled;
the prior successful passage and its Listen/Keep controls remained available.
This is browser reconstruction/download evidence, not device audio capture.

Safari initially retained the old engine module and reported a missing new
export; opening that module's local URL and reloading it from origin refreshed
the cache, after which the import succeeded. No browser settings were changed.
The full native run used the accepted-sample block path while Fable finalized
terminal-error handling; that error path still needs his final test/review
handoff. No reader integration commit or peer approval is claimed yet.

Final engine dependency is fdf24f8. Astra reviewed the committed kernel and
ran13 focused block/mix/import/session tests, all passing. Formal approval:
collab/reviews/20261102T0156Z-astra-reviews-rest-block-renderer.md. Terminal
processing failure and partial-scratch wording are resolved. Reader/UI peer
review remains pending at this point in the log.

Safari responsive preview at320×656 showed the intake and retained-passage
status wrapping within the column; this is a desktop layout check, not iPhone
hardware validation. Homepage current-edge/history copy now includes direct
Listen back and full-duration return, with reader limits explicit in catalog.

Fable's final reader/mixer review and homepage addendum approve the integration:
collab/reviews/20261102T0158Z-fable-reviews-full-duration-reader.md. His separate
120.025-second48k fixture includes a contact ending on a4096-frame edge and
has zero differing mixed samples against the full renderer. This is additional
independent equivalence evidence, not the same authored fixture as Safari's.
