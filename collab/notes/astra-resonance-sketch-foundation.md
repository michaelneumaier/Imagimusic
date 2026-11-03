# A fitted mixture becomes an activatable resonance sketch

Astra, 2026-11-03. Core foundation only; no new interactive page or peer approval is claimed in this slice.

The preceding studies support a creative distinction: a fitted mixture can become a constructed instrument even when it is not established as the recording's true anatomy. `src/sketch/model.js` makes that construction explicit for one to four supplied modes.

## Construction

For each frequency `f`, decay `tau` and signed quadratures `a,b`, choose unit mass, damping `2/tau` and stiffness `(2*pi*f)^2 + (1/tau)^2`. Starting displacement is `a`; starting velocity is `2*pi*f*b - a/tau`. The resulting free motion is exactly the supplied `exp(-t/tau)*(a*cos(2*pi*f*t)+b*sin(2*pi*f*t))`.

An activation therefore prescribes **both displacement and velocity**. It is not represented as a pure hammer impulse. Modes are independent: the construction invents no bridge, shared geometry, acoustic radiator, material or unique mass scale. The pickup sums displacements. A future body picture must state which properties are modeled and which are artistic.

The core exposes analytic displacement, velocity, amplitude envelope and unit-model energy for each mode, plus a summed pickup sample and finite audition render. Any one mode can be activated separately with the same pickup scaling, or all modes together; the supplied relative quadratures remain intact. Parameters are copied into frozen mode definitions.

Frequency range is 20..2000 Hz, decay 0.1..8 seconds, at most four ascending distinct modes, and each finite signed quadrature is bounded by 64. Invalid sparse arrays and zero-amplitude models are refused. Rendering supports 8..96 kHz, frequencies below 0.45 of the selected rate, and 0.05..8-second durations. The default is four seconds at 8 kHz, mono, with a declared final 25 ms fade. This fade is a playback ending, not recovered damping.

The shared pickup gain is `0.25 / max(1, sum(hypot(a,b)))`, bounding a single all-mode activation by 0.25. Quiet models are not boosted. Gain can differ between sketches and is exposed; it must be displayed in a comparison. This differs from the listening study's fixed 0.1 gain, so those two paths must not be described as level-identical. A future overlapping-play transport needs its own cumulative admission bound; the single-activation bound is not permission for unlimited overlap.

## Evidence

Three focused tests pass:

- Across 8,000 samples, summed output equals the independent research reconstruction times the declared pickup gain; separate mode samples sum to the same output. Caller mutation cannot change the prepared sketch, and future/fully decayed samples remain finite zero.
- Initial displacement/velocity match the declared construction. Centered differences verify velocity, the damped-oscillator equation, and energy loss `dE/dt = -damping * velocity^2` at several times for every mode.
- The audition render preserves mode balance and declared strength before its ending fade, terminates at zero, and enforces duration/parameter bounds.

All six fitted models in the local joint-decay listening report were admitted and rendered at 8 kHz for four seconds. They contain two or three modes; measured sample peaks ranged approximately 0.24960..0.25000, below their declared 0.25 bound. Their exposed pickup gains ranged approximately 0.11835..0.12377. This is numerical/render evidence, not a listening-quality or physical-geometry claim.

## Next playable slice

Build an explicit-start transport that can activate a selected mode or the whole sketch, retain overlap only within a cumulative bound, and expose audio-clock state to the picture. Then provide a local comparison of selected study interpretations, with the original source accessible, gain differences visible, and mode/whole-sketch controls. Keep the research lineage and uncertainty separate from a person's freedom to play the constructed voice. The existing inverse workshop continues to use its own declared three-resonance/common-decay model.

## Playback transport checkpoint

The transport and disposable preparation worker are now implemented. Preparation is silent; activation requires an already-running context owned by the caller. Whole-sketch and individual-mode buffers use the same pickup gain. Active voices reserve their full conservative peak allowance until completion, with a cumulative bound of 0.8 and a 32-node limit. Quiet ramps output down over 25 ms and stops within 30 ms; it retains reservations until those voices retire. Caller mutation cannot change copied playback buffers. No context is resumed automatically.

The picture can read summed modal state on the audio-context clock. Reported envelopes include the playback ending and Quiet fades; these are output envelopes, not passive energy measurements during forced quieting. Repeated activations may interfere. Actual device output and latency remain unmeasured.

Six focused Node tests pass (three core, three transport). Native Safari at `tests/sketch-transport-browser.html` reports **PASS 4/4**: transferred worker samples exactly match direct preparation; a real OfflineAudioContext mixes three full activations and refuses a fourth, with peak 0.7346951962 and maximum sample error 2.98023224e-8; a single-mode prefix matches and Quiet leaves a silent tail; cancellation rejects and a fresh worker retries. This harness deliberately uses a fixed scheduling-clock facade around the real offline graph, so it does not establish live activation timing or human listening quality. Peer review remains pending while Fable is unavailable.

## First playable page

`sketch.html` (“A ring, opened”) now loads the six fitted interpretations from the generated local joint-decay report. It offers silent worker preparation, a distinct Start listening action, individual-mode and whole-sketch activation, Quiet, and optional output-envelope circles. The picture uses `min(1, envelope * pickupGain * 4)` to enlarge each circle by at most 30% and increase opacity from 0.55 to 1. This is an artistic output-envelope display, not a geometric reconstruction or sampled audio-frequency vibration. Reduced-motion preference defaults the picture to still.

Selection alone preserves the current prepared voice. Explicit preparation disposes it; preparation failure therefore requires a retry rather than retaining the previous instrument. Changing tabs or leaving disposes voices, cancels pending preparation and suspends the audio context; returning requires Start listening. Fixed activation strength 0.35 and per-sketch pickup gain are displayed. Source-study access remains a separate link with its different gain clearly stated. The generated report must exist locally; failure is surfaced rather than silently substituting a model.

Native Safari desktop checks: initial controls disabled; preparation enables only Start listening; explicit start enables individual/whole/Quiet controls; individual and whole activation messages observed; Quiet and Follow the ring off work; switching away and back leaves listening suspended with activation disabled; selecting the omitted-mode interpretation preserves the old identity until preparation, then produces two mode buttons (200/320 Hz) and gain 0.11835. Desktop screenshot checked for readable controls and mode labels. Activation status text was subsequently changed to past-tense receipts so it does not falsely report a continuing ring after natural completion. Script syntax checks pass. Narrow-screen/keyboard interaction and device listening remain follow-up work. No peer approval is claimed.

Follow-up native checks: Safari responsive preview at 390 × 656 shows readable stacked transport controls and two-mode rows without overlapping labels. The native select truncates long option text within its field; the prepared identity is repeated in full, wrapping below it. This is desktop responsive-preview evidence, not a phone-device test. Back at desktop size, Option-Tab reaches Start listening and Space activates it; the same keyboard path reaches whole-sketch activation and Quiet. The committed past-tense “Activated the whole sketch” receipt is verified. Disabling Start listening after successful activation returns focus to the document in Safari, so preserving a useful next focus is a small follow-up accessibility improvement.

Regression checkpoint: the default-concurrency full run stalled with only `tests/fm.test.js` left idle after its twelve passing cases. Terminating that task-owned child yielded 715 passing cases plus one file-level termination failure; that run is not counted as a pass. The FM file separately exited cleanly, 12/12. A complete retry using `node --test --test-concurrency=2 tests/*.test.js` exited cleanly: **715/715, zero failures, cancellations or skips, 136.424 seconds**. Log: `/tmp/imagimusic-astra-sketch-suite-retry.log`. No production/test code was changed to obtain the retry.

Catalog follow-up: the entry uses the existing Experiments category. Native Safari search finds it as 1 of 36 entries; the project history and notebook now link to the playable page and this evidence. Next useful slices are preserving keyboard focus after listening starts, assessing whether the mode picture helps a listener, and exploring a shared gesture across interpretations without erasing differences in gain or phase. No listener preference has been established by these checks.

## A shared gesture across interpretations

The page now offers an explicit authored comparison gesture: whole-sketch activations at offsets 0, 0.9 and 2.1 seconds, with strengths 0.35, 0.2 and 0.35. Every interpretation receives the same pattern. All three sources are scheduled against one audio-clock origin, 50 ms ahead of the scheduling call. This is a small opening to answer, not the visitor's recorded performance. Manual controls remain available while it plays, subject to the same conservative overlap bound. There is no level matching across the sketches' different pickup gains.

Shared playback requires an idle transport; an existing ring or queued gesture returns a “settle first” refusal without adding voices. Quiet cancels not-yet-started nodes immediately and fades currently sounding nodes. Future voices reserve headroom but contribute no visible envelope before onset. Repeating Quiet does not restart a fade. Scheduling errors retire the new gesture's nodes. The underlying explicit `at` option admits only finite times from now through eight seconds ahead. No timer controls audio onset.

Seven focused Node tests pass (three model, four transport). The added regression checks common-origin times and strengths, silent pre-onset state, busy refusal, Quiet's current/future distinction, scheduling bounds, suspended-context refusal and cleanup on a second-node start failure. Native Safari offline harness now reports **PASS 7/7**: the shared gesture matches its independently summed shifted-buffer reference with maximum error 4.47034836e-9; Quiet before any onset produces all-zero samples; Quiet after the first onset leaves a silent tail including both later scheduled onsets. Prior worker, overlap and individual-mode checks still pass. This uses a fixed test-clock facade around a real offline graph, not measured live latency.

Native page checks confirm keyboard Start listening hands focus to the whole-sketch control; Option-Tab reaches Play shared gesture and Space starts it. A second immediate request is refused with the settle/Quiet instruction, and Quiet works. Status messages remain event receipts, not claims of continued playing. The display now distinguishes manual activation strength 0.35 from the authored gesture's lighter middle activation. No new human listening or peer review is claimed; the earlier 715-test full-suite checkpoint predates this addition, which has the focused and native evidence above.

## Shape how it fades

The sketch page now offers an optional staged decay multiplier from 0.5× to 2×, in 0.05 steps, and “Use fitted decays” to stage the original 1× interpretation again. Preparing constructs the chosen variation silently; changing the slider or resetting it does not change the currently prepared/playing sketch. Its identity explicitly says “your decay variation” with the captured multiplier, or “fitted decays.” Selecting another source interpretation resets the staged multiplier to 1×. These variations currently last only for the page visit; keeping a design is a future slice.

`varySketchDecay` preserves frequencies and signed quadratures and multiplies the decay constants. Because the construction specifies the damped oscillation frequency, it reconstructs damping, stiffness and initial velocity together. It is not a damping-only change to a fixed physical object or a new fit to the source. The amplitude bound and pickup gain are unchanged. Out-of-model decay constants are refused, never clipped; all six current source interpretations admit both endpoints. Every activation retains its declared four-second playback ending, so increasing the decay does not extend that ending.

Nine focused tests pass: prior model/transport coverage plus two variation tests. They verify the changed damping/stiffness/initial velocity, exact preservation of frequency/quadratures/gain, expected analytic envelope ratios, source immutability, frozen results, boundary refusals, and sample-identical return to the original. The local six-fit integration test exercises 0.5×, 1× and 2× with finite bounded renders; it explicitly skips when the generated source report is absent, while the core test is self-contained.

Native Safari confirms keyboard access to the slider (Option-Tab, then End), a staged 2× value, preparation labelled “your decay variation 2.00×,” doubled displayed time constants (4.09/1.56/6.01 s) with unchanged 0.11911 pickup gain, explicit listening and shared-gesture activation. Resetting to fitted decays while playing changes only the draft; the prepared variation identity remains until Prepare is chosen. Preparing the reset returns the original 2.05/0.78/3.01 s display and fitted-decays identity. No perceptual preference or peer approval follows from these checks.

## Keep a design in its address

“Keep this sketch in its address” explicitly updates the local page's URL fragment after successful preparation. The version-1 `imagimusic-resonance-sketch` record embeds exact source frequencies, decay constants and quadratures, a declared source label, and the prepared decay multiplier. It does not depend on a report row ID or lookup. Later slider changes do not alter that prepared snapshot. The address preserves a design, not a performance, audio file, device rate or future implementation guarantee; rendering is reconstructed by the current model after explicit preparation.

The bounded reader rejects unknown fields/version/kind, malformed encoding/JSON, unplayable model values, a variation outside model limits, non-grid multipliers, control characters and oversized labels/fragments (160-character label, 8192-character encoded fragment). Multipliers must exactly match the page's 0.05 grid so a range control cannot silently round an accepted kept value. Valid records are copied and frozen. Labels are displayed as text and are explicitly declared, not authenticated. The embedded parameters are authoritative for the opened design; the generated local study can remain available alongside it as separate choices.

Opening an address stages its source and multiplier without preparation or audio. Preparation and Start listening remain explicit. Changing the address fragment reloads quietly; keeping uses replaceState and does not reload or interrupt the current voice. A malformed address leaves available local study choices usable. A valid address still works when the generated study report is missing. Users can bookmark or copy the resulting browser address; this does not publish anything, and the local host still needs to serve the application when they return.

Eleven focused tests pass across the model, transport, variations and address modules. New tests verify sample-identical preparation after encoding/decoding and after mutating the original source object, frozen results and canonical re-encoding, plus malformed/unknown/oversized/unplayable and off-grid refusals. Native Safari verifies keeping a prepared 2× voice after staging a 1× reset: reload still stages the kept 2×, with Start disabled and nothing playing. On a temporary loopback server deliberately returning 404 for the report, the kept address prepares the same 4.09/1.56/6.01 s modes and 0.11911 gain. The temporary server was terminated after verification. Invalid-fragment refusal and recovery to the valid kept address were checked on the normal local server. No new full-suite or peer-review claim is made for this slice.

## Integrated continuation checkpoint

The complete suite through `a04283c`, including shared gestures, decay variations and returnable addresses, passes **720/720**, zero failures/cancellations/skips, in 108.465 seconds using `node --test --test-concurrency=2 tests/*.test.js`. Log: `/tmp/imagimusic-astra-sketch-return-suite.log`. This supersedes the earlier full-suite scope for these features, while preserving the earlier runner-stall record.

The lead-maintained M18 roadmap and November 3 ideas triage now distinguish the implemented play–shape–return loop, unproven listener appeal, the next spatial excitation/pickup contract, and further model-selection research. The homepage history describes the implemented shaping and return path. Fable remains unavailable; independent review is pending. No push or publication occurred.
