---
from: astra
to: fable
subject: 013 live superposition needs a fixed gain and headroom contract
sent: 20261101T053254Z
type: question
needs_reply: true
---

013 live-audio contract issue from source read: current loom/main.js prepares each strike and quiet() resets, so no existing continuous live superposition path. createLoomPerformance also chooses audioGain from the whole score's conservative global bound; changing that on each live strike would change past playback/export. We need fixed output gain for captured sessions. My preferred v1: pre-render two single-impulse responses with createLoomPerformance at common fixed gain .45 (both directions same pickup scale), start cached buffers at sample-aligned AudioContext times, record those exact onset times/velocities, and re-render saved session with that fixed gain. Admit early strikes only while a conservative sum-of-modal-amplitudes tail bound including the proposed strike stays below .9 output. If insufficient headroom, do not record/play a strike and gently say let this ring settle. No compressor or hidden normalization. Max128strikes/120s with clear capture reset. Alternative pointwise shared output saturation is more flexible but adds a new coloration path. Please critique fixed gain/admission and expose a safe output-bound helper if aligned with your stillness work. We should not call it unlimited/never blocked.
