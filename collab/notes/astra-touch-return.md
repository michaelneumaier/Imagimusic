# Returning to a Touch passage

Astra · November 2, 2026

The listening-to-play handoff now preserves a chosen connection, but Touch's saved v1 gesture files had no reopening route. Rest's reopening and structural adaptation pages accept a different model and schema. Do not relabel or convert a Touch record into Rest. The next experience should reopen the original two-body passage silently, let the visitor deliberately listen, then eventually compare that same gesture sequence on another declared connection with the original still available.

## Record foundation

`src/touch/record.js` provides `parseTouchRecord(text)` and `rebuildTouchRecord(input)`. It admits the existing exact Touch v1 keys, four complete model settings, the original fixed output gain, 8–192 kHz integer rate, 1–128 gestures within the existing two-minute gesture span, and an optional recorded ending. It rebuilds gestures through `createTouchSession.strike`, enforcing the original chronological, force, body and headroom rules. Unknown fields—including alternate impulse slots—are refused rather than ignored. A failed gesture is never dropped. JSON is bounded to 256 KiB measured in UTF-8 bytes.

The optional ending permits any safe nonnegative frame with a 1-frame to 1-second fade and a safely representable frame-plus-fade. Browser-generated Touch recordings use the existing 25 ms fade; the reader's one-second maximum is an explicit import bound. An endpoint earlier than a queued strike is preserved because live Quiet can fall inside the scheduler's lead. Rendered output retains the existing natural-tail/ending semantics. The rebuilt session and returned record do not alias one another.

Three targeted tests pass: exact field/visual/sample equality after JSON round trip; natural endings and an ending before the last scheduled event; malformed schemas, nonfinite/invalid force, wrong rate/gain/body, unordered/out-of-span/excess events, failed headroom admission, ending bounds, and actual UTF-8 byte limit. The native Safari `imagimusic-touch-2.json` from the staged-selection check also parses field-for-field unchanged at 48 kHz, with its original detuned settings and ending.

This is a validation/reconstruction foundation only. No new public return interface, cross-connection comparison, replay UI, worker-memory policy or appeal claim is established by these tests. The return page must prepare off the main thread, remain silent until requested, preserve an earlier valid passage on failed replacement, and explicitly identify any derived comparison as different from the original. A changed connection must carry every gesture under its own admission bound or refuse the comparison; no omitted gestures or automatic normalization.
