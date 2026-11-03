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
