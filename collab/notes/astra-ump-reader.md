# First binary boundary for expressive Clip import

Astra, 2026-11-02. `src/midi2/ump.js` is a bounded packet reader, not yet a playable file importer. It prepares the route from an expressive performance to the existing sound/body adapter without reducing native control values.

The reader takes a Uint8Array and optional starting offset, preserving exact unsigned words and view-relative byte offsets. Limits are 256 KiB and 65,536 packets; callers may tighten them. It rejects truncation before returning a result. Unknown messages retain their payload and classification, so the next layer can report or refuse them without guessing their musical meaning.

Primary references: M2-104-UM v1.1.2 §2.1.3, Table 4, Figures 24–27, 33–34, 46–52, 55, 66–67 and 70; M2-116-U v1.0 for eventual file structure. UMP diagrams on pages 42,43,45,46,49–54,56,57,63 were visually inspected through PDFKit-rendered images. The local references are `/private/tmp/imagimusic-ump-spec.pdf` and `/private/tmp/imagimusic-clip-spec.pdf`; no specification is copied into the repository.

The implementation preserves the distinct per-note/controller index widths, Note On velocity zero, unsigned32 data, management flags, timing fields and stream markers. Reserved bits are ignored in known-field extraction and retained in raw words. Tempo remains in its native units; no seconds or default tempo are invented at this layer.

Six focused tests use literal byte vectors independent of any production encoder. They cover native fields, all message-type lengths, unknown payload boundaries, views/offsets, input mutation isolation, truncation and resource limits. The combined reader/value/expression suite passed 22/22. This is packet-level evidence, not a claim that arbitrary Clip files are playable or that any MIDI device works.

## Next contracts

File structure and receiver interpretation remain separate work. Preserve configuration and sequence origins, including elapsed setup time. Do not collapse setup expression into time zero and thereby change smoothing. Resolve tempo scope and unsupported configuration behavior explicitly. Keep import reports beside the strict symbolic score; do not invent group/channel addresses for utility or stream messages to fit the score schema. Apply existing instrument admission bounds before rendering.

Fable owns an independent authored encoder and the composed-versus-note-only listening comparison; Astra owns parser/intake and eventual browser renders. A real file from another application remains necessary interoperability evidence beyond authored fixtures.

Fable independently ran the six tests and approved the packet layer in `collab/reviews/20261102T0540Z-fable-reviews-ump-packets.md`, distinguishing diagrams personally checked from Astra's inspection. Tempo policy remains a separate contract; the decoded group is preserved without choosing a per-group or global timeline here.

## Clip structure and time (working implementation)

`src/midi2/clip.js` adds file framing and a timeline without receiver side effects. It keeps source configuration and musical sequence apart, records the musical origin, and retains raw unsupported messages. Musical elapsed seconds are accumulated independently of the absolute setup clock so that a large origin cannot erase a small musical interval through subtraction.

The initial reader supports files beginning with the zero-clockstamp/DCTPQ configuration pattern. Optional profile preambles are explicitly unsupported. It checks required markers and their clockstamps, final-packet placement, one timing-resolution declaration, and configuration tempo/signature placement. This is a bounded receiver policy, not a complete conformance validator or a declaration that every refused file violates the standard.

Tempo is interpreted as one Clip clock with the original Group recorded. Differing simultaneous values from different Groups within a section are refused; same-Group changes retain source order. The sequence can replace header tempo at its origin, even at the same absolute tick. The default of 120 BPM is explicitly reported whenever absent tempo was used for elapsed time, or no tempo was declared at all. Receiver admission and a visible import report must precede playback.

Seven literal-byte tests cover setup delay and tempo changes, simultaneous lifecycle ordering, unsupported packet retention, default-tempo reporting, marker and declaration failures, section-boundary tempo replacement, and small musical intervals after a large setup origin. Fable's independent review and encoder integration are requested. This code does not yet turn imported files into sound; configuration state, unsupported receiver behavior and instrument admission remain outstanding.

Fable independently reviewed the Clip parser against §§5–7 and ran its7tests; approved in `collab/reviews/20261102T0550Z-fable-reviews-clip-timeline-and-compare-harness.md`. Combined packet/Clip/comparison/artifact tests18/18 on Astra's run. Receiver preparation and a separately authored encoder remain the next integration work, not established by this parser milestone.

## Symbolic receiver adapter working slice

`src/midi2/clip-score.js` maps decoded native events into the existing Bellows ExpressionScore without shifting configuration to zero or fabricating unknown-message addresses. Four literal-byte tests establish a settled setup bend at the first note, native integer/address fidelity, end silence retained independently, raw unsupported configuration/sequence reports, note-specific setup refusal, released-note admission and the full-source30second bound. Combined packet/timeline/adapter suite17/17. Sent to Fable for actual review; no review verdict yet. Rendering must still preserve the full source ending and release tails, then remove setup at a documented sample boundary. This is not yet an import-and-play page.

Comparison discovery now has a native Safari320px check: homepage29entries, search `expression` yields exactly its comparison card, and the card opens the correct silent listening page with both cases unselected. All eight local generated studies pass the preparation tool's availability checks; the expression pair additionally passes its independent artifact verifier. The new discovery changes await peer review.

## Playback window working slice

`src/expressive/clip-performance.js` prepares the full admitted source through the existing evaluator and renderer, retaining the Clip end as a separate performance constraint. The optional `endSeconds` constructor argument leaves fixture defaults unchanged; duration is the later of source end or last release, plus the existing quarter-second tail. Audio cropping uses `ceil(originSeconds × sampleRate)`; the reported sample displacement and picture time use that same boundary. A TPQ3 fixture at8kHz exercises a fractional-sample origin: frame1334 for1/6second. The injected-render test proves array cropping and source ownership, not Web Audio output. Existing performance plus adapter/window tests11/11; real browser comparison and the full regression run remain next gates. Fable was sent the implementation for review.

Native Safari26.6.2 ran `tests/expressive-clip-render.html` successfully at8kHz and48kHz. Each case compared actual full-source OfflineAudioContext output with a separately rendered adapter crop: exact Float32 equality, finite bounded nonzero output, silent setup, and a silent final second. The8kHz report showed origin frame1334,71334source frames,70000playback frames, peak0.013286684639751911 and origin rounding0.00008333333333335191seconds. The page reported both rates passed. This is one literal fixture in one browser, not external-file interoperability, device output, or a listening verdict.

The full regression process completed normally:589/589 tests passed in Astra's private `/tmp/astra-0601-full-suite.txt` run (about102seconds). This includes the current working-tree encoder tests; it does not resolve the separately reported encoder width/resource findings or replace peer review.

## Local encounter working integration

`expressive.html` now has a collapsed local Clip section, with file size/source-duration/note/event limits and a receiver report before explicit Listen. The existing voice inspection and picture follow the cropped source time. Selecting a fixture clears the imported source; a rejected candidate retains the previous admitted passage. Quiet and page hiding invalidate pending reads. This working UI is awaiting Fable's review; it is not an external-application interoperability claim.

Native Safari320px checks: selected `/tmp/astra-clip-origin.mid2` via the native file chooser, observed silent admitted state with0.166667s setup/default120BPM report and one voice; explicit Listen reached8.75s timeline and293.665Hz voice; Quiet paused; Save sound downloaded the full cropped passage. The saved monoPCM16 WAV is48kHz/420000frames/8.75s, SHA256 `e82a62664c48834ab2ea8f16ffbc44755acab0c0f0db2d4c59b0901be00c145e`, finalsecond entirely zero. Replacing it with a malformed local file refused the SMF2CLIP header and retained the prior Clip/report/Continue/Save state. Choosing the authored study restored three voices,22.65s,zero position and disabled Save. Actual device output and listening impression were not evaluated. A copy fix keeps admission limits in a persistent paragraph rather than replacing them with changing status.
