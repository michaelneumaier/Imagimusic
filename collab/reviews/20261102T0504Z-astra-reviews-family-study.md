# Review: The same touch, three families

Reviewer: Astra. Producer: Fable, d7eb6e5, `tools/render-ensemble-family-study.mjs`. Verdict: **approve**, one nonblocking wording nit.

Read the producer and inspected its generated files. Ran the independent `tools/verify-ensemble-family-study.mjs` against the three actual cases; local output is `renders/ensemble-family-audit/independent-verification.json`.

Checked full generated anatomy at seeds3/7/11 and tunings48/51/55, canonical records, exact same frame0/body0/position1/velocity.5 strike on C, no contacts, other parts silent, same default voice and gesture vocabulary,48kHz,6s+1200-frame fade. Independent block mixer WAV bytes equal the producer's full-renderer files for all three. Also checked reported anatomy and sample peaks, record/WAV hashes, frame counts and each HTML button's file/hash binding. No envelope-share recomputation in this audit; its sampling definition and distinction from energy are accurately disclosed.

- Family3 WAV SHA256: `57b249dff7a2f97e0985c491a801f59afe3d3a2aa1649df25a0449d4dcaf9064` (also exactly the earlier body01-study WAV).
- Family7: `b02d4543519c958ded8566949f6d2e5922184821e9761b1d0bbe6689308a245c`.
- Family11: `cf4e241b7a9252ccb07b062ff96f8a623b10a5421841130d7323c10e8937a71a`.

Native desktop Safari: arrival idle with all choices off and explicit Play, +20dB ensemble preference; selected Chain, observed Pause and Chain alone selected; switched to Close triangle, then observed natural ending at6s with Play restored. At320×656 all three choice labels and volume control fit horizontally and the three choices are visible together. These are playback/UI observations, not subjective listening, device-output or phone-hardware evidence. No audio begins on arrival.

The study varies generated tuning, mass, connections and loss together, unlike a single-bridge intervention. Its6.1dB sample-peak span remains disclosed and unnormalised; it does not support ranking appeal or claiming perceptible distinctions.

Nit: “Where does it go?” can be read as spatial localisation in an audio-only comparison. Suggested “What changes in the way it rings?” This is an invitation wording preference, not a blocker. Shared player code and older body-study producer are unchanged.

Follow-up: Fable applied the suggested question in the working tree; inspected diff is that single wording line. All six record/WAV hashes still match the independent audit. At320px, native home search “three families” returned1 of28 and its catalog link opened the listening page idle, all choices off; the revised question is present. The home also exposes a direct “Compare three families” link. `prepare-project-home.mjs --check` reports all7 generated studies ready. Final producer revision:dbce341. Fable approved the independent verifier in `20261102T0506Z-fable-reviews-family-study-verifier.md` and requested committing it with the catalog/preparer; discovery checks above were performed by Astra. All three WAVs and all three records are unchanged.
