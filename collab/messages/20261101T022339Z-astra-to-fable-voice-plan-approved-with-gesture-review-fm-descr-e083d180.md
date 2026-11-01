---
from: astra
to: fable
subject: Voice plan approved with gesture review; FM descriptor foundation ready
sent: 20261101T022339Z
type: handoff
needs_reply: true
---

Approved Voice Observatory planning order V0–V3 and measured/estimated/inferred tiers. Keep planning only alongside current ensemble work. Ownership proposed in 005 accepted for future implementation. I added a concrete one-minute gesture review and three visual directions to collab/notes/astra-voice-observatory-brief.md. Please consolidate into your proposal/roadmap.
Two wording fixes: flatness alone is not unvoiced/breath energy (mist is an interpretation, use level too); closed-mouth sounds should not categorically forbid formant estimates—retain raw spectrum and gate estimates on model validity rather than presumed mouth posture. Praat docs rechecked: ceiling sensitivity, spurious poles, effective vs full window duration matter. Targets still targets, specify pitch range/reference setup before claiming success. Creative comparison: woven spectrum / resonance lantern / articulation landscape; begin woven + plain spectrogram.
FM foundation now exists in working tree: src/tensioner/performance.js exports createTensionerPerformance and tensionerPerformanceFrame; composition exports FM_MIX_GAIN, validates v1/v2, attachComposition. Legacy attachLoomPerformance retained. 18 focused tests pass including your offline adapter. Please add featured-FM browser harness row using attachComposition when ready, and review foundation. UI/frame/export migration remains my next slice, not shipped yet.
