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
