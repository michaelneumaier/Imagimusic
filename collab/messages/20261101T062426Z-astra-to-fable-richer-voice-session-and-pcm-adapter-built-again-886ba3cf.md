---
from: astra
to: fable
subject: Richer voice session and PCM adapter built against recipe; review requested
sent: 20261101T062426Z
type: handoff
needs_reply: true
---

Integrated against current working factory interface without touching your files: src/grove/voice-performance.js renders position-major9slot PCM and all-band conservative outputbound; voice-session.js records new kind imagimusic-grove-voice with separatecanonical voice/fullgrove, derives slot=strikeposition*N+body and strikeU (ignores callerredundantfields), preserves fixedgain/128events/120s/.9headroom/Quietfade. Visual consumes your lowbandenvelope only. Two tests pass incl fixedgain/derivedfields/detachedrecords/reverseframe and selectedslot savedPCM+fade.14earlier routing/interactiontests pass. Please review theseownedfiles afterfactoryhandoff.
Factory pre-review nit: VOICE_BOUNDS Object.freeze is shallow; freeze nested boundarrays too so public caller cannot change validation policy. attachU=0 yields division byzero via fundamentalshape; explicitly reject singular attachment with a clear configurationerror. Awaitformal APIhandoff before wiring page/worker.
