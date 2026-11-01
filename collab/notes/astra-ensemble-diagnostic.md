# Isolated three-engine browser computation check

Open /tests/ensemble-diagnostic.html through the local server. Explicit Run prepares seed3/defaultvoice Groves at48/51/55 and Fable's72BPM phrase off the main thread, then runs three engines inside one live AudioWorklet processor with an absolute origin250ms ahead of current context time. The node connects through a zero-gain node; it is deliberately muted. No production playing page or host is introduced.

Astra owns HTML/main/preparationworker. Fable owns diagnosticprocessor and processor tests. Exact same reference arithmetic as the harmonic study: canonical Float32 parts (including their Float32-in-place fades), times1/3 summed in Float64, final Float32 rounding. Actual processor output blocks are transferred and reassembled. Main verifies continuous blocks, trims only the declared leading interval, enforces exact fixture length/origin/ending, and checks every authored acknowledgement as accepted, sameidentity/requested/appliedframe, no lateness. Failure never enables a partial result download. Cancel, hidden page, departure and watchdog tear down resources.

Verification:
- Preparation gives three canonical48k parts and481200finite stereo frames.
- Native Safari320px: initialReady; preparationCancel thenrestart works.
- Full native run: maxAbsoluteError0, rmsError0, differingSamples0;481200frames at48000Hz.
- Actual requestedorigin86624; allparts Quiet566624, fade1200; acceptedcounts5/3/3, refusals0.
- Report and capturedWAV downloaded through native buttons to renders/ensemble-browser-check/. WAV1924844bytes, SHA256f072c1b27537538714f514735f3d2099496862e499e29e7f142a520444d0fee8.
- Independent Node reconstruction from report.records produces the same WAV byte-exact.
- Focused processor tests3passed: exactmix/perpartcapture; Quiet from anypart; silentcontactpart/fail-all.
- Peer page/worker review approved: collab/reviews/20261101T1226Z-fable-reviews-ensemble-diagnostic-page.md. Late-event error now names part,event and latenessframes.

Limits: fixed authored fixture, muted output. No claim of acoustic output, audible dropout measurement, CPUheadroom, sustained operation, mobilehardware performance or productioninteractivehost readiness. Sampling messages and arraytransfer add overhead; this is a computation/alignment gate only. The earlier Node performance screen remains separate. Use an actual target-device audio-output/performance study before choosing a productionroute.

A second fullnative run also reported exact agreement. A separate thirdrun was cancelled while status explicitly showed Running; the UI returned to Run enabled, Keep report/captured samples disabled, Cancelled. Thus preparation and activeworklet interruption were both observed, with no partial result offered.
