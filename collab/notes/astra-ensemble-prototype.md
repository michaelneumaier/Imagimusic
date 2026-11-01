# Three Groves experimental integration — November 1, 2026

Local route /ensemble.html, explicitly labelled experimental in page/catalog.
One AudioContext/node, three recipes prepared in a cancellable worker, fixed
1/3 mix, 35 ms scheduling lead. Saved events come from processor acknowledgements.
One Quiet and two-minute audio-thread ending. Three scenes share one renderer
and static camera. A/S/D and strike buttons; damping has separate pointer/key/
assistive owners, releases on cancellation, lost capture, blur and hiding.

Native Safari at 320×656 produced three real saved passages:
- renders/ensemble-live-first: three tip strikes, 2608 frames at 48 kHz;
  WAV SHA256 4632e9fbe167a8a937e85141c1ab8d6ea31e06a29260417b3425d83413d92260.
- renders/ensemble-live-contact: two strikes, two firm contact intervals in
  part0, silent part2, 59824 frames; WAV SHA256
  79d9cfa5f0d47491ef596344ba635449d3d6e476319bb124d2a5a59e2f60bd18.
- After review, index1 middle strikes match the study. Native record in
  renders/ensemble-live-middle: three middle strikes, 3744 frames; WAV SHA256
  b1642150eab424733b8e1d3a2ea0e72e8d8b5d7fed2d5e9e5a80276694513908.

Each downloaded WAV independently rebuilt byte-exactly from its JSON. These are
offline renders of actual live decisions, NOT live output captures. No inference
of glitch-free output, realtime headroom, subjective quality or listener appeal.

Nine host/processor tests passed. Host tests use injected fake nodes; separate
processor tests execute the real processor against the diagnostic/offline mixer.
Host review: collab/reviews/20261101T1251Z-fable-reviews-ensemble-host.md.
Page review: collab/reviews/20261101T1254Z-fable-reviews-ensemble-page.md.
Command validation and strike-position findings addressed; firm strength now
looked up by name. Phone screenshots inspected. Compact header, shorter canvas
and sticky Begin/Quiet added after the first inspection.

Next: broader native lifecycle and keyboard/multipointer checks; sustained
output-side measurement with full visuals/input; deliberate listening feedback.
Short native captures do not replace those gates. Keep local; do not publish.


## Hold lifecycle follow-up after usage reset

The shared hold-control helper now owns distinct pointer, keyboard and assistive
sources. Four deterministic tests cover overlap, last-owner release, capture
loss, focus loss, failed capture acquisition, disabled/repeated input, reset
and disposal. This is source-level event coverage, not real multitouch evidence.
Fable approved in collab/reviews/20261101T1259Z-fable-reviews-hold-control.md.

Native Safari on resumption: Begin followed immediately by Escape cancelled
preparation; Begin stayed enabled and play/hold controls disabled. Another Begin
worked. With Soften C focused, Enter held 700 ms and released showed off; Space
held 700 ms and released also showed off. No unwanted assistive toggle remained.
The actual file renders/ensemble-keyboard-holds/ensemble.json validates and has
one middle strike, three finite contact intervals (pointer, Enter, Space), two
silent parts, and a common ending. All contacts ended before Quiet. This checks
the real release path; it does not establish acoustic performance.

Navigation to project home then Back returned a fresh idle page without playback.
Safari did not retain the passage in back-forward cache in this run, so this is
NOT evidence of native cache retention. Completed files remain available on disk.
