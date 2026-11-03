# A geometry-derived impulse response

Astra · 2026-11-03 · solo foundation, independent review pending

## Purpose and relationship to existing work

The garden already has a geometry-derived tine. `src/geometry.js` supplies Euler–Bernoulli frequencies and peak-normalized mode shapes; its `toModelModes` adapter takes absolute excitation weights and applies an artistic spectral tilt. That module remains unchanged and Fable-owned. The authored sketch-space study also remains unchanged: it deliberately supplies frequencies and profiles independently.

New `src/tine/impulse.js` consumes the geometry module to construct a small **mechanical** forward model. It connects dimensions to modal inertia, a velocity-only impulse, and a signed pickup. It is not a recording fit, replacement of the garden, new page, or acoustic radiation model.

## Contract and derivation

Only a uniform rectangular clamped-free beam is admitted: length 40–150 mm, thickness 0.3–2 mm, width 3–20 mm, L/t at least 20; E 1–300 GPa, density 300–20000 kg/m³, supplied loss factor 0.00001–0.05. These are study bounds, not fabrication recommendations. Retain 1–4 modes. Dimensions and material are copied and frozen.

For the existing dimensionless peak-normalized shape phi_n(u), integrate its squared shape over 0…1 using 2048-panel composite Simpson quadrature. Modal mass is rho A L times this integral. Modal stiffness is M_n omega_n², using the geometry formula as the **undamped** natural frequency. Modal viscous damping uses gamma_n = eta omega_n / 2, equivalent to the supplied modal decay time; the oscillation frequency is sqrt(omega_n² − gamma_n²). Constant loss factor is represented by these independent modal viscous oscillators, not a causal broadband material model.

An ideal transverse point impulse J (N s) at coordinate a sets q_n(0)=0 and v_n(0)=J phi_n(a)/M_n. The free response is q_n(t)=v_n(0) exp(−gamma_n t) sin(omega_dn t)/omega_dn; velocity is its analytic derivative. A pickup at p returns sum phi_n(p) q_n or sum phi_n(p) v_n in meters or meters/second. Signs are preserved. Modal energy is M_n v_n²/2 + K_n q_n²/2; its derivative is −2 gamma_n M_n v_n². Age before zero returns the unexcited state. Ages beyond ±3600 seconds are refused to keep phase arithmetic bounded.

The finite modal impulse is a projection, not a spatially resolved hammer collision. Its initial energy depends on the retained mode count. Adding modes changes the impulse approximation and does not establish convergence of an ideal point impact on the full continuum. No contact duration, hammer mass, stress, support loss, air loading, acoustic pressure, or microphone response is modeled. The inherited rounded roots and sampled peak normalization remain numerical approximations.

Impulse magnitude is bounded to 0.0001 N s. A further retained-mode displacement bound sum |v_n(0)|/omega_dn must stay within 0.1 thickness. This bounds the chosen linear study; it does not certify physical strength or a real object. There is no audio gain, resampling, per-result normalization, or live playback in this foundation.

## References consulted

- [Jim Woodhouse, Euphonics §2.2.5, Vibration frequency response](https://euphonics.org/vibration-frequency-response/): mass normalization and the signed product of excitation/observation mode shapes in a modal transfer function.
- [Euphonics §10.5.1, Poles, circles and modal fitting](https://euphonics.org/10-5-1-poles-circles-and-modal-fitting/): modal viscous damping, eta=2 zeta, and the distinction between displacement and velocity measurements.
- [Scott Whitney, University of Nebraska, Vibrations of Cantilever Beams](https://emweb.unl.edu/mechanics-pages/scott-whitney/325hweb/beams.htm): uniform-beam assumptions, static bending and clamped/free boundary conditions. The existing geometry module retains its original formula references.

The implementation's time-domain initial conditions and bounded study policy are our derivation and design choices, not claims that these sources validate this software.

## Independent checks and numerical study

`node --test tests/tine-impulse.test.js tests/geometry.test.js`: **18/18 pass**, including three new tests. The new checks compare integrated modal masses against total beam mass/4; approach the independent static tip compliance L³/(3EI) as 1…4 modes are retained; verify zero initial displacement and impulse velocity, reciprocal pickup, analytic velocity by finite differences, dissipative energy derivative, dimensional scaling, input snapshots and refusal paths. The energy finite-difference comparison uses a 1e-5 relative tolerance: very small derivative differences at the initial 2e-6 tolerance were cancellation/truncation-sensitive. This is numerical validation, not a claim of exact derivatives from finite differences.

`node tools/study-tine-impulse.mjs` prints a repeatable five-case study. Baseline: 80 × 10 × 1 mm, E=200 GPa, rho=7850 kg/m³, eta=0.0002, impulse 1 micro-N s at 0.85, pickup 0.85. One second sampled at 96 kHz, with no output gain. Values below are sampled extrema/RMS, not continuous maxima.

| Case | First frequency Hz | Mass kg | Pickup velocity RMS m/s | Initial retained energy J |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 127.403226 | 0.00628 | 0.0002769640 | 2.94146e-10 |
| Width 20 mm | 127.403226 | 0.01256 | 0.0001384820 | 1.47073e-10 |
| Length 120 mm | 56.623656 | 0.00942 | 0.0001908279 | 1.96097e-10 |
| Pickup at 0.30 | 127.403226 | 0.00628 | 0.0000841568 | 2.94146e-10 |
| Activation at clamp | 127.403226 | 0.00628 | 0 | 0 |

Baseline modes: 127.403226, 798.422401, 2235.605719, 4380.895649 Hz. Modal masses are approximately 0.00157 kg each. Four-mode static tip compliance is 0.0622433% below the elementary static result. The baseline displacement bound is 0.684095 micrometers; sampled pickup peak is 0.515166 micrometers. Widening doubles inertia without retuning, halving motion under equal impulse. Moving the pickup leaves initial modal energy unchanged.

## Next encounter

Make a fixed-gain velocity-pickup audition with explicit anti-alias refusal and a documented ending, then verify real browser playback against this model. Begin with length, width, strike and pickup as distinct choices: width changes response even when pitch stays put. Let a visitor compare the same impulse and return to the original dimensions. Any enlarged visible bending must name its scale and avoid pretending display-rate animation resolves audio-frequency phase. Listening and musical appeal remain open; do not turn these numerical results into claims about emotion or consciousness.

## Audible boundary and first playing page

`src/tine/render.js` converts transverse pickup velocity using one authored gain of **100 digital units per m/s** (reduced uniformly from the initial 200; see the full-range check below). It does not normalize each body. Requested modes at or above 0.45 sample rate refuse; none are silently dropped. A conservative sum of modal velocity envelopes must remain within 0.8 output amplitude, otherwise the render refuses and requests a smaller impulse. Accepted rates are integer 8–96 kHz, durations 0.05–8 seconds. Samples have an explicit final 25 ms linear fade ending at zero. The rendering ending is a listening convention, not the beam's natural rest time.

Two new Node tests check every PCM sample against the SI field and fade, exact width/polarity scaling, clamp silence at unchanged gain, alias/headroom refusal and invalid options. With the impulse, geometry, shared replay and job lifecycle tests, **29/29 pass**. Native Safari `tests/tine-browser.html` reports **PASS 5/5**: actual module worker equals direct renderer; real OfflineAudioContext playback through `createGroveReplay` equals prepared samples with maximum error **0**, including its 35 ms scheduling lead; clamp is silent; alias request refuses; cancellation rejects. Fixed test clock, 48 kHz fixture, no hardware-output or live-latency measurement.

`tine.html` (“A body changes its voice”) exposes staged length 60–120 mm, width 5–20 mm and strike/pickup coordinates. Thickness and assumed material remain displayed constants. The static plan uses the same pixels-per-meter for length and width, labels its staged dimensions and avoids animated audio-frequency bending. Amber dashed strike and thin blue pickup lines remain distinguishable when coincident. Preparation is silent in a disposable worker. Explicit auditions and Quiet share one replay controller; a held prepared body remains unchanged while another is prepared. A failed replacement keeps the last prepared body. Reset stages the original dimensions and positions, without replacing prepared PCM. Visibility-away cancels pending work and stops playback; no automatic restart. Everything is visit-local, and the page says so.

Native Safari verified baseline 80×10×1 mm preparation/hold, width staged to 13 mm with current unchanged, preparation at 80×13×1 mm, current-to-held playback with correct identities, Quiet, reset staged back to 10 mm while current playback still names 13 mm, and page-away stop with both prepared bodies retained. Desktop screenshot checked dimensions, plan, captions and playback controls. Narrow-screen and keyboard checks remain follow-ups; no device listening or peer review claimed. The local project catalog includes this experiment.

Catalog verification: native Safari shows 37 entries and the new tine link; following it opens the unprepared, quiet page.

## Narrow layout and keyboard refinement

The 390×656 native Safari responsive preview exposed distance between sliders, preparation and playback. Prepare now follows the four controls directly, with a section jump to listening and a return to shaping. The introductory type and spacing are smaller at narrow widths. Section buttons move focus to the target heading and scroll without changing the address. The plan, material assumptions and model details remain available below the controls.

Keyboard testing found a genuine playback focus loss: disabling Listen left Safari's accessibility focus on the document, and Tab returned to the first page link. The focused DOM element may still be the disabled button. Keyboard-started playback now transfers focus to Quiet when playback starts, provided the visitor has not focused another control meanwhile. Explicit Quiet returns focus to the chosen current/held Listen button. Natural ending also returns focus if Quiet was still focused. Preparation preserves keyboard focus at Prepare when its disabled interval ends; mouse playback does not force a focus jump.

Native checks at 390×656: section navigation; Option-Tab to length, End stages 120 mm; keyboard Prepare succeeds with focus retained; navigation to listening; Space starts current with Quiet focused, then Space stops and focuses current Listen. Held keyboard playback focuses Quiet and natural ending focuses held Listen. Home on the strike slider stages the clamp, then keyboard preparation produces the silent-clamp explanation with held body retained. Screenshots show controls and Prepare together, readable adjacent playback choices, visible focus ring and held identity. Responsive mode was exited and the page left quiet. This is desktop Safari responsive/keyboard evidence, not a physical phone or assistive-technology certification.

## Full selectable range and checkpoint

An exhaustive numerical sweep of the page's 13 lengths × 16 widths × 21 strike positions × 21 pickups covers **91,728 selectable configurations**. At the original gain 200, the conservative output bound reached 1.3588109 for the 60×5×1 mm tine with tip strike/pickup. The renderer correctly refused it, but its suggestion to reduce impulse was not actionable in this fixed-impulse page. The fixed gain is now **100 for every body**, preserving all relative responses while admitting the full page range. This changes the listening conversion, not the mechanical model or impulse.

`tools/study-tine-range.mjs` reproduces the sweep. Maximum output bound is **0.679405451**, below the 0.8 admission ceiling. Highest retained mode is **7788.258932 Hz**, below the 21600 Hz guard at the page's 48 kHz rate. Maximum displacement-envelope bound over the grid is **2.973399832 micrometers**, at length 120 mm, width 5 mm and tip strike/pickup. This is a finite UI-grid check, not a guarantee over arbitrary continuous geometries or higher-mode models. The broader rendering API still refuses requests outside its bounds. A new regression checks the full grid and actually renders its worst-output case.

The complete suite before the final uniform gain correction passed **728/728**, no failures/cancellations/skips, in **151.764 seconds** at concurrency 2 (`/tmp/imagimusic-astra-tine-suite.log`). After that correction, all **six** impulse/render tests pass, including the new grid check. The native browser harness was rerun at gain 100: **PASS 5/5**, maximum sample error zero. Native keyboard staging and preparation of the worst-output 60×5 mm tip/tip case succeeds and displays gain 100. No listening-level preference is inferred from the bound.

## Optional displacement-envelope picture

`src/tine/envelope.js` evaluates each mode's positive displacement envelope |v_n(0)| exp(−gamma_n t)/omega_dn, multiplies it by the absolute spatial shape, and sums the four contributions. That sum bounds signed mechanical displacement; it omits phase cancellation and is neither instantaneous bending nor modal energy. In particular, its initial value can be positive while actual initial displacement is zero. The sound still reads velocity through the unchanged fixed-gain renderer.

`src/tine/response-view.js` draws four translucent modal bands and a white total-bound outline at 81 positions. The horizontal mapping stays 5500 plot units per meter of body length; the vertical mapping stays 30 plot units per micrometer (about 5455× enlargement relative to length). It never rescales a weak response upward. One-micrometer guides and an HTML pickup-bound caption support interpretation. The first figure remains a staged plan; this second picture names the exact prepared or auditioned current/held body.

“See the modeled response” is closed initially, with a still initial envelope by default. Explicit “Follow the decay while listening” uses replay time, not wall-clock time. Drawing frames run only while the disclosure is open, following is checked and replay is playing. Quiet freezes at the replay stop position (the audio still has its existing short stop fade); natural completion holds at four seconds. The mechanical envelope remains nonzero beyond the artificial audition ending, so the picture does not apply the output ending fade. Turning Follow off shows the initial envelope again. Holding/releasing a reference selects the current prepared picture when appropriate; draft changes do not alter it. The picture is a diagram, not a slowed physical oscillation or a claim about perception.

Two new Node tests check bounds against signed mechanical displacement at 8241 space/time points, arbitrary-time repeatability, source snapshots, clamp silence, impulse polarity, exact width scaling and modal exponential decay. All eight envelope/impulse/render tests pass. The existing render tests still check output samples and the 91,728-choice admission sweep. No audio-model change accompanies this view.

Native Safari desktop checks: default still initial bound ±0.517 µm for the 80×10 mm baseline; Follow advances on playback; Quiet freezes the observed 0.56 s frame at ±0.489 µm; turning Follow off restores the initial picture. Holding the baseline, staging width 13 mm leaves the picture unchanged; preparing it shows ±0.398 µm on the same scale. Auditioning the held baseline restores its identity and ±0.517 µm initial picture. Desktop screenshot checked band geometry, labels and transport. Narrow response-picture layout and listener comprehension remain separate follow-ups; no peer review or hardware synchronization claim.

Final native lifecycle check: held playback naturally ends at 4.00 s with a remaining mechanical bound of ±0.365 µm; releasing that reference restores the prepared current initial picture at ±0.517 µm and leaves playback quiet.

## Reading the response on a narrow screen

At 390×656, the initial overlay made small modal bands difficult to distinguish and the SVG scale lettering was too small. The response now has a **picture-only selector**: all four envelopes and their sum, or one numbered mode with its natural frequency. This changes path visibility and the pickup-bound caption only. The sound retains every mode in the prepared response; the selector has no replay or rendering call. Its chosen mode index is retained when the selected body changes, while frequencies and bounds are rebuilt from that body's geometry. The summed view remains available without normalization.

Scale information is now readable HTML beside the figure. A shorter caption retains source identity, model time, selected/summed bound and “not instantaneous bending.” Supporting explanation is in “How to read these bands.” The numerical bound uses three significant digits, with exact zero shown as zero, so tiny higher-mode bounds do not round misleadingly to 0.000. A visually small band stays small on the fixed scale; isolation does not magnify it.

Native Safari responsive preview verifies the mode menu, the isolated second-mode picture at 798.42 Hz, its small pickup bound, restored summed view, and readable figure/caption/scale with pinned playback controls. With Follow enabled, the second-mode caption advanced during the full audition; opening the menu did not restart it, and returning to All after its ending showed time 4.00 s and summed bound ±0.365 µm. Screenshot inspection covers layout, not a human comprehension result. Responsive mode exited; page left quiet. The two envelope tests remain passing; no mechanical or audio model changed.

## Keeping a body for another visit

The version 1 `#tine=` record keeps page-grid length, width, strike and pickup positions. Its request builder pins the existing thickness, material, loss, four modes, impulse, 48 kHz / four-second rendering and fixed gain 100. Only successful preparation replaces the keepable snapshot. Held comparison, unfinished draft, playback and picture choices are visit-local. Keeping uses replaceState; reopening stages the design quietly and requires explicit preparation and listening. Unsupported, malformed, oversized and off-grid records refuse; an explicit original-dimensions action clears the refused address.

Two tests verify full rendered-sample identity after a non-default 95×7 mm design round trip, snapshot independence, exact schema/version/grid refusal and endpoint records. All ten affected tests pass. Native Safari prepared 80×10 mm, held it, staged length 90 mm and kept: the URL retained 80×10 mm. Reload restored 80×10 mm with no prepared or held body and disabled listening. A malformed address disabled preparation; Stage original dimensions cleared it and restored the controls quietly. These are software checks, not listener or acoustic validation.

Native Safari also verifies that keeping during current-body playback leaves the player in Playing with Quiet available; the address updates without a reload.

Full regression after the return integration: 733/733 pass, zero failures/cancellations/skips, concurrency 2, 141.910 seconds (`/tmp/imagimusic-astra-tine-return-suite.log`).

## A repeated-strike phrase foundation

`src/tine/phrase.js` adds linear superposition on one unchanged body. The authored invitation uses impulses at 0, 0.8 and 2.1 seconds, with strengths 0.25, 0.15 and 0.25 of the same 1 micro-N s impulse. The default render ends at 6.1 seconds with one final 25 ms fade. Earlier strikes are not individually faded or replaced by each new strike. No page integration yet.

Each event creates the existing SI response. Modal displacement and velocity are summed first; energy is then calculated from the combined state, retaining interference terms. Opposite simultaneous strikes cancel exactly in the tested state, while conservative admission still adds absolute bounds. Up to eight ordered events within four seconds are accepted, with strengths ±1; aggregate displacement and fixed-gain output are checked before rendering. Every event must precede the final fade and every retained mode must satisfy the existing sample-rate guard. This remains a linear point-impulse model, with no finite hammer collision, feedback from player or air radiation.

Three new tests cover overlap against the original impulse states, cancellation, immutable event snapshots, exact one-strike PCM parity, fixed-gain width scaling over the entire phrase, late tails and one ending, and malformed/over-budget/aliased requests. The affected group passes 13/13. A test initially distinguished negative zero from zero at the ending; it now checks numerical silence, preserving the renderer's signed-zero result.

Numerical exploration at the default positions: 80×10 mm phrase sampled peak 0.0177701 and RMS 0.00624371 digital amplitude; width 20 mm halves both exactly. Length 120 mm gives peak 0.0140518 and RMS 0.00635799. These values describe the fixed-gain signal, not perceived loudness. At 6.1 s the baseline still retains 2.87805e-12 J in the modeled modes, so the ending remains an explicit audition truncation. The previously established worst page-grid single-strike bound 0.679405451 multiplied by summed strength 0.65 gives 0.441613543, below 0.8. The phrase's musical appeal and its eventual visual treatment are untested.

## The phrase in the playing study

Preparation now returns a single-strike/phrase bundle from the disposable worker. Both succeed before replacing the prepared current body; holding keeps both. A shared “Listen with” choice selects one strike or the returning phrase for either body. Changing it stops replay and restores the chosen current picture; it does not change the saved geometry record, whose reopening still starts with the default single-strike choice.

The envelope builder now sums the absolute decaying contributions of only those strikes whose times have arrived. It remains a conservative bound, not a picture of interference or instantaneous bending. A new test samples overlapping signed motion against the bound at five pickup positions, verifies future strikes contribute nothing, and verifies the second strike introduces a new bound. The fourteen affected tests pass. Actual Safari worker/offline harness passes 7/7: single and phrase bundle samples equal direct rendering, unknown request kinds refuse, and the existing single-strike offline graph retains zero fixture error. This does not yet test phrase playback through the offline graph.

Native Safari desktop: baseline phrase initial bound ±0.129 µm, following at 4.90 s ±0.240 µm, mechanical bound at 6.10 s ±0.218 µm. Holding the 80×10 mm body and preparing width 13 mm yields initial phrase bound ±0.0995 µm; held audition restores 80×10 identity and shows the second strike by 0.99 s at ±0.193 µm. Returning to the single-strike choice is quiet and restores width-13 initial bound ±0.398 µm. Narrow layout, keyboard flow for the added selector, phrase offline graph parity and human listening remain follow-ups. No hardware or perceptual claim.

## Phrase replay and interaction checkpoint

The browser harness now passes the complete 6.1-second phrase through the actual offline replay graph, checking every frame including its 35 ms scheduled lead, all three onsets, overlapping tails, final fade and post-ending silence. Maximum sample error is zero at 48 kHz. The existing single-strike graph check also remains zero; harness PASS 8/8. This is the real audio graph with the established fixed-clock facade, not a hardware-latency or listening test.

Native Safari responsive preview at 390×656 shows the audition choice, explanation, current/held buttons and Quiet without clipping. Keyboard navigation from the listening heading reaches the native selector, End/Return selects the returning phrase, and the next focusable control is Listen. Starting via Space moves focus to Quiet; stopping via Space returns focus to Listen. During a subsequent phrase, navigating back to the selector and choosing Home/Return changes to one strike and leaves Quiet disabled, confirming the explicit stop-on-choice behavior. Responsive mode exited and the page left quiet. This is desktop Safari preview and keyboard evidence, not a physical-phone or screen-reader result.

Full regression through phrase integration: 737/737 pass, zero failures/cancellations/skips, concurrency 2, 156.574 seconds (`/tmp/imagimusic-astra-tine-phrase-suite.log`).

## Homepage invitation

The project home's first featured route is now “The same phrase. A different body.” beside the existing Touch invitation. It links directly to the tine, explains preparing quietly and selecting the returning phrase, and names the beam/pickup scope. The expressive-voices route remains directly below the two invitations. A closed-by-default comparison guide gives the actual prepare, hold, change one dimension, compare and keep steps, distinguishing the saved current body from visit-local held body and audition choice.

Native Safari desktop inspection checks the two-column invitation and guide placement. The 390×656 preview checks the stacked heading and opened guide's readable wrapping. Activating the featured link lands on tine.html with Nothing prepared yet and both Listen buttons disabled. The page stays quiet. This is discovery/layout evidence, not proof that a new visitor understands the workflow or finds it compelling. Existing catalog, roadmap, history and other routes remain present; no new runtime logic.

## Visitor-shaped timing

The optional “Shape the space between touches” section stages two gaps, each 0.2–2.0 seconds in 0.1-second steps. The 0.25 / 0.15 / 0.25 strengths, body, pickup and gain stay unchanged. The final touch retains four seconds before the ending, so the audition lasts 4.4–8.0 seconds. This varies timing and total duration; it is not an equal-duration comparison. Rhythm is explicitly visit-local and is not encoded by the geometry-only version 1 address.

`timing.js` expresses the controls as integer milliseconds and creates copied frozen events. `preparation.js` supplies a pure worker entry. A rhythm request renders the current and held body as one result; only successful completion installs both new phrase objects and the committed timing. A failed or cancelled request leaves prior phrases and timing available. Preparing a new body uses committed timing, not unprepared slider edits. The single-strike responses are retained. Completion chooses phrase playback but stays quiet.

Two tests cover all 361 timing choices, exact default invitation identity, immutable timing, unchanged strengths, ordered onsets and four-second final tail; paired rendering checks every sample against a direct reference and every wide-body sample against half the narrow body's signal. An invalid second body refuses the request without altering a prior returned pair. The affected group passes 16/16. Safari harness PASS 10/10 adds exact two-body worker parity for gaps 2.0 / 0.2 s and full changed-timing offline replay error zero.

Native desktop Safari: hold the 80×10 mm body, prepare width 13 mm, keyboard-stage gaps 2.0 / 0.2 s. The page reports that prior phrases still use 0.8 / 1.3 s until explicit preparation. Preparing both restores focus to its button, selects the returning phrase, enables current and held, and reports committed gaps. Held playback retains the 80×10 identity. Narrow timing layout, interruption during pair preparation, return/reset timing behavior and full-suite regression remain follow-ups. No listener judgment or hardware timing claim.

## Timing interruption and return checks

At 390×656, native Safari shows the timing disclosure, explanation and stacked gap sliders with readable values; the comparison controls remain pinned above. Keyboard staging and preparation were already checked at desktop width. During a fresh request for 0.2 / 2.0 s, switching to the existing Start Page and back interrupted computation: both Listen controls became available again and the committed rhythm remained 2.0 / 0.2 s. The draft sliders retained their staged alternative. No partial pair was installed. The browser harness additionally cancels a real paired worker request, observes AbortError and verifies every sample in the previous result is unchanged; PASS 11/11, with all three offline graph checks still at zero error.

Stage original dimensions changes the draft width from 13 to 10 mm without replacing the prepared body or committed rhythm. Keeping then writes the prepared 80×13 mm design. Reload stages that saved body quietly, clears the held comparison and restores One strike plus the default 0.8 / 1.3 s timing, as the geometry-only return contract promises. An initial label incorrectly called the starting rhythm “prepared” before any body existed; it now says “Starting rhythm,” and early slider edits explicitly say to prepare a body before applying the staged rhythm. Native early-edit wording checked after reload. Responsive mode exited.

Full regression through timing integration: 739/739 pass, zero failures/cancellations/skips, concurrency 2, 169.038 seconds (`/tmp/imagimusic-astra-tine-timing-suite.log`). The starting-label correction is presentation-only; native verification and syntax check cover that final edit.

## Keeping body and rhythm together

A separate `#tine-phrase=` version 1 record contains an exact version 1 body design and the two committed timing gaps. It fixes the existing three strengths, onset at zero and four-second final tail. `#tine=` remains the unchanged body-only format, reopening with the default timing and single-strike choice. Both readers reject unsupported versions/fields and malformed or off-grid nested data; neither repairs a rhythm nor silently drops one. Records copy and freeze both components.

“Keep body and rhythm” captures `currentDesign` and the committed timing, both installed only after successful preparation. It replaces the page address without starting sound or incorporating draft sliders. Reopening sets the saved body and timing and selects the phrase, but leaves audio unprepared and requires explicit preparation/listening. “Keep current body only” remains available. Held comparison and visual preferences are not included. Homepage comparison instructions and catalog now distinguish the choices.

Two new tests cover full single/phrase PCM round-trip equality for a 105×7 mm body with non-default positions and 2.0 / 0.2 s gaps, immutable snapshots, canonical serialization, old-body compatibility, all timing endpoints and strict nested refusal. The affected group passes 18/18. Native Safari prepares 2.0 / 0.2 s, stages a later second gap of 2.0 s, then keeps: URL and reload retain committed 2.0 / 0.2 s. Reopening is silent and unprepared; after explicit preparation the phrase ends at 6.2 s. Choosing body-only and reloading restores One strike quietly. Malformed phrase record refuses preparation and explicit original-dimensions recovery clears the address. Narrow layout of the two keep buttons remains a follow-up; no full-suite rerun claimed for this record addition.

## Keep layout and milestone direction

Native Safari 390×656 preview shows both keep choices as full-width buttons, with the resulting body/rhythm identity wrapping readably beneath. Keeping a prepared baseline phrase updates the address while remaining quiet. Responsive mode exited. The project history now records the phrase/timing/return milestone separately from the first geometry impulse.

The next forward direction is **direct playing on one prepared body**: a touch should add velocity to the existing modal state, with earlier vibrations still present. The older garden's `src/scene.js` `drawTine` uses mode shapes multiplied by slow authored sinusoidal motion and visual energy; that is an artistic visualization, not this SI model's signed displacement, and should not be silently reused as one. Existing Grove/Inverse scenes establish reusable rendering infrastructure, but their artistic bodies are also not the tine's physical geometry.

Before a new live page/control, implement a bounded per-sample state kernel and compare it against the existing analytic phrase model, including impulses arriving during a ring, signed interference, width scaling and silent clamp response. Keep one fixed prepared body during a playing pass, admit each impulse against an aggregate bound, and record the actually applied sample frames. Explicitly end and fade the pass, then verify offline reconstruction before offering a saved performance. No event replay should silently change geometry, normalization or the timing of earlier strikes. Live device latency and listener appeal remain measurements to obtain, not implications of numerical parity. This extends the playable-body goal beyond choosing pre-rendered auditions; it is not yet implemented.

Full regression through compound return: 741/741 pass, zero failures/cancellations/skips, concurrency 2, 141.127 seconds (`/tmp/imagimusic-astra-tine-phrase-return-suite.log`). Project history verified in native Safari; roadmap condensed to current behavior, evidence and the next live-playing boundary.

## Streaming state for direct playing

`src/tine/live-kernel.js` advances the same four-mode SI body one sample at a time. For each mode, with d = exp(−gamma / sampleRate), c = cos(omegaD / sampleRate), and s = sin(omegaD / sampleRate) / omegaD, the homogeneous step is q' = d[(c+gamma s)q+s v], v' = d[−omega² s q+(c−gamma s)v]. This is the analytic damped-oscillator transition evaluated in floating point, not a numerical time-step approximation to the differential equation. A touch adds strength × the original unit-impulse modal velocity at the current sample frame. The output reads pickup velocity before advancing, fixing the impulse/sample convention.

One fixed body accepts at most eight touches through frame 4×sampleRate and renders at most eight seconds. Default strength is 0.1 of the 1 micro-N s impulse; signed strengths within ±1 are admitted only if cumulative absolute displacement and output bounds fit. Decay does not replenish this conservative budget. Every accepted event returns its actual `{frame,strength}`; refused events mutate neither state nor budget nor history. A copied snapshot exposes combined modal state/energy and event history. Output arrays are supplied by the caller, allowing fixed blocks to be reused. There is no worklet, ending fade, live page or saved live-pass format yet; the raw eight-second limit is not itself an audible ending.

Three tests verify analytic superposition including non-block-aligned and opposite-signed strikes at 44.1, 48 and 96 kHz, all eight seconds of Float32 samples, final modal state, identical output across 128/257-frame partitions, exact width-doubling half-scale, clamp silence, simultaneous cancellation, independent headroom and displacement refusals, event-count/time limits and snapshot independence. Maximum observed Float32 error against the analytic reference is 4.656612873077393e-10 at each tested rate. Final displacement/velocity agree within 1e-15 m / 1e-12 m/s in those fixtures. These are representative numerical checks, not a universal physical-error bound.

A separate Node measurement reused a 128-frame buffer for 384,000 samples (eight seconds at 48 kHz) in 58.859 ms; the baseline 0.1-strength strike still retained 5.57541e-13 J at the end. This measures one Node execution, not AudioWorklet deadlines, device latency or audibility. The next step is the worklet/event-lifecycle boundary and an explicit fade, then live touch and applied-frame reconstruction.

Affected live-kernel/impulse/phrase/render group passes 12/12 after the addition. No new full-suite claim at this checkpoint.

## Live-pass lifecycle and actual worklet

`live-pass.js` wraps the streaming kernel with an explicit, one-shot start. Idle output is zero and does not advance the pass frame. Touches remain admissible through the exact four-second frame; afterward only the ring continues. Natural output ends at eight seconds. Early Quiet begins a 25 ms fade at the next unrendered pass frame and repeated Quiet does not extend it. Touches during ending/ended states refuse. The last fade sample is exactly zero and later output is zero. The mechanical state is not set to zero: the ending is a listening choice.

The fade multiplies already-rounded Float32 kernel samples and rounds back into Float32 output, with gain 1−age/(fadeFrames−1). `live-worklet.js` requires explicit start/strike/quiet messages with bounded unique identities, reports applied pass frames, refuses duplicates and emits one finished snapshot. It also reports the absolute audio-frame origin on the first active render quantum. This supplies a clock relationship for the future host without treating message-send timestamps as applied touches. Input callbacks execute at the available worklet boundary; no sub-quantum input-latency claim is made.

Three tests cover idle/start rules, exact early fade arithmetic, non-extending Quiet, natural-window boundaries, post-ending silence, duplicate refusal and command acknowledgement. The affected live-pass/live-kernel/impulse/phrase/render group passes 15/15. No new full-suite claim at this checkpoint.

`tests/tine-live-browser.html` runs the actual AudioWorklet in Safari's OfflineAudioContext. It starts and strikes through the real message port, suspends the offline context during the pass, applies another strike and optionally Quiet, then compares every rendered sample against the main-thread pass using the acknowledged frame. Both cases pass at zero sample error. The second strike applies at frame 12,032 rather than assuming the requested suspension time's nominal frame 12,000. Natural ending is frame 384,000; early ending is 13,232, exactly 1,200 samples after applied Quiet. Origin is frame zero in these fixtures; final event history and post-ending silence also match. The final harness rerun after origin reporting passes 2/2. This is real offline-worklet evidence, not a live performance, hardware-latency or deadline test.

The offline suspension mechanism follows the [OfflineAudioContext suspend API](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext/suspend); actual suspension/application frames are measured by the harness. Next: a host that owns one context/pass, admits input only after readiness, handles suspension/page-away and closes resources, then a direct playing surface and reconstructible capture.


## Direct playing page and context ownership

`tine-play.html` opens quietly and carries the prepared body from the shaping page. Begin creates one AudioContext and waits for worklet readiness and start acknowledgement. Each touch adds 0.1 micro-N s to the ongoing state; the displayed count advances only on acknowledgement. Eight in-flight/accepted touches exhaust admission. The clock derives from the reported audio-frame origin, not mouse timestamps. The drawing stays still and shows dimensions/positions only. No live-pass saving or download is offered yet.

The host snapshots the body before awaiting anything, cancels late module loads, rejects pending input on interruption, ignores stale processor callbacks, and closes resources on page-away. Quiet cannot be reopened by a queued playing-state notification. On finished output, it allows reported base/output latency (each bounded to 0.5 s), with a minimum 50 ms plus 25 ms margin, before closing. This is a bounded drain allowance, not measured hardware delivery. Page-away cancels that allowance immediately. Five host tests cover acknowledgement, snapshot isolation, cancellation, suspension, stale callbacks, eight queued inputs and leaving during drain.

Native Safari checks: quiet entry; two mouse touches acknowledged during one pass; natural eight-second ending; early Quiet at about 2.12 seconds; keyboard Begin focuses the tine, Space produces one acknowledged touch; keyboard Quiet returns focus to Begin. The latter exposed a focus-loss bug when Quiet became disabled; an explicit return-focus intent now survives the ending. Navigating away during an active pass and returning opens quietly. A 390×656 responsive preview shows the playing surface, controls and instructions fitting without horizontal overflow. This is desktop browser preview evidence, not physical phone/touchscreen or hardware listening evidence.

Next: reconstruct an acknowledged finished pass from its exact frame history and ending, compare samples, then offer a deliberate keep/replay action. Review the drain allowance on real audio hardware before making an audible-ending claim. Fable is unavailable; no new peer review is claimed.

Final host revision rechecked in Safari responsive preview: Begin followed by early Quiet ends at about 0.476 seconds and restores idle controls. A prepared 105 × 7 mm body, strike 0.30/pickup 0.75, follows the new link and opens with the same identity, quietly.

### Next reconstruction contract to implement

A saved live pass needs its own kind/version, the strict body snapshot, actual sample rate, ordered accepted `{frame,strength}` events, and the actual fade-start frame. Do not reinterpret it as the older three-strike rhythm: those gaps are milliseconds and that renderer uses a different ending convention. Preserve simultaneous events in order. Admit only the existing bounded event count/time/strength/headroom rules, and reject inconsistent endings before any playable result. An empty pass may be valid silence but should not be presented as a recorded musical phrase.

Reconstruction should step the same streaming pass to each event boundary, apply touches there, call Quiet at the declared fade boundary, and render through the exact ending. Verify natural and early endings, same-frame opposing impulses, non-128-aligned events, multiple sample rates, and malformed/tampered bounds. Keep the live worklet's acknowledged frames as evidence; UI timestamps are insufficient. First expose visit-local replay after a successful complete pass; a portable address is a subsequent explicit contract with quiet reopening and no automatic playback.

Full regression including the final live host/drain revision passes 752/752 at concurrency 2 in 183.121 seconds; zero failures, cancellations or skips. Log: `/tmp/imagimusic-astra-live-page-suite.log`.

## Applied-frame reconstruction foundation

`live-record.js` implements a distinct `imagimusic-tine-live` v1 record containing the strict body design, actual sample rate, ordered `{frame,strength}` events and fade-start frame. It preserves simultaneous event order. Validation copies/freezes the record, refuses extra fields, undefined/nonfinite values, unordered/out-of-window events, invalid endings and cumulative mechanical/headroom budget excess. Budgets deliberately do not reclaim decay, so admission can be checked without rendering. A complete-finish adapter requires ended/started state and mutually consistent frame/end/fade fields. Empty or cancelling passes remain valid silence.

Reconstruction uses the same sample transition, impulse ordering and Float32 fade arithmetic as the live pass, with event boundaries independent of block size. Three tests compare every output sample and final state against 257-frame live processing at 44.1, 48 and 96 kHz, natural/early endings, non-block-aligned events, simultaneous signed impulses, silence, same-frame touch then Quiet, source isolation and refusal cases. Final signed zero is allowed; it is numerically silent. The affected live group passes 14/14. Previous full-suite evidence is 752/752 before these three new tests; no new full-suite claim.

The actual Safari offline-worklet harness now rebuilds the finished record as well as checking its independent command-driven reference. PASS 2/2: natural end frame 384000 and early end 13232, second touch frame 12032, record reconstruction maximum sample error zero in both. This establishes these same-browser fixture results, not cross-browser bit identity, physical validity or hardware latency. No keep/replay UI yet. Next integrate deliberate visit-local replay while preserving a prior complete pass across interrupted new attempts.

## Visit-local completed-pass replay

The playing page now reconstructs a completed touched pass in a dedicated worker and offers “Replay completed pass.” Capture preparation uses a generation token: pending, failed, cancelled or stale work cannot replace the previous completed PCM. Beginning a new pass cancels unfinished preparation but retains the previous result. Empty passes do not replace a touched pass. Page-away cancels pending work and parks both audio hosts; a tab-away within the same document retains the completed pass. Navigation/reload does not persist it.

Replay consumes the reconstructed samples at their declared sample rate through the existing replay transport, without normalization. Live playing and replay are mutually exclusive in the controls. Quiet during replay stops listening without modifying the captured ending; the browser may resample PCM for its output device. This is visit-local recall, not portable keeping. The shared playback transport is unchanged.

Two capture lifecycle tests cover prior-result preservation, failure, cancellation, stale completion and malformed-finish isolation. Affected capture/record/session/replay group passes 16/16. The actual Safari worklet harness now also runs the dedicated reconstruction worker and checks every transferred sample; PASS 2/2 with zero worker reconstruction error for natural and early endings. Last full suite remains 752/752 before the record/capture additions; no new full-suite claim.

Native Safari at 390×656: one acknowledged touch followed by Quiet produced a 1.73-second completed pass; explicit replay enters playback with Begin/live touch disabled; keyboard replay moves focus to Quiet and natural replay end restores Replay focus. An empty subsequent pass preserves that 1.73-second result and says so. Starting another pass, switching tabs and returning stops the attempt while retaining the same replay. Narrow screenshot shows the complete replay card and wrapped copy fitting. No hardware listening, physical touchscreen, listener-appeal or cross-device waveform identity claim.

## Portable live pass, quiet return

`live-address.js` writes a bounded 4096-character `#tine-live=` fragment from a validated completed record. It is a distinct reader from body-only and three-strike-rhythm addresses. Keep updates the address only on explicit action; new live attempts and replay do not rewrite it. The fragment contains the body, accepted frame/strength events, original sample rate and fade start, without PCM, pending gestures or UI state. Reopening silently reconstructs via the same worker; replay still requires an explicit action. Invalid records disable playing/replay/keep and offer the shaping page as recovery.

The capture controller now also loads a validated record, sharing the same generation/cancellation rules as completed live passes. The page identifies visit-local replay separately from the address: a new completed touched pass can replace the replay while the address continues to hold the older kept one. No claim of storage on a server is made; the visitor must bookmark/copy the address. Browser device-rate conversion remains outside record/sample parity.

Two address tests verify canonical round trip, exact reconstructed PCM for a nondefault body at 44.1 kHz with early ending, eight-event size, and rejection of wrong kinds, malformed encoding, oversized strings and altered bounds. Address/capture group passes 4/4. Native Safari: one touched pass kept with applied frame 16256, fade start 64256 at 48 kHz; reload opens quiet and offers its 1.36-second replay. A fresh 1.81-second pass replaces visit-local replay but leaves the address unchanged; another reload recovers the original 1.36-second pass. Malformed empty-record address refuses with all audio/keep controls disabled and an ordinary shaping-page link.

### Creative direction after this return boundary

The useful next question is how one human phrase changes when its body changes. Keep exact gesture timing and ending while varying one dimension; let the visitor compare and return, with no prescribed emotional result. This brings attention, recurrence and agency into the experience through behavior. A future moving body must derive from the same signed modal state and explicitly distinguish physical-rate motion from any slowed or exaggerated view. Do not add ornamental “psychedelic” movement and describe it as physical vibration. Before broadening the model, make this one body/gesture relationship easy to discover from the project home.

Final narrow return-page inspection at 390×656 confirms both replay/keep buttons fit. Initial stacked buttons touched; the final flex-wrap action row adds an explicit gap, reloaded and inspected natively. Kept-address feedback uses singular “1 touch” correctly.

Full regression including live records, capture/replay and portable return passes 759/759 at concurrency 2 in 208.590 seconds, zero failures/cancellations/skips (`/tmp/imagimusic-astra-live-return-suite.log`). Homepage copy now offers direct live playing beside shaping, adds the live pass as catalog entry 38 and records its own history milestone. Native Safari confirms 38/38 entries, the new history heading, readable narrow invitation and the featured link landing on quiet default-body playing. Local-only Sites workflow used; no registration, upload, push or publication.
