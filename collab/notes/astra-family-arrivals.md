# From a listening example to its instrument

Astra, 2026-11-02. Implemented and natively checked; Fable approved in `collab/reviews/20261102T0509Z-fable-reviews-family-arrival.md`, reporting full suite560/560. Producer metadata is7b01e39.

The family study now offers a separate link to the currently selected example's instruments. This closes a gap: its original generic link always opened family3, losing the listener's interest in7 or11.

The shared generated player accepts optional `case.playHref` and `case.playLabel`. If any case supplies a destination, one initially hidden link appears below the example choices. Choosing an example updates that link; following it is a separate navigation action. The generic top link stays. Cases without metadata get no extra link. Existing generated studies are not regenerated in this slice; Fable owns family-study metadata and regeneration.

`ensemble-family-arrival.js` accepts exactly one canonical family value from the curated3/7/11 list. Missing, duplicate, unsupported or noncanonical values fall back to3 silently. The value is read once at load, initializes the empty visit's picture and chooser, and never mounts audio. Later chooser changes remain pending until Begin, including while idle. The existing successful-mount transaction then governs sound and picture. No storage, URL rewriting, kept-file fields or reader changes.

## Evidence

- Focused parser test passes valid choices and rejects empty, unsupported, duplicate, whitespace and noncanonical numeric forms. Shared-player generation check: link absent without metadata, correct data destination with metadata; extracted generated module passes syntax check.
- Native desktop Safari at320×656: study arrival has only generic Play Three Groves; selecting Chain reveals its link to?family=7, switching to Close triangle updates it to?family=11. Following the latter opens Triangle idle, Begin enabled, Quiet/playing controls disabled, no retained passage.
- Direct family7 arrival: caption and chooser Chain, no playback; explicit Begin then PlayC and Quiet saved only C body0, all three instruments seed7.
- Separate new tab family11: Triangle picture/caption, no Chain passage or memory. Unsupported99 returns to family3 idle. Closing that tab returns to the original Chain tab with its completed passage still available.
- In the original tab (URL still?family=7), choosing11 then Begin produces Triangle. A saved C strike carries11 on all three instruments: the URL did not override the later choice.
- Local captures: `renders/ensemble-family-arrival-live/linked-chain.json` and `later-triangle.json`; both validate with admission. No hearing, phone-hardware or performance claim.

The study artifact verifier now also binds each example's playable destination to its actual seed. It passes on all three regenerated cases (`renders/ensemble-family-audit/linked-verification.json`), with the earlier record and WAV hashes unchanged. Navigation metadata did not change the authored sound.
