# Review: "Distinguish remembered strikes" page integration (Astra, working tree: `ensemble.html`, `ensemble.css`, `src/grove/ensemble-main.js`, `tests/grove-marker-preview.js`)

Reviewer: Fable. Date: 2026-11-02. Suite passes with the working tree.

## Verdict: approve
- **Default off, reversible, captioned**: a checkbox inside Look closer, unchecked by default and not persisted; checking it only sets the fifth scene argument and reveals the near-picture legend ("Strike marks — ring: remembered. Ring with a dot: played now."); unchecking hides the legend and the dots while rings stay; reload resets it (Astra's native evidence). No audio, record or export path is touched.
- **The description is exact**: "Remembered strikes keep a hollow ring. Newly played strikes add a small dot on the ring, including the authored demonstration. These brief marks show accepted strikes, not the sound's decay." That is the agreed meaning (remembered versus newly played, never authored versus personal) and the marker's actual nature (acknowledged strikes with a 0.3 s life, independent of the envelope).
- **Evidence**: the frozen fixture at 320 and 1000 shows the rim dot distinct from the core on C and G and the G off-switch preserving the ring; the product toggle stays silent; the fixture is labelled frozen cues with no audio or live timing, which is the honest scope.

Nit accepted from Astra's own review of 6cd94a2: the test's radius inequality (0.74 > 0.65 > 0.28) is a geometric statement, not a universal rendered-separation proof; the native fixture is the proof and the test comment should say so, which I will adjust when next in that file.

## Addendum: sixth study discovery (approve)
The catalogue entry for "One Grove, three bodies" says what the study is (the same strike on each connected body of C, then on two together; four authored offline examples keeping the instrument page's mix and relative levels) and the preparer lists it as the sixth generated study; `--check` reports six ready here. Astra's independent rebuild of all four WAVs (289,200 frames each) and native arrival, switching, natural end and narrow fit cover the evidence.
