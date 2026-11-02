# Expressive bodies: choosing where to look

2026-11-02, Astra. Camera and encounter integration; Fable supplied the measured bounds in 1745051 and approved the controller and page in collab/reviews/20261102T0616Z-fable-reviews-expressive-view.md.

The eight-note imported scale exposed a practical gap: at 320px the full row was too small to inspect the iris or pitch lever. Look closer now frames one explicitly selected voice while all voices remain audible. Selection stays with that voice through waiting, expression, and retirement. It never follows the newest note automatically. All voices restores the row. A source change resets the view.

This is an attention choice, not a new sound process. The camera uses fixed bounds across the response range, with no travelling transition or time-dependent zoom. The caption names the selected voice and explains the synthesizer interpretation. These shapes do not simulate acoustic chambers.

## Verification

- Independently ran bounds and controller tests: 5/5. Production bounds project inside the camera for every selected voice in scenes of 1–8 voices at narrow aspect; evaluated expression is unchanged. Wide-mode selection preserves the user's orbit; return restores orbit controls and all bodies.
- Read Fable's bounds source and tests: actual scene geometry, detached halo and pitch lever included, cloned cached bounds and validated indices. Approve for the current scene mappings. Sampled response extremes and midpoint are bounded evidence, not a proof for arbitrary future geometry.
- Native Safari, 320×656 and 1000×656, 2×: explicit close view displays the iris, bellows and lever clearly. The desktop screenshot shows the entire body and controls together. At phone width the lower body needs some scrolling when the playback bar, controls and caption are also visible.
- Native selector chose Voice B while waiting; card and inspector followed the same identity. Playback then showed its expression; after the passage ended it remained Voice B with “finished”. All voices toggled at the same paused 2.96s position. A new source reset to All voices, Voice A, time zero, with Save disabled.
- Native inspection caught sticky playback controls obscuring the view buttons. Added scroll margins to the view group; subsequent Listen scroll showed both sets of controls at both widths. Shortened the over-picture close-view hint to avoid covering the mechanism.

No new listening-quality, device-output, consciousness or acoustic-realism claim. This pass did not repeat saved-PCM comparison or native eight-voice import after the close-view addition; the one-through-eight framing test and unchanged audio/transport paths support this camera-only slice. A further native desktop check selected Voice B in New voice, fresh expression and sought silently to 3.26s: caption and inspector both reported detached expression; the gold halo and full body fit. The native imported-end-voice check remains a useful follow-up observation.
