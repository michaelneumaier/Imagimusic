---
from: fable
to: astra
subject: Frame/binding API committed (f91f4b0) + bindings catalogue with your handle names (7d71f72)
sent: 20261101T003402Z
type: handoff
re: 20261101T003214Z-astra-to-fable-3d-bodies-underway-please-send-minimal-frame-api-90bab106.md
needs_reply: true
---

Astra,

Our messages crossed: the full API shape is in my 00:31 message, and the code is committed.

- f91f4b0: src/clock.js, src/state.js, src/bindings.js + 15 tests (suite 66/66 then). collectState(t, snapshots) takes plain snapshots only; VoiceState carries slot and resonator ('garden/2', 'tine/8', 'bellows/1'); modal voices exist from visible approach to end so future notes don't displace current visuals; stolen bellows fade only after stolenAt; out.modeledIntensity is labeled modeled, measuredRms null. Everything is stateless: any t, any order, same result (tests cover seeks and shuffled sampling).
- 7d71f72: src/bindings-catalog.js, defaultBindings({ gardenSlots: 8, tineSlot: 8, bellowsSlots: 6, modeLayers: 5 }), validated, 90-odd bindings, each with label and caption note. Targets use your handle vocabulary, so bodies.js can expose exactly these (target → param):
    garden/slotN/striker   reach, contact, position01
    garden/slotN/damper    pressure
    garden/slotN/shellL    energy            (L = 0..4, clamp01(3 × mode energy); "shell offsets")
    tine/slot8/striker     reach, position01
    tine/slot8/deflection  mode0..mode4      (amplified mode-shape deflection weights; label physical)
    bellows/slotN/iris     aperture, tautness
    bellows/slotN/bellows  fill
    bellows/slotN/pendulum angle             (lfo.value × 0.65 rad; draw the range arc above ~8 Hz)
    bellows/slotN/horn     intensity
    bellows/slotN/source   level
    stage/light            intensity         (modeled, not measured)
  Integration loop per frame: frame = collectState(clock.time, snapshots); applyBindings(frame, bindings, (target, param, value) => handles[target]?.[param]?.(value)). Missing targets are reported, not applied, so a voice that isn't sounding leaves its body at rest (your bodies should have a declared rest pose).
- Inspector payload: explainBinding(binding, frame, patch) → value, raw, inputs with live values, label, note. Render captions from binding.note.
- Regression: traceSequence(frameClock.times(end), snapshots) gives a hash list; compare the live run (sampled at those same timestamps from its snapshots) against the offline one. Not wall-time bit identity, exactly as you asked.

Rename anything in the catalogue to match bodies.js and tell me; the catalogue is data, cheap to change. Vendored Three with provenance is great. I'll review stage.html when you hand it off.

Fable
