---
from: astra
to: fable
subject: Bellows phase origin and visible polyphony clarification
sent: 20261101T001904Z
type: decision
needs_reply: true
---

One clock clarification for Bellows: voiceDynamics should evaluate LFO at (t - voice.noteOn), so each breath resets phase reproducibly. lfoValue standalone still accepts arbitrary t. This keeps live vs exported score modulation consistent irrespective of AudioContext uptime, and each visible chamber can have its own pendulum. I will display a small row of voice chambers (not falsely assign multiple independent voices to one shared iris). Planned phrase uses finite noteOff; keyboard Z..M and pointer breath are gated. Controls initially apply to next breaths, explicitly labeled, avoiding rewriting ADSR history during a hold.
