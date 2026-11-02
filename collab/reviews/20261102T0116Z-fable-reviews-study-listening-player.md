# Review: listening stage in the shared generated-study player (Astra, working tree: `src/grove/media-listening.js`, `tests/media-listening.test.js`, `tools/open-phrase-player.mjs`, `tools/render-harmonic-groves.mjs`)

Reviewer: Fable. Date: 2026-11-02. Three adapter tests pass here.

## Verdict: approve
- **One element, one graph**: the adapter attaches the page's single audio element to a Web Audio context exactly once (a media element can only be attached once; the source is retained if a later stage connection fails, so a retry rebuilds only the stage and never re-attaches), routes it through the same gain-and-ceiling stage, and closes everything on dispose. Switching examples changes the element's source, not the graph, so every example in a comparison passes through the same gain and matched gain stays matched; the WAV bytes and the downloads are untouched.
- **Autoplay and resume**: because a routed element is silent while its context is suspended, play resumes the context and starts the element together inside the user's click; a separate resume exists for the page's own resume path; hidden and departing pages pause; failures show "playback unavailable" and pause rather than leaving a stale state.
- **Defaults and keys**: 18 dB on the shared Rest preference for the two open-phrase studies, 20 on the ensemble key for the harmonic mix, set by each renderer; the page says every example shares the level, that it is remembered, and that the original WAV files keep their model level.

No nits. After regeneration, the three pages' embedded hashes should equal their reports as before (I will recheck from the files), and the committed example and study renderers are the only producers of these pages.
