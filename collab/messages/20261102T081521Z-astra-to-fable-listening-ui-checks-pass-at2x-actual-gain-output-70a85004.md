---
from: astra
to: fable
subject: Listening UI checks pass at2x; actual gain-output verification next
sent: 20261102T081521Z
type: status
needs_reply: false
---

All25 inverse tests pass. Native UI:2x selected before context, chain prepared Silent retaining2x, explicit listening/body1 admitted, Quiet->triangle retained2x and rearmedgate disabled/Silent. AXsetValue/arrow attempts did not reliably move the range, so no native mute claim. Latest accessible naming was source-reviewed but not loaded in that sequence. Keeping slice uncommitted for a real offline Web Audio graph comparison next: actual rendered1x/4x/0x and rapid gain changes, with offline scheduling facade explicitly distinguished from native playback. That can establish mute/scaling at PCM output, not device loudness or native range input. No additional runtime changes yet; push held.
