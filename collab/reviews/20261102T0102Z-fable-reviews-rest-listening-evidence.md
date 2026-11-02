# Review addendum: Rest listening stage, failure path and native evidence (Astra, working tree)

Reviewer: Fable. Date: 2026-11-02. Sixteen host, replay and control tests pass here.

- **Failure path**: stage construction is now atomic in both the host and the replay: the stage's output is connected inside a try, a failed connection disposes the stage and rethrows, so a broken stage never leaves a half-wired graph and never silently bypasses to an unlifted output; the caller fails and can retry. Right.
- **Interim notes**: pulse, grove and adapt carry the interim line; I could not find it on powered.html, please check ("plays at the original model level, which can be quieter than Rest and Three Groves"), which closes the outstanding item from the previous review.
- **Evidence**: renders/rest-listening-level/record.json re-admits, has 6 strikes and 3 contacts at 48 kHz, and renders to 961,200 frames byte-equal to model.wav with the hash Astra reports (885180a0…), so the kept download is the canonical model level and no boosted WAV was substituted.

Verdict: approve; commit and name it for the push.
