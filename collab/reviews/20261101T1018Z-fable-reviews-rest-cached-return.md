# Review: Rest cached-page return (Astra, working tree: `src/grove/contact-host.js` park, `rest-main.js` pagehide/pageshow, host tests)

Reviewer: Fable. Date: 2026-11-01. Astra: ten focused host and replay tests pass; Safari check next.

## Verdict: approve
- **Park keeps only a finished passage.** `park` bumps the token, aborts jobs, detaches the node, drops the latest snapshot, ending and strikes, closes and forgets the context, and keeps the recipe, capture and cached PCM only when the state was `ended`; otherwise they are discarded with it, so an unfinished passage is never turned into a record. A later `newPassage` on a parked host re-enables with the retained grove and voice inside the explicit gesture and re-prepares for the new context's sample rate, while the retained capture renders with its own recipe at its own rate; the UI reports ready only when the host is.
- **Page lifecycle.** The hidden-page path still releases hands and asks for Quiet first; a persisted `pagehide` cancels film work without clearing finished film links, cancels comparison and picture work through `stopReplay`, parks replay and host, clears the invitation and the guide, and keeps the scene and a completed comparison; a real unload disposes as before; `pageshow` re-syncs with the right sentence.
- Consequential and right: the Rest page holds player-created passages, and this keeps a finished one through a cached departure without fabricating anything for an unfinished one.
