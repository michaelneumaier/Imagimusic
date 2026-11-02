# A touch on the body

Astra · 2026-11-02 · implemented prototype, reviewed and natively checked

In a close view, a short tap on an actual shell or core queues the same strike
as its numbered button. The point is a more direct relationship between the
body someone attends to and the sound they choose to excite. Nothing interprets
intent or promises an emotional state. The numbered controls remain available.

The input adapter requires the same stable body identity at press and release,
inside the canvas, while the existing live-input gate permits playing. Movement
over8 CSS pixels, duration over600ms, a second pointer, cancellation, scrolling,
resize, visibility/blur, park or a change of view abandons the candidate. A
ResizeObserver also cancels when the canvas changes size independently of the
window. Listeners are passive, with no pointer capture or preventDefault;
touch-action:auto remains. This preserves the browser's opportunity to scroll.

The picker sees only shell/core meshes of the selected Grove. Rings, labels,
connections and hidden Groves are not targets. It reads the current camera and
canvas rectangle each time. Accepted audio acknowledgements still own the
visible strike marks; pressing a body cannot fabricate a successful strike.
No engine, record schema, physical model or scene source changed.

Six focused input/raycast tests pass, covering gesture cancellation, stable
identities, decorative/hidden-target exclusion, changing camera/viewport and
observer cleanup. Fable approved the source in review20261102T0436Z (a88c328)
and reported555 full-suite checks at his review checkpoint. The additional
explicit observer-cleanup test is included in Astra's final six focused checks.

Native Safari desktop responsive320 evidence lives in
renders/ensemble-body-tap-live:
- taps-and-button.json contains exactly C bodies02,03,01 (zero-based1,2,0).
  The sequence was two shell clicks, an empty-space click, a drag starting on01,
  then one labelled Play01 press. Empty space/drag add no event; the button is
  not double-counted. Before Begin, a shell click leaves the encounter idle.
- after-replay.json is byte-identical after shell attempts during preparation/
  playback and a fresh retained-gesture download. report.json records the hash
  and refreshed download timestamp (Safari reused the same filename).

This is desktop click/drag evidence. Touch scrolling, multiple fingers and
physical phone performance have not been observed on hardware. The test events
cover cancellation semantics; they do not substitute for that observation.
No subjective listening or appeal conclusion follows from the input checks.

The optional mark legend now follows the body controls. Native320 inspection
confirms the order: view caption, instrument, body controls/help, mark legend.
This addresses Fable's caption-order nit on the preceding body-button slice.

A second native run resized to1000×656, changed to G, prepared the instruments,
and clicked its body02 shell. wide-g.json contains only partG/body1, confirming
selected-Grove targeting after the viewport change. Both native records pass
canonical admission validation at48kHz.
