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
